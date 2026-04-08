import Section from './Section';
import ScrollReveal from './ScrollReveal';
import { COVENANT_TEXT, SITE_TAGLINE } from '../content/site';

export default function CovenantSection() {
  const paragraphs = COVENANT_TEXT.split('\n\n');

  return (
    <Section
      id="covenant"
      className="relative py-28 sm:py-36"
    >
      {/* Elevated surface */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'var(--surface-elevated)' }}
      />

      <div className="relative z-10 max-w-3xl mx-auto text-center">
        <ScrollReveal>
          <p className="section-label mb-8">// The Covenant</p>
          {paragraphs.map((p, i) => (
            <p
              key={i}
              className="font-serif text-[clamp(1.1rem,2.5vw,1.4rem)] leading-[1.65] italic mb-6"
              style={{ color: 'var(--color-text)' }}
            >
              {p}
            </p>
          ))}
        </ScrollReveal>

        <ScrollReveal delay={0.2}>
          <p
            className="font-display text-[14px] italic tracking-wide mt-10"
            style={{ color: 'rgba(191,87,0,0.4)' }}
          >
            &ldquo;{SITE_TAGLINE}&rdquo;
          </p>
        </ScrollReveal>
      </div>
    </Section>
  );
}
