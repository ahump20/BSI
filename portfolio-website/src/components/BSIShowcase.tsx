import { motion } from 'framer-motion';
import { staggerContainer, staggerItem } from '../utils/animations';
import PlatformStatus from './PlatformStatus';

const leagues = [
  { name: 'College Baseball', note: 'Flagship' },
  { name: 'MLB', note: 'Full Coverage' },
  { name: 'NFL', note: 'Full Coverage' },
  { name: 'NCAA Football', note: 'Full Coverage' },
  { name: 'NBA', note: 'Full Coverage' },
  { name: 'NCAA Basketball', note: 'Full Coverage' },
];

const techStack = [
  'Cloudflare Workers', 'D1', 'KV', 'R2', 'Hono',
  'Next.js', 'React', 'TypeScript', 'Claude API',
  'SportsDataIO', 'Highlightly', 'Vitest', 'Playwright',
];

const capabilities = [
  {
    title: 'AI-Powered Analysis',
    description: 'Claude-driven editorial generation, predictive modeling, and analytical depth — AI as a force multiplier for coverage, not a gimmick.',
  },
  {
    title: 'Predictive Intelligence',
    description: 'Machine learning models trained on historical performance, matchup dynamics, and contextual factors. Predictions grounded in real signal.',
  },
  {
    title: 'Edge-First Architecture',
    description: '27 Cloudflare Workers at the edge — sub-50ms response times globally. Data pipelines that fetch, transform, and cache without a traditional server.',
  },
  {
    title: 'Podcast Export',
    description: 'NotebookLM integration transforms written analytics into audio. Coverage extends beyond readers to listeners through a second medium.',
  },
];

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center">
      <p className="text-3xl font-bold font-sans text-burnt-orange">{value}</p>
      <p className="text-xs font-mono text-warm-gray mt-1">{label}</p>
    </div>
  );
}

export default function BSIShowcase() {
  return (
    <section
      id="bsi"
      aria-labelledby="bsi-heading"
      className="section-padding relative"
      style={{
        background: 'linear-gradient(180deg, var(--surface-deep) 0%, var(--surface-elevated) 50%, var(--surface-deep) 100%)',
      }}
    >
      <div className="container-custom">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.05 }}
          variants={staggerContainer}
        >
          {/* Header */}
          <motion.div variants={staggerItem}>
            <p className="section-label">// The Platform</p>
            <h2 id="bsi-heading" className="section-title">Blaze Sports Intel</h2>
            <p className="font-sans font-semibold text-burnt-orange uppercase tracking-[0.2em] text-sm mb-4">
              Born to Blaze the Path Beaten Less
            </p>
            <div className="mb-10">
              <PlatformStatus />
            </div>
          </motion.div>

          {/* Editorial lead + stats — 2 column on desktop */}
          <div className="grid lg:grid-cols-5 gap-12 mb-16">
            {/* Narrative — 3 cols */}
            <motion.div variants={staggerItem} className="lg:col-span-3 space-y-5 text-bone/85 text-lg leading-relaxed">
              <p>
                I built BSI because the coverage I wanted did not exist. Try finding advanced
                analytics for a Tuesday night college baseball game between Rice and Sam Houston.
                Try tracking conference standings across five sports without clicking through
                fifteen pages. The gap between interest in the game and access to meaningful
                data is the product.
              </p>
              <p>
                Twenty-seven Workers handle every API call, data transformation, and cache layer.
                Seven databases store historical and live game data. Eighteen storage buckets
                hold everything from box scores to editorial assets. One person built all of it
                &mdash; old-school scouting instinct fused with new-school sabermetrics, running
                on Cloudflare&rsquo;s edge.
              </p>

              <div className="flex flex-wrap gap-4 pt-2">
                <a
                  href="https://blazesportsintel.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary"
                >
                  Visit BSI
                </a>
                <a
                  href="https://blazecraft.app"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-outline"
                >
                  BlazeCraft Dashboard
                </a>
              </div>
            </motion.div>

            {/* Stats + architecture — 2 cols */}
            <motion.div variants={staggerItem} className="lg:col-span-2 space-y-8">
              {/* Stat grid */}
              <div className="grid grid-cols-2 gap-6">
                <StatCard value="27" label="Workers" />
                <StatCard value="7" label="D1 Databases" />
                <StatCard value="15" label="KV Namespaces" />
                <StatCard value="18" label="R2 Buckets" />
              </div>

              {/* Architecture flow — compact */}
              <div className="card p-5">
                <p className="section-label mb-3">// Data Flow</p>
                <div className="space-y-2">
                  {[
                    { label: 'External APIs', sub: 'Highlightly · SportsDataIO · ESPN' },
                    { label: 'Workers', sub: '27 Hono-powered edge functions' },
                    { label: 'Storage', sub: 'D1 · KV · R2' },
                    { label: 'UI', sub: 'Next.js static export' },
                  ].map((node, i) => (
                    <div key={node.label} className="flex items-center gap-3">
                      {i > 0 && <span aria-hidden="true" className="text-burnt-orange/50 font-mono text-xs">→</span>}
                      <div>
                        <span className="font-sans text-xs uppercase tracking-wider text-bone font-semibold">{node.label}</span>
                        <span className="font-mono text-[0.6rem] text-warm-gray ml-2">{node.sub}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>

          {/* League coverage — editorial inline list */}
          <motion.div variants={staggerItem} className="mb-12">
            <p className="section-label mb-4">// Coverage</p>
            <div className="flex flex-wrap gap-x-6 gap-y-2">
              {leagues.map((league, i) => (
                <span key={league.name} className="flex items-center gap-2">
                  <span className="font-sans text-sm uppercase tracking-wider text-bone font-medium">
                    {league.name}
                  </span>
                  <span className="text-[0.6rem] font-mono text-burnt-orange">{league.note}</span>
                  {i < leagues.length - 1 && (
                    <span className="text-bone/10 ml-2" aria-hidden="true">|</span>
                  )}
                </span>
              ))}
            </div>
          </motion.div>

          {/* Capabilities — absorbed from AIFeatures */}
          <motion.div variants={staggerItem} className="mb-12">
            <p className="section-label mb-6">// Intelligence Layer</p>
            <div className="grid md:grid-cols-2 gap-6">
              {capabilities.map((cap) => (
                <div
                  key={cap.title}
                  className="border-l-2 border-burnt-orange/30 pl-5 py-1 hover:border-burnt-orange transition-colors duration-300"
                >
                  <h3 className="font-sans font-semibold text-sm uppercase tracking-wider text-bone mb-2">
                    {cap.title}
                  </h3>
                  <p className="text-warm-gray text-sm leading-relaxed">{cap.description}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Tech stack — pushed below the fold */}
          <motion.div variants={staggerItem}>
            <p className="section-label mb-4">// Tech Stack</p>
            <div className="flex flex-wrap gap-3">
              {techStack.map((tech) => (
                <span
                  key={tech}
                  className="text-xs font-mono bg-burnt-orange/10 text-burnt-orange border border-burnt-orange/20 px-4 py-2 rounded-full hover:bg-burnt-orange/20 hover:border-burnt-orange/40 transition-all duration-300"
                >
                  {tech}
                </span>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
