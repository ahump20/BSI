/**
 * Cloudflare Images Integration
 * Optimizes images for the web with automatic format conversion, resizing, and CDN delivery
 */

export interface CloudflareImageOptions {
  width?: number;
  height?: number;
  fit?: 'scale-down' | 'contain' | 'cover' | 'crop' | 'pad';
  quality?: number;
  format?: 'auto' | 'webp' | 'avif' | 'json';
  blur?: number;
  sharpen?: number;
}

/**
 * Generate Cloudflare Images URL with transformations
 * @param imageId - Image ID or URL in Cloudflare Images
 * @param options - Transformation options
 * @returns Optimized image URL
 */
export function getCloudflareImageUrl(
  imageId: string,
  options: CloudflareImageOptions = {}
): string {
  const {
    width,
    height,
    fit = 'scale-down',
    quality = 85,
    format = 'auto',
    blur,
    sharpen,
  } = options;

  // Cloudflare Images delivery URL
  // In production, this should come from environment variables
  const accountHash = process.env.NEXT_PUBLIC_CF_IMAGES_ACCOUNT_HASH || 'YOUR_ACCOUNT_HASH';
  const baseUrl = `https://imagedelivery.net/${accountHash}`;

  // Build variant string
  const params: string[] = [];
  if (width) params.push(`w=${width}`);
  if (height) params.push(`h=${height}`);
  params.push(`fit=${fit}`);
  params.push(`q=${quality}`);
  params.push(`f=${format}`);
  if (blur) params.push(`blur=${blur}`);
  if (sharpen) params.push(`sharpen=${sharpen}`);

  const variant = params.join(',');

  return `${baseUrl}/${imageId}/${variant}`;
}

/**
 * Generate responsive srcset for Cloudflare Images
 * @param imageId - Image ID
 * @param widths - Array of widths for responsive images
 * @returns srcset string
 */
export function getCloudflareImageSrcSet(
  imageId: string,
  widths: number[] = [320, 640, 768, 1024, 1280, 1536]
): string {
  return widths
    .map(width => {
      const url = getCloudflareImageUrl(imageId, { width, format: 'auto' });
      return `${url} ${width}w`;
    })
    .join(', ');
}

/**
 * Cloudflare Images component props
 */
export interface CloudflareImageProps {
  imageId: string;
  alt: string;
  width?: number;
  height?: number;
  fit?: CloudflareImageOptions['fit'];
  quality?: number;
  className?: string;
  priority?: boolean;
  loading?: 'lazy' | 'eager';
}

/**
 * Pre-configured image variants for common use cases
 */
export const IMAGE_VARIANTS = {
  thumbnail: { width: 200, height: 200, fit: 'cover' as const, quality: 80 },
  card: { width: 400, height: 300, fit: 'cover' as const, quality: 85 },
  hero: { width: 1920, height: 1080, fit: 'cover' as const, quality: 90 },
  avatar: { width: 128, height: 128, fit: 'cover' as const, quality: 85 },
  og: { width: 1200, height: 630, fit: 'cover' as const, quality: 90 },
} as const;

/**
 * Get optimized image URL for a specific variant
 */
export function getVariantUrl(imageId: string, variant: keyof typeof IMAGE_VARIANTS): string {
  return getCloudflareImageUrl(imageId, IMAGE_VARIANTS[variant]);
}

/**
 * Upload image to Cloudflare Images (server-side only)
 * @param file - File to upload
 * @param metadata - Optional metadata
 * @returns Image ID
 */
export async function uploadToCloudflareImages(
  file: File | Blob,
  metadata?: Record<string, string>
): Promise<{ id: string; url: string }> {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;

  if (!accountId || !apiToken) {
    throw new Error('Cloudflare credentials not configured');
  }

  const formData = new FormData();
  formData.append('file', file);
  if (metadata) {
    formData.append('metadata', JSON.stringify(metadata));
  }

  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/images/v1`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiToken}`,
      },
      body: formData,
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to upload image: ${response.statusText}`);
  }

  const result = await response.json();
  return {
    id: result.result.id,
    url: result.result.variants[0],
  };
}

/**
 * Placeholder blur data URL generator
 * Creates a tiny placeholder for blur-up effect
 */
export function getBlurDataUrl(color: string = '#1a1a1a'): string {
  return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10'%3E%3Crect width='10' height='10' fill='${encodeURIComponent(color)}'/%3E%3C/svg%3E`;
}
