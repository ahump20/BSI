import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { staggerContainer, staggerItem } from '../utils/animations';

const photos = [
  {
    src: '/assets/running-vs-tivy.jpg',
    srcSet: '/assets/optimized/running-vs-tivy-640w.webp 640w, /assets/optimized/running-vs-tivy-1024w.webp 1024w',
    alt: 'Chargers #20 — corner route vs Tivy',
    aspect: 'wide' as const,
    featured: false,
  },
  {
    src: '/assets/chargers-with-dad.jpg',
    srcSet: '/assets/optimized/chargers-with-dad-640w.webp 640w, /assets/optimized/chargers-with-dad-1024w.webp 1024w',
    alt: 'Post-game with Dad — Friday night lights',
    aspect: 'tall' as const,
    featured: false,
  },
  {
    src: '/assets/last-game-silhouette.jpg',
    srcSet: '/assets/optimized/last-game-silhouette-640w.webp 640w, /assets/optimized/last-game-silhouette-1024w.webp 1024w',
    alt: 'Last game — vs Seguin, 2013',
    aspect: 'wide' as const,
    featured: true,
  },
  {
    src: '/assets/friendsgiving.jpg',
    srcSet: '/assets/optimized/friendsgiving-640w.webp 640w, /assets/optimized/friendsgiving-1024w.webp 1024w',
    alt: 'Friendsgiving — Austin, TX',
    aspect: 'wide' as const,
    featured: false,
  },
];

export default function AthleticArc() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-60px' });

  return (
    <section
      id="athletic-arc"
      aria-label="Athletic arc — Friday Night Lights to the Forty Acres"
      className="relative py-16 overflow-hidden"
      style={{
        background: 'linear-gradient(180deg, #0D0D0D 0%, rgba(26,26,26,0.4) 50%, #0D0D0D 100%)',
      }}
    >
      {/* Top accent line */}
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{
          background: 'linear-gradient(90deg, transparent 10%, rgba(191,87,0,0.3) 50%, transparent 90%)',
        }}
      />

      <div className="max-w-6xl mx-auto px-6" ref={ref}>
        <motion.div
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          variants={staggerContainer}
        >
          <motion.p
            variants={staggerItem}
            className="section-label text-center mb-10"
          >
            // Friday Night Lights to the Forty Acres
          </motion.p>

          {/* Desktop: staggered grid */}
          <div className="hidden md:grid md:grid-cols-12 gap-4 items-center">
            {photos.map((photo, i) => {
              // Layout: wide photos span 7 cols, tall photos span 5 cols
              // Alternate alignment for visual rhythm
              const isWide = photo.aspect === 'wide';
              const colSpan = isWide ? 'md:col-span-7' : 'md:col-span-5';
              const isLastGame = photo.featured;

              return (
                <motion.div
                  key={photo.alt}
                  variants={staggerItem}
                  className={`${colSpan} relative group`}
                  style={isLastGame ? { gridColumn: '1 / -1' } : undefined}
                >
                  <div
                    className={`overflow-hidden rounded-sm ${
                      isLastGame ? 'max-h-[400px]' : 'max-h-[320px]'
                    }`}
                  >
                    <img
                      src={photo.src}
                      srcSet={photo.srcSet}
                      sizes="(max-width: 768px) 85vw, 60vw"
                      alt={photo.alt}
                      loading="lazy"
                      decoding="async"
                      className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.02] ${
                        isLastGame ? 'object-center' : ''
                      }`}
                      style={isLastGame ? { minHeight: '300px' } : undefined}
                    />
                    {/* Vignette overlay */}
                    <div
                      className="absolute inset-0 pointer-events-none"
                      style={{
                        boxShadow: 'inset 0 0 60px rgba(0,0,0,0.4)',
                      }}
                    />
                  </div>
                  <p
                    className={`text-xs font-mono mt-2 ${
                      isLastGame
                        ? 'text-burnt-orange text-center'
                        : i % 2 === 0
                          ? 'text-warm-gray/60 text-left'
                          : 'text-warm-gray/60 text-right'
                    }`}
                  >
                    {photo.alt}
                  </p>
                </motion.div>
              );
            })}
          </div>

          {/* Mobile: horizontal scroll strip */}
          <div className="md:hidden -mx-6 px-6 overflow-x-auto scrollbar-hide">
            <div className="flex gap-4 pb-4" style={{ width: 'max-content' }}>
              {photos.map((photo) => {
                const isLastGame = photo.featured;
                return (
                  <div
                    key={photo.alt}
                    className={`flex-shrink-0 ${
                      isLastGame ? 'w-[85vw]' : 'w-[70vw]'
                    }`}
                  >
                    <div className="overflow-hidden rounded-sm max-h-[240px]">
                      <img
                        src={photo.src}
                        srcSet={photo.srcSet}
                        sizes="85vw"
                        alt={photo.alt}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <p
                      className={`text-xs font-mono mt-2 ${
                        isLastGame ? 'text-burnt-orange' : 'text-warm-gray/60'
                      }`}
                    >
                      {photo.alt}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Bottom accent line */}
      <div
        className="absolute bottom-0 left-0 right-0 h-px"
        style={{
          background: 'linear-gradient(90deg, transparent 10%, rgba(191,87,0,0.3) 50%, transparent 90%)',
        }}
      />
    </section>
  );
}
