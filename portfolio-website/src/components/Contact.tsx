import { motion } from 'framer-motion';
import { EnvelopeIcon, PhoneIcon, BriefcaseIcon, FireIcon } from '@heroicons/react/24/solid';
import toast from 'react-hot-toast';

export default function Contact() {
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };
  return (
    <section id="contact" aria-labelledby="contact-heading" className="section-padding bg-sand">
      <div className="container-custom">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl mx-auto text-center"
        >
          <h2 id="contact-heading" className="text-4xl md:text-6xl font-bold uppercase tracking-wider text-charcoal mb-6">
            Let's <span className="text-burnt-orange">Connect</span>
          </h2>

          <p className="text-lg md:text-xl text-charcoal/70 mb-12 max-w-2xl mx-auto">
            Whether you're interested in sports analytics, building platforms that serve underserved markets,
            or just want to talk about the philosophy of showing up — I'm always open to good conversations.
          </p>

          <div className="grid md:grid-cols-2 gap-6 mb-12">
            <div
              onClick={() => copyToClipboard('Austin@BlazeSportsIntel.com', 'Email')}
              className="bg-white rounded-lg p-6 shadow-lg hover:shadow-xl hover:scale-105 hover:border-l-8 transition-all duration-300 ease-out-expo border-l-4 border-burnt-orange group cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <div className="text-burnt-orange w-12 h-12 flex items-center justify-center bg-burnt-orange/10 rounded-lg group-hover:scale-110 transition-transform duration-300">
                  <EnvelopeIcon className="w-7 h-7" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-mono uppercase text-charcoal/60">Email</p>
                  <p className="text-lg font-semibold text-charcoal group-hover:text-burnt-orange transition-colors">
                    Austin@BlazeSportsIntel.com
                  </p>
                </div>
              </div>
            </div>

            <div
              onClick={() => copyToClipboard('+1 (210) 273-5538', 'Phone number')}
              className="bg-white rounded-lg p-6 shadow-lg hover:shadow-xl hover:scale-105 hover:border-l-8 transition-all duration-300 ease-out-expo border-l-4 border-burnt-orange group cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <div className="text-burnt-orange w-12 h-12 flex items-center justify-center bg-burnt-orange/10 rounded-lg group-hover:scale-110 transition-transform duration-300">
                  <PhoneIcon className="w-7 h-7" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-mono uppercase text-charcoal/60">Phone</p>
                  <p className="text-lg font-semibold text-charcoal group-hover:text-burnt-orange transition-colors">
                    (210) 273-5538
                  </p>
                </div>
              </div>
            </div>

            <a
              href="https://linkedin.com/in/ahump20"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white rounded-lg p-6 shadow-lg hover:shadow-xl hover:scale-105 hover:border-l-8 transition-all duration-300 ease-out-expo border-l-4 border-burnt-orange group cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <div className="text-burnt-orange w-12 h-12 flex items-center justify-center bg-burnt-orange/10 rounded-lg group-hover:scale-110 transition-transform duration-300">
                  <BriefcaseIcon className="w-7 h-7" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-mono uppercase text-charcoal/60">LinkedIn</p>
                  <p className="text-lg font-semibold text-charcoal group-hover:text-burnt-orange transition-colors">
                    linkedin.com/in/ahump20
                  </p>
                </div>
              </div>
            </a>

            <a
              href="https://blazesportsintel.com"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white rounded-lg p-6 shadow-lg hover:shadow-xl hover:scale-105 hover:border-l-8 transition-all duration-300 ease-out-expo border-l-4 border-burnt-orange group cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <div className="text-burnt-orange w-12 h-12 flex items-center justify-center bg-burnt-orange/10 rounded-lg group-hover:scale-110 transition-transform duration-300">
                  <FireIcon className="w-7 h-7" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-mono uppercase text-charcoal/60">Portfolio</p>
                  <p className="text-lg font-semibold text-charcoal group-hover:text-burnt-orange transition-colors">
                    BlazeSportsIntel.com
                  </p>
                </div>
              </div>
            </a>
          </div>

          <div className="mb-12">
            <p className="text-sm font-mono uppercase text-charcoal/60 mb-2">Based in</p>
            <p className="text-2xl font-bold font-sans text-charcoal">
              San Antonio, <span className="text-burnt-orange">Texas</span>
            </p>
          </div>

          <div className="bg-gradient-to-r from-burnt-orange to-ember rounded-lg p-8 text-white">
            <h3 className="text-2xl font-bold font-sans uppercase mb-4">
              Download Full Resume
            </h3>
            <p className="mb-6 text-white/90">
              Available in multiple formats: HTML, PDF, JPG, PNG — all quality-tested with Playwright
            </p>
            <a
              href="/Austin_Humphrey_Resume_Executive_v2.pdf"
              download
              className="inline-block bg-white text-burnt-orange px-8 py-3 rounded-lg font-sans font-bold uppercase tracking-wider hover:bg-sand transition-colors duration-300"
            >
              Download PDF Resume
            </a>
          </div>

          <div className="mt-16 pt-12 border-t-2 border-burnt-orange/20">
            <div className="grid md:grid-cols-3 gap-8 text-left">
              {/* Column 1: Austin Info */}
              <div>
                <h4 className="text-lg font-sans font-bold uppercase tracking-wider text-burnt-orange mb-3">
                  Austin Humphrey
                </h4>
                <p className="text-base text-charcoal/70 mb-2">
                  Born in Memphis, Tennessee
                </p>
                <p className="text-base text-charcoal/70 mb-2">
                  Rooted in Texas soil
                </p>
                <p className="text-base text-charcoal/70">
                  Building for underserved markets
                </p>
              </div>

              {/* Column 2: Tech Stack */}
              <div>
                <h4 className="text-lg font-sans font-bold uppercase tracking-wider text-burnt-orange mb-3">
                  Built With
                </h4>
                <ul className="space-y-2 text-base text-charcoal/70">
                  <li>React 18 + TypeScript</li>
                  <li>Tailwind CSS + Framer Motion</li>
                  <li>Cloudflare Pages</li>
                  <li>WebP Optimization</li>
                </ul>
              </div>

              {/* Column 3: Philosophy */}
              <div>
                <h4 className="text-lg font-sans font-bold uppercase tracking-wider text-burnt-orange mb-3">
                  Philosophy
                </h4>
                <p className="text-base text-charcoal/70 italic">
                  "It's not where you're from.<br />
                  It's how you show up."
                </p>
                <p className="text-sm font-mono text-charcoal/50 mt-4">
                  © 2025 Austin Humphrey
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
