/**
 * Secrets Status Endpoint
 * GET /api/admin/secrets-status
 *
 * Returns which secrets are configured (presence check only, never exposes values).
 * Useful for debugging deployment issues and verifying configuration.
 */

interface Env {
  // Sports Data APIs
  SPORTSDATAIO_API_KEY?: string;
  SPORTSDATAIO_KEY?: string;
  CFBDATA_API_KEY?: string;
  COLLEGEFOOTBALLDATA_API_KEY?: string;
  THEODDS_API_KEY?: string;

  // AI Services
  GOOGLE_GEMINI_API_KEY?: string;
  GOOGLE_GEMINI_API_KEY_2?: string;
  GOOGLE_GEMINI_API_KEY_3?: string;
  OPENAI_API_KEY?: string;
  ANTHROPIC_API_KEY?: string;

  // Authentication
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  JWT_SECRET?: string;
  SESSION_SECRET?: string;
  CSRF_SECRET?: string;

  // Payments
  STRIPE_SECRET_KEY?: string;
  STRIPE_WEBHOOK_SECRET?: string;
  STRIPE_PRO_PRICE_ID?: string;
  STRIPE_ENTERPRISE_PRICE_ID?: string;

  // Security
  ENCRYPTION_KEY?: string;
  API_KEY_SALT?: string;

  // Cloudflare Bindings
  KV?: KVNamespace;
  NIL_CACHE?: KVNamespace;
  DB?: D1Database;
  NIL_DB?: D1Database;
  SPORTS_DATA?: R2Bucket;
  NIL_ARCHIVE?: R2Bucket;
  AI?: Ai;
  VECTORIZE?: VectorizeIndex;
  ANALYTICS?: AnalyticsEngineDataset;

  // Environment
  ENVIRONMENT?: string;
}

interface SecretStatus {
  configured: boolean;
  category: string;
  required: boolean;
  description: string;
}

const SECRETS_CONFIG: Record<string, Omit<SecretStatus, 'configured'>> = {
  // Sports Data APIs
  SPORTSDATAIO_API_KEY: {
    category: 'sports-data',
    required: true,
    description: 'SportsDataIO API key for MLB/NFL/NBA data',
  },
  CFBDATA_API_KEY: {
    category: 'sports-data',
    required: true,
    description: 'College Football Data API key',
  },
  THEODDS_API_KEY: {
    category: 'sports-data',
    required: false,
    description: 'The Odds API key for betting data',
  },

  // AI Services
  GOOGLE_GEMINI_API_KEY: {
    category: 'ai-services',
    required: false,
    description: 'Google Gemini API key for AI features',
  },
  OPENAI_API_KEY: {
    category: 'ai-services',
    required: false,
    description: 'OpenAI API key (fallback LLM)',
  },
  ANTHROPIC_API_KEY: {
    category: 'ai-services',
    required: false,
    description: 'Anthropic API key (fallback LLM)',
  },

  // Authentication
  GOOGLE_CLIENT_ID: {
    category: 'authentication',
    required: true,
    description: 'Google OAuth client ID',
  },
  GOOGLE_CLIENT_SECRET: {
    category: 'authentication',
    required: true,
    description: 'Google OAuth client secret',
  },
  JWT_SECRET: {
    category: 'authentication',
    required: true,
    description: 'JWT signing secret (min 32 chars)',
  },
  SESSION_SECRET: {
    category: 'authentication',
    required: false,
    description: 'Session encryption secret',
  },
  CSRF_SECRET: {
    category: 'authentication',
    required: false,
    description: 'CSRF token generation secret',
  },

  // Payments
  STRIPE_SECRET_KEY: {
    category: 'payments',
    required: true,
    description: 'Stripe secret API key',
  },
  STRIPE_WEBHOOK_SECRET: {
    category: 'payments',
    required: true,
    description: 'Stripe webhook signing secret',
  },
  STRIPE_PRO_PRICE_ID: {
    category: 'payments',
    required: true,
    description: 'Stripe Pro tier price ID',
  },
  STRIPE_ENTERPRISE_PRICE_ID: {
    category: 'payments',
    required: true,
    description: 'Stripe Enterprise tier price ID',
  },

  // Security
  ENCRYPTION_KEY: {
    category: 'security',
    required: false,
    description: 'Data encryption key',
  },
  API_KEY_SALT: {
    category: 'security',
    required: false,
    description: 'API key hashing salt',
  },
};

const BINDINGS_CONFIG: Record<string, Omit<SecretStatus, 'configured'>> = {
  KV: {
    category: 'cloudflare',
    required: true,
    description: 'Cloudflare KV namespace for caching',
  },
  DB: {
    category: 'cloudflare',
    required: true,
    description: 'Cloudflare D1 database',
  },
  SPORTS_DATA: {
    category: 'cloudflare',
    required: false,
    description: 'Cloudflare R2 bucket for sports data',
  },
  AI: {
    category: 'cloudflare',
    required: false,
    description: 'Workers AI binding',
  },
  VECTORIZE: {
    category: 'cloudflare',
    required: false,
    description: 'Vectorize index for semantic search',
  },
};

export const onRequest: PagesFunction<Env> = async ({ env, request }) => {
  // Only allow GET requests
  if (request.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const secrets: Record<string, SecretStatus> = {};
  const bindings: Record<string, SecretStatus> = {};

  // Check secrets
  for (const [key, config] of Object.entries(SECRETS_CONFIG)) {
    // Handle alternate key names
    let value: string | undefined;
    if (key === 'SPORTSDATAIO_API_KEY') {
      value = env.SPORTSDATAIO_API_KEY || env.SPORTSDATAIO_KEY;
    } else if (key === 'CFBDATA_API_KEY') {
      value = env.CFBDATA_API_KEY || env.COLLEGEFOOTBALLDATA_API_KEY;
    } else {
      value = env[key as keyof Env] as string | undefined;
    }

    secrets[key] = {
      configured: Boolean(value),
      ...config,
    };
  }

  // Check bindings
  for (const [key, config] of Object.entries(BINDINGS_CONFIG)) {
    const binding = env[key as keyof Env];
    bindings[key] = {
      configured: Boolean(binding),
      ...config,
    };
  }

  // Calculate summary
  const allItems = [...Object.values(secrets), ...Object.values(bindings)];
  const configured = allItems.filter((s) => s.configured);
  const missing = allItems.filter((s) => !s.configured);
  const requiredMissing = missing.filter((s) => s.required);

  const summary = {
    total: allItems.length,
    configured: configured.length,
    missing: missing.length,
    requiredMissing: requiredMissing.length,
    status: requiredMissing.length === 0 ? 'ready' : 'incomplete',
  };

  // Group by category
  const byCategory: Record<string, { configured: string[]; missing: string[] }> = {};

  for (const [key, status] of Object.entries({ ...secrets, ...bindings })) {
    if (!byCategory[status.category]) {
      byCategory[status.category] = { configured: [], missing: [] };
    }
    if (status.configured) {
      byCategory[status.category].configured.push(key);
    } else {
      byCategory[status.category].missing.push(key);
    }
  }

  const response = {
    timestamp: new Date().toISOString(),
    environment: env.ENVIRONMENT || 'production',
    summary,
    byCategory,
    secrets,
    bindings,
    missingRequired:
      requiredMissing.length > 0
        ? Object.entries({ ...secrets, ...bindings })
            .filter(([_, s]) => !s.configured && s.required)
            .map(([key]) => key)
        : [],
  };

  return new Response(JSON.stringify(response, null, 2), {
    status: summary.status === 'ready' ? 200 : 503,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  });
};
