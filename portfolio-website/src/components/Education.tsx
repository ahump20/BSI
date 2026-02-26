import { motion } from 'framer-motion';
import { staggerContainer, staggerItem } from '../utils/animations';

const schools = [
  {
    degree: 'M.S. Entertainment Business — Sports Management',
    school: 'Full Sail University',
    detail: 'Graduated February 2026 | GPA: 3.56',
    accent: '#FF6B35',
    icon: '🎬',
  },
  {
    degree: 'AI & Machine Learning Postgraduate Certificate',
    school: 'UT Austin McCombs School of Business',
    detail: 'Accepted and currently in progress',
    accent: '#BF5700',
    icon: '🤘',
  },
  {
    degree: 'B.A. International Relations & Global Studies',
    school: 'University of Texas at Austin',
    detail: '2014 – 2020 | Minors: Economics, European Studies',
    accent: '#BF5700',
    icon: '🤘',
  },
];

export default function Education() {
  return (
    <section
      id="education"
      aria-labelledby="education-heading"
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
            <p className="section-label">// Education</p>
            <h2 id="education-heading" className="section-title">Academic Foundation</h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {schools.map((s) => (
              <motion.div
                key={s.school}
                variants={staggerItem}
                className="card p-6 group relative overflow-hidden"
                style={{ borderTop: `2px solid ${s.accent}` }}
              >
                <span className="text-2xl mb-3 block">{s.icon}</span>
                <h3 className="font-sans font-semibold text-base uppercase tracking-wider text-bone mb-2 group-hover:text-burnt-orange transition-colors duration-300">
                  {s.degree}
                </h3>
                <p className="font-semibold text-sm mb-2" style={{ color: s.accent }}>{s.school}</p>
                <p className="text-sm font-mono text-warm-gray">{s.detail}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
