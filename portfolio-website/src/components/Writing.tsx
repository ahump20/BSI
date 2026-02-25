import { motion } from 'framer-motion';
import { staggerContainer, staggerItem } from '../utils/animations';

const pieces = [
  {
    title: 'Big 12 Conference Baseball Preview 2026',
    excerpt:
      'A deep dive into every Big 12 program — from Texas Tech\'s rebuilt rotation to TCU\'s lineup depth. Conference realignment reshuffled the deck; here\'s how each team plays its hand.',
    tag: 'Conference Preview',
    url: 'https://blazesportsintel.com/college-baseball/editorial/big-12',
    featured: true,
  },
  {
    title: 'SEC Conference Baseball Preview 2026',
    excerpt:
      'The deepest conference in college baseball just added Texas and Oklahoma. Sixteen programs, one question: can anyone dethrone the defending champions?',
    tag: 'Conference Preview',
    url: 'https://blazesportsintel.com/college-baseball/editorial/sec',
    featured: false,
  },
  {
    title: 'Week 1 Recap: What We Learned',
    excerpt:
      'Opening weekend separated contenders from pretenders. Three takeaways from 200+ games across D1 baseball, plus early rankings movement and upset alerts.',
    tag: 'Weekly Recap',
    url: 'https://blazesportsintel.com/college-baseball/editorial/week-1-recap',
    featured: false,
  },
  {
    title: 'Texas Longhorns: Week 1 in Review',
    excerpt:
      'The Longhorns opened SEC play with a statement. Breaking down the pitching staff\'s evolution, lineup construction decisions, and what the numbers say about postseason trajectory.',
    tag: 'Team Analysis',
    url: 'https://blazesportsintel.com/blog-post-feed/texas-baseball-week-1-recap-lamar-preview-michigan-state-series-2026',
    featured: false,
  },
];

export default function Writing() {
  const lead = pieces.find(p => p.featured);
  const rest = pieces.filter(p => !p.featured);

  return (
    <section
      id="writing"
      aria-labelledby="writing-heading"
      className="section-padding section-border"
    >
      <div className="container-custom">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          variants={staggerContainer}
        >
          <motion.div variants={staggerItem}>
            <p className="section-label">// The Voice</p>
            <h2 id="writing-heading" className="section-title">Writing & Editorial</h2>
            <p className="text-warm-gray text-lg mb-10 max-w-2xl">
              BSI editorial goes where prestige platforms won't — covering programs, markets, and
              matchups that deserve the same analytical depth as the teams with national TV deals.
            </p>
          </motion.div>

          {/* Lead article — full width featured treatment */}
          {lead && (
            <motion.a
              variants={staggerItem}
              href={lead.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block card p-8 md:p-10 mb-8 group"
              style={{
                background: 'linear-gradient(135deg, rgba(26,26,26,0.8) 0%, rgba(191,87,0,0.04) 100%)',
              }}
            >
              <span className="text-[0.6rem] font-mono text-burnt-orange uppercase tracking-widest">
                {lead.tag}
              </span>
              <h3 className="font-sans font-bold text-xl md:text-2xl uppercase tracking-wider text-bone mt-3 mb-4 group-hover:text-burnt-orange transition-colors duration-300">
                {lead.title}
              </h3>
              <p className="font-display italic text-warm-gray text-lg md:text-xl leading-relaxed max-w-3xl">
                "{lead.excerpt}"
              </p>
            </motion.a>
          )}

          {/* Remaining articles — editorial list layout */}
          <div className="space-y-0 mb-10">
            {rest.map((piece) => (
              <motion.a
                key={piece.title}
                variants={staggerItem}
                href={piece.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col md:flex-row md:items-center gap-2 md:gap-6 py-5 border-b border-bone/5 hover:bg-bone/[0.02] transition-colors duration-300 px-2 -mx-2"
              >
                <span className="text-[0.6rem] font-mono text-burnt-orange uppercase tracking-widest shrink-0 w-36">
                  {piece.tag}
                </span>
                <h3 className="font-sans font-semibold text-base uppercase tracking-wider text-bone group-hover:text-burnt-orange transition-colors duration-300 shrink-0 md:w-80">
                  {piece.title}
                </h3>
                <p className="text-bone/60 text-sm leading-relaxed hidden lg:block flex-1">{piece.excerpt}</p>
                <svg className="w-4 h-4 text-bone/20 group-hover:text-burnt-orange shrink-0 hidden md:block transition-colors duration-300" viewBox="0 0 20 20" fill="none">
                  <path d="M5 15L15 5M15 5H8M15 5V12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </motion.a>
            ))}
          </div>

          <motion.div variants={staggerItem} className="text-center">
            <a
              href="https://blazesportsintel.com/blog-post-feed"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-outline inline-flex items-center gap-2"
            >
              View All Writing
              <svg className="w-4 h-4" viewBox="0 0 20 20" fill="none">
                <path d="M5 15L15 5M15 5H8M15 5V12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
