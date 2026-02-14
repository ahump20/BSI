import { useEffect, useRef } from 'react';

export default function Philosophy() {
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
      id="covenant"
      aria-labelledby="covenant-heading"
      className="section-padding section-border"
    >
      <div className="container-custom max-w-4xl mx-auto text-center">
        <div className="reveal">
          <p className="section-label">// The Covenant</p>
          <h2 id="covenant-heading" className="sr-only">Texas Covenant</h2>

          <blockquote className="mb-12">
            <p className="font-serif italic text-bone/90 text-3xl md:text-5xl leading-relaxed mb-6">
              "For me, personally, I believe Texas is how you choose to treat
              the best and worst of us."
            </p>
            <footer className="text-sm font-mono text-burnt-orange">— Austin Humphrey</footer>
          </blockquote>

          <div className="text-warm-gray text-lg leading-relaxed space-y-6 text-left max-w-3xl mx-auto">
            <p>
              It's a covenant with oneself and the company one keeps, to never stop dreaming
              beyond the horizon, regardless of race, ethnicity, religion, or even birth soil.
            </p>
            <p>
              The land doesn't care about your resume. The wind doesn't read your LinkedIn.
              What matters is whether you showed up when it was hard, stayed when it was
              thankless, and built something that outlasts the news cycle.
            </p>
          </div>

          <p className="font-sans font-bold uppercase tracking-[0.2em] text-burnt-orange text-xl md:text-2xl mt-12">
            It's not where you're from.
            <br />
            It's how you show up.
          </p>
        </div>
      </div>
    </section>
  );
}
