/**
 * Centralized OG image metadata for Next.js Metadata API.
 * Standard dimensions: 1200x630 (Open Graph specification).
 */
export const ogImage = (path = '/images/og-image.png', alt?: string) =>
  [{ url: path, width: 1200, height: 630, ...(alt && { alt }) }];
