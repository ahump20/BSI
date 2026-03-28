import { motion } from 'framer-motion';
import { staggerContainer, staggerItem, SCROLL_VIEWPORT } from '../utils/animations';
import {
  ORIGIN_CHAPTERS,
  ORIGIN_CLOSER,
  ORIGIN_FACTS,
  type OriginPhoto,
} from '../content/site';

// ── Photo Components ────────────────────────────

function DocPhoto({ photo, className = '' }: { photo: OriginPhoto; className?: string }) {
  return (
    <figure className={`group overflow-hidden rounded-sm border border-bone/10 bg-charcoal/30 ${className}`}>
      <img
        src={photo.src}
        srcSet={photo.srcSet}
        sizes={photo.wide ? '(max-width: 768px) 100vw, 66vw' : '(max-width: 768px) 100vw, 50vw'}
        alt={photo.alt}
        loading="lazy"
        decoding="async"
        className="photo-documentary block w-full object-cover group-hover:scale-[1.02]"
      />
      <figcaption className="border-t border-bone/10 px-4 py-3 text-[0.62rem] font-mono uppercase tracking-[0.18em] text-warm-gray/70 leading-relaxed">
        {photo.alt}
      </figcaption>
    </figure>
  );
}

function PhotoGrid({ photos }: { photos: OriginPhoto[] }) {
  // Single wide photo — full span
  if (photos.length === 1 && photos[0].wide) {
    return (
      <motion.div variants={staggerItem}>
        <DocPhoto photo={photos[0]} />
      </motion.div>
    );
  }

  // Single non-wide photo — constrained width
  if (photos.length === 1) {
    return (
      <motion.div variants={staggerItem} className="max-w-lg">
        <DocPhoto photo={photos[0]} />
      </motion.div>
    );
  }

  // Two photos — side by side
  if (photos.length === 2) {
    const hasWide = photos.some((p) => p.wide);
    if (hasWide) {
      return (
        <motion.div variants={staggerItem} className="grid gap-4">
          {photos.map((photo) => (
            <DocPhoto key={photo.src} photo={photo} className={photo.wide ? 'md:col-span-2' : ''} />
          ))}
        </motion.div>
      );
    }
    return (
      <motion.div variants={staggerItem} className="grid gap-4 md:grid-cols-2">
        {photos.map((photo) => (
          <DocPhoto key={photo.src} photo={photo} />
        ))}
      </motion.div>
    );
  }

  // Three photos — first wide (if flagged), rest in 2-col; or 2-col + 1
  const widePhoto = photos.find((p) => p.wide);
  const regularPhotos = photos.filter((p) => !p.wide);

  if (widePhoto) {
    return (
      <div className="space-y-4">
        <motion.div variants={staggerItem}>
          <DocPhoto photo={widePhoto} />
        </motion.div>
        <motion.div variants={staggerItem} className="grid gap-4 md:grid-cols-2">
          {regularPhotos.map((photo) => (
            <DocPhoto key={photo.src} photo={photo} />
          ))}
        </motion.div>
      </div>
    );
  }

  // Default: all in grid
  return (
    <motion.div variants={staggerItem} className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {photos.map((photo) => (
        <DocPhoto key={photo.src} photo={photo} />
      ))}
    </motion.div>
  );
}

// ── Main Component ──────────────────────────────

export default function Origin() {
  return (
    <section
      id="origin"
      aria-labelledby="origin-heading"
      className="section-padding section-border"
    >
      <div className="container-custom">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={SCROLL_VIEWPORT}
          variants={staggerContainer}
        >
          {/* Section header */}
          <motion.div variants={staggerItem} className="max-w-3xl">
            <p className="section-label">Origin</p>
            <h2 id="origin-heading" className="section-title mb-4">
              Born in Memphis. Rooted in Texas Soil.
            </h2>
            <p className="text-base leading-8 text-bone/68 md:text-lg">
              Texas is not decorative background in this story. It is the throughline between family, sports, identity, and the standard behind the work.
            </p>
          </motion.div>

          {/* Documentary chapters — photo narrative flow */}
          <div className="mt-14 space-y-16">
            {ORIGIN_CHAPTERS.map((chapter) => (
              <motion.article
                key={chapter.id}
                initial="hidden"
                whileInView="visible"
                viewport={SCROLL_VIEWPORT}
                variants={staggerContainer}
                className="space-y-6"
              >
                {/* Chapter label */}
                <motion.p variants={staggerItem} className="chapter-label">{chapter.label}</motion.p>

                {/* Narrative text — editorial lead style */}
                {chapter.narrative && (
                  <motion.p variants={staggerItem} className="editorial-lead max-w-2xl">
                    {chapter.narrative}
                  </motion.p>
                )}

                {/* Photo grid — layout adapts to photo count and flags */}
                <PhotoGrid photos={chapter.photos} />
              </motion.article>
            ))}
          </div>

          {/* Quick facts — floating element after the documentary */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={SCROLL_VIEWPORT}
            variants={staggerContainer}
            className="mt-16 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(260px,0.4fr)]"
          >
            <motion.div variants={staggerItem} className="space-y-8">
              {/* Closing blockquote */}
              <blockquote className="border-l-2 border-burnt-orange/40 pl-6 text-xl italic leading-relaxed text-bone/84">
                Texas is not a birthplace here. It is the standard behind how you carry effort, loyalty, and memory.
              </blockquote>

              {/* Closer — the punchline */}
              <p className="font-sans text-xl font-bold uppercase tracking-[0.18em] text-bone md:text-2xl">
                <span className="text-burnt-orange">{ORIGIN_CLOSER.split('. ')[0]}.</span>
                <br />
                <span className="mt-2 block">{ORIGIN_CLOSER.split('. ')[1]}</span>
              </p>
            </motion.div>

            {/* Sidebar — portrait, facts, and the Crockett quote */}
            <motion.aside variants={staggerItem} className="space-y-5">
              {/* Portrait */}
              <figure className="overflow-hidden rounded-sm border border-bone/10 bg-charcoal/30">
                <picture>
                  <source
                    srcSet="/assets/optimized/nana-graduation-640w.webp 640w, /assets/optimized/nana-graduation-1024w.webp 1024w"
                    sizes="(max-width: 1024px) 100vw, 260px"
                    type="image/webp"
                  />
                  <img
                    src="/assets/nana-graduation.jpg"
                    alt="Austin with his grandmother"
                    loading="lazy"
                    decoding="async"
                    className="w-full max-h-[320px] object-cover [object-position:50%_12%] photo-documentary"
                  />
                </picture>
                <figcaption className="border-t border-bone/10 px-4 py-3 text-[0.62rem] font-mono uppercase tracking-[0.18em] text-warm-gray/70">
                  Austin with his grandmother
                </figcaption>
              </figure>

              <div className="rounded-sm border border-bone/8 bg-charcoal/18 p-6">
                <h3 className="font-mono text-[0.64rem] uppercase tracking-[0.24em] text-burnt-orange/82">
                  Quick Facts
                </h3>
                <div className="mt-5 space-y-4">
                  {ORIGIN_FACTS.map((fact) => (
                    <div key={fact.label} className="flex items-baseline justify-between gap-4">
                      <span className="text-sm font-mono text-warm-gray">{fact.label}</span>
                      <span className="text-sm font-semibold text-bone text-right">{fact.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-sm border border-bone/8 bg-charcoal/20 p-6">
                <p className="font-mono text-[0.64rem] uppercase tracking-[0.24em] text-burnt-orange/82">
                  The Quote
                </p>
                <p className="mt-4 text-lg italic leading-relaxed text-bone/84">
                  &ldquo;You may all go to hell, and I will go to Texas.&rdquo;
                </p>
                <p className="mt-3 text-xs font-mono text-warm-gray/72">Davy Crockett, 1835</p>
              </div>
            </motion.aside>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
