import { useEffect, useRef } from 'react';

const features = [
  {
    icon: '🧠',
    title: 'Claude-Powered Analysis',
    description:
      'Deep analytical capabilities powered by Claude AI. From editorial generation to predictive modeling, AI augments every layer of the platform — not as a gimmick, but as a force multiplier for coverage depth.',
  },
  {
    icon: '🎧',
    title: 'Podcast Export',
    description:
      'NotebookLM integration transforms written analytics into audio content. Coverage that started as data pipelines becomes podcast-ready — extending reach beyond readers to listeners.',
  },
  {
    icon: '📊',
    title: 'Predictive Intelligence Engine',
    description:
      'Machine learning models trained on historical performance data, matchup dynamics, and contextual factors. Predictions grounded in real signal, not hype cycles or brand-name bias.',
  },
  {
    icon: '⚡',
    title: 'Edge-First Architecture',
    description:
      '53 Cloudflare Workers running at the edge — sub-50ms response times globally. Data pipelines that fetch, transform, and cache without a single traditional server. The infrastructure is the product.',
  },
];

export default function AIFeatures() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const els = sectionRef.current?.querySelectorAll('.reveal');
    if (!els) return;
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add('visible'); }),
      { threshold: 0.15 }
    );
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="ai-features"
      aria-labelledby="ai-heading"
      className="section-padding section-border"
    >
      <div className="container-custom">
        <div className="reveal">
          <p className="section-label">// Intelligence Layer</p>
          <h2 id="ai-heading" className="section-title">AI-Powered Features</h2>
          <p className="text-warm-gray text-lg max-w-3xl mb-12">
            AI isn't the product — it's the engine. Every feature is designed to deepen coverage,
            not replace the instinct that makes sports analysis worth reading.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="card p-8 reveal group"
              style={{
                borderTop: '2px solid transparent',
                borderImage: 'linear-gradient(to right, #BF5700, #FF6B35, #BF5700) 1',
                borderImageSlice: '1 0 0 0',
              }}
            >
              <div className="text-3xl mb-4">{feature.icon}</div>
              <h3 className="font-sans font-semibold text-base uppercase tracking-wider text-bone mb-3 group-hover:text-burnt-orange transition-colors duration-300">
                {feature.title}
              </h3>
              <p className="text-warm-gray leading-relaxed text-sm">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
