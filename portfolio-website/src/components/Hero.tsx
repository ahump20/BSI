import { motion } from 'framer-motion';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';
import { EASE_OUT_EXPO } from '../utils/animations';

const marqueeItems = [
  '23 Workers',
  '6 Leagues',
  '58+ Articles',
  '7 Databases',
  '12 KV Caches',
  '18 R2 Buckets',
  '558 Tests Passing',
];

export default function Hero() {
  const prefersReducedMotion = usePrefersReducedMotion();

  return (
    <section id="hero" aria-labelledby="hero-heading" className="relative min-h-screen flex items-center overflow-hidden bg-midnight">
      {/* Static editorial gradient — deliberate burnt-orange anchor at top-right */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            background: [
              'radial-gradient(ellipse 70% 60% at 85% 15%, rgba(191,87,0,0.10) 0%, transparent 60%)',
              'radial-gradient(ellipse 50% 50% at 10% 80%, rgba(139,69,19,0.05) 0%, transparent 50%)',
              'radial-gradient(ellipse 40% 40% at 50% 50%, rgba(255,107,53,0.02) 0%, transparent 50%)',
            ].join(', '),
          }}
        />
      </div>

      {/* Content — left-aligned on desktop, centered on mobile */}
      <div className="relative z-10 px-6 md:px-12 lg:px-16 max-w-6xl mx-auto w-full py-32 md:py-0">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE_OUT_EXPO }}
          className="section-label mb-6 text-center md:text-left"
        >
          Sports Intelligence Architect
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2, ease: EASE_OUT_EXPO }}
          className="text-center md:text-left"
        >
          <h1
            id="hero-heading"
            className="font-sans font-bold uppercase leading-[0.9] tracking-wider text-bone mb-6"
          >
            <span className="block" style={{ fontSize: 'clamp(2.5rem, 8vw, 5rem)' }}>
              Austin
            </span>
            <span
              className="block text-stroke text-burnt-orange"
              style={{ fontSize: 'clamp(4rem, 12vw, 8rem)' }}
            >
              Humphrey
            </span>
          </h1>
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4, ease: EASE_OUT_EXPO }}
          className="text-warm-gray text-lg md:text-xl max-w-xl mb-10 leading-relaxed text-center md:text-left"
        >
          Building the sports analytics platform that mainstream media won't — old-school scouting instinct fused with new-school sabermetrics, covering the athletes and programs outside the spotlight.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.6, ease: EASE_OUT_EXPO }}
          className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start"
        >
          <a
            href="https://blazesportsintel.com"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary"
          >
            Blaze Sports Intel
          </a>
          <a href="#origin" className="btn-outline">
            The Origin
          </a>
          <a href="/Austin_Humphrey_Resume.pdf" download className="btn-outline">
            Resume
          </a>
        </motion.div>
      </div>

      {/* Stats marquee */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 0.8 }}
        className="absolute bottom-16 left-0 right-0 overflow-hidden border-t border-b border-bone/5 py-3"
      >
        <div className="marquee-track" aria-hidden="true">
          {[...marqueeItems, ...marqueeItems].map((item, i) => (
            <span key={i} className="font-mono text-xs text-warm-gray/80 uppercase tracking-[0.3em] mx-8 whitespace-nowrap">
              {item}
              <span className="text-burnt-orange/40 ml-8">·</span>
            </span>
          ))}
        </div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.6 }}
        className="absolute bottom-6 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={prefersReducedMotion ? {} : { y: [0, 8, 0] }}
          transition={prefersReducedMotion ? {} : { repeat: Infinity, duration: 2, ease: 'easeInOut' }}
        >
          <svg width="20" height="12" viewBox="0 0 20 12" fill="none" className="text-bone/30">
            <path d="M1 1L10 10L19 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </motion.div>
      </motion.div>

    </section>
  );
}
