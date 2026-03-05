import { useRef } from 'react';
import { motion } from 'framer-motion';
import { staggerContainer, staggerItem } from '../utils/animations';

const features = [
  {
    title: 'Claude-Powered Analysis',
    description:
      'Deep analytical capabilities powered by Claude AI. From editorial generation to predictive modeling, AI augments every layer of the platform — not as a gimmick, but as a force multiplier for coverage depth.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7" stroke="currentColor" strokeWidth="1.5">
        <path d="M12 2a7 7 0 0 1 7 7c0 2.38-1.19 4.47-3 5.74V17a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 0 1 7-7z" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M9 21h6M10 17v4M14 17v4" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: 'Podcast Export',
    description:
      'NotebookLM integration transforms written analytics into audio content. Coverage that started as data pipelines becomes podcast-ready — extending reach beyond readers to listeners.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7" stroke="currentColor" strokeWidth="1.5">
        <path d="M3 18v-6a9 9 0 0 1 18 0v6" strokeLinecap="round" />
        <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3v5zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3v5z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    title: 'Predictive Intelligence Engine',
    description:
      'Machine learning models trained on historical performance data, matchup dynamics, and contextual factors. Predictions grounded in real signal, not hype cycles or brand-name bias.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7" stroke="currentColor" strokeWidth="1.5">
        <path d="M3 3v18h18" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M7 16l4-6 4 4 5-8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    title: 'Edge-First Architecture',
    description:
      '27 Cloudflare Workers running at the edge — sub-50ms response times globally. Data pipelines that fetch, transform, and cache without a single traditional server. The infrastructure is the product.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7" stroke="currentColor" strokeWidth="1.5">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
];

function FeatureCard({ feature }: { feature: typeof features[0] }) {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    card.style.setProperty('--glow-x', `${x}px`);
    card.style.setProperty('--glow-y', `${y}px`);
  };

  return (
    <motion.div
      ref={cardRef}
      variants={staggerItem}
      onMouseMove={handleMouseMove}
      className="card p-8 group relative overflow-hidden"
      style={{
        borderTop: '2px solid transparent',
        borderImage: 'linear-gradient(to right, #BF5700, #FF6B35, #BF5700) 1',
        borderImageSlice: '1 0 0 0',
      }}
    >
      {/* Mouse proximity glow */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{
          background: 'radial-gradient(300px circle at var(--glow-x, 50%) var(--glow-y, 50%), rgba(191,87,0,0.06), transparent 60%)',
        }}
      />

      <div className="relative">
        <div className="text-burnt-orange mb-4">{feature.icon}</div>
        <h3 className="font-sans font-semibold text-base uppercase tracking-wider text-bone mb-3 group-hover:text-burnt-orange transition-colors duration-300">
          {feature.title}
        </h3>
        <p className="text-warm-gray leading-relaxed text-sm">{feature.description}</p>
      </div>
    </motion.div>
  );
}

export default function AIFeatures() {
  return (
    <section
      id="ai-features"
      aria-labelledby="ai-heading"
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
            <p className="section-label">// Intelligence Layer</p>
            <h2 id="ai-heading" className="section-title">AI-Powered Features</h2>
            <p className="text-warm-gray text-lg max-w-3xl mb-12">
              AI isn't the product — it's the engine. Every feature is designed to deepen coverage,
              not replace the instinct that makes sports analysis worth reading.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6">
            {features.map((feature) => (
              <FeatureCard key={feature.title} feature={feature} />
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
