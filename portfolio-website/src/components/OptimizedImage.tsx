interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
}

export default function OptimizedImage({ src, alt, className = '', priority = false }: OptimizedImageProps) {
  // Extract filename without extension from src path
  // e.g., "/assets/texas-soil.jpg" → "texas-soil"
  const filename = src.split('/').pop()?.replace(/\.(jpg|jpeg|png)$/, '') || '';

  // Generate WebP srcSet for different sizes
  const webpSrcSet = `
    /assets/optimized/${filename}-640w.webp 640w,
    /assets/optimized/${filename}-1024w.webp 1024w,
    /assets/optimized/${filename}-1920w.webp 1920w
  `.trim();

  return (
    <picture>
      {/* WebP format with responsive sizes */}
      <source
        type="image/webp"
        srcSet={webpSrcSet}
        sizes="(max-width: 640px) 640px, (max-width: 1024px) 1024px, 1920px"
      />

      {/* Fallback to original image for browsers that don't support WebP */}
      <img
        src={src}
        alt={alt}
        className={className}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
      />
    </picture>
  );
}
