import Section from './Section';
import ScrollReveal from './ScrollReveal';
import { ORIGIN_PHOTOS, ORIGIN_TEXT } from '../content/site';

export default function OriginSection() {
  const paragraphs = ORIGIN_TEXT.split('\n\n');

  return (
    <Section id="origin" label="The Origin" className="origin-bridge-shell">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-10 lg:gap-16 items-start">
        {/* Text column */}
        <ScrollReveal>
          <div>
            <h2 className="section-title">Friday Night Lights to the Forty Acres</h2>
            {paragraphs.map((p, i) => (
              <p
                key={i}
                className="font-serif text-[17px] leading-[1.65] mb-6"
                style={{ color: 'var(--color-text-muted)' }}
              >
                {p}
              </p>
            ))}
          </div>
        </ScrollReveal>

        {/* Photo gallery — asymmetric */}
        <ScrollReveal delay={0.15}>
          <div className="space-y-4">
            {ORIGIN_PHOTOS.map(photo => (
              <div
                key={photo.alt}
                className={`group relative overflow-hidden ${photo.dominant ? '' : 'photo-card'}`}
                style={
                  photo.dominant
                    ? {
                        borderRadius: '2px',
                        boxShadow: '0 12px 40px rgba(0,0,0,0.4)',
                      }
                    : {}
                }
              >
                <picture>
                  <source srcSet={photo.src} type="image/webp" />
                  <img
                    src={photo.fallback}
                    alt={photo.alt}
                    className={`w-full ${photo.dominant ? 'vignette-deep' : ''}`}
                    loading="lazy"
                  />
                </picture>
                {/* Caption overlay on hover */}
                <div
                  className="absolute inset-x-0 bottom-0 p-3 transition-opacity duration-300 opacity-0 group-hover:opacity-100"
                  style={{
                    background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)',
                  }}
                >
                  <p className="font-mono text-[10px] tracking-wide" style={{ color: 'var(--color-text-muted)' }}>
                    {photo.caption}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </ScrollReveal>
      </div>
    </Section>
  );
}
