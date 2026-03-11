import { motion } from 'framer-motion';
import { staggerContainer, staggerItem, fadeInRight } from '../utils/animations';

const sidebarFacts = [
  { label: 'Born', value: 'August 17, 1995' },
  { label: 'Birthplace', value: 'Memphis, Tennessee' },
  { label: 'Birth Soil', value: 'West Columbia, TX' },
  { label: 'Family in Texas', value: '127+ years' },
  { label: 'Shares Birthday', value: 'Davy Crockett' },
  { label: 'Named After', value: 'Austin, Texas' },
];

interface PhotoProps {
  src: string;
  srcSet: string;
  alt: string;
}

const originMoments = [
  {
    title: 'The soil came first',
    text:
      'Austin was born in Memphis on August 17, 1995, but his parents brought Texas soil from West Columbia and placed it beneath his mother before he was born. That was not a gesture for a story later. It was a family continuation.',
  },
  {
    title: 'Identity was inherited early',
    text:
      'The doctor reportedly told the family, “You know you ain’t the first to do this, but they’ve ALL been from Texas.” The next day the El Campo Leader-News ran the headline “Tennessee Birth Will Be on Texas Soil.”',
  },
  {
    title: 'Sports culture was native, not added',
    text:
      'Ricky Williams, UT season tickets, youth baseball, Friday night lights, and the Forty Acres all formed the same worldview: Texas was never only geography. It was a standard for how to show up.',
  },
  {
    title: 'BSI came out of lived history',
    text:
      'Blaze Sports Intel was named from Bartlett Blaze, Austin’s dachshund, whose name traces back to his first youth baseball team. The brand was not invented in a vacuum. It was remembered into form.',
  },
];

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

export default function About() {
  return (
    <section
      id="origin"
      aria-labelledby="origin-heading"
      className="section-padding section-border"
      style={{ paddingTop: 'clamp(2rem, 4vw, 3.5rem)' }}
    >
      <div className="container-custom">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          variants={staggerContainer}
        >
          <motion.div variants={staggerItem}>
            <p className="section-label">// The Origin</p>
            <h2 id="origin-heading" className="section-title">
              Born in Memphis. Rooted in Texas Soil.
            </h2>
            <p className="editorial-lead max-w-3xl">
              Texas was never a backdrop. It was the standard behind the family, the sports, the
              identity, and eventually the work.
            </p>
          </motion.div>

          <div className="grid gap-12 lg:grid-cols-[minmax(0,1.35fr)_minmax(300px,0.8fr)]">
            <div className="space-y-10">
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

              <div className="space-y-8">
                {originMoments.map((moment, index) => (
                  <motion.article
                    key={moment.title}
                    variants={staggerItem}
                    className="grid gap-4 border-t border-bone/10 pt-6 md:grid-cols-[4rem_minmax(0,1fr)]"
                  >
                    <div className="font-mono text-xs uppercase tracking-[0.24em] text-burnt-orange/70">
                      {String(index + 1).padStart(2, '0')}
                    </div>
                    <div className="space-y-3">
                      <h3 className="font-sans text-base font-semibold uppercase tracking-[0.18em] text-bone">
                        {moment.title}
                      </h3>
                      <p className="text-base leading-8 text-bone/85">{moment.text}</p>
                    </div>
                  </motion.article>
                ))}
              </div>

              <motion.blockquote
                variants={staggerItem}
                className="border-l border-burnt-orange/40 pl-6 text-xl italic leading-relaxed text-bone/85"
              >
                Texas isn&apos;t a birthplace here. It&apos;s a covenant with family, effort, and
                how you choose to carry yourself when nobody is obligated to care.
              </motion.blockquote>
            </div>

            <motion.div className="lg:col-span-1" variants={fadeInRight}>
              <div className="lg:sticky lg:top-24 space-y-6">
                <div className="card p-6">
                  <h3 className="section-label mb-6">Quick Facts</h3>
                  <div className="space-y-4">
                    {sidebarFacts.map((fact) => (
                      <div key={fact.label} className="flex justify-between items-baseline">
                        <span className="text-sm font-mono text-warm-gray">{fact.label}</span>
                        <span className="text-sm font-semibold text-bone text-right">{fact.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div
                  className="card p-6"
                  style={{
                    background:
                      'linear-gradient(135deg, rgba(191,87,0,0.10) 0%, rgba(139,69,19,0.05) 45%, rgba(26,26,26,0.78) 100%)',
                  }}
                >
                  <p className="text-[0.65rem] font-mono uppercase tracking-[0.22em] text-burnt-orange/80">
                    The Quote
                  </p>
                  <p className="mt-4 text-lg italic leading-relaxed text-bone/85">
                    &ldquo;You may all go to hell, and I will go to Texas.&rdquo;
                  </p>
                  <p className="mt-3 text-xs font-mono text-warm-gray">Davy Crockett, 1835</p>
                </div>

                <div className="card overflow-hidden border border-bone/10">
                  <PhotoCard
                    src="/assets/blaze-dog.jpg"
                    srcSet="/assets/optimized/blaze-dog-640w.webp 640w, /assets/optimized/blaze-dog-1024w.webp 1024w"
                    alt="Bartlett Blaze, the namesake that turned memory into brand"
                  />
                </div>

                <div className="card p-6">
                  <p className="section-label mb-4">Why It Matters</p>
                  <p className="text-sm leading-7 text-bone/75">
                    The portfolio is not organized around a personal myth for its own sake. It is
                    organized around founder-market fit. AustinHumphrey.com works when the origin,
                    the product, and the standards behind both all read as one line.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
