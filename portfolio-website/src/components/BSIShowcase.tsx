import { useState } from 'react';
import { motion } from 'framer-motion';
import { staggerContainer, staggerItem, useAnimatedCounter } from '../utils/animations';
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

function StatCard({ target, label, inView }: { target: number; label: string; inView: boolean }) {
  const count = useAnimatedCounter(target, inView);
  return (
    <div className="card p-5 text-center">
      <p className="text-3xl font-bold font-sans text-burnt-orange">{count}</p>
      <p className="text-xs font-mono text-warm-gray mt-1">{label}</p>
    </div>
  );
}

export default function BSIShowcase() {
  const [inView, setInView] = useState(false);

  return (
    <section
      id="bsi"
      aria-labelledby="bsi-heading"
      className="section-padding section-border relative"
      style={{
        background: 'linear-gradient(180deg, #0D0D0D 0%, rgba(26,26,26,0.3) 50%, #0D0D0D 100%)',
      }}
    >
      <div className="container-custom">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          variants={staggerContainer}
          onViewportEnter={() => setInView(true)}
        >
          <motion.div variants={staggerItem}>
            <p className="section-label">// The Platform</p>
            <h2 id="bsi-heading" className="section-title">Blaze Sports Intel</h2>
            <p className="font-sans font-semibold text-burnt-orange uppercase tracking-[0.2em] text-sm mb-10">
              Born to Blaze the Path Less Beaten
            </p>
          </motion.div>

          {/* Bento grid layout */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {/* Main description card — 2 cols */}
            <motion.div
              variants={staggerItem}
              className="md:col-span-2 card p-8"
              style={{
                background: 'linear-gradient(135deg, rgba(26,26,26,0.8) 0%, rgba(191,87,0,0.04) 100%)',
              }}
            >
              <div className="flex items-center justify-between mb-6">
                <span className="font-mono text-xs text-warm-gray/50 uppercase tracking-wider">System Overview</span>
                <PlatformStatus />
              </div>

              <div className="space-y-4 text-bone/85 text-lg leading-relaxed mb-6">
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
              </div>

              <div className="flex flex-wrap gap-4">
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

            {/* Stat cards — right column */}
            <motion.div variants={staggerItem} className="grid grid-cols-2 gap-4 content-start">
              <StatCard target={27} label="Workers" inView={inView} />
              <StatCard target={7} label="D1 Databases" inView={inView} />
              <StatCard target={15} label="KV Namespaces" inView={inView} />
              <StatCard target={18} label="R2 Buckets" inView={inView} />
            </motion.div>
          </div>

          {/* League rows */}
          <motion.div variants={staggerItem} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-12">
            {leagues.map((league) => (
              <div
                key={league.name}
                className="card px-4 py-3 text-center"
              >
                <span className="font-sans text-xs uppercase tracking-wider text-bone font-medium block">
                  {league.name}
                </span>
                <span className="text-[0.6rem] font-mono text-burnt-orange">{league.note}</span>
              </div>
            ))}
          </motion.div>

          {/* Architecture flow */}
          <motion.div variants={staggerItem} className="card p-6 mb-10">
            <p className="section-label mb-4">// Data Architecture</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-0 text-center">
              {[
                { label: 'External APIs', sub: 'Highlightly · SportsDataIO · ESPN' },
                { label: 'Workers', sub: '27 Hono-powered edge functions' },
                { label: 'Storage', sub: 'D1 · KV · R2' },
                { label: 'UI', sub: 'Next.js static export' },
              ].map((node, i) => (
                <div key={node.label} className="flex items-center">
                  <div className="px-4 py-3">
                    <p className="font-sans text-sm uppercase tracking-wider text-bone font-semibold">{node.label}</p>
                    <p className="font-mono text-[0.6rem] text-warm-gray mt-0.5">{node.sub}</p>
                  </div>
                  {i < 3 && (
                    <span aria-hidden="true" className="text-burnt-orange font-mono text-lg hidden sm:block">→</span>
                  )}
                </div>
              ))}
            </div>
          </motion.div>

          {/* Tech stack tags */}
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
