import { useState, useEffect, useCallback } from 'react';
import { NAV_ITEMS } from '../content/site';

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /* Lock body scroll when mobile menu is open */
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  const scrollTo = useCallback((id: string) => {
    setMenuOpen(false);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  }, []);

  return (
    <nav
      className="fixed top-0 inset-x-0 z-50 transition-colors duration-300"
      style={{
        backgroundColor: scrolled ? 'rgba(13,13,13,0.92)' : 'transparent',
        backdropFilter: scrolled ? 'blur(8px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(245,240,235,0.04)' : 'none',
      }}
    >
      <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-4">
        {/* Logo / name */}
        <button
          onClick={() => scrollTo('hero')}
          className="font-mono text-[10px] tracking-[0.25em] uppercase"
          style={{ color: 'var(--color-accent)' }}
        >
          Austin Humphrey
        </button>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-6">
          {NAV_ITEMS.filter(i => i.id !== 'hero').map(item => (
            <button
              key={item.id}
              onClick={() => scrollTo(item.id)}
              className="font-mono text-[10px] tracking-[0.15em] uppercase transition-colors duration-200 hover:text-[var(--color-accent)]"
              style={{ color: 'var(--color-text-muted)' }}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden flex flex-col gap-[5px] p-2"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
        >
          <span
            className="block w-5 h-[1.5px] transition-all duration-300 origin-center"
            style={{
              backgroundColor: 'var(--color-text)',
              transform: menuOpen ? 'rotate(45deg) translate(2px, 2px)' : 'none',
            }}
          />
          <span
            className="block w-5 h-[1.5px] transition-opacity duration-200"
            style={{
              backgroundColor: 'var(--color-text)',
              opacity: menuOpen ? 0 : 1,
            }}
          />
          <span
            className="block w-5 h-[1.5px] transition-all duration-300 origin-center"
            style={{
              backgroundColor: 'var(--color-text)',
              transform: menuOpen ? 'rotate(-45deg) translate(2px, -2px)' : 'none',
            }}
          />
        </button>
      </div>

      {/* Mobile overlay */}
      <div
        className="md:hidden fixed inset-0 top-[56px] transition-all duration-300 flex flex-col items-center justify-center gap-8"
        style={{
          backgroundColor: 'rgba(13,13,13,0.97)',
          opacity: menuOpen ? 1 : 0,
          pointerEvents: menuOpen ? 'auto' : 'none',
        }}
      >
        {NAV_ITEMS.map(item => (
          <button
            key={item.id}
            onClick={() => scrollTo(item.id)}
            className="font-sans text-lg uppercase tracking-widest transition-colors duration-200 hover:text-[var(--color-accent)]"
            style={{ color: 'var(--color-text)' }}
          >
            {item.label}
          </button>
        ))}
      </div>
    </nav>
  );
}
