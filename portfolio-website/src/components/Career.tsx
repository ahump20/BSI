import { motion } from 'framer-motion';
import { staggerContainer, staggerItem } from '../utils/animations';
import { CAREER_ENTRIES, EDUCATION_LINE } from '../content/site';

export default function Career() {
  return (
    <section
      id="career"
      aria-labelledby="career-heading"
      className="section-padding section-border career-bg"
    >
      <div className="container-custom">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.05 }}
          variants={staggerContainer}
        >
          <motion.div variants={staggerItem}>
            <p className="section-label">// The Journey</p>
            <h2 id="career-heading" className="section-title">Experience</h2>
          </motion.div>

          {/* Professional timeline */}
          <div className="space-y-0 mb-12">
            {CAREER_ENTRIES.map((entry) => {
              const isBSI = entry.accent === 'burnt-orange';
              return (
                <motion.div
                  key={entry.company}
                  variants={staggerItem}
                  className="group relative pl-6 py-6 border-l border-bone/10 hover:border-burnt-orange/30 transition-colors duration-300"
                >
                  {/* Timeline dot */}
                  <div className="absolute left-0 top-8 -translate-x-1/2">
                    <span
                      className={`block w-2.5 h-2.5 rounded-full timeline-dot ${
                        isBSI ? 'bg-burnt-orange' : entry.accent === 'spectrum-blue' ? 'bg-spectrum-blue' : 'bg-nw-navy'
                      }`}
                    />
                  </div>

                  <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-1 mb-2">
                    <div>
                      <h3 className="font-sans font-semibold text-base uppercase tracking-wider text-bone group-hover:text-burnt-orange transition-colors duration-300">
                        {entry.title}
                      </h3>
                      <p className={`text-sm font-semibold ${
                        isBSI ? 'text-burnt-orange' : entry.accent === 'spectrum-blue' ? 'text-spectrum-blue' : 'text-nw-navy'
                      }`}>
                        {entry.company}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm font-mono text-warm-gray shrink-0">
                      <span>{entry.location}</span>
                      <span className="text-bone/10 hidden sm:inline">|</span>
                      <span>{entry.period}</span>
                    </div>
                  </div>

                  <p className="text-bone/75 text-sm leading-relaxed max-w-3xl">{entry.description}</p>
                </motion.div>
              );
            })}
          </div>

          {/* Education + credentials — compact row */}
          <motion.div variants={staggerItem} className="border-t border-bone/10 pt-8">
            <p className="section-label mb-4">// Education & Credentials</p>
            <p className="font-sans text-sm text-bone/75 leading-relaxed tracking-wide">
              {EDUCATION_LINE}
            </p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
