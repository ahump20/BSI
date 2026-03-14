import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { staggerContainer, staggerItem } from '../utils/animations';

const pieces = [
  {
    title: 'Big 12 Conference Baseball Preview 2026',
    excerpt:
      "A deep dive into every Big 12 program — from Texas Tech's rebuilt rotation to TCU's lineup depth. Conference realignment reshuffled the deck; here's how each team plays its hand.",
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
      'Opening weekend separated contenders from pretenders. Three takeaways from 200+ games across D1 baseball.',
    tag: 'Weekly Recap',
    url: 'https://blazesportsintel.com/college-baseball/editorial/week-1-recap',
    featured: false,
  },
  {
    title: 'Texas Longhorns: Week 1 in Review',
    excerpt:
      "The Longhorns opened SEC play with a statement. Breaking down the pitching staff's evolution and what the numbers say about postseason trajectory.",
    tag: 'Team Analysis',
    url: 'https://blazesportsintel.com/blog-post-feed/texas-baseball-week-1-recap-lamar-preview-michigan-state-series-2026',
    featured: false,
  },
];

export default function Proof() {
  const [playing, setPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const lead = pieces.find((piece) => piece.featured);
  const rest = pieces.filter((piece) => !piece.featured);

  const handlePlay = () => {
    setPlaying(true);
    videoRef.current?.play();
  };

  return (
    <section
      id="proof"
      aria-labelledby="proof-heading"
      className="section-padding section-border section-glow relative overflow-hidden proof-section-bottom"
    >
      <div className="container-custom">
        <motion.div
          initial="visible"
          whileInView="visible"
          viewport={{ once: true, amount: 0.05 }}
          variants={staggerContainer}
          className="space-y-12"
        >
          <motion.div variants={staggerItem} className="max-w-4xl">
            <p className="section-label">// The Proof</p>
            <h2 id="proof-heading" className="section-title mb-6">
              Writing & Film
            </h2>
            <p className="editorial-lead">
              BSI proves itself in public. The work is not a pitch deck. It is
              published, argued, spoken, and shipped in plain view for anyone
              willing to read the tape.
            </p>
          </motion.div>

          {lead && (
            <motion.div
              variants={staggerItem}
              className="grid gap-8 border-t border-b border-bone/5 py-10 lg:grid-cols-[minmax(0,1.3fr)_minmax(250px,0.7fr)] lg:items-end"
            >
              <a
                href={lead.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group block"
              >
                <span className="inline-flex rounded-full border border-burnt-orange/25 bg-burnt-orange/10 px-3 py-1 font-mono text-[0.58rem] uppercase tracking-[0.28em] text-burnt-orange">
                  {lead.tag}
                </span>
                <h3
                  className="mt-5 font-sans font-bold uppercase tracking-[0.08em] text-bone transition-colors duration-300 group-hover:text-burnt-orange proof-lead-title"
                >
                  {lead.title}
                </h3>
                <p className="mt-6 max-w-3xl font-serif text-xl leading-relaxed text-bone/72 md:text-2xl">
                  {lead.excerpt}
                </p>
              </a>

              <div className="space-y-4 border-l border-bone/10 pl-0 lg:pl-8">
                <p className="font-mono text-[0.6rem] uppercase tracking-[0.28em] text-warm-gray/70">
                  Why It Matters
                </p>
                <p className="text-sm leading-7 text-bone/70">
                  This is the public proof layer behind the platform: editorial
                  coverage, film, and voice all pushing the same thesis with
                  different instruments.
                </p>
                <a
                  href={lead.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 font-mono text-[0.62rem] uppercase tracking-[0.28em] text-burnt-orange"
                >
                  Read the feature
                  <svg className="h-4 w-4" viewBox="0 0 20 20" fill="none">
                    <path
                      d="M5 15L15 5M15 5H8M15 5V12"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </a>
              </div>
            </motion.div>
          )}

          <motion.div
            variants={staggerItem}
            className="grid gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]"
          >
            <div className="space-y-3">
              <p className="font-mono text-[0.6rem] uppercase tracking-[0.28em] text-warm-gray/60">
                Editorial Ledger
              </p>
              <p className="max-w-sm text-sm leading-7 text-bone/65">
                The deeper pieces carry the same job: show range, show signal,
                and make the platform legible through repeatable public work.
              </p>
            </div>

            <div className="space-y-3">
              {rest.map((piece, index) => (
                <a
                  key={piece.title}
                  href={piece.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group grid gap-4 border-b border-bone/5 py-4 md:grid-cols-[9rem_minmax(0,1fr)_1.5rem]"
                >
                  <span className="font-mono text-[0.58rem] uppercase tracking-[0.24em] text-burnt-orange/85">
                    {piece.tag}
                  </span>
                  <div className="space-y-2">
                    <h3 className="font-sans text-sm font-semibold uppercase tracking-[0.16em] text-bone transition-colors duration-300 group-hover:text-burnt-orange">
                      {piece.title}
                    </h3>
                    <p className="text-sm leading-7 text-bone/60">{piece.excerpt}</p>
                  </div>
                  <div className="flex items-start justify-end pt-1">
                    <span className="font-mono text-xs text-bone/20 transition-all duration-300 group-hover:translate-x-1 group-hover:text-burnt-orange">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                  </div>
                </a>
              ))}
            </div>
          </motion.div>

          <motion.div
            variants={staggerItem}
            className="flex flex-col gap-4 border-b border-bone/5 pb-10 md:flex-row md:items-center md:justify-between"
          >
            <a
              href="https://blazesportsintel.com/blog-post-feed"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-outline inline-flex items-center gap-2"
            >
              View All Writing
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="none">
                <path
                  d="M5 15L15 5M15 5H8M15 5V12"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </a>
            <p className="font-mono text-[0.7rem] uppercase tracking-[0.22em] text-warm-gray/65">
              Also exported as audio via NotebookLM
            </p>
          </motion.div>

          <motion.div
            variants={staggerItem}
            className="mt-12 border-t border-bone/5 pt-12"
          >
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:items-center">
              <div className="space-y-4">
                <p className="section-label mb-0">// On Camera</p>
                <h3 className="font-sans text-2xl font-semibold uppercase tracking-[0.14em] text-bone md:text-3xl">
                  Talking Sports: The Analytical Lens
                </h3>
                <p className="max-w-2xl text-base leading-8 text-bone/70">
                  The same argument, spoken instead of typed. Film matters here
                  because credibility is not only what gets published. It is how
                  the thinking sounds when the notes are gone.
                </p>
                <p className="font-mono text-[0.68rem] uppercase tracking-[0.24em] text-warm-gray/60">
                  Short-form editorial proof from the same operating system.
                </p>
              </div>

              <div className="relative overflow-hidden rounded-lg border border-bone/10 bg-midnight shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
                <div
                  className="pointer-events-none absolute inset-0 z-10 vignette-deep"
                />
                <div className="aspect-video">
                  <video
                    ref={videoRef}
                    controls={playing}
                    preload="metadata"
                    playsInline
                    aria-label="Talking Sports: The Analytical Lens"
                    className="h-full w-full object-cover"
                    onPlay={() => setPlaying(true)}
                  >
                    <source src="/assets/austin-speaking-sports.mp4" type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                </div>

                {!playing && (
                  <button
                    onClick={handlePlay}
                    className="absolute inset-0 z-20 flex items-center justify-center cursor-pointer"
                    aria-label="Play video"
                  >
                    <span className="flex h-20 w-20 items-center justify-center rounded-full border border-white/10 bg-burnt-orange/90 shadow-2xl transition-all duration-300 hover:scale-105 hover:bg-burnt-orange">
                      <svg viewBox="0 0 24 24" fill="white" className="ml-1 h-8 w-8">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </span>
                  </button>
                )}

                <div className="flex items-center justify-between border-t border-bone/10 px-4 py-3">
                  <p className="font-mono text-[0.62rem] uppercase tracking-[0.24em] text-warm-gray/70">
                    Speaking Reel
                  </p>
                  <p className="font-mono text-[0.58rem] uppercase tracking-[0.22em] text-burnt-orange/75">
                    Proof in motion
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
