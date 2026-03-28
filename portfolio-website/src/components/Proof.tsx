import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { staggerContainer, staggerItem, SCROLL_VIEWPORT } from '../utils/animations';
import { PROOF_PIECES, SPEAKING_REEL } from '../content/site';

export default function Proof() {
  const [playing, setPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handlePlay = () => {
    setPlaying(true);
    videoRef.current?.play();
  };

  return (
    <section
      id="proof"
      aria-labelledby="proof-heading"
      className="section-padding section-border"
    >
      <div className="container-custom">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={SCROLL_VIEWPORT}
          variants={staggerContainer}
        >
          <motion.div variants={staggerItem}>
            <p className="section-label">Proof</p>
            <h2 id="proof-heading" className="section-title mb-2">
              The argument is public.
            </h2>
          </motion.div>

          {/* Editorial pieces — pull-quote layout with enhanced hover */}
          <div className="mt-10 space-y-0">
            {PROOF_PIECES.map((piece, i) => (
              <motion.a
                key={piece.title}
                variants={staggerItem}
                custom={i}
                href={piece.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group block border-t border-bone/8 py-8 transition-all duration-400 hover:border-burnt-orange/20 hover:bg-burnt-orange/[0.02] md:py-10"
              >
                <div className="grid gap-4 md:grid-cols-[minmax(0,0.35fr)_minmax(0,0.65fr)] md:items-start md:gap-8">
                  <div>
                    <p className="font-mono text-[0.58rem] uppercase tracking-[0.26em] text-burnt-orange/75">
                      {piece.tag}
                    </p>
                    <h3 className="mt-3 font-sans text-base font-semibold uppercase tracking-[0.14em] text-bone transition-colors duration-300 group-hover:text-burnt-orange md:text-lg">
                      {piece.title}
                    </h3>
                  </div>
                  <div className="flex items-start justify-between gap-4">
                    <p className="editorial-lead max-w-xl">
                      {piece.pullQuote}
                    </p>
                    <svg
                      className="mt-2 h-4 w-4 shrink-0 text-bone/15 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-burnt-orange"
                      viewBox="0 0 20 20"
                      fill="none"
                    >
                      <path d="M5 15L15 5M15 5H8M15 5V12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </div>
              </motion.a>
            ))}
          </div>

          {/* View all writing */}
          <motion.div variants={staggerItem} className="mt-2">
            <a
              href="https://blazesportsintel.com/blog-post-feed"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-outline inline-flex items-center gap-2"
            >
              All Writing
              <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="none">
                <path d="M5 15L15 5M15 5H8M15 5V12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
          </motion.div>

          {/* Speaking reel — full-width cinematic presentation */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={SCROLL_VIEWPORT}
            variants={staggerContainer}
            className="mt-16 border-t border-bone/8 pt-10"
          >
            <motion.div variants={staggerItem} className="mb-8 text-center">
              <p className="font-mono text-[0.58rem] uppercase tracking-[0.26em] text-burnt-orange/75">
                Speaking
              </p>
              <h3 className="mt-3 font-sans text-xl font-semibold uppercase tracking-[0.12em] text-bone md:text-2xl">
                {SPEAKING_REEL.title}
              </h3>
              <p className="mx-auto mt-3 max-w-lg text-base leading-8 text-bone/65">
                {SPEAKING_REEL.summary}
              </p>
            </motion.div>

            {/* Cinema-grade video container */}
            <motion.div variants={staggerItem} className="video-cinema">
              <div className="pointer-events-none absolute inset-0 z-10 vignette-deep" />
              <div className="aspect-video">
                <video
                  ref={videoRef}
                  controls={playing}
                  preload="metadata"
                  playsInline
                  poster="/assets/optimized/last-game-silhouette-1024w.webp"
                  aria-label={SPEAKING_REEL.title}
                  className="h-full w-full object-cover"
                  onPlay={() => setPlaying(true)}
                >
                  <source src={SPEAKING_REEL.videoSrc} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              </div>

              {!playing && (
                <button
                  onClick={handlePlay}
                  className="absolute inset-0 z-20 flex items-center justify-center"
                  aria-label={`Play ${SPEAKING_REEL.title}`}
                >
                  <span className="flex h-20 w-20 items-center justify-center rounded-full border border-white/10 bg-burnt-orange/90 shadow-[0_0_30px_rgba(191,87,0,0.3)] transition-all duration-300 hover:scale-110 hover:bg-burnt-orange hover:shadow-[0_0_50px_rgba(191,87,0,0.5)]">
                    <svg viewBox="0 0 24 24" fill="white" className="ml-1 h-8 w-8">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </span>
                </button>
              )}
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
