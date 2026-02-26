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
      'Built a production-grade sports analytics platform from scratch, covering MLB, NFL, NCAA football, NBA, and college baseball. 14 Cloudflare Workers, 5 D1 databases, 9 KV namespaces, and 18 R2 buckets — architecture designed, deployed, and maintained by one person. Real-time data pipelines with 30-second update cadence for live scoring across six leagues. 58+ editorial deep-dives across SEC, Big 12, and Big Ten programs. AI-powered predictive modules and Claude-driven analytics.',
  },
  {
    title: 'Advertising Account Executive',
    company: 'Spectrum Reach',
    location: 'Austin / San Antonio, TX',
    period: 'Nov 2022 – Dec 2025',
    accent: '#3B82F6',
    description:
      'Data-informed advertising across linear TV, OTT/CTV, streaming, and digital platforms in the Austin/San Antonio DMA. Translated campaign performance into actionable insights and coordinated cross-functional teams for multi-platform campaign delivery.',
  },
  {
    title: 'Financial Representative',
    company: 'Northwestern Mutual',
    location: 'Austin, TX',
    period: 'Dec 2020 – Aug 2022',
    accent: '#1E3A5F',
    description:
      'Top-5 nationally ranked intern program led to a full-time role. Built comprehensive financial plans using structured modeling. Earned the "Power of 10" Award for top 10% national performance and won the March Madness sales competition.',
  },
  {
    title: 'Rush Captain & Alumni Relations Chair',
    company: 'Alpha Tau Omega — UT Austin',
    location: 'Austin, TX',
    period: '2015 – 2020',
    accent: '#D4A843',
    description:
      'Led recruitment strategy that brought in 73 new members. Managed approximately $100K in event budgets and served as the bridge between active chapter and alumni network.',
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
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          variants={staggerContainer}
        >
          <motion.div variants={staggerItem}>
            <p className="section-label">// The Journey</p>
            <h2 id="experience-heading" className="section-title">Experience</h2>
          </motion.div>

          <div className="space-y-6">
            {experiences.map((exp, idx) => (
              <motion.div
                key={exp.company}
                variants={staggerItem}
                className="card p-6 md:p-8 relative overflow-hidden group"
                style={{ borderTop: `2px solid ${exp.accent}` }}
              >
                {/* Glow dot */}
                <div className="absolute top-0 left-8 -translate-y-1/2">
                  <span className="relative flex h-3 w-3">
                    <span
                      className="absolute inline-flex h-full w-full rounded-full opacity-40 animate-glow-pulse"
                      style={{ backgroundColor: exp.accent }}
                    />
                    <span
                      className="relative inline-flex h-3 w-3 rounded-full"
                      style={{ backgroundColor: exp.accent }}
                    />
                  </span>
                </div>

                {/* Number */}
                <span className="absolute top-4 right-6 font-mono text-xs text-bone/10">
                  {String(idx + 1).padStart(2, '0')}
                </span>

                <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-1 mb-4">
                  <div>
                    <h3 className="font-sans font-semibold text-lg uppercase tracking-wider text-bone group-hover:text-burnt-orange transition-colors duration-300">
                      {exp.title}
                    </h3>
                    <p className="font-semibold text-base" style={{ color: exp.accent }}>{exp.company}</p>
                    <p className="text-sm font-mono text-warm-gray">{exp.location}</p>
                  </div>
                  <span className="text-sm font-mono text-warm-gray whitespace-nowrap">{exp.period}</span>
                </div>

                <p className="text-bone/80 leading-relaxed">{exp.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
