import { motion } from 'framer-motion';
import { staggerContainer, staggerItem } from '../utils/animations';

export default function Podcast() {
  return (
    <section
      id="podcast"
      aria-labelledby="podcast-heading"
      className="section-padding section-border"
    >
      <div className="container-custom">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          variants={staggerContainer}
        >
          <div className="max-w-2xl mx-auto text-center">
            <motion.div variants={staggerItem}>
              <p className="section-label">// Listen</p>
              <h2 id="podcast-heading" className="section-title">Podcast Export</h2>
            </motion.div>
            <motion.p variants={staggerItem} className="text-warm-gray text-lg mb-8 leading-relaxed">
              BSI editorial coverage transforms into podcast-ready audio via NotebookLM.
              Coverage that started as data pipelines becomes accessible through a second medium.
            </motion.p>
            <motion.div variants={staggerItem}>
              <a
                href="https://notebooklm.google.com"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary"
              >
                Explore on NotebookLM
              </a>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
