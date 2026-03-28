'use client';

/**
 * HeroBg — Heritage hero section with R2 background imagery.
 *
 * Layers (bottom to top):
 *   1. R2 image (darkened, covers full section)
 *   2. Gradient overlay (scoreboard black → transparent)
 *   3. Grain texture (Heritage atmosphere)
 *   4. Children (text content)
 *
 * The image is decorative atmosphere, not content — never fights readability.
 */

interface HeroBgProps {
  /** R2 bucket alias: "brand" or "images" */
  bucket: 'brand' | 'images';
  /** R2 object path within the bucket */
  imagePath: string;
  /** Image opacity (0-1). Lower = more subtle. Default: 0.15 */
  imageOpacity?: number;
  /** Additional className on the outer wrapper */
  className?: string;
  children: React.ReactNode;
}

export function HeroBg({
  bucket,
  imagePath,
  imageOpacity = 0.15,
  className = '',
  children,
}: HeroBgProps) {
  const src = `/api/assets/${bucket}/${imagePath}`;

  return (
    <section
      className={`relative overflow-hidden ${className}`}
      style={{ borderBottom: '1px solid var(--border-vintage)' }}
    >
      {/* Layer 1: R2 background image */}
      <img
        src={src}
        alt=""
        aria-hidden="true"
        loading="eager"
        decoding="async"
        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        style={{ opacity: imageOpacity }}
      />

      {/* Layer 2: Gradient overlay — dark at top/bottom, slightly transparent center */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `linear-gradient(
            to bottom,
            var(--surface-scoreboard) 0%,
            rgba(10, 10, 10, 0.7) 40%,
            rgba(10, 10, 10, 0.85) 70%,
            var(--surface-scoreboard) 100%
          )`,
        }}
      />

      {/* Layer 3: Grain texture */}
      <div
        className="absolute inset-0 pointer-events-none grain-overlay"
        style={{ opacity: 0.4 }}
      />

      {/* Layer 4: Content */}
      <div className="relative z-10">{children}</div>
    </section>
  );
}
