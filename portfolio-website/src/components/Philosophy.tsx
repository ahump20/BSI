import { motion } from 'framer-motion';

export default function Philosophy() {
  return (
    <section id="philosophy" aria-labelledby="philosophy-heading" className="section-padding bg-gradient-to-br from-charcoal via-midnight to-charcoal text-white relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-burnt-orange/5 via-transparent to-texas-soil/5" />

      <div className="container-custom relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl mx-auto"
        >
          <h2 id="philosophy-heading" className="sr-only">Philosophy</h2>
          <blockquote className="text-center mb-16">
            <p className="text-3xl md:text-5xl font-serif italic text-sand/90 leading-relaxed mb-6">
              "I have said that Texas is a state of mind."
            </p>
            <footer className="text-lg font-mono text-burnt-orange">
              — John Steinbeck
            </footer>
          </blockquote>

          <div className="space-y-8 text-lg md:text-xl leading-relaxed text-sand/90">
            <p>
              For me, personally, I believe <strong className="text-burnt-orange">Texas is how you choose to treat the best and worst of us</strong>.
              It's a covenant with oneself and the company one keeps, to never stop dreaming beyond the horizon,
              regardless of race, ethnicity, religion, or even birth soil.
            </p>

            <p>
              Texas is a <strong className="text-burnt-orange">home</strong>,
              a <strong className="text-burnt-orange">family</strong>,
              and a <strong className="text-burnt-orange">philosophy</strong>.
            </p>

            <p className="text-center text-2xl md:text-3xl font-sans font-bold uppercase tracking-wider text-burnt-orange my-12">
              It's not where you're from.
              <br />
              It's how you show up.
            </p>

            <div className="border-l-4 border-burnt-orange pl-6 py-4 bg-white/5 rounded-r-lg">
              <p className="italic">
                This philosophy shapes everything I build — from sports analytics platforms that serve
                underserved markets to the discipline of showing up for every pitch, every commit, every conversation.
              </p>
              <p className="mt-4 italic">
                Blaze Sports Intel exists because mainstream coverage treats geography as destiny.
                I build for the programs, athletes, and fans who refuse to accept that premise.
              </p>
            </div>

            <p className="text-center text-sm font-mono text-sand/60 mt-12 pt-8 border-t border-burnt-orange/30">
              P.S. — Yes, I still have the Texas soil and newspaper article on my birth to this day.
            </p>
          </div>
        </motion.div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-burnt-orange via-ember to-burnt-orange" />
    </section>
  );
}
