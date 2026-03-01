import { motion } from 'framer-motion';
import PlatformStatus from './PlatformStatus';

const marqueeItems = [
  '27 Workers',
  '6 Leagues',
  '58+ Articles',
  '7 Databases',
  '15 KV Caches',
  '18 R2 Buckets',
  '511 Tests Passing',
];

const EASE: [number, number, number, number] = [0.19, 1, 0.22, 1];

export default function Hero() {
  return (
    <section id="hero" aria-labelledby="hero-heading" className="relative min-h-screen flex items-center justify-center overflow-hidden bg-midnight">
      {/* CSS gradient mesh background — no JS, no canvas */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            background: [
              'radial-gradient(ellipse 80% 60% at 25% 20%, rgba(191,87,0,0.08) 0%, transparent 60%)',
              'radial-gradient(ellipse 60% 80% at 75% 75%, rgba(139,69,19,0.06) 0%, transparent 60%)',
              'radial-gradient(ellipse 50% 50% at 50% 50%, rgba(255,107,53,0.03) 0%, transparent 50%)',
              'radial-gradient(ellipse 90% 40% at 80% 10%, rgba(191,87,0,0.04) 0%, transparent 50%)',
            ].join(', '),
            animation: 'hero-mesh 20s ease-in-out infinite alternate',
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE }}
          className="section-label mb-6"
        >
          Sports Intelligence Architect
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2, ease: EASE }}
        >
          <h1
            id="hero-heading"
            className="font-sans font-bold uppercase leading-[0.9] tracking-wider text-bone mb-4"
            style={{ fontSize: 'clamp(4rem, 12vw, 8rem)' }}
          >
            Austin
            <br />
            <span className="text-stroke text-burnt-orange">Humphrey</span>
          </h1>
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4, ease: EASE }}
          className="font-display italic text-warm-gray text-lg md:text-xl max-w-2xl mx-auto mb-4 leading-relaxed"
        >
          "The gap between interest in the game and access to meaningful analytics
          is the product — old-school scouting instinct fused with new-school sabermetrics."
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="flex justify-center mb-10"
        >
          <PlatformStatus className="lg:hidden" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.6, ease: EASE }}
          className="flex flex-col sm:flex-row gap-4 justify-center mb-16"
        >
          <a href="#origin" className="btn-primary">
            The Origin
          </a>
          <a
            href="https://blazesportsintel.com"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-outline"
          >
            Blaze Sports Intel
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
          {/* Duplicate for seamless loop */}
          {[...marqueeItems, ...marqueeItems].map((item, i) => (
            <span key={i} className="font-mono text-xs text-warm-gray/60 uppercase tracking-[0.3em] mx-8 whitespace-nowrap">
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
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
        >
          <svg width="20" height="12" viewBox="0 0 20 12" fill="none" className="text-bone/30">
            <path d="M1 1L10 10L19 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </motion.div>
      </motion.div>

      {/* Hero mesh animation keyframes */}
      <style>{`
        @keyframes hero-mesh {
          0% { transform: scale(1) rotate(0deg); }
          50% { transform: scale(1.05) rotate(0.5deg); }
          100% { transform: scale(1) rotate(-0.5deg); }
        }
      `}</style>
    </section>
  );
}
