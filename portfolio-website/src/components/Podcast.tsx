import { useEffect, useRef } from 'react';

export default function Podcast() {
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
      id="podcast"
      aria-labelledby="podcast-heading"
      className="section-padding section-border"
    >
      <div className="container-custom">
        <div className="max-w-2xl mx-auto text-center reveal">
          <p className="section-label">// Listen</p>
          <h2 id="podcast-heading" className="section-title">Podcast Export</h2>
          <p className="text-warm-gray text-lg mb-8 leading-relaxed">
            BSI editorial coverage transforms into podcast-ready audio via NotebookLM.
            Coverage that started as data pipelines becomes accessible through a second medium.
          </p>
          <a
            href="https://notebooklm.google.com"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary"
          >
            Explore on NotebookLM
          </a>
        </div>
      </div>
    </section>
  );
}
