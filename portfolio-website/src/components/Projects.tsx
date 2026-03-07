import { motion } from 'framer-motion';
import { staggerContainer, staggerItem } from '../utils/animations';

const projects = [
  {
    name: 'Blaze Sports Intel',
    description:
      'Production-grade sports analytics platform covering 6 leagues with real-time data pipelines, AI-powered editorial, and 58+ deep-dive articles. 27 Cloudflare Workers, 7 D1 databases, 15 KV caches, 18 R2 buckets — built and maintained solo.',
    tech: ['Next.js', 'Cloudflare Workers', 'Hono', 'D1', 'KV', 'R2', 'TypeScript'],
    url: 'https://blazesportsintel.com',
    highlight: 'Flagship',
    featured: true,
    live: true,
  },
  {
    name: 'A Documented Heritage',
    description:
      'Personal data archive with 12+ interactive D3 charts, a Three.js swing biomechanics viewer, and an ancestry globe. Cross-references 8 data sources — Spotify, 23andMe, natal chart, personality instruments, writing corpus, and more.',
    tech: ['React', 'D3.js', 'Three.js', 'TypeScript', 'Tailwind'],
    url: 'https://dna.austinhumphrey.com',
    highlight: 'Data Viz',
    featured: false,
    live: false,
  },
  {
    name: 'BSI Radar Lab',
    description:
      'Physics-based quality auditor for TrackMan pitch data. Six validation layers — Magnus model, SSW detection, calibration drift, physical bounds, release clustering, and fatigue tracking. All processing runs locally in the browser.',
    tech: ['React', 'Recharts', 'TypeScript', 'Vite'],
    url: 'https://labs.blazesportsintel.com',
    highlight: 'Analytics',
    featured: false,
    live: true,
  },
  {
    name: 'BlazeCraft',
    description:
      'Warcraft 3: Frozen Throne–style system health dashboard for BSI infrastructure. Real-time monitoring of Workers, D1, KV, and R2 with game-inspired UI, leaderboards, and Durable Object state management.',
    tech: ['Cloudflare Pages', 'Workers', 'Durable Objects', 'Canvas2D'],
    url: 'https://blazecraft.app',
    highlight: 'DevOps',
    featured: false,
    live: true,
  },
  {
    name: 'Sandlot Sluggers',
    description:
      'Browser-based 3D baseball arcade with four game modes, real college baseball rosters via BSI API, and leaderboard integration. Deployed at arcade.blazesportsintel.com.',
    tech: ['Three.js', 'JavaScript', 'Cloudflare Pages'],
    url: 'https://arcade.blazesportsintel.com',
    highlight: 'Game',
    featured: false,
    live: true,
  },
];

export default function Projects() {
  const featured = projects.find(p => p.featured);
  const rest = projects.filter(p => !p.featured);

  return (
    <section
      id="projects"
      aria-labelledby="projects-heading"
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
            <p className="section-label">// The Work</p>
            <h2 id="projects-heading" className="section-title">Projects</h2>
          </motion.div>

          {/* Featured project — full width hero card */}
          {featured && (
            <motion.a
              variants={staggerItem}
              href={featured.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => window.posthog?.capture('project_clicked', { project: featured.name })}
              className="block card p-8 md:p-10 mb-8 group relative overflow-hidden gradient-border-hover rounded-lg"
              style={{
                background: 'linear-gradient(135deg, rgba(26,26,26,0.8) 0%, rgba(191,87,0,0.06) 100%)',
              }}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="text-[0.6rem] font-mono text-burnt-orange bg-burnt-orange/10 border border-burnt-orange/20 px-3 py-1 rounded-full uppercase tracking-widest">
                      {featured.highlight}
                    </span>
                    {featured.live && (
                      <span className="flex items-center gap-1.5 text-[0.6rem] font-mono text-emerald-400 uppercase tracking-widest">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
                        </span>
                        Live
                      </span>
                    )}
                  </div>
                  <h3 className="font-sans font-bold text-2xl md:text-3xl uppercase tracking-wider text-bone mt-4 group-hover:text-burnt-orange transition-colors duration-300">
                    {featured.name}
                  </h3>
                </div>
                <svg className="w-5 h-5 text-bone/30 group-hover:text-burnt-orange group-hover:translate-x-1 group-hover:-translate-y-1 transition-all duration-300 shrink-0 mt-2" viewBox="0 0 20 20" fill="none">
                  <path d="M5 15L15 5M15 5H8M15 5V12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <p className="text-bone/75 text-base leading-relaxed mb-6 max-w-3xl">{featured.description}</p>
              <div className="flex flex-wrap gap-2">
                {featured.tech.map((t) => (
                  <span
                    key={t}
                    className="text-[0.65rem] font-mono text-warm-gray bg-bone/5 px-3 py-1 rounded"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </motion.a>
          )}

          {/* Remaining projects — asymmetric grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rest.map((project) => (
              <motion.a
                key={project.name}
                variants={staggerItem}
                href={project.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => window.posthog?.capture('project_clicked', { project: project.name })}
                className="card p-6 group block gradient-border-hover rounded-lg"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-sans font-semibold text-lg uppercase tracking-wider text-bone group-hover:text-burnt-orange transition-colors duration-300">
                      {project.name}
                    </h3>
                    {project.live && (
                      <span className="flex items-center gap-1 text-[0.55rem] font-mono text-emerald-400 uppercase tracking-widest">
                        <span className="relative flex h-1.5 w-1.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
                        </span>
                        Live
                      </span>
                    )}
                  </div>
                  <span className="text-[0.6rem] font-mono text-burnt-orange bg-burnt-orange/10 border border-burnt-orange/20 px-2 py-0.5 rounded-full uppercase tracking-widest shrink-0 ml-3">
                    {project.highlight}
                  </span>
                </div>
                <p className="text-bone/75 text-sm leading-relaxed mb-4">{project.description}</p>
                <div className="flex flex-wrap gap-2">
                  {project.tech.map((t) => (
                    <span
                      key={t}
                      className="text-[0.65rem] font-mono text-warm-gray bg-bone/5 px-2 py-0.5 rounded"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </motion.a>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
