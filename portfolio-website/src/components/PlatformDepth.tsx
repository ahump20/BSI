import { motion } from 'framer-motion';
import { staggerContainer, staggerItem } from '../utils/animations';
import PlatformStatus from './PlatformStatus';
import { BSI_PLATFORM, PLATFORM_URLS } from '../content/site';

export default function PlatformDepth() {
  return (
    <section
      id="platform"
      aria-labelledby="platform-heading"
      className="section-padding section-border platform-depth-bg"
    >
      <div className="container-custom">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.05 }}
          variants={staggerContainer}
        >
          <motion.div variants={staggerItem}>
            <p className="section-label">// The Platform</p>
            <h2 id="platform-heading" className="section-title">Blaze Sports Intel</h2>
            <div className="mb-8">
              <PlatformStatus />
            </div>
          </motion.div>

          {/* Thesis */}
          <motion.div variants={staggerItem} className="max-w-3xl mb-12">
            <p className="text-bone/85 text-lg leading-relaxed">
              I built BSI because the coverage I wanted did not exist. Try finding advanced
              analytics for a Tuesday night college baseball game between Rice and Sam Houston.
              Try tracking conference standings across five sports without clicking through
              fifteen pages. The gap between interest in the game and access to meaningful
              data is the product.
            </p>
          </motion.div>

          {/* Stats + leagues */}
          <motion.div variants={staggerItem} className="grid md:grid-cols-[auto_1fr] gap-10 items-start mb-10">
            <div className="flex gap-8">
              {BSI_PLATFORM.stats.map((stat) => (
                <div key={stat.label} className="text-center">
                  <p className="text-3xl font-bold font-sans text-burnt-orange text-shadow-glow">{stat.value}</p>
                  <p className="text-xs font-mono text-warm-gray mt-1">{stat.label}</p>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-x-5 gap-y-2 items-center">
              {BSI_PLATFORM.leagues.map((league, i) => (
                <span key={league.name} className="flex items-center gap-2">
                  <span className="font-sans text-sm uppercase tracking-wider text-bone font-medium">
                    {league.name}
                  </span>
                  <span className="text-[0.6rem] font-mono text-burnt-orange">{league.note}</span>
                  {i < BSI_PLATFORM.leagues.length - 1 && (
                    <span className="text-bone/10 ml-1" aria-hidden="true">|</span>
                  )}
                </span>
              ))}
            </div>
          </motion.div>

          {/* Tech + CTA */}
          <motion.div variants={staggerItem} className="flex flex-col sm:flex-row sm:items-center gap-6">
            <a
              href={PLATFORM_URLS.bsi}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary"
            >
              Visit BSI
            </a>
            <p className="font-mono text-[0.62rem] text-warm-gray/60 tracking-wider">
              {BSI_PLATFORM.techStackSentence}
            </p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
