import { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useMotionValueEvent, useSpring, AnimatePresence } from 'framer-motion';
import { NAV_ITEMS } from '../content/site';

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
    const observed = new Set<Element>();
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveSection(entry.target.id);
        });
      },
      { threshold: 0.3, rootMargin: '-80px 0px -60% 0px' }
    );

    const attach = () => {
      document.querySelectorAll('section[id]').forEach((s) => {
        if (!observed.has(s)) {
          observed.add(s);
          io.observe(s);
        }
      });
    };

    // Attach to existing sections
    attach();

    // Watch for lazy-loaded sections appearing in the DOM
    const mo = new MutationObserver(attach);
    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      io.disconnect();
      mo.disconnect();
    };
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
    requestAnimationFrame(() => {
      const firstLink = mobileMenuRef.current?.querySelector('a');
      firstLink?.focus();
    });
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [mobileOpen]);

  const scrollToSection = (sectionId: string) => {
    const target = document.getElementById(sectionId);
    if (!target) return;

    const nextPath =
      sectionId === 'hero'
        ? '/'
        : sectionId === 'origin'
          ? '/about'
          : sectionId === 'contact'
            ? '/contact'
            : `/#${sectionId}`;
    // Section IDs updated: work, proof, platform, origin, career, contact

    window.history.replaceState(null, '', nextPath);
    const scrollTarget = Math.max(window.scrollY + target.getBoundingClientRect().top - 88, 0);
    const root = document.documentElement;
    const previousScrollBehavior = root.style.scrollBehavior;
    root.style.scrollBehavior = 'auto';
    window.scrollTo({ top: scrollTarget, left: 0, behavior: 'auto' });
    root.style.scrollBehavior = previousScrollBehavior;
    setMobileOpen(false);
  };

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
            ? 'bg-midnight/96 backdrop-blur-md border-b border-burnt-orange/15 shadow-[0_10px_32px_rgba(0,0,0,0.35)]'
            : 'bg-transparent border-b border-transparent'
        }`}
      >
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          {/* Logo */}
          <a
            href="/"
            className="flex items-center gap-3 group"
            onClick={(event) => {
              event.preventDefault();
              scrollToSection('hero');
            }}
          >
            <img
              src="/assets/nana-graduation.jpg"
              alt="Austin Humphrey"
              className="w-9 h-9 rounded-full object-cover [object-position:65%_12%] border-2 border-burnt-orange/60 group-hover:scale-110 group-hover:border-burnt-orange group-hover:shadow-[0_0_16px_rgba(191,87,0,0.4)] transition-all duration-300"
            />
            <span className="font-mono text-sm text-bone/70 hidden sm:block group-hover:text-burnt-orange transition-colors duration-300">
              Austin Humphrey
            </span>
          </a>

          {/* Desktop nav */}
          <ul className="hidden md:flex items-center gap-1">
            {NAV_ITEMS.map((item) => (
              <li key={item.id}>
                <a
                  href={`#${item.id}`}
                  onClick={(event) => {
                    event.preventDefault();
                    scrollToSection(item.id);
                  }}
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
                      className="absolute -bottom-1 left-1 right-1 h-[2px] bg-burnt-orange rounded-full shadow-[0_0_8px_rgba(191,87,0,0.5)]"
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
            className="md:hidden border border-burnt-orange/30 bg-charcoal/90 px-2.5 py-2 text-bone/70 hover:border-burnt-orange hover:text-burnt-orange transition-colors"
            aria-label="Navigation menu"
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav-menu"
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
              id="mobile-nav-menu"
              ref={mobileMenuRef}
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.19, 1, 0.22, 1] }}
              className="overflow-hidden md:hidden bg-midnight/98 backdrop-blur-lg border-t border-burnt-orange/10"
            >
              <ul className="px-6 py-4 space-y-1">
                {NAV_ITEMS.map((item) => (
                  <li key={item.id}>
                    <a
                      href={`#${item.id}`}
                      onClick={(event) => {
                        event.preventDefault();
                        scrollToSection(item.id);
                      }}
                      aria-current={activeSection === item.id ? 'location' : undefined}
                      className={`block px-4 py-3.5 font-sans text-xs uppercase tracking-[0.2em] rounded-sm transition-all duration-300 ${
                        activeSection === item.id
                          ? 'text-burnt-orange bg-burnt-orange/10 border-l-2 border-burnt-orange'
                          : 'text-bone/50 hover:text-bone hover:bg-white/5 border-l-2 border-transparent'
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
