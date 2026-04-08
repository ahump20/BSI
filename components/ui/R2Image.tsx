'use client';

/**
 * R2Image — serves images from BSI R2 buckets through the worker asset route.
 *
 * Bucket aliases:
 *   "brand"  — sized logos, brand grid (bsi-web-assets)
 *   "images" — hero banners, stadium photos (blazesports-assets)
 *
 * Usage:
 *   <R2Image bucket="brand" path="bsi-logo-shield-200.png" alt="BSI Shield" width={200} height={200} />
 *   <R2Image bucket="images" path="blaze-stadium-hero.png" alt="BSI stadium hero" fill className="object-cover" />
 */

interface R2ImageProps {
  bucket: 'brand' | 'images';
  path: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  /** Load eagerly (above the fold). Default: lazy. */
  priority?: boolean;
  /** Fill parent container via absolute positioning */
  fill?: boolean;
  style?: React.CSSProperties;
}

export function R2Image({
  bucket,
  path,
  alt,
  className,
  width,
  height,
  priority = false,
  fill = false,
  style,
}: R2ImageProps) {
  const src = `/api/assets/${bucket}/${path}`;

  const fillStyles: React.CSSProperties = fill
    ? { position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }
    : {};

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      width={fill ? undefined : width}
      height={fill ? undefined : height}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      style={{ ...fillStyles, ...style }}
    />
  );
}
