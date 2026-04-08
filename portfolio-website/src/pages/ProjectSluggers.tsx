import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';
import { PLATFORM_URLS } from '../content/site';

function ProjectSluggers() {
  const prefersReducedMotion = usePrefersReducedMotion();

  const fade = prefersReducedMotion
    ? {}
    : {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        transition: { duration: 0.6, ease: [0.4, 0, 0.2, 1] },
      };

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="grain-overlay" />

      <motion.div className="fixed top-8 left-8 z-20" {...fade}>
        <Link
          to="/"
          className="font-mono text-[10px] tracking-[0.2em] uppercase transition-colors duration-300 hover:text-[var(--color-accent)]"
          style={{ color: 'var(--color-text-muted)' }}
        >
          ← Austin Humphrey
        </Link>
      </motion.div>

      <section className="min-h-screen flex flex-col justify-center px-8 sm:px-16 lg:px-24 py-20">
        <div className="max-w-4xl">
          <motion.p
            className="font-mono text-[11px] tracking-[0.3em] uppercase mb-8"
            style={{ color: 'var(--color-accent)' }}
            {...fade}
          >
            Sandlot Sluggers
          </motion.p>

          <motion.h1
            className="font-serif text-[clamp(1.5rem,4vw,2.6rem)] leading-[1.35] font-normal italic mb-10"
            style={{ color: 'var(--color-text)' }}
            {...fade}
            transition={{ delay: 0.1, duration: 0.7, ease: [0.4, 0, 0.2, 1] }}
          >
            Most sports games use fake rosters or licensed data you can't touch.{' '}
            <span style={{ color: 'var(--color-text-muted)' }}>
              This one pulls real college lineups from the same API that powers BSI — then lets you hit with them.
            </span>
          </motion.h1>

          <motion.div
            className="relative rounded-lg overflow-hidden mb-10"
            style={{
              border: '1px solid rgba(245,240,235,0.04)',
              boxShadow: '0 20px 60px rgba(0,0,0,0.4), 0 4px 20px rgba(0,0,0,0.2)',
            }}
            {...fade}
            transition={{ delay: 0.2, duration: 0.7, ease: [0.4, 0, 0.2, 1] }}
          >
            <img
              src="/assets/bsi-arcade.png"
              alt="BSI Arcade — Sandlot Sluggers with game cards for baseball, football, and runner games"
              className="w-full"
              loading="eager"
            />
          </motion.div>

          <motion.div
            className="flex items-center gap-6 mb-12"
            {...fade}
            transition={{ delay: 0.3, duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
          >
            <a
              href={PLATFORM_URLS.arcade}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 font-mono text-[11px] tracking-[0.15em] uppercase transition-colors duration-300 hover:text-[var(--color-text)]"
              style={{
                color: 'var(--color-accent)',
                borderBottom: '1px solid rgba(191,87,0,0.3)',
                paddingBottom: '2px',
              }}
            >
              Play it
            </a>
          </motion.div>

          <motion.div
            className="space-y-0"
            style={{ borderTop: '1px solid rgba(245,240,235,0.04)' }}
            {...fade}
            transition={{ delay: 0.35, duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
          >
            {[
              ['Stack', 'Three.js · JavaScript · Vite · Cloudflare Pages'],
              ['Modes', 'Practice · Quick Play · Home Run Derby · Team Mode'],
              ['Data', 'Live rosters fetched from the BSI API at game start — real players, real positions'],
              ['Range', '3D rendering, physics simulation, asset pipelines, API integration, leaderboard persistence'],
            ].map(([key, val]) => (
              <div
                key={key}
                className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1 sm:gap-8 py-4"
                style={{ borderBottom: '1px solid rgba(245,240,235,0.04)' }}
              >
                <span
                  className="font-mono text-[10px] tracking-[0.1em] uppercase flex-shrink-0"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  {key}
                </span>
                <span
                  className="font-serif text-[15px] sm:text-right"
                  style={{ color: 'var(--color-text)' }}
                >
                  {val}
                </span>
              </div>
            ))}
          </motion.div>

          <div className="flex items-center gap-6 pt-10">
            <Link
              to="/projects/bsi"
              className="font-mono text-[10px] tracking-[0.15em] uppercase transition-colors duration-300 hover:text-[var(--color-text)]"
              style={{ color: 'var(--color-text-muted)' }}
            >
              ← Blaze Sports Intel
            </Link>
            <Link
              to="/projects/blazecraft"
              className="font-mono text-[10px] tracking-[0.15em] uppercase transition-colors duration-300 hover:text-[var(--color-text)]"
              style={{ color: 'var(--color-text-muted)' }}
            >
              Next: BlazeCraft →
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

export default ProjectSluggers;
