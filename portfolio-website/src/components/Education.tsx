import { useEffect, useRef } from 'react';

const schools = [
  {
    degree: 'M.S. Entertainment Business — Sports Management',
    school: 'Full Sail University',
    detail: 'Graduated February 2026 | GPA: 3.56',
  },
  {
    degree: 'AI & Machine Learning Postgraduate Certificate',
    school: 'UT Austin McCombs School of Business',
    detail: 'Accepted and currently in progress',
  },
  {
    degree: 'B.A. International Relations & Global Studies',
    school: 'University of Texas at Austin',
    detail: '2014 – 2020 | Minors: Economics, European Studies',
  },
];

export default function Education() {
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
      id="education"
      aria-labelledby="education-heading"
      className="section-padding section-border"
    >
      <div className="container-custom">
        <div className="reveal">
          <p className="section-label">// Education</p>
          <h2 id="education-heading" className="section-title">Academic Foundation</h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {schools.map((s) => (
            <div key={s.school} className="card p-6 reveal" style={{ borderTop: '2px solid #BF5700' }}>
              <h3 className="font-sans font-semibold text-base uppercase tracking-wider text-bone mb-2">
                {s.degree}
              </h3>
              <p className="text-burnt-orange font-semibold text-sm mb-2">{s.school}</p>
              <p className="text-sm font-mono text-warm-gray">{s.detail}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
