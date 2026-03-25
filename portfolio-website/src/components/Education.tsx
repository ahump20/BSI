import { motion } from 'framer-motion';
import { staggerContainer, staggerItem } from '../utils/animations';

const schools = [
  {
    degree: 'M.S. Entertainment Business — Sports Management',
    school: 'Full Sail University',
    detail: 'Graduated February 2026 | GPA: 3.56',
    bgAccent: 'bg-ember',
    textAccent: 'text-ember',
  },
  {
    degree: 'AI & Machine Learning Postgraduate Certificate',
    school: 'UT Austin McCombs School of Business',
    detail: 'Accepted and currently in progress',
    bgAccent: 'bg-burnt-orange',
    textAccent: 'text-burnt-orange',
  },
  {
    degree: 'B.A. International Relations & Global Studies',
    school: 'University of Texas at Austin',
    detail: '2014 – 2020 | Minors: Economics, European Studies',
    bgAccent: 'bg-burnt-orange',
    textAccent: 'text-burnt-orange',
  },
];

export default function Education() {
  return (
    <section
      id="education"
      aria-labelledby="education-heading"
      className="section-padding education-bg"
    >
      <div className="container-custom">
        <motion.div
          initial="visible"
          whileInView="visible"
          viewport={{ once: true, amount: 0.05 }}
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
                className="group relative card py-7 px-6"
              >
                {/* Top accent bar */}
                <div
                  className={`absolute top-0 left-0 right-0 h-[2px] opacity-60 ${s.bgAccent}`}
                />

                {/* Accent dot */}
                <div
                  className={`w-2.5 h-2.5 rounded-full mb-5 ${s.bgAccent}`}
                />

                <h3 className="font-sans font-semibold text-base uppercase tracking-wider text-bone mb-2 group-hover:text-burnt-orange transition-colors duration-300">
                  {s.degree}
                </h3>
                <p className={`font-semibold text-sm mb-2 ${s.textAccent}`}>{s.school}</p>
                <p className="text-sm font-mono text-warm-gray">{s.detail}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
