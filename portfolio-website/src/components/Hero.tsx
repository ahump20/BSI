import { motion } from 'framer-motion';
import { EASE_OUT_EXPO } from '../utils/animations';
import { HERO_CONTENT, SITE_TAGLINE } from '../content/site';

function ScrollIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 1.8, duration: 0.8 }}
      className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2"
    >
      <span className="font-mono text-[0.55rem] uppercase tracking-[0.3em] text-bone/30">
        Scroll
      </span>
      <motion.div
        animate={{ y: [0, 6, 0] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
        className="h-8 w-[1px] bg-gradient-to-b from-burnt-orange/50 to-transparent"
      />
    </motion.div>
  );
}

export default function Hero() {
  return (
    <section
      id="hero"
      aria-labelledby="hero-heading"
      className="relative overflow-hidden bg-midnight"
    >
      {/* Photo backdrop — silhouette lighting lets vignette do the heavy lifting */}
      <picture>
        <source
          srcSet="/assets/optimized/last-game-silhouette-640w.webp 640w, /assets/optimized/last-game-silhouette-1024w.webp 1024w"
          sizes="100vw"
          type="image/webp"
        />
        <img
          src="/assets/last-game-silhouette.jpg"
          alt=""
          aria-hidden="true"
          className="hero-bg-photo"
        />
      </picture>

      {/* Gradient overlay — heavy at bottom where text lives, transparent at top for atmosphere */}
      <div className="hero-photo-overlay" />

      {/* Grain texture */}
      <div className="absolute inset-0 pointer-events-none hero-grain" />

      <div className="relative z-10 mx-auto flex min-h-[90svh] max-w-5xl flex-col justify-end px-6 pb-20 pt-28 md:min-h-[85svh] md:px-12 md:pb-24 md:pt-36 lg:px-16 lg:pb-28">
        {/* Thesis — the anchor */}
        <motion.p
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: EASE_OUT_EXPO }}
          className="max-w-2xl font-serif text-xl leading-relaxed text-bone/90 md:text-2xl md:leading-relaxed [text-shadow:0_2px_12px_rgba(0,0,0,0.6)]"
        >
          {HERO_CONTENT.thesis}
        </motion.p>

        {/* Name — arrives after the thesis */}
        <motion.h1
          id="hero-heading"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, delay: 0.25, ease: EASE_OUT_EXPO }}
          className="mt-10 font-sans font-bold uppercase leading-[0.88] tracking-[0.06em] text-bone md:mt-12 [text-shadow:0_4px_20px_rgba(0,0,0,0.5)]"
        >
          <span className="block hero-first-name">Austin</span>
          <span className="mt-1 block hero-last-name text-burnt-orange">Humphrey</span>
        </motion.h1>

        {/* Tagline + CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5, ease: EASE_OUT_EXPO }}
          className="mt-8 flex flex-col gap-5 sm:flex-row sm:items-center sm:gap-8"
        >
          <a href={HERO_CONTENT.cta.href} className="btn-primary">
            {HERO_CONTENT.cta.label}
          </a>
          <p className="font-mono text-[0.7rem] uppercase tracking-[0.25em] text-burnt-orange/80 [text-shadow:0_1px_6px_rgba(0,0,0,0.4)]">
            {SITE_TAGLINE}
          </p>
        </motion.div>
      </div>

      {/* Scroll indicator — appears after entrance animations settle */}
      <ScrollIndicator />

      {/* Bottom edge — subtle burnt-orange glow line */}
      <div className="absolute bottom-0 left-0 right-0 h-px accent-line-narrow" />
    </section>
  );
}
