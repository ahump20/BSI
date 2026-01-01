/**
 * Environment Variable Validation
 *
 * Validates all required environment variables on application startup
 * Prevents deployment with missing or invalid configuration
 *
 * Works in both Node.js and Cloudflare Workers environments
 */

import { z } from 'zod';

// Base environment schema (common to both Node.js and Workers)
const BaseEnvSchema = z.object({
  // Environment
  NODE_ENV: z.enum(['development', 'staging', 'production']).optional(),
  ENVIRONMENT: z.enum(['development', 'staging', 'production']).optional(),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error', 'fatal']).default('info'),
});

// Node.js-specific environment schema (full local development)
const NodeEnvSchema = BaseEnvSchema.extend({
  // Database (REQUIRED in production)
  DATABASE_URL: z.string().url().or(z.string().startsWith('postgresql://')),
  POSTGRES_PASSWORD: z.string().min(16, 'Password must be at least 16 characters'),

  // Storage (REQUIRED in production)
  MINIO_ROOT_PASSWORD: z.string().min(16, 'Password must be at least 16 characters'),

  // Security (REQUIRED in production)
  JWT_SECRET: z.string().min(32, 'JWT secret must be at least 32 characters'),
  SESSION_SECRET: z.string().min(32, 'Session secret must be at least 32 characters'),
  CSRF_SECRET: z.string().min(32, 'CSRF secret must be at least 32 characters'),
  ENCRYPTION_KEY: z.string().min(32, 'Encryption key must be at least 32 characters'),
  API_KEY_SALT: z.string().min(32, 'API key salt must be at least 32 characters'),

  // Monitoring (REQUIRED in production)
  GRAFANA_PASSWORD: z.string().min(12, 'Grafana password must be at least 12 characters'),

  // Optional but recommended
  SENTRY_DSN: z.string().url().optional(),
  DD_API_KEY: z.string().optional(),
});

// Cloudflare Workers environment schema (secrets set via wrangler)
const WorkersEnvSchema = BaseEnvSchema.extend({
  // Sports Data APIs
  SPORTSDATAIO_API_KEY: z.string().min(1, 'SportsDataIO API key is required').optional(),
  CFBDATA_API_KEY: z.string().min(1, 'CFBD API key is required').optional(),
  COLLEGEFOOTBALLDATA_API_KEY: z.string().optional(), // Alias for CFBDATA_API_KEY
  THEODDS_API_KEY: z.string().optional(),

  // AI Services
  GOOGLE_GEMINI_API_KEY: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),

  // Authentication
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  JWT_SECRET: z.string().min(32, 'JWT secret must be at least 32 characters').optional(),

  // Payments
  STRIPE_SECRET_KEY: z.string().startsWith('sk_').optional(),
  STRIPE_WEBHOOK_SECRET: z.string().startsWith('whsec_').optional(),
  STRIPE_PRO_PRICE_ID: z.string().startsWith('price_').optional(),
  STRIPE_ENTERPRISE_PRICE_ID: z.string().startsWith('price_').optional(),
});

// Combined schema for full validation
const EnvSchema = NodeEnvSchema;

type Env = z.infer<typeof EnvSchema>;
type WorkersEnv = z.infer<typeof WorkersEnvSchema>;

// Export schemas for external use
export { WorkersEnvSchema, NodeEnvSchema, BaseEnvSchema };

/**
 * Validate environment variables
 * Works in both Node.js and Cloudflare Workers
 *
 * @param env - Cloudflare env bindings (Workers) or undefined (Node.js)
 */
export function validateEnv(env?: any): { valid: boolean; errors?: string[] } {
  const envSource = env || (typeof process !== 'undefined' ? process.env : {});

  try {
    EnvSchema.parse(envSource);
    return { valid: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.issues.map((err) => {
        const field = err.path.join('.');
        return `${field}: ${err.message}`;
      });

      return {
        valid: false,
        errors,
      };
    }

    return {
      valid: false,
      errors: ['Unknown validation error'],
    };
  }
}

/**
 * Get validated environment variables
 * Works in both Node.js and Cloudflare Workers
 *
 * @param env - Cloudflare env bindings (Workers) or undefined (Node.js)
 */
export function getEnv(env?: any): Env {
  const result = validateEnv(env);

  if (!result.valid) {
    const errors = result.errors?.join('\n') || 'Unknown error';
    throw new Error(`Environment validation failed:\n${errors}`);
  }

  return (env || (typeof process !== 'undefined' ? process.env : {})) as unknown as Env;
}

/**
 * Check for default/weak passwords
 * Works in both Node.js and Cloudflare Workers
 *
 * @param env - Cloudflare env bindings (Workers) or undefined (Node.js)
 */
export function checkForWeakSecrets(env?: any): string[] {
  const envSource = env || (typeof process !== 'undefined' ? process.env : {});
  const warnings: string[] = [];
  const weakPatterns = ['CHANGE_ME', 'password', 'secret', 'admin', '123456', 'blaze'];

  const secretFields = [
    'POSTGRES_PASSWORD',
    'MINIO_ROOT_PASSWORD',
    'JWT_SECRET',
    'SESSION_SECRET',
    'CSRF_SECRET',
    'ENCRYPTION_KEY',
    'GRAFANA_PASSWORD',
  ];

  for (const field of secretFields) {
    const value = envSource[field] || '';

    for (const pattern of weakPatterns) {
      if (value.toLowerCase().includes(pattern.toLowerCase())) {
        warnings.push(`${field} appears to contain weak/default value`);
        break;
      }
    }

    if (value.length < 16) {
      warnings.push(`${field} is shorter than recommended 16 characters`);
    }
  }

  return warnings;
}

/**
 * Run environment validation on startup (Node.js only)
 * Skips validation in Cloudflare Workers
 */
export function validateEnvironmentOnStartup(): void {
  // Skip in Workers - validation should be done at request time with env bindings
  if (typeof process === 'undefined') {
    console.warn('⚠️  Running in Cloudflare Workers - skipping startup validation');
    return;
  }

  console.log('🔍 Validating environment configuration...');

  const result = validateEnv();

  if (!result.valid) {
    console.error('❌ Environment validation failed:');
    result.errors?.forEach((error) => console.error(`  - ${error}`));
    if (typeof process !== 'undefined' && typeof process.exit === 'function') {
      process.exit(1);
    }
    return;
  }

  console.log('✅ Environment validation passed');

  // Check for weak secrets in production
  const nodeEnv = typeof process !== 'undefined' ? process.env?.NODE_ENV : undefined;
  if (nodeEnv === 'production') {
    const warnings = checkForWeakSecrets();

    if (warnings.length > 0) {
      console.warn('⚠️  Security warnings:');
      warnings.forEach((warning) => console.warn(`  - ${warning}`));

      // In production, exit if weak secrets are detected
      console.error('❌ Production deployment blocked due to weak secrets');
      if (typeof process !== 'undefined' && typeof process.exit === 'function') {
        process.exit(1);
      }
    }
  }
}

/**
 * Validate Cloudflare Workers environment bindings
 * Use this in Workers request handlers to validate env
 *
 * @param env - Cloudflare env bindings
 * @returns Validation result with missing/invalid fields
 */
export function validateWorkersEnv(env: Record<string, unknown>): {
  valid: boolean;
  errors?: string[];
  warnings?: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check required sports data APIs
  const hasCfbdKey = env.CFBDATA_API_KEY || env.COLLEGEFOOTBALLDATA_API_KEY;
  if (!hasCfbdKey) {
    warnings.push('CFBDATA_API_KEY: College Football Data API key not configured');
  }

  const hasSportsDataKey = env.SPORTSDATAIO_API_KEY || env.SPORTSDATAIO_KEY;
  if (!hasSportsDataKey) {
    warnings.push('SPORTSDATAIO_API_KEY: SportsDataIO API key not configured');
  }

  // Check authentication secrets
  if (!env.JWT_SECRET) {
    errors.push('JWT_SECRET: Required for authentication');
  } else if (typeof env.JWT_SECRET === 'string' && env.JWT_SECRET.length < 32) {
    errors.push('JWT_SECRET: Must be at least 32 characters');
  }

  // Check payment integration
  if (!env.STRIPE_SECRET_KEY) {
    warnings.push('STRIPE_SECRET_KEY: Required for payment processing');
  }
  if (!env.STRIPE_WEBHOOK_SECRET) {
    warnings.push('STRIPE_WEBHOOK_SECRET: Required for webhook verification');
  }

  // Check OAuth
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
    warnings.push('GOOGLE_CLIENT_ID/SECRET: Required for Google OAuth');
  }

  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}

/**
 * Get environment variable with fallback support
 * Handles alias names used in different parts of the codebase
 *
 * @param env - Environment object
 * @param key - Primary key name
 * @param aliases - Alternative key names
 * @returns Value or undefined
 */
export function getEnvVar(
  env: Record<string, unknown>,
  key: string,
  ...aliases: string[]
): string | undefined {
  if (env[key]) return env[key] as string;
  for (const alias of aliases) {
    if (env[alias]) return env[alias] as string;
  }
  return undefined;
}
