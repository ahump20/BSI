const ABSOLUTE_URL_PATTERN = /^https?:\/\//i;

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, '');
}

function normalizePath(path: string): string {
  return path.startsWith('/') ? path : `/${path}`;
}

function getConfiguredPublicApiOrigin(): string {
  const configured = process.env.NEXT_PUBLIC_API_BASE?.trim();
  return configured ? trimTrailingSlash(configured) : '';
}

export function getReadApiOrigin(): string {
  const configured = getConfiguredPublicApiOrigin();
  if (configured) return configured;
  return '';
}

export function getReadApiUrl(path: string): string {
  if (ABSOLUTE_URL_PATTERN.test(path)) return path;
  return `${getReadApiOrigin()}${normalizePath(path)}`;
}

export function getAnalyticsApiUrl(path: string): string | null {
  if (ABSOLUTE_URL_PATTERN.test(path)) return path;

  const configured = getConfiguredPublicApiOrigin();
  if (configured) return `${configured}${normalizePath(path)}`;

  // Avoid shipping local development traffic to production analytics.
  if (typeof window !== 'undefined' && ['localhost', '127.0.0.1'].includes(window.location.hostname)) {
    return null;
  }

  return normalizePath(path);
}
