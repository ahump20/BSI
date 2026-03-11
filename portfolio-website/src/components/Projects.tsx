import { motion } from 'framer-motion';
import { staggerContainer, staggerItem } from '../utils/animations';

const heavyProjects = [
  {
    name: 'A Documented Heritage',
    description:
      'Personal data archive with 12+ interactive D3 charts, a Three.js swing biomechanics viewer, and an ancestry globe. Cross-references 8 data sources — Spotify, 23andMe, natal chart, personality instruments, writing corpus, and more.',
    tech: ['React', 'D3.js', 'Three.js', 'TypeScript', 'Tailwind'],
    url: 'https://dna.austinhumphrey.com',
    highlight: 'Data Viz',
    live: false,
  },
  {
    name: 'BSI Radar Lab',
    description:
      'Physics-based quality auditor for TrackMan pitch data. Six validation layers — Magnus model, SSW detection, calibration drift, physical bounds, release clustering, and fatigue tracking. All processing runs locally in the browser.',
    tech: ['React', 'Recharts', 'TypeScript', 'Vite'],
    url: 'https://labs.blazesportsintel.com',
    highlight: 'Analytics',
    live: true,
  },
];

const lightProjects = [
  {
    name: 'BlazeCraft',
    description:
      'Warcraft 3: Frozen Throne-style system health dashboard for BSI infrastructure. Real-time monitoring with game-inspired UI and Durable Object state management.',
    tech: ['Cloudflare Pages', 'Workers', 'Durable Objects', 'Canvas2D'],
    url: 'https://blazecraft.app',
    highlight: 'DevOps',
    live: true,
  },
  {
    name: 'Sandlot Sluggers',
    description:
      'Browser-based 3D baseball arcade with four game modes, real college baseball rosters via BSI API, and leaderboard integration.',
    tech: ['Three.js', 'JavaScript', 'Cloudflare Pages'],
    url: 'https://arcade.blazesportsintel.com',
    highlight: 'Game',
    live: true,
  },
];

function LiveBadge() {
  return (
    <span className="flex items-center gap-1.5 text-[0.6rem] font-mono text-emerald-400 uppercase tracking-widest">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
      </span>
      Live
    </span>
  );
}

export default function Projects() {
  return (
    <section
      id="projects"
      aria-labelledby="projects-heading"
      className="section-padding"
    >
      <div className="container-custom">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.05 }}
          variants={staggerContainer}
        >
          <motion.div variants={staggerItem}>
            <p className="section-label">// The Work</p>
            <h2 id="projects-heading" className="section-title">Projects</h2>
          </motion.div>

          {/* Heavy-weight projects — larger cards, more visual space */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {heavyProjects.map((project) => (
              <motion.a
                key={project.name}
                variants={staggerItem}
                href={project.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => window.posthog?.capture('project_clicked', { project: project.name })}
                className="card p-8 group block gradient-border-hover rounded-lg"
                style={{
                  background: 'linear-gradient(135deg, rgba(26,26,26,0.8) 0%, rgba(191,87,0,0.04) 100%)',
                }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-[0.6rem] font-mono text-burnt-orange bg-burnt-orange/10 border border-burnt-orange/20 px-3 py-1 rounded-full uppercase tracking-widest">
                      {project.highlight}
                    </span>
                    {project.live && <LiveBadge />}
                  </div>
                  <svg className="w-5 h-5 text-bone/20 group-hover:text-burnt-orange group-hover:translate-x-1 group-hover:-translate-y-1 transition-all duration-300 shrink-0" viewBox="0 0 20 20" fill="none">
                    <path d="M5 15L15 5M15 5H8M15 5V12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>

                <h3 className="font-sans font-bold text-xl uppercase tracking-wider text-bone mb-3 group-hover:text-burnt-orange transition-colors duration-300">
                  {project.name}
                </h3>
                <p className="text-bone/75 text-base leading-relaxed mb-5">{project.description}</p>
                <div className="flex flex-wrap gap-2">
                  {project.tech.map((t) => (
                    <span key={t} className="text-[0.65rem] font-mono text-warm-gray bg-bone/5 px-3 py-1 rounded">
                      {t}
                    </span>
                  ))}
                </div>
              </motion.a>
            ))}
          </div>

          {/* Light-weight projects — compact treatment */}
          <div className="grid md:grid-cols-2 gap-4">
            {lightProjects.map((project) => (
              <motion.a
                key={project.name}
                variants={staggerItem}
                href={project.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => window.posthog?.capture('project_clicked', { project: project.name })}
                className="group flex items-start gap-4 py-4 px-4 rounded-lg hover:bg-bone/[0.02] transition-colors duration-300 border border-transparent hover:border-bone/5"
              >
                <div className="shrink-0 mt-1">
                  <span className="text-[0.55rem] font-mono text-burnt-orange bg-burnt-orange/10 border border-burnt-orange/20 px-2 py-0.5 rounded-full uppercase tracking-widest">
                    {project.highlight}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-sans font-semibold text-sm uppercase tracking-wider text-bone group-hover:text-burnt-orange transition-colors duration-300">
                      {project.name}
                    </h3>
                    {project.live && <LiveBadge />}
                  </div>
                  <p className="text-bone/60 text-sm leading-relaxed">{project.description}</p>
                </div>
              </motion.a>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
