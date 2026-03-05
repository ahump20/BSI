/**
 * Shared route matching utility.
 * Supports :param placeholders in path patterns.
 */
export function matchRoute(
  pathname: string,
  pattern: string
): { params: Record<string, string> } | null {
  const pp = pattern.split('/');
  const sp = pathname.split('/');
  if (pp.length !== sp.length) return null;
  const params: Record<string, string> = {};
  for (let i = 0; i < pp.length; i++) {
    if (pp[i].startsWith(':')) params[pp[i].slice(1)] = sp[i];
    else if (pp[i] !== sp[i]) return null;
  }
  return { params };
}
