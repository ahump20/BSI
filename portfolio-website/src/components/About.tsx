import { motion } from 'framer-motion';
import OptimizedImage from './OptimizedImage';

export default function About() {
  return (
    <section id="about" aria-labelledby="about-heading" className="section-padding bg-white">
      <div className="container-custom">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <h2 id="about-heading" className="text-4xl md:text-6xl font-bold uppercase tracking-wider text-charcoal mb-4">
            Born in <span className="text-burnt-orange">Memphis</span>.
            <br />
            Rooted in <span className="text-texas-soil">Texas Soil</span>.
          </h2>

          <div className="grid md:grid-cols-2 gap-12 mt-12">
            <div className="space-y-6">
              <p className="text-lg leading-relaxed">
                On <strong>August 17, 1995</strong>, I was born in Memphis, Tennessee — the same day
                as <strong>Davy Crockett</strong>, the legendary folk hero who famously declared
                "You may all go to hell, and I will go to Texas" before defending the Alamo.
              </p>

              <p className="text-lg leading-relaxed">
                But my parents had a plan. They brought <strong className="text-burnt-orange">Texas soil</strong> from
                <strong> West Columbia</strong> — the birthplace of the Republic of Texas,
                where the first capital stood and Stephen F. Austin's vision took root.
                That soil was placed beneath my mother before I was born.
              </p>

              <p className="text-lg leading-relaxed text-charcoal/80 border-l-4 border-burnt-orange pl-4 italic">
                The doctor looked at my parents and said:<br />
                <span className="text-burnt-orange font-semibold">
                  "You know you ain't the first to do this, but they've ALL been from Texas."
                </span>
              </p>

              <p className="text-lg leading-relaxed">
                The next day, the <strong>El Campo Leader-News</strong> ran the headline:
                <br />
                <span className="font-sans font-bold text-burnt-orange uppercase">
                  "Tennessee Birth Will Be on Texas Soil"
                </span>
              </p>

              <p className="text-lg leading-relaxed">
                That Texas soil still sits in my home today. Not as nostalgia — as a <strong>covenant</strong>.
                A reminder that where you're from matters less than how you choose to show up for the people around you.
              </p>
            </div>

            <div className="space-y-6">
              <div className="bg-sand rounded-lg overflow-hidden shadow-xl">
                <OptimizedImage
                  src="/assets/texas-soil.jpg"
                  alt="Original Texas soil in ziplock bag with Texas patch from West Columbia"
                  className="w-full h-64 object-cover"
                />
                <div className="p-4">
                  <p className="text-sm font-mono text-charcoal/70">
                    The original Texas soil from West Columbia, birthplace of the Republic
                  </p>
                </div>
              </div>

              <div className="bg-sand rounded-lg overflow-hidden shadow-xl">
                <OptimizedImage
                  src="/assets/birth-article.jpg"
                  alt="El Campo Leader-News article: Tennessee birth will be on Texas soil"
                  className="w-full h-64 object-cover"
                />
                <div className="p-4">
                  <p className="text-sm font-mono text-charcoal/70">
                    El Campo Leader-News, August 18, 1995
                  </p>
                </div>
              </div>

              <div className="bg-sand rounded-lg overflow-hidden shadow-xl">
                <OptimizedImage
                  src="/assets/birth-certificate.jpg"
                  alt="Tennessee birth certificate - August 17, 1995, Memphis"
                  className="w-full h-64 object-cover"
                />
                <div className="p-4">
                  <p className="text-sm font-mono text-charcoal/70">
                    Born August 17, 1995 — Memphis, Tennessee
                  </p>
                </div>
              </div>

              <div className="bg-sand rounded-lg overflow-hidden shadow-xl">
                <OptimizedImage
                  src="/assets/young-austin-longhorns.jpg"
                  alt="Young Austin in burnt orange Texas Longhorns shirt"
                  className="w-full h-64 object-cover"
                />
                <div className="p-4">
                  <p className="text-sm font-mono text-charcoal/70">
                    Born in Memphis, raised on Texas tradition
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
