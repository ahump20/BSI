import { motion } from 'framer-motion';
import { staggerContainer, staggerItem } from '../utils/animations';

const experiences = [
  {
    title: 'Founder & Builder',
    company: 'Blaze Sports Intel',
    location: 'San Antonio, TX',
    period: '2023 – Present',
    bgAccent: 'bg-burnt-orange',
    textAccent: 'text-burnt-orange',
    description:
      'Production-grade sports analytics platform covering six leagues — dozens of specialized systems, multiple databases, 58+ editorial deep-dives. Full architecture designed, deployed, and maintained solo.',
  },
  {
    title: 'Advertising Account Executive',
    company: 'Spectrum Reach',
    location: 'Austin / San Antonio, TX',
    period: 'Nov 2022 – Dec 2025',
    bgAccent: 'bg-spectrum-blue',
    textAccent: 'text-spectrum-blue',
    description:
      'Advertising strategy across Austin and San Antonio — two of the fastest-growing markets in Texas — spanning linear TV, OTT/CTV, streaming, and digital. Turned raw campaign data into revenue decisions for local and regional businesses.',
  },
  {
    title: 'Financial Representative',
    company: 'Northwestern Mutual',
    location: 'Austin, TX',
    period: 'Dec 2020 – Aug 2022',
    bgAccent: 'bg-nw-navy',
    textAccent: 'text-nw-navy',
    description:
      'Top-5 nationally ranked intern program to full-time. Only person in the office daily during COVID. Nearly tripled the referral production of every other advisor. "Power of 10" Award — top 10% national performance.',
  },
  {
    title: 'Rush Captain & Alumni Relations Chair',
    company: 'Alpha Tau Omega — UT Austin',
    location: 'Austin, TX',
    period: '2015 – 2020',
    bgAccent: 'bg-ato-gold',
    textAccent: 'text-ato-gold',
    description:
      'Led recruitment strategy for 73 new members. Managed approximately $100K in event budgets. Bridge between active chapter and alumni network.',
  },
];

export default function Experience() {
  return (
    <section
      id="experience"
      aria-labelledby="experience-heading"
      className="section-padding section-border experience-bg"
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
                    className={`block w-2.5 h-2.5 rounded-full ${exp.bgAccent} timeline-dot`}
                  />
                </div>

                <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-1 mb-2">
                  <div>
                    <h3 className="font-sans font-semibold text-base uppercase tracking-wider text-bone group-hover:text-burnt-orange transition-colors duration-300">
                      {exp.title}
                    </h3>
                    <p className={`text-sm font-semibold ${exp.textAccent}`}>{exp.company}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm font-mono text-warm-gray shrink-0">
                    <span>{exp.location}</span>
                    <span className="text-bone/10 hidden sm:inline">|</span>
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
