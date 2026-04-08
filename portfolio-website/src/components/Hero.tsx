import { motion } from 'framer-motion';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';
import { EASE_OUT_EXPO } from '../utils/animations';
import { SITE_TAGLINE } from '../content/site';

export default function Hero() {
  const reduced = usePrefersReducedMotion();

  const fadeUp = (delay: number) =>
    reduced
      ? {}
      : {
          initial: { opacity: 0, y: 20 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.65, delay, ease: EASE_OUT_EXPO },
        };

  return (
    <section
      id="hero"
      className="relative min-h-screen flex flex-col justify-center sm:justify-end overflow-hidden"
    >
      {/* Background photograph */}
      <img
        src="/assets/optimized/football-uniform-1920w.webp"
        alt=""
        aria-hidden="true"
        className="absolute inset-0 w-full h-full object-cover object-top"
        loading="eager"
        fetchPriority="high"
      />

      {/* Dark gradient overlay for text readability — lighter on mobile where content is centered */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.3) 25%, rgba(0,0,0,0.5) 50%, rgba(0,0,0,0.7) 70%, rgba(13,13,13,0.92) 88%, rgba(13,13,13,1) 100%)',
        }}
      />

      {/* Film grain */}
      <div className="grain-overlay" />

      {/* Content — pinned to bottom of viewport */}
      <div className="relative z-10 px-6 sm:px-10 lg:px-16 pb-12 sm:pb-16 lg:pb-20">
        <div className="max-w-6xl mx-auto">
          {/* Name */}
          <motion.div {...fadeUp(0)}>
            <h1>
              <span
                className="hero-first-name block font-sans font-bold uppercase leading-none"
                style={{
                  color: 'var(--color-text)',
                  textShadow: '0 2px 30px rgba(0,0,0,0.7)',
                }}
              >
                Austin
              </span>
              <span
                className="hero-last-name block font-sans font-bold uppercase leading-none -mt-2 sm:-mt-3"
                style={{
                  color: 'var(--color-text)',
                  textShadow: '0 2px 40px rgba(0,0,0,0.8)',
                }}
              >
                Humphrey
              </span>
            </h1>
          </motion.div>

          {/* Thesis */}
          <motion.p
            className="max-w-2xl font-serif text-[clamp(1rem,2.5vw,1.35rem)] leading-relaxed italic mt-6"
            style={{ color: 'var(--color-text-muted)', textShadow: '0 1px 12px rgba(0,0,0,0.6)' }}
            {...fadeUp(0.15)}
          >
            Builder of Blaze Sports Intel — six-league analytics platform built solo on Cloudflare.
            330 college baseball programs with park-adjusted sabermetrics. All of it live. All of it one person.
          </motion.p>

          {/* Tagline */}
          <motion.p
            className="font-display text-[12px] italic tracking-wide mt-8"
            style={{ color: 'rgba(191,87,0,0.5)' }}
            {...fadeUp(0.3)}
          >
            {SITE_TAGLINE}
          </motion.p>

          {/* Scroll indicator */}
          <motion.div
            className="mt-10"
            {...fadeUp(0.5)}
          >
            <span
              className="inline-block font-mono text-[9px] tracking-[0.3em] uppercase"
              style={{ color: 'rgba(245,240,235,0.25)' }}
            >
              Scroll
            </span>
            <div
              className="w-px h-8 mt-2"
              style={{ background: 'linear-gradient(to bottom, rgba(191,87,0,0.4), transparent)' }}
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
