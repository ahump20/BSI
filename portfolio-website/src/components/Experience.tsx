import { motion } from 'framer-motion';
import { staggerContainer, staggerItem } from '../utils/animations';

const experiences = [
  {
    title: 'Founder & Builder',
    company: 'Blaze Sports Intel',
    location: 'San Antonio, TX',
    period: '2023 – Present',
    accent: '#BF5700',
    description:
      'Production-grade sports analytics platform covering six leagues — 23 Workers, 7 databases, 58+ editorial deep-dives. Full architecture designed, deployed, and maintained solo. See the BSI section above for the complete story.',
  },
  {
    title: 'Advertising Account Executive',
    company: 'Spectrum Reach',
    location: 'Austin / San Antonio, TX',
    period: 'Nov 2022 – Dec 2025',
    accent: '#3B82F6',
    description:
      'Data-informed advertising across linear TV, OTT/CTV, streaming, and digital platforms in the Austin/San Antonio DMA. Translated campaign performance into actionable insights and coordinated cross-functional teams.',
  },
  {
    title: 'Financial Representative',
    company: 'Northwestern Mutual',
    location: 'Austin, TX',
    period: 'Dec 2020 – Aug 2022',
    accent: '#1E3A5F',
    description:
      'Top-5 nationally ranked intern program led to a full-time role. Built comprehensive financial plans. Earned "Power of 10" Award for top 10% national performance.',
  },
  {
    title: 'Rush Captain & Alumni Relations Chair',
    company: 'Alpha Tau Omega — UT Austin',
    location: 'Austin, TX',
    period: '2015 – 2020',
    accent: '#D4A843',
    description:
      'Led recruitment strategy for 73 new members. Managed approximately $100K in event budgets. Bridge between active chapter and alumni network.',
  },
];

export default function Experience() {
  return (
    <section
      id="experience"
      aria-labelledby="experience-heading"
      className="section-padding section-border"
    >
      <div className="container-custom">
        <motion.div
          initial="visible"
          whileInView="visible"
          viewport={{ once: true, amount: 0.05 }}
          variants={staggerContainer}
        >
          <motion.div variants={staggerItem}>
            <p className="section-label">// The Journey</p>
            <h2 id="experience-heading" className="section-title">Experience</h2>
          </motion.div>

          {/* Timeline-style editorial list */}
          <div className="space-y-0">
            {experiences.map((exp) => (
              <motion.div
                key={exp.company}
                variants={staggerItem}
                className="group relative pl-6 py-6 border-l border-bone/10 hover:border-burnt-orange/30 transition-colors duration-300"
              >
                {/* Timeline dot */}
                <div className="absolute left-0 top-8 -translate-x-1/2">
                  <span
                    className="block w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: exp.accent }}
                  />
                </div>

                <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-1 mb-2">
                  <div>
                    <h3 className="font-sans font-semibold text-base uppercase tracking-wider text-bone group-hover:text-burnt-orange transition-colors duration-300">
                      {exp.title}
                    </h3>
                    <p className="text-sm font-semibold" style={{ color: exp.accent }}>{exp.company}</p>
                  </div>
                  <div className="flex items-center gap-3 text-sm font-mono text-warm-gray shrink-0">
                    <span>{exp.location}</span>
                    <span className="text-bone/10">|</span>
                    <span>{exp.period}</span>
                  </div>
                </div>

                <p className="text-bone/75 text-sm leading-relaxed max-w-3xl">{exp.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
