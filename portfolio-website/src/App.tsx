import { lazy, Suspense, useCallback, useEffect } from 'react';
import Navigation from './components/Navigation';
import Hero from './components/Hero';
import Work from './components/Work';
import Proof from './components/Proof';
import Origin from './components/Origin';
import Contact from './components/Contact';
import Footer from './components/Footer';
import ErrorBoundary from './components/ErrorBoundary';

const AIChatWidget = lazy(() => import('./components/AIChatWidget'));

function PhotoBreak({
  srcSet,
  fallback,
  alt,
  height = 'clamp(140px, 22vw, 280px)',
  objectPosition,
}: {
  srcSet: string;
  fallback: string;
  alt: string;
  height?: string;
  objectPosition?: string;
}) {
  return (
    <div
      className="photo-break-parallax relative w-full overflow-hidden"
      style={{ height }}
      aria-hidden="true"
    >
      <picture className="absolute inset-0">
        <source srcSet={srcSet} sizes="100vw" type="image/webp" />
        <img
          src={fallback}
          alt={alt}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover"
          style={objectPosition ? { objectPosition } : undefined}
        />
      </picture>
      <div className="absolute inset-0 bg-gradient-to-b from-midnight/50 via-transparent to-midnight/50" />
    </div>
  );
}

const SECTION_ORDER = ['hero', 'work', 'proof', 'origin', 'contact'] as const;

function App() {
  // Route-based scroll on initial load
  useEffect(() => {
    const routeToSection: Record<string, string> = {
      '/': 'hero',
      '/work': 'work',
      '/about': 'origin',
      '/contact': 'contact',
    };

    const targetSectionId = routeToSection[window.location.pathname];
    if (!targetSectionId) return;

    const scrollToTarget = () => {
      const target = document.getElementById(targetSectionId);
      if (target) {
        target.scrollIntoView({ behavior: 'auto', block: 'start' });
      }
    };

    requestAnimationFrame(scrollToTarget);
  }, []);

  // Keyboard section navigation — j/k or arrows when not in an input
  const handleKeyNav = useCallback((e: KeyboardEvent) => {
    const tag = (e.target as HTMLElement).tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

    const isNext = e.key === 'j' || e.key === 'ArrowDown';
    const isPrev = e.key === 'k' || e.key === 'ArrowUp';
    if (!isNext && !isPrev) return;

    // Find current section based on scroll position
    const viewportMid = window.scrollY + window.innerHeight / 3;
    let currentIdx = 0;
    for (let i = SECTION_ORDER.length - 1; i >= 0; i--) {
      const el = document.getElementById(SECTION_ORDER[i]);
      if (el && el.offsetTop <= viewportMid) {
        currentIdx = i;
        break;
      }
    }

    const nextIdx = isNext
      ? Math.min(currentIdx + 1, SECTION_ORDER.length - 1)
      : Math.max(currentIdx - 1, 0);

    if (nextIdx === currentIdx) return;

    e.preventDefault();
    const target = document.getElementById(SECTION_ORDER[nextIdx]);
    if (target) {
      const offset = Math.max(target.getBoundingClientRect().top + window.scrollY - 88, 0);
      window.scrollTo({ top: offset, behavior: 'smooth' });
    }
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyNav);
    return () => window.removeEventListener('keydown', handleKeyNav);
  }, [handleKeyNav]);

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-midnight text-bone">
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <Navigation />
        <main id="main" className="main-content" tabIndex={-1}>
          <Hero />
          <Work />

          {/* Cinematic photo break — rhythm shift before proof */}
          <PhotoBreak
            srcSet="/assets/optimized/running-vs-tivy-640w.webp 640w, /assets/optimized/running-vs-tivy-1024w.webp 1024w"
            fallback="/assets/running-vs-tivy.jpg"
            alt=""
          />

          <Proof />

          {/* Photo break — Austin with Blaze, the dog that named the brand */}
          <PhotoBreak
            srcSet="/assets/optimized/blaze-dog-640w.webp 640w, /assets/optimized/blaze-dog-1024w.webp 1024w, /assets/optimized/blaze-dog-1920w.webp 1920w"
            fallback="/assets/blaze-dog.jpg"
            alt=""
            height="clamp(160px, 25vw, 320px)"
            objectPosition="50% 25%"
          />

          <Origin />
          <Contact />
        </main>
        <Footer />

        <Suspense fallback={null}>
          <AIChatWidget />
        </Suspense>
      </div>
    </ErrorBoundary>
  );
}

export default App;
