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
  rotate?: string;
}

function PhotoCard({ src, srcSet, alt, rotate = '2deg' }: PhotoProps) {
  return (
    <motion.div
      variants={staggerItem}
      className="photo-card inline-block my-6"
      style={{ transform: `rotate(${rotate})`, maxWidth: '260px' }}
    >
      <img
        src={src}
        srcSet={srcSet}
        sizes="(max-width: 640px) 200px, 260px"
        alt={alt}
        loading="lazy"
        className="w-full h-auto block"
      />
      <p className="text-xs text-charcoal/70 text-center mt-1 font-serif italic">{alt}</p>
    </motion.div>
  );
}

export default function About() {
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
          viewport={{ once: true, margin: '-80px' }}
          variants={staggerContainer}
        >
          <motion.div variants={staggerItem}>
            <p className="section-label">// The Origin</p>
            <h2 id="origin-heading" className="section-title">
              Born in Memphis. Rooted in Texas Soil.
            </h2>
          </motion.div>

          <div className="grid lg:grid-cols-3 gap-12">
            {/* Narrative column with interspersed photos */}
            <div className="lg:col-span-2 space-y-6 text-bone/90 text-lg leading-relaxed">
              <motion.div variants={staggerItem}>
                <p>
                  On <strong className="text-bone">August 17, 1995</strong>, I was born in Memphis,
                  Tennessee — the same day as <strong className="text-bone">Davy Crockett</strong>.
                  "You may all go to hell, and I will go to Texas." That energy was in the room.
                </p>
              </motion.div>

              <motion.div variants={staggerItem} className="flex justify-center lg:justify-start">
                <PhotoCard
                  src="/assets/titans-halloween.jpg"
                  srcSet="/assets/optimized/titans-halloween-640w.webp 640w, /assets/optimized/titans-halloween-1024w.webp 1024w"
                  alt="Halloween in Memphis — a Titan before a Texan"
                  rotate="2deg"
                />
              </motion.div>

              <motion.div variants={staggerItem} className="flex justify-center lg:justify-end">
                <PhotoCard
                  src="/assets/birth-certificate.jpg"
                  srcSet="/assets/optimized/birth-certificate-640w.webp 640w, /assets/optimized/birth-certificate-1024w.webp 1024w"
                  alt="Birth certificate"
                  rotate="-1.5deg"
                />
              </motion.div>

              <motion.div variants={staggerItem}>
                <p>
                  But my parents had a plan. They brought{' '}
                  <strong className="text-burnt-orange">Texas soil</strong> from{' '}
                  <strong className="text-bone">West Columbia</strong> — birthplace
                  of the Republic of Texas. That soil was placed beneath my mother before I was born.
                </p>
              </motion.div>

              <motion.div variants={staggerItem}>
                <blockquote className="border-l-2 border-burnt-orange pl-6 py-4 my-8 text-warm-gray italic text-xl">
                  The doctor looked at my parents and said:
                  <br />
                  <span className="text-burnt-orange font-semibold not-italic">
                    "You know you ain't the first to do this, but they've ALL been from Texas."
                  </span>
                </blockquote>
              </motion.div>

              <motion.div variants={staggerItem}>
                <p>
                  The next day, the <strong className="text-bone">El Campo Leader-News</strong> ran the headline:{' '}
                  <span className="font-sans font-bold text-burnt-orange uppercase text-base tracking-wider">
                    "Tennessee Birth Will Be on Texas Soil"
                  </span>
                </p>
              </motion.div>

              <motion.div variants={staggerItem} className="flex justify-center lg:justify-start">
                <PhotoCard
                  src="/assets/texas-soil.jpg"
                  srcSet="/assets/optimized/texas-soil-640w.webp 640w, /assets/optimized/texas-soil-1024w.webp 1024w"
                  alt="The article and the soil — West Columbia, TX"
                  rotate="-2deg"
                />
              </motion.div>

              <motion.div variants={staggerItem}>
                <p>
                  My grandfather <strong className="text-bone">Bill</strong> served in World War II,
                  then came home and put down roots running banks in{' '}
                  <strong className="text-bone">El Campo, Texas</strong>. My <strong className="text-bone">Nana</strong> moved
                  in with our family when I was eight — she's been there for over 20 years. My family has been
                  in Texas for over <strong className="text-burnt-orange">127 years</strong>. The soil wasn't
                  a stunt — it was a continuation.
                </p>
              </motion.div>

              <motion.div variants={staggerItem} className="flex justify-center lg:justify-start">
                <PhotoCard
                  src="/assets/nana-graduation.jpg"
                  srcSet="/assets/optimized/nana-graduation-640w.webp 640w, /assets/optimized/nana-graduation-1024w.webp 1024w"
                  alt="With Nana — UT graduation party"
                  rotate="-2deg"
                />
              </motion.div>

              <motion.div variants={staggerItem} className="flex justify-center lg:justify-end">
                <PhotoCard
                  src="/assets/baseball-with-father.jpg"
                  srcSet="/assets/optimized/baseball-with-father-640w.webp 640w, /assets/optimized/baseball-with-father-1024w.webp 1024w"
                  alt="Baseball with Dad"
                  rotate="1.5deg"
                />
              </motion.div>

              <motion.div variants={staggerItem}>
                <p>
                  In <strong className="text-bone">1998</strong>, I watched{' '}
                  <strong className="text-bone">Ricky Williams</strong> break the NCAA rushing record
                  in burnt orange. My family held UT season tickets for over 40 years.
                  Texas was never just geography — it was identity.
                </p>
              </motion.div>

              <motion.div variants={staggerItem} className="flex justify-center lg:justify-start">
                <PhotoCard
                  src="/assets/football-uniform.jpg"
                  srcSet="/assets/optimized/football-uniform-640w.webp 640w, /assets/optimized/football-uniform-1024w.webp 1024w"
                  alt="Young Austin in football uniform"
                  rotate="-1deg"
                />
              </motion.div>

              <motion.div variants={staggerItem}>
                <p>
                  The name <strong className="text-burnt-orange">Blaze Sports Intel</strong> comes
                  from my dachshund, <strong className="text-bone">Bartlett Blaze</strong> — who was
                  named after my first baseball team, the Bartlett Blaze from youth ball.
                  It is not corporate branding — it is lived history.
                </p>
              </motion.div>

              <motion.div variants={staggerItem} className="flex justify-center lg:justify-end">
                <PhotoCard
                  src="/assets/blaze-dog.jpg"
                  srcSet="/assets/optimized/blaze-dog-640w.webp 640w, /assets/optimized/blaze-dog-1024w.webp 1024w"
                  alt="Bartlett Blaze — the namesake"
                  rotate="2deg"
                />
              </motion.div>

              <motion.div variants={staggerItem}>
                <p>
                  That Texas soil still sits in my home today. Not as nostalgia — as
                  a <strong className="text-burnt-orange">covenant</strong>. A reminder that where
                  you're from matters less than how you choose to show up.
                </p>
              </motion.div>
            </div>

            {/* Sidebar facts — sticky on desktop */}
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
                    background: 'linear-gradient(135deg, rgba(191,87,0,0.06) 0%, rgba(139,69,19,0.04) 50%, rgba(26,26,26,0.6) 100%)',
                  }}
                >
                  <p className="text-sm italic text-warm-gray leading-relaxed">
                    "You may all go to hell, and I will go to Texas."
                  </p>
                  <p className="text-xs font-mono text-burnt-orange mt-3">— Davy Crockett, 1835</p>
                </div>

                <div className="flex justify-center">
                  <PhotoCard
                    src="/assets/young-austin-longhorns.jpg"
                    srcSet="/assets/optimized/young-austin-longhorns-640w.webp 640w, /assets/optimized/young-austin-longhorns-1024w.webp 1024w"
                    alt="Young Austin — Longhorn from day one"
                    rotate="-2.5deg"
                  />
                </div>

                <div className="flex justify-center">
                  <PhotoCard
                    src="/assets/ballpark-kids.jpg"
                    srcSet="/assets/optimized/ballpark-kids-640w.webp 640w, /assets/optimized/ballpark-kids-1024w.webp 1024w"
                    alt="At the ballpark"
                    rotate="1.5deg"
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
