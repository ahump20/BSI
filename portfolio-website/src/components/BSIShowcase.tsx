import ScrollReveal from './ScrollReveal';
import Section from './Section';
import { BSI_SHOWCASE, PLATFORM_URLS } from '../content/site';

export default function BSIShowcase() {
  return (
    <Section id="bsi" label="The Work" title="Blaze Sports Intel" glow className="bsi-showcase-bg">
      {/* Asymmetric grid: screenshot left, info right */}
      <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-8 lg:gap-12 items-start">
        {/* Screenshot */}
        <ScrollReveal direction="left">
          <div
            className="relative rounded-sm overflow-hidden"
            style={{
              border: '1px solid rgba(245,240,235,0.06)',
              boxShadow: '0 20px 60px rgba(0,0,0,0.4), 0 4px 20px rgba(0,0,0,0.2)',
            }}
          >
            <img
              src="/assets/bsi-homepage.png"
              alt="Blaze Sports Intel homepage — live scores, sidebar navigation, Heritage design system"
              className="w-full"
              loading="lazy"
            />
          </div>
        </ScrollReveal>

        {/* Info panel */}
        <ScrollReveal delay={0.15}>
          <div className="space-y-8">
            {/* Stats row */}
            <div className="grid grid-cols-2 gap-4">
              {BSI_SHOWCASE.stats.map(stat => (
                <div key={stat.label}>
                  <p
                    className="font-sans text-[clamp(1.5rem,3vw,2.25rem)] font-bold uppercase"
                    style={{ color: 'var(--color-text)' }}
                  >
                    {stat.value}
                  </p>
                  <p
                    className="font-mono text-[10px] tracking-[0.15em] uppercase"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>

            {/* Description */}
            <p
              className="font-serif text-[15px] leading-relaxed"
              style={{ color: 'var(--color-text-muted)' }}
            >
              The coverage gap between what fans care about and what media covers is the product.
              Six sports, 330 D1 programs, park-adjusted sabermetrics — all running on Cloudflare,
              all one person.
            </p>

            {/* Visit CTA */}
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
          </div>
        </ScrollReveal>
      </div>

      {/* Capabilities — 2×2 grid below */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-14">
        {BSI_SHOWCASE.capabilities.map((cap, i) => (
          <ScrollReveal key={cap.title} delay={0.1 + i * 0.08}>
            <div
              className="p-5 rounded-sm"
              style={{
                background: 'rgba(26,26,26,0.5)',
                border: '1px solid rgba(245,240,235,0.04)',
              }}
            >
              <h3
                className="font-sans text-xs font-semibold uppercase tracking-wider mb-2"
                style={{ color: 'var(--color-accent)' }}
              >
                {cap.title}
              </h3>
              <p
                className="font-serif text-[14px] leading-relaxed"
                style={{ color: 'var(--color-text-muted)' }}
              >
                {cap.description}
              </p>
            </div>
          </ScrollReveal>
        ))}
      </div>
    </Section>
  );
}
