import { useEffect, useRef } from 'react';

const experiences = [
  {
    title: 'Founder & Builder',
    company: 'Blaze Sports Intel',
    location: 'San Antonio, TX',
    period: '2023 – Present',
    description:
      'Built a production-grade sports analytics platform from scratch, covering MLB, NFL, NCAA football, NBA, and college baseball. 53 Cloudflare Workers, 12 D1 databases, 45 KV namespaces, and 18 R2 buckets — architecture designed, deployed, and maintained by one person. Real-time data pipelines with 30-second update cadence for live scoring across six leagues. AI-powered predictive modules and Claude-driven editorial generation.',
  },
  {
    title: 'Advertising Account Executive',
    company: 'Spectrum Reach',
    location: 'Austin / San Antonio, TX',
    period: 'Nov 2022 – Dec 2025',
    description:
      'Data-informed advertising across linear TV, OTT/CTV, streaming, and digital platforms in the Austin/San Antonio DMA. Translated campaign performance into actionable insights and coordinated cross-functional teams for multi-platform campaign delivery.',
  },
  {
    title: 'Financial Representative',
    company: 'Northwestern Mutual',
    location: 'Austin, TX',
    period: 'Dec 2020 – Aug 2022',
    description:
      'Top-5 nationally ranked intern program led to a full-time role. Built comprehensive financial plans using structured modeling. Earned the "Power of 10" Award for top 10% national performance and won the March Madness sales competition.',
  },
  {
    title: 'Rush Captain & Alumni Relations Chair',
    company: 'Alpha Tau Omega — UT Austin',
    location: 'Austin, TX',
    period: '2015 – 2020',
    description:
      'Led recruitment strategy that brought in 73 new members. Managed approximately $100K in event budgets and served as the bridge between active chapter and alumni network.',
  },
];

export default function Experience() {
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
      id="experience"
      aria-labelledby="experience-heading"
      className="section-padding section-border"
    >
      <div className="container-custom">
        <div className="reveal">
          <p className="section-label">// The Journey</p>
          <h2 id="experience-heading" className="section-title">Experience</h2>
        </div>

        {/* Timeline */}
        <div className="relative ml-4 md:ml-8">
          {/* Vertical line */}
          <div
            className="absolute left-0 top-0 bottom-0 w-px"
            style={{
              background: 'linear-gradient(to bottom, #BF5700, #8B4513, #BF5700)',
            }}
          />

          <div className="space-y-12">
            {experiences.map((exp) => (
              <div key={exp.company} className="relative pl-8 reveal">
                {/* Dot */}
                <div
                  className="absolute left-0 top-1 -translate-x-1/2"
                  style={{
                    width: 9,
                    height: 9,
                    borderRadius: '50%',
                    background: '#BF5700',
                    boxShadow: '0 0 8px rgba(191, 87, 0, 0.5)',
                  }}
                />

                <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-1 mb-3">
                  <div>
                    <h3 className="font-sans font-semibold text-lg uppercase tracking-wider text-bone">
                      {exp.title}
                    </h3>
                    <p className="text-burnt-orange font-semibold text-base">{exp.company}</p>
                    <p className="text-sm font-mono text-warm-gray">{exp.location}</p>
                  </div>
                  <span className="text-sm font-mono text-warm-gray whitespace-nowrap">{exp.period}</span>
                </div>

                <p className="text-bone/80 leading-relaxed">{exp.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
