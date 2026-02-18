import { useEffect, useRef } from 'react';

const pieces = [
  {
    title: 'Big 12 Conference Baseball Preview 2026',
    excerpt:
      'A deep dive into every Big 12 program — from Texas Tech\'s rebuilt rotation to TCU\'s lineup depth. Conference realignment reshuffled the deck; here\'s how each team plays its hand.',
    tag: 'Conference Preview',
    url: 'https://blazesportsintel.com/college-baseball/editorial/big-12',
  },
  {
    title: 'SEC Conference Baseball Preview 2026',
    excerpt:
      'The deepest conference in college baseball just added Texas and Oklahoma. Sixteen programs, one question: can anyone dethrone the defending champions?',
    tag: 'Conference Preview',
    url: 'https://blazesportsintel.com/college-baseball/editorial/sec',
  },
  {
    title: 'Week 1 Recap: What We Learned',
    excerpt:
      'Opening weekend separated contenders from pretenders. Three takeaways from 200+ games across D1 baseball, plus early rankings movement and upset alerts.',
    tag: 'Weekly Recap',
    url: 'https://blazesportsintel.com/college-baseball/editorial/week-1-recap',
  },
  {
    title: 'Texas Longhorns: Week 1 in Review',
    excerpt:
      'The Longhorns opened SEC play with a statement. Breaking down the pitching staff\'s evolution, lineup construction decisions, and what the numbers say about postseason trajectory.',
    tag: 'Team Analysis',
    url: 'https://blazesportsintel.com/blog-post-feed/texas-baseball-week-1-recap-lamar-preview-michigan-state-series-2026',
  },
];

export default function Writing() {
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
      id="writing"
      aria-labelledby="writing-heading"
      className="section-padding section-border"
    >
      <div className="container-custom">
        <div className="reveal">
          <p className="section-label">// The Voice</p>
          <h2 id="writing-heading" className="section-title">Writing & Editorial</h2>
          <p className="text-warm-gray text-lg mb-10 max-w-2xl">
            BSI editorial goes where prestige platforms won't — covering programs, markets, and
            matchups that deserve the same analytical depth as the teams with national TV deals.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-10">
          {pieces.map((piece) => (
            <a
              key={piece.title}
              href={piece.url}
              target="_blank"
              rel="noopener noreferrer"
              className="card p-6 group reveal block"
            >
              <span className="text-[0.6rem] font-mono text-burnt-orange uppercase tracking-widest">
                {piece.tag}
              </span>
              <h3 className="font-sans font-semibold text-base uppercase tracking-wider text-bone mt-2 mb-3 group-hover:text-burnt-orange transition-colors duration-300">
                {piece.title}
              </h3>
              <p className="text-bone/70 text-sm leading-relaxed">{piece.excerpt}</p>
            </a>
          ))}
        </div>

        <div className="reveal text-center">
          <a
            href="https://blazesportsintel.com/blog-post-feed"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-outline"
          >
            View All Writing →
          </a>
        </div>
      </div>
    </section>
  );
}
