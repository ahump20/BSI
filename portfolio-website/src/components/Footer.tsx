import { motion } from 'framer-motion';
import { staggerContainer, staggerItem, SCROLL_VIEWPORT } from '../utils/animations';
import { CREDENTIALS, FOOTER_LINK_GROUPS, PRIMARY_EMAIL, RESUME_PATH, SITE_LOCATION, SITE_TAGLINE } from '../content/site';

function BackToTop() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    window.history.replaceState(null, '', '/');
  };

  return (
    <button
      onClick={scrollToTop}
      className="group inline-flex items-center gap-2 font-mono text-[0.6rem] uppercase tracking-[0.2em] text-warm-gray/50 transition-colors duration-300 hover:text-burnt-orange"
      aria-label="Back to top"
    >
      <svg className="h-3 w-3 transition-transform duration-300 group-hover:-translate-y-0.5" viewBox="0 0 12 12" fill="none">
        <path d="M6 10V2M6 2L2 6M6 2L10 6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      Top
    </button>
  );
}

export default function Footer() {
  return (
    <footer className="border-t border-bone/5 footer-bg">
      <div className="mx-auto max-w-5xl px-6 py-14 md:px-12 md:py-16 lg:px-16">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={SCROLL_VIEWPORT}
          variants={staggerContainer}
        >
          <div className="grid gap-10 md:grid-cols-[repeat(3,minmax(0,1fr))_minmax(0,0.9fr)]">
            {FOOTER_LINK_GROUPS.map((group) => (
              <motion.div key={group.title} variants={staggerItem}>
                <p className="font-mono text-[0.64rem] uppercase tracking-[0.24em] text-burnt-orange/82">
                  {group.title}
                </p>
                <ul className="mt-5 space-y-3">
                  {group.links.map((link) => {
                    const isExternal = 'external' in link && Boolean(link.external);
                    return (
                      <li key={link.label}>
                        <a
                          href={link.href}
                          target={isExternal ? '_blank' : undefined}
                          rel={isExternal ? 'noopener noreferrer' : undefined}
                          className="footer-link text-sm text-warm-gray transition-colors duration-300 hover:text-burnt-orange"
                        >
                          {link.label}
                        </a>
                      </li>
                    );
                  })}
                </ul>
              </motion.div>
            ))}

            <motion.div variants={staggerItem}>
              <p className="font-mono text-[0.64rem] uppercase tracking-[0.24em] text-burnt-orange/82">
                Info
              </p>
              <ul className="mt-5 space-y-3 text-sm text-warm-gray">
                <li>{SITE_LOCATION}</li>
                <li>
                  <a href={RESUME_PATH} download className="footer-link transition-colors duration-300 hover:text-burnt-orange">
                    Download Resume
                  </a>
                </li>
                <li className="break-all">{PRIMARY_EMAIL}</li>
              </ul>
            </motion.div>
          </div>

          {/* Credentials line */}
          <motion.div variants={staggerItem} className="mt-10 border-t border-bone/5 pt-6">
            <p className="font-mono text-[0.58rem] uppercase tracking-[0.18em] text-warm-gray/50">
              {CREDENTIALS}
            </p>
          </motion.div>

          <motion.div variants={staggerItem} className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-baseline sm:justify-between">
            <p className="font-sans text-sm font-medium uppercase tracking-[0.18em] text-burnt-orange/75">
              {SITE_TAGLINE}
            </p>
            <div className="flex items-center gap-6">
              <BackToTop />
              <p className="text-sm font-mono text-warm-gray/58">
                &copy; {new Date().getFullYear()} Austin Humphrey
              </p>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </footer>
  );
}
