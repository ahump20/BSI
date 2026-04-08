import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';
import { PLATFORM_URLS } from '../content/site';

function ProjectBSI() {
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
      {/* Film grain */}
      <div className="grain-overlay" />

      {/* Back link — fixed, quiet */}
      <motion.div className="fixed top-8 left-8 z-20" {...fade}>
        <Link
          to="/"
          className="font-mono text-[10px] tracking-[0.2em] uppercase transition-colors duration-300 hover:text-[var(--color-accent)]"
          style={{ color: 'var(--color-text-muted)' }}
        >
          ← Austin Humphrey
        </Link>
      </motion.div>

      {/* === FIRST VIEWPORT: The Statement === */}
      <section className="min-h-screen flex flex-col justify-center px-8 sm:px-16 lg:px-24 py-20">
        <div className="max-w-4xl">
          {/* Project label */}
          <motion.p
            className="font-mono text-[11px] tracking-[0.3em] uppercase mb-8"
            style={{ color: 'var(--color-accent)' }}
            {...fade}
          >
            Blaze Sports Intel
          </motion.p>

          {/* Position statement — Negate-Then-State */}
          <motion.h1
            className="font-serif text-[clamp(1.5rem,4vw,2.6rem)] leading-[1.35] font-normal italic mb-10"
            style={{ color: 'var(--color-text)' }}
            {...fade}
            transition={{ delay: 0.1, duration: 0.7, ease: [0.4, 0, 0.2, 1] }}
          >
            College baseball analytics didn't exist outside pay-walled tools and hand-maintained spreadsheets.{' '}
            <span style={{ color: 'var(--color-text-muted)' }}>
              330 programs. Zero public sabermetrics. So I built them.
            </span>
          </motion.h1>

          {/* Screenshot — the commanding visual anchor */}
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
              src="/assets/bsi-homepage.png"
              alt="Blaze Sports Intel homepage — live scores, sidebar navigation, Heritage design system"
              className="w-full"
              loading="eager"
            />
          </motion.div>

          {/* Visit link — understated */}
          <motion.div
            {...fade}
            transition={{ delay: 0.3, duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
          >
            <a
              href={PLATFORM_URLS.bsi}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 font-mono text-[11px] tracking-[0.15em] uppercase transition-colors duration-300 hover:text-[var(--color-text)]"
              style={{
                color: 'var(--color-accent)',
                borderBottom: '1px solid rgba(191,87,0,0.3)',
                paddingBottom: '2px',
              }}
            >
              <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ background: '#22c55e' }} />
              Visit live site
            </a>
          </motion.div>
        </div>
      </section>

      {/* === BELOW THE FOLD: Details for those who scroll === */}
      <section
        className="px-8 sm:px-16 lg:px-24 py-20"
        style={{ borderTop: '1px solid rgba(245,240,235,0.04)' }}
      >
        <div className="max-w-3xl">
          {/* The what — in Austin's voice */}
          <p
            className="font-serif text-[17px] leading-relaxed mb-12"
            style={{ color: 'var(--color-text-muted)' }}
          >
            Try finding advanced analytics for a Tuesday night game between Rice and Sam Houston.
            Try tracking conference standings across five sports without clicking through fifteen
            separate pages. The gap between interest in the game and access to meaningful data — that
            is the product. BSI treats a mid-major pitcher with the same analytical rigor as an SEC
            Friday night starter. The architecture is deliberately constrained: Cloudflare only. No AWS.
            No Vercel. One person can debug the entire stack because one person built the entire stack.
          </p>

          {/* Quiet detail rows — key-value, not grid */}
          <div className="space-y-0">
            {[
              ['Stack', 'Cloudflare Workers · D1 · KV · R2 · Next.js · React · TypeScript'],
              ['Scale', '53 Workers · 12 databases · 45 KV stores · 40+ API routes'],
              ['Coverage', '330 D1 baseball teams · MLB · NFL · NBA · College Football'],
              ['Analytics', 'wOBA · wRC+ · FIP · ERA- · park factors · conference strength — recomputed every 6 hours'],
              ['Live data', '15-second score updates via Durable Objects + WebSocket'],
              ['Operator', 'One person. Architecture, data pipelines, frontend, editorial, analytics.'],
            ].map(([key, val]) => (
              <div
                key={key}
                className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1 sm:gap-8 py-5"
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
          </div>

          {/* Second screenshot — deeper into the product */}
          <div
            className="relative rounded-lg overflow-hidden mt-16 mb-8"
            style={{
              border: '1px solid rgba(245,240,235,0.04)',
              boxShadow: '0 12px 40px rgba(0,0,0,0.3)',
            }}
          >
            <img
              src="/assets/bsi-savant.png"
              alt="BSI Savant — park-adjusted sabermetrics leaderboard with wOBA, wRC+, FIP, ERA-"
              className="w-full"
              loading="lazy"
            />
          </div>
          <p
            className="font-mono text-[9px] tracking-wide mb-16"
            style={{ color: 'rgba(245,240,235,0.2)' }}
          >
            The Savant leaderboard — wOBA, wRC+, FIP, ERA- for every qualified D1 player. Park-adjusted. Conference-strength-weighted. Recomputed every six hours from real game data.
          </p>

          {/* Closing — back to landing */}
          <div className="flex items-center gap-6 pt-8" style={{ borderTop: '1px solid rgba(245,240,235,0.04)' }}>
            <Link
              to="/"
              className="font-mono text-[10px] tracking-[0.15em] uppercase transition-colors duration-300 hover:text-[var(--color-text)]"
              style={{ color: 'var(--color-text-muted)' }}
            >
              ← All projects
            </Link>
            <Link
              to="/projects/sluggers"
              className="font-mono text-[10px] tracking-[0.15em] uppercase transition-colors duration-300 hover:text-[var(--color-text)]"
              style={{ color: 'var(--color-text-muted)' }}
            >
              Next: Sandlot Sluggers →
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

export default ProjectBSI;
