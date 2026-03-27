import { motion } from 'framer-motion';
import { EASE_OUT_EXPO } from '../utils/animations';
import { PLATFORM_URLS } from '../content/site';

export default function Hero() {
  return (
    <section id="hero" aria-labelledby="hero-heading" className="relative min-h-screen flex items-center overflow-hidden bg-midnight hero-grain">
      {/* Static editorial gradient */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 hero-gradient-mesh" />
      </div>

      {/* Content */}
      <div className="relative z-10 px-6 md:px-12 lg:px-16 max-w-6xl mx-auto w-full py-32 md:py-0">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1, ease: EASE_OUT_EXPO }}
          className="text-center md:text-left"
        >
          <h1
            id="hero-heading"
            className="font-sans font-bold uppercase leading-[0.9] tracking-wider text-bone mb-6"
          >
            <span className="block hero-first-name">
              Austin
            </span>
            <span className="block text-stroke text-burnt-orange hero-last-name">
              Humphrey
            </span>
          </h1>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.35, ease: EASE_OUT_EXPO }}
          className="text-center md:text-left space-y-2 mb-10"
        >
          <p className="font-sans font-semibold text-burnt-orange uppercase tracking-[0.2em] text-sm">
            Founder of Blaze Sports Intel
          </p>
          <p className="text-warm-gray text-lg md:text-xl max-w-xl leading-relaxed">
            Six leagues of live analytics and original editorial for the athletes outside the spotlight.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.6, ease: EASE_OUT_EXPO }}
          className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start"
        >
          <a href="#work" className="btn-primary">
            See the Work
          </a>
          <a
            href={PLATFORM_URLS.bsi}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-outline"
          >
            Blaze Sports Intel
          </a>
        </motion.div>
      </div>
    </section>
  );
}
