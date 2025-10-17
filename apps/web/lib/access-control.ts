export type AccessTier = 'free' | 'pro' | 'admin';

const PRO_ROLES = new Set(['editor', 'admin']);

export function canAccessDiamondPro(roles: string[] | undefined | null): boolean {
  if (!roles) return false;
  return roles.some((role) => PRO_ROLES.has(role));
}

export function resolveAccessTier(roles: string[] | undefined | null): AccessTier {
  if (!roles || roles.length === 0) {
    return 'free';
  }
  if (roles.includes('admin')) {
    return 'admin';
  }
  if (roles.some((role) => role === 'editor')) {
    return 'pro';
  }
  return 'free';
}

export function summarizeAccess(roles: string[] | undefined | null) {
  const tier = resolveAccessTier(roles);
  return {
    tier,
    isDiamondPro: tier === 'pro' || tier === 'admin',
    isAdmin: tier === 'admin'
  };
}
