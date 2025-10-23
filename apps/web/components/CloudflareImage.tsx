'use client';

import { getCloudflareImageUrl, getCloudflareImageSrcSet, CloudflareImageProps } from '../lib/cloudflare-images';

/**
 * CloudflareImage Component
 * Optimized image component using Cloudflare Images
 *
 * Features:
 * - Automatic format selection (WebP, AVIF)
 * - Responsive image generation with srcSet
 * - Edge CDN delivery
 * - Lazy loading support
 *
 * @example
 * ```tsx
 * <CloudflareImage
 *   imageId="longhorns-logo"
 *   alt="Texas Longhorns Logo"
 *   width={400}
 *   height={300}
 *   fit="cover"
 * />
 * ```
 */
export function CloudflareImage({
  imageId,
  alt,
  width = 800,
  height,
  fit = 'scale-down',
  quality = 85,
  className,
  priority = false,
  loading = 'lazy',
}: CloudflareImageProps) {
  const imageUrl = getCloudflareImageUrl(imageId, {
    width,
    height,
    fit,
    quality,
    format: 'auto',
  });

  const srcSet = getCloudflareImageSrcSet(imageId);

  return (
    <img
      src={imageUrl}
      alt={alt}
      width={width}
      height={height}
      srcSet={srcSet}
      className={className}
      loading={priority ? 'eager' : loading}
      style={{ maxWidth: '100%', height: 'auto' }}
    />
  );
}

/**
 * Background Image Component using Cloudflare Images
 * Useful for hero sections and card backgrounds
 */
export function CloudflareBackgroundImage({
  imageId,
  alt,
  width = 1920,
  height = 1080,
  fit = 'cover',
  quality = 90,
  className,
  children,
}: CloudflareImageProps & { children?: React.ReactNode }) {
  const imageUrl = getCloudflareImageUrl(imageId, {
    width,
    height,
    fit,
    quality,
    format: 'auto',
  });

  return (
    <div
      className={className}
      style={{
        backgroundImage: `url(${imageUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
      role="img"
      aria-label={alt}
    >
      {children}
    </div>
  );
}

/**
 * Avatar Component with Cloudflare Images
 * Pre-configured for profile pictures
 */
export function CloudflareAvatar({
  imageId,
  alt,
  size = 128,
  className,
}: {
  imageId: string;
  alt: string;
  size?: number;
  className?: string;
}) {
  return (
    <CloudflareImage
      imageId={imageId}
      alt={alt}
      width={size}
      height={size}
      fit="cover"
      quality={85}
      className={className}
      priority
    />
  );
}
