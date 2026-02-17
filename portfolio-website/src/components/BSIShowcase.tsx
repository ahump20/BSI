import { useEffect, useRef } from 'react';

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

export default function BSIShowcase() {
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
      id="bsi"
      aria-labelledby="bsi-heading"
      className="section-padding section-border"
    >
      <div className="container-custom">
        <div className="reveal">
          <p className="section-label">// The Platform</p>
          <h2 id="bsi-heading" className="section-title">Blaze Sports Intel</h2>
          <p className="font-sans font-semibold text-burnt-orange uppercase tracking-[0.2em] text-sm mb-10">
            Born to Blaze the Path Less Beaten
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-12 mb-16">
          {/* Description */}
          <div className="space-y-6 text-bone/85 text-lg leading-relaxed reveal">
            <p>
              BSI covers what mainstream sports media overlook: the athletes, programs, and markets
              outside the East and West Coast spotlight. The gap between interest in college and
              amateur sports and access to meaningful analytics is the product.
            </p>
            <p>
              Old-school scouting instinct fused with new-school sabermetrics, powered by AI tooling
              that makes the depth accessible. Major platforms paint a black-and-white picture —
              LeBron vs. MJ, Yankees or Dodgers, Cowboys or nothing. BSI exists to leave that
              binary behind.
            </p>
            <p className="text-warm-gray italic border-l-2 border-burnt-orange pl-6">
              The real game lives between the poles: what actual fans, players, and professionals
              care about but can't find covered at depth.
            </p>
            <div className="flex flex-wrap gap-4 pt-4">
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
          </div>

          {/* League rows + stats */}
          <div className="reveal">
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="card p-5 text-center">
                <p className="text-3xl font-bold font-sans text-burnt-orange">14</p>
                <p className="text-xs font-mono text-warm-gray mt-1">Workers</p>
              </div>
              <div className="card p-5 text-center">
                <p className="text-3xl font-bold font-sans text-burnt-orange">5</p>
                <p className="text-xs font-mono text-warm-gray mt-1">D1 Databases</p>
              </div>
              <div className="card p-5 text-center">
                <p className="text-3xl font-bold font-sans text-burnt-orange">9</p>
                <p className="text-xs font-mono text-warm-gray mt-1">KV Namespaces</p>
              </div>
              <div className="card p-5 text-center">
                <p className="text-3xl font-bold font-sans text-burnt-orange">18</p>
                <p className="text-xs font-mono text-warm-gray mt-1">R2 Buckets</p>
              </div>
            </div>

            <div className="space-y-2">
              {leagues.map((league) => (
                <div
                  key={league.name}
                  className="flex items-center justify-between px-4 py-2 card"
                >
                  <span className="font-sans text-sm uppercase tracking-wider text-bone font-medium">
                    {league.name}
                  </span>
                  <span className="text-xs font-mono text-burnt-orange">{league.note}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tech stack tags */}
        <div className="reveal">
          <p className="section-label mb-4">// Tech Stack</p>
          <div className="flex flex-wrap gap-3">
            {techStack.map((tech) => (
              <span
                key={tech}
                className="text-xs font-mono bg-burnt-orange/10 text-burnt-orange border border-burnt-orange/20 px-4 py-2 rounded-full"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
