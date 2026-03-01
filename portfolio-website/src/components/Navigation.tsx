import { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useMotionValueEvent, useSpring, AnimatePresence } from 'framer-motion';
import PlatformStatus from './PlatformStatus';

const navItems = [
  { id: 'origin', label: 'Origin' },
  { id: 'experience', label: 'Experience' },
  { id: 'education', label: 'Education' },
  { id: 'bsi', label: 'BSI' },
  { id: 'covenant', label: 'Covenant' },
  { id: 'contact', label: 'Contact' },
];

export default function Navigation() {
  const [activeSection, setActiveSection] = useState('hero');
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress, scrollY } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });

  useMotionValueEvent(scrollY, 'change', (latest) => {
    setScrolled(latest > 50);
  });

  useEffect(() => {
    const sections = document.querySelectorAll('section[id]');
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveSection(entry.target.id);
        });
      },
      { threshold: 0.3, rootMargin: '-80px 0px -60% 0px' }
    );
    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const onResize = () => { if (window.innerWidth >= 768) setMobileOpen(false); };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    if (!mobileOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileOpen(false);
    };
    // Focus first menu link when menu opens
    requestAnimationFrame(() => {
      const firstLink = mobileMenuRef.current?.querySelector('a');
      firstLink?.focus();
    });
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [mobileOpen]);

  return (
    <>
      {/* Scroll progress bar */}
      <motion.div
        aria-hidden="true"
        className="scroll-progress"
        style={{ scaleX }}
      />

      <motion.nav
        aria-label="Main navigation"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: [0.19, 1, 0.22, 1] }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled
            ? 'bg-midnight/90 backdrop-blur-2xl border-b border-bone/5 shadow-lg shadow-black/20'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          {/* Logo + Platform Status */}
          <div className="flex items-center gap-4">
            <a href="#hero" className="flex items-center gap-3 group">
              <div className="w-9 h-9 bg-burnt-orange rounded-full flex items-center justify-center font-sans font-bold text-white text-xs group-hover:scale-110 transition-transform duration-300">
                AH
              </div>
              <span className="font-mono text-sm text-bone/70 hidden sm:block group-hover:text-burnt-orange transition-colors duration-300">
                Austin Humphrey
              </span>
            </a>
            <div className="hidden lg:block">
              <PlatformStatus />
            </div>
          </div>

          {/* Desktop nav */}
          <ul className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <li key={item.id}>
                <a
                  href={`#${item.id}`}
                  aria-current={activeSection === item.id ? 'location' : undefined}
                  className={`relative px-3 py-2 font-sans text-xs uppercase tracking-[0.2em] font-medium transition-colors duration-300 ${
                    activeSection === item.id
                      ? 'text-burnt-orange'
                      : 'text-bone/50 hover:text-bone'
                  }`}
                >
                  {item.label}
                  {activeSection === item.id && (
                    <motion.div
                      layoutId="nav-indicator"
                      className="absolute -bottom-1 left-0 right-0 h-px bg-burnt-orange"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                </a>
              </li>
            ))}
          </ul>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden text-bone/70 hover:text-burnt-orange transition-colors p-2"
            aria-label="Navigation menu"
            aria-expanded={mobileOpen}
          >
            <svg width="20" height="14" viewBox="0 0 20 14" fill="none" xmlns="http://www.w3.org/2000/svg">
              {mobileOpen ? (
                <path d="M1 1L19 13M19 1L1 13" stroke="currentColor" strokeWidth="1.5" />
              ) : (
                <>
                  <path d="M0 1H20" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M0 7H20" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M0 13H20" stroke="currentColor" strokeWidth="1.5" />
                </>
              )}
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              ref={mobileMenuRef}
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.19, 1, 0.22, 1] }}
              className="overflow-hidden md:hidden bg-midnight/95 backdrop-blur-xl border-t border-bone/5"
            >
              <ul className="px-6 py-4 space-y-1">
                {navItems.map((item) => (
                  <li key={item.id}>
                    <a
                      href={`#${item.id}`}
                      onClick={() => setMobileOpen(false)}
                      aria-current={activeSection === item.id ? 'location' : undefined}
                      className={`block px-4 py-3 font-sans text-xs uppercase tracking-[0.2em] rounded transition-colors duration-300 ${
                        activeSection === item.id
                          ? 'text-burnt-orange bg-burnt-orange/10'
                          : 'text-bone/50 hover:text-bone hover:bg-white/5'
                      }`}
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>
    </>
  );
}
