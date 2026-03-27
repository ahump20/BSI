import { motion } from 'framer-motion';
import { staggerContainer, staggerItem, fadeInRight } from '../utils/animations';
import { ORIGIN_FACTS, ORIGIN_MOMENTS } from '../content/site';

interface PhotoProps {
  src: string;
  srcSet: string;
  alt: string;
}

function PhotoCard({ src, srcSet, alt }: PhotoProps) {
  return (
    <motion.div
      variants={staggerItem}
      className="group overflow-hidden rounded-sm border border-bone/10 bg-charcoal/40"
    >
      <img
        src={src}
        srcSet={srcSet}
        sizes="(max-width: 640px) 200px, 260px"
        alt={alt}
        loading="lazy"
        decoding="async"
        className="block h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.02]"
      />
      <div className="border-t border-bone/10 px-4 py-3">
        <p className="text-[0.65rem] font-mono uppercase tracking-[0.22em] text-warm-gray/80">{alt}</p>
      </div>
    </motion.div>
  );
}

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
          viewport={{ once: true, amount: 0.05 }}
          variants={staggerContainer}
        >
          <motion.div variants={staggerItem}>
            <p className="section-label">// The Origin</p>
            <h2 id="origin-heading" className="section-title">
              Born in Memphis. Rooted in Texas Soil.
            </h2>
            <p className="editorial-lead max-w-3xl mb-4">
              Texas was never a backdrop. It was the standard behind the family, the sports, the
              identity, and eventually the work.
            </p>
          </motion.div>

          <div className="grid gap-12 lg:grid-cols-[minmax(0,1.35fr)_minmax(300px,0.8fr)]">
            <div className="space-y-10">
              {/* Photos */}
              <motion.div variants={staggerItem} className="grid gap-6 md:grid-cols-2">
                <PhotoCard
                  src="/assets/texas-soil.jpg"
                  srcSet="/assets/optimized/texas-soil-640w.webp 640w, /assets/optimized/texas-soil-1024w.webp 1024w"
                  alt="West Columbia soil, preserved article, and the beginning of the story"
                />
                <PhotoCard
                  src="/assets/young-austin-longhorns.jpg"
                  srcSet="/assets/optimized/young-austin-longhorns-640w.webp 640w, /assets/optimized/young-austin-longhorns-1024w.webp 1024w"
                  alt="Longhorn allegiance started early and never needed explanation"
                />
              </motion.div>

              {/* Origin narrative */}
              <div className="space-y-8">
                {ORIGIN_MOMENTS.map((moment) => (
                  <motion.article
                    key={moment.title}
                    variants={staggerItem}
                    className="border-t border-bone/10 pt-6"
                  >
                    <h3 className="font-sans text-base font-semibold uppercase tracking-[0.18em] text-bone mb-3">
                      {moment.title}
                    </h3>
                    <p className="text-base leading-8 text-bone/85">{moment.text}</p>
                  </motion.article>
                ))}
              </div>

              {/* Covenant accent — closing punchline */}
              <motion.div variants={staggerItem} className="pt-8">
                <p className="font-sans font-bold uppercase tracking-[0.2em] text-xl md:text-2xl">
                  <span className="text-burnt-orange">It&apos;s not where you&apos;re from.</span>
                  <br />
                  <span className="text-bone mt-1 block">It&apos;s how you show up.</span>
                </p>
              </motion.div>
            </div>

            {/* Sidebar */}
            <motion.div className="lg:col-span-1" variants={fadeInRight}>
              <div className="lg:sticky lg:top-24 space-y-6">
                {/* Facts */}
                <div className="card p-6">
                  <h3 className="section-label mb-6">Quick Facts</h3>
                  <div className="space-y-4">
                    {ORIGIN_FACTS.map((fact) => (
                      <div key={fact.label} className="flex justify-between items-baseline">
                        <span className="text-sm font-mono text-warm-gray">{fact.label}</span>
                        <span className="text-sm font-semibold text-bone text-right">{fact.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Davy Crockett quote */}
                <div className="card p-6 about-quote-card">
                  <p className="text-[0.65rem] font-mono uppercase tracking-[0.22em] text-burnt-orange/80">
                    The Quote
                  </p>
                  <p className="mt-4 text-lg italic leading-relaxed text-bone/85">
                    &ldquo;You may all go to hell, and I will go to Texas.&rdquo;
                  </p>
                  <p className="mt-3 text-xs font-mono text-warm-gray">Davy Crockett, 1835</p>
                </div>

                {/* Blaze dog */}
                <div className="card overflow-hidden border border-bone/10">
                  <PhotoCard
                    src="/assets/blaze-dog.jpg"
                    srcSet="/assets/optimized/blaze-dog-640w.webp 640w, /assets/optimized/blaze-dog-1024w.webp 1024w"
                    alt="Bartlett Blaze, the namesake that turned memory into brand"
                  />
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
