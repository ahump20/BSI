/**
 * BLAZE SPORTS INTEL - FEATURE GATE UTILITIES
 *
 * Enforces subscription tier access to protected endpoints
 * Tiers: free, pro, enterprise
 *
 * @version 1.0.0
 * @updated 2025-12-10
 */

export type Tier = 'free' | 'pro' | 'enterprise';

interface FeatureGateEnv {
  DB: D1Database;
  KV: KVNamespace;
}

// Feature access by tier
const TIER_FEATURES: Record<Tier, string[]> = {
  free: ['scores', 'standings', 'basic-stats', 'schedules', 'news'],
  pro: [
    'scores',
    'standings',
    'basic-stats',
    'schedules',
    'news',
    'advanced-stats',
    'predictions',
    'api-access',
    'historical-data',
    'player-comparisons',
    'box-scores',
  ],
  enterprise: [
    'scores',
    'standings',
    'basic-stats',
    'schedules',
    'news',
    'advanced-stats',
    'predictions',
    'api-access',
    'historical-data',
    'player-comparisons',
    'box-scores',
    'bulk-export',
    'custom-alerts',
    'priority-support',
    'white-label',
    'dedicated-api',
    'raw-data-access',
  ],
};

// Tier hierarchy for comparison
const TIER_ORDER: Record<Tier, number> = {
  free: 0,
  pro: 1,
  enterprise: 2,
};

/**
 * Get user's tier from cache or database
 */
export async function getUserTier(userId: string, env: FeatureGateEnv): Promise<Tier> {
  // Check KV cache first (5-minute TTL)
  const cached = await env.KV.get(`tier:${userId}`);
  if (cached && ['free', 'pro', 'enterprise'].includes(cached)) {
    return cached as Tier;
  }

  // Query database
  try {
    const result = await env.DB.prepare('SELECT tier FROM users WHERE id = ?')
      .bind(userId)
      .first<{ tier: string }>();

    const tier = (result?.tier as Tier) || 'free';

    // Cache for 5 minutes
    await env.KV.put(`tier:${userId}`, tier, { expirationTtl: 300 });

    return tier;
  } catch (error) {
    console.error('Failed to fetch user tier:', error);
    return 'free';
  }
}

/**
 * Check if a user has access to a specific feature
 */
export async function checkFeatureAccess(
  userId: string,
  feature: string,
  env: FeatureGateEnv
): Promise<{ allowed: boolean; tier: Tier; reason?: string }> {
  const tier = await getUserTier(userId, env);
  const allowedFeatures = TIER_FEATURES[tier] || TIER_FEATURES.free;
  const allowed = allowedFeatures.includes(feature);

  return {
    allowed,
    tier,
    reason: allowed
      ? undefined
      : `Feature '${feature}' requires ${getRequiredTierForFeature(feature)} subscription`,
  };
}

/**
 * Get the minimum tier required for a feature
 */
function getRequiredTierForFeature(feature: string): string {
  if (TIER_FEATURES.free.includes(feature)) return 'Free';
  if (TIER_FEATURES.pro.includes(feature)) return 'Pro';
  if (TIER_FEATURES.enterprise.includes(feature)) return 'Enterprise';
  return 'Enterprise';
}

/**
 * Check if user meets minimum tier requirement
 */
export async function requireTier(
  userId: string,
  minimumTier: Tier,
  env: FeatureGateEnv
): Promise<{ allowed: boolean; currentTier: Tier; reason?: string }> {
  const currentTier = await getUserTier(userId, env);
  const allowed = TIER_ORDER[currentTier] >= TIER_ORDER[minimumTier];

  return {
    allowed,
    currentTier,
    reason: allowed ? undefined : `This feature requires a ${minimumTier} subscription`,
  };
}

/**
 * Create a 403 Forbidden response for feature gate failures
 */
export function createGateResponse(
  feature: string,
  currentTier: Tier,
  requiredTier: Tier
): Response {
  return new Response(
    JSON.stringify({
      error: 'Upgrade required',
      message: `This feature requires a ${requiredTier} subscription`,
      feature,
      currentTier,
      requiredTier,
      upgradeUrl: '/pricing',
    }),
    {
      status: 403,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    }
  );
}

/**
 * Get all features available for a tier
 */
export function getFeaturesForTier(tier: Tier): string[] {
  return TIER_FEATURES[tier] || TIER_FEATURES.free;
}

/**
 * Check if a tier has access to a feature (without database lookup)
 */
export function tierHasFeature(tier: Tier, feature: string): boolean {
  return (TIER_FEATURES[tier] || TIER_FEATURES.free).includes(feature);
}
