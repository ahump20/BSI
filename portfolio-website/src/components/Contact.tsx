import { useEffect, useRef } from 'react';

const links = [
  { label: 'Email', value: 'Austin@BlazeSportsIntel.com', href: 'mailto:Austin@BlazeSportsIntel.com' },
  { label: 'LinkedIn', value: 'linkedin.com/in/ahump20', href: 'https://linkedin.com/in/ahump20' },
  { label: 'BSI', value: 'BlazeSportsIntel.com', href: 'https://blazesportsintel.com' },
  { label: 'GitHub', value: 'github.com/ahump20', href: 'https://github.com/ahump20' },
  { label: 'X', value: '@BlazeSportsIntel', href: 'https://x.com/BlazeSportsIntel' },
];

export default function Contact() {
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
      id="contact"
      aria-labelledby="contact-heading"
      className="section-padding section-border"
    >
      <div className="container-custom max-w-3xl mx-auto text-center">
        <div className="reveal">
          <p className="section-label">// Connect</p>
          <h2 id="contact-heading" className="section-title">Get in Touch</h2>
          <p className="text-warm-gray text-lg mb-12 max-w-2xl mx-auto">
            Whether you're interested in sports analytics, building platforms that serve
            underserved markets, or just want to talk about the philosophy of showing up.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-12 reveal">
          {links.map((link) => (
            <a
              key={link.label}
              href={link.href}
              target={link.href.startsWith('mailto') ? undefined : '_blank'}
              rel={link.href.startsWith('mailto') ? undefined : 'noopener noreferrer'}
              className="card p-5 text-center group"
            >
              <p className="text-xs font-mono text-warm-gray mb-1">{link.label}</p>
              <p className="text-sm font-semibold text-bone group-hover:text-burnt-orange transition-colors duration-300 break-words">
                {link.value}
              </p>
            </a>
          ))}
        </div>

        <div className="reveal">
          <a href="/Austin_Humphrey_Resume_Executive_v2.pdf" download className="btn-primary">
            Download Resume
          </a>
          <p className="text-sm font-mono text-warm-gray mt-8">
            Based in San Antonio, <span className="text-burnt-orange">Texas</span>
          </p>
        </div>
      </div>
    </section>
  );
}
