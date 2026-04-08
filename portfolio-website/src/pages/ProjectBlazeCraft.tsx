import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';
import { PLATFORM_URLS } from '../content/site';

function ProjectBlazeCraft() {
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
            BlazeCraft
          </motion.p>

          <motion.h1
            className="font-serif text-[clamp(1.5rem,4vw,2.6rem)] leading-[1.35] font-normal italic mb-10"
            style={{ color: 'var(--color-text)' }}
            {...fade}
            transition={{ delay: 0.1, duration: 0.7, ease: [0.4, 0, 0.2, 1] }}
          >
            Grafana tells you a service is down. It does not make you want to fix it at 2 AM.{' '}
            <span style={{ color: 'var(--color-text-muted)' }}>
              I built an infrastructure dashboard inside a Warcraft III command grove — because the interface you actually open is the one that works.
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
              src="/assets/bsi-blazecraft.png"
              alt="BlazeCraft — Warcraft III-styled faction selection screen for BSI infrastructure monitoring"
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
              href={PLATFORM_URLS.blazecraft}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 font-mono text-[11px] tracking-[0.15em] uppercase transition-colors duration-300 hover:text-[var(--color-text)]"
              style={{
                color: 'var(--color-accent)',
                borderBottom: '1px solid rgba(191,87,0,0.3)',
                paddingBottom: '2px',
              }}
            >
              Visit live
            </a>
          </motion.div>

          <motion.div
            className="space-y-0"
            style={{ borderTop: '1px solid rgba(245,240,235,0.04)' }}
            {...fade}
            transition={{ delay: 0.35, duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
          >
            {[
              ['Stack', 'Canvas2D isometric renderer · Cloudflare Workers · Durable Objects · R2'],
              ['Monitoring', 'Health checks against all 53 BSI Workers every 60 seconds'],
              ['Mapping', 'Ancients and groves are Workers. Wisps are live request traffic. Moon wells are KV caches.'],
              ['Range', 'Canvas rendering, real-time polling, game UI patterns, creative problem-solving as a design tool'],
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
              to="/projects/sluggers"
              className="font-mono text-[10px] tracking-[0.15em] uppercase transition-colors duration-300 hover:text-[var(--color-text)]"
              style={{ color: 'var(--color-text-muted)' }}
            >
              ← Sandlot Sluggers
            </Link>
            <Link
              to="/"
              className="font-mono text-[10px] tracking-[0.15em] uppercase transition-colors duration-300 hover:text-[var(--color-text)]"
              style={{ color: 'var(--color-text-muted)' }}
            >
              All projects →
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

export default ProjectBlazeCraft;
