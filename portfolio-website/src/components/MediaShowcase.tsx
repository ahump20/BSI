import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { staggerContainer, staggerItem } from '../utils/animations';

export default function MediaShowcase() {
  const [playing, setPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handlePlay = () => {
    setPlaying(true);
    videoRef.current?.play();
  };

  return (
    <section
      id="media"
      aria-labelledby="media-heading"
      className="section-padding section-border"
    >
      {/* Full-width cinematic framing — breaks out of container */}
      <div className="container-custom">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          variants={staggerContainer}
        >
          <motion.div variants={staggerItem}>
            <p className="section-label">// The Reel</p>
            <h2 id="media-heading" className="section-title">Media</h2>
          </motion.div>
        </motion.div>
      </div>

      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-80px' }}
        variants={staggerContainer}
        className="max-w-5xl mx-auto px-4"
      >
        <motion.div variants={staggerItem} className="relative group">
          {/* Video container with vignette */}
          <div className="relative rounded-lg overflow-hidden bg-midnight">
            {/* Vignette overlay */}
            <div
              className="absolute inset-0 z-10 pointer-events-none rounded-lg"
              style={{
                boxShadow: 'inset 0 0 80px rgba(0,0,0,0.5)',
              }}
            />

            <div className="aspect-video">
              <video
                ref={videoRef}
                controls={playing}
                preload="metadata"
                playsInline
                className="w-full h-full object-cover"
                onPlay={() => setPlaying(true)}
              >
                <source
                  src="/assets/austin-speaking-sports.mp4"
                  type="video/mp4"
                />
                Your browser does not support the video tag.
              </video>
            </div>

            {/* Custom play button overlay */}
            {!playing && (
              <button
                onClick={handlePlay}
                className="absolute inset-0 z-20 flex items-center justify-center cursor-pointer group/play"
                aria-label="Play video"
              >
                <div className="w-20 h-20 rounded-full bg-burnt-orange/90 flex items-center justify-center group-hover/play:bg-burnt-orange group-hover/play:scale-110 transition-all duration-300 shadow-2xl">
                  <svg viewBox="0 0 24 24" fill="white" className="w-8 h-8 ml-1">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </button>
            )}
          </div>

          {/* Caption */}
          <div className="mt-6 text-center max-w-2xl mx-auto">
            <h3 className="font-sans font-semibold text-base uppercase tracking-wider text-bone mb-2">
              Talking Sports: The Analytical Lens
            </h3>
            <p className="text-bone/70 text-sm leading-relaxed">
              A conversation about how data and scouting instinct intersect — why the best analysis
              isn't about having the most numbers, it's about knowing which numbers matter and
              what they can't tell you.
            </p>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}
