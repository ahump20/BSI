import { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { staggerContainer, staggerItem, SCROLL_VIEWPORT } from '../utils/animations';
import PlatformStatus from './PlatformStatus';
import { FLAGSHIP, SUPPORTING_PROJECTS, type Project } from '../content/site';

function useCountUp(target: number, trigger: boolean, duration = 1600): string {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!trigger) return;
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) { setCount(target); return; }

    let start: number | null = null;
    let animId: number;
    const step = (ts: number) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress < 1) animId = requestAnimationFrame(step);
    };
    animId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animId);
  }, [target, trigger, duration]);

  return String(count);
}

function AnimatedStat({ value, label }: { value: string; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!ref.current) return;
    const io = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); io.disconnect(); } },
      { threshold: 0.5 }
    );
    io.observe(ref.current);
    return () => io.disconnect();
  }, []);

  // Extract numeric part and suffix (e.g., "330+" → 330, "+")
  const numMatch = value.match(/^(\d+)(.*)$/);
  const numPart = numMatch ? parseInt(numMatch[1], 10) : 0;
  const suffix = numMatch ? numMatch[2] : '';
  const animated = useCountUp(numPart, visible);

  return (
    <div ref={ref}>
      <p className="font-sans text-3xl font-bold text-burnt-orange tabular-nums">
        {visible ? animated : '0'}{suffix}
      </p>
      <p className="mt-1 font-mono text-[0.6rem] uppercase tracking-[0.22em] text-warm-gray/68">
        {label}
      </p>
    </div>
  );
}

function SupportingProject({ project }: { project: Project }) {
  return (
    <a
      href={project.href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => window.posthog?.capture('project_clicked', { project: project.name })}
      className="group flex items-start justify-between gap-4 border-t border-bone/8 py-5 transition-colors duration-300 hover:border-burnt-orange/25"
    >
      <div className="min-w-0">
        <div className="flex items-center gap-3">
          <h3 className="font-sans text-sm font-semibold uppercase tracking-[0.16em] text-bone transition-colors duration-300 group-hover:text-burnt-orange">
            {project.name}
          </h3>
          {project.state === 'building' && (
            <span className="font-mono text-[0.5rem] uppercase tracking-[0.2em] text-warm-gray/60">
              In progress
            </span>
          )}
        </div>
        <p className="mt-2 max-w-lg text-sm leading-7 text-bone/60">{project.outcome}</p>
      </div>
      <svg
        className="mt-1 h-4 w-4 shrink-0 text-bone/15 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-burnt-orange"
        viewBox="0 0 20 20"
        fill="none"
      >
        <path d="M5 15L15 5M15 5H8M15 5V12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </a>
  );
}

export default function Work() {
  return (
    <section
      id="work"
      aria-labelledby="work-heading"
      className="section-padding section-border"
    >
      <div className="container-custom">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={SCROLL_VIEWPORT}
          variants={staggerContainer}
        >
          {/* Section label */}
          <motion.p variants={staggerItem} className="section-label">
            Work
          </motion.p>

          {/* ── Flagship: BSI ── */}
          <motion.div variants={staggerItem} className="mt-2 grid gap-10 lg:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.6fr)]">
            <div>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  <picture>
                    <source
                      srcSet="/assets/optimized/bsi-logo-640w.webp 640w"
                      type="image/webp"
                    />
                    <img
                      src="/assets/bsi-logo.png"
                      alt="BSI"
                      width={40}
                      height={40}
                      className="h-10 w-10 rounded-sm object-contain"
                    />
                  </picture>
                  <h2 id="work-heading" className="section-title mb-0">
                    <a
                      href={FLAGSHIP.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="transition-colors duration-300 hover:text-burnt-orange"
                      onClick={() => window.posthog?.capture('project_clicked', { project: 'BSI' })}
                    >
                      {FLAGSHIP.name}
                    </a>
                  </h2>
                </div>
                <PlatformStatus />
              </div>

              <p className="mt-6 max-w-2xl text-base leading-8 text-bone/72 md:text-lg md:leading-9">
                {FLAGSHIP.thesis}
              </p>
            </div>

            {/* Stats — right column on desktop, animated counters */}
            <div className="flex flex-row gap-8 lg:flex-col lg:gap-6 lg:pt-2">
              {FLAGSHIP.stats.map((stat) => (
                <AnimatedStat key={stat.label} value={stat.value} label={stat.label} />
              ))}
            </div>
          </motion.div>

          {/* BSI screenshot — browser-chrome frame for product credibility */}
          <motion.div variants={staggerItem} className="mt-10">
            <a
              href={FLAGSHIP.href}
              target="_blank"
              rel="noopener noreferrer"
              className="block group"
              onClick={() => window.posthog?.capture('project_clicked', { project: 'BSI screenshot' })}
            >
              <div className="screenshot-frame">
                {/* Browser chrome bar */}
                <div className="flex items-center gap-2 border-b border-bone/5 bg-[#0A0A0A] px-4 py-2.5">
                  <div className="flex gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-bone/10" />
                    <span className="h-2.5 w-2.5 rounded-full bg-bone/10" />
                    <span className="h-2.5 w-2.5 rounded-full bg-bone/10" />
                  </div>
                  <div className="mx-3 flex-1 rounded-sm bg-bone/[0.04] px-3 py-1">
                    <span className="font-mono text-[0.6rem] text-warm-gray/50">blazesportsintel.com</span>
                  </div>
                </div>
                <picture>
                  <source
                    srcSet="/assets/optimized/bsi-homepage-640w.webp 640w, /assets/optimized/bsi-homepage-1024w.webp 1024w"
                    sizes="(max-width: 768px) 100vw, 960px"
                    type="image/webp"
                  />
                  <img
                    src="/assets/bsi-homepage.png"
                    alt="Blaze Sports Intel — live scores, rankings, and advanced analytics across 330 D1 programs"
                    loading="lazy"
                    decoding="async"
                    width={1024}
                    height={595}
                    className="w-full transition-transform duration-700 ease-out-expo group-hover:scale-[1.015]"
                  />
                </picture>
              </div>
            </a>
          </motion.div>

          {/* Capabilities — flowing list, not cards */}
          <motion.ul variants={staggerItem} className="mt-10 space-y-4 border-t border-bone/8 pt-8">
            {FLAGSHIP.capabilities.map((cap) => (
              <li key={cap} className="flex items-start gap-3 text-sm leading-7 text-bone/65">
                <span className="mt-2.5 block h-1 w-1 shrink-0 rounded-full bg-burnt-orange/60" />
                {cap}
              </li>
            ))}
          </motion.ul>

          {/* Tech line */}
          <motion.p
            variants={staggerItem}
            className="mt-8 max-w-3xl font-mono text-[0.65rem] uppercase tracking-[0.18em] text-warm-gray/55"
          >
            {FLAGSHIP.tech}
          </motion.p>

          {/* Visit CTA */}
          <motion.div variants={staggerItem} className="mt-8">
            <a
              href={FLAGSHIP.href}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary"
            >
              Visit BSI
            </a>
          </motion.div>

          {/* ── Supporting Projects ── */}
          <motion.div variants={staggerItem} className="mt-16">
            <p className="font-mono text-[0.6rem] uppercase tracking-[0.26em] text-burnt-orange/70">
              Also shipping
            </p>
            <div className="mt-4">
              {SUPPORTING_PROJECTS.map((project) => (
                <SupportingProject key={project.name} project={project} />
              ))}
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
