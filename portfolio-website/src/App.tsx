import { lazy, Suspense, useEffect } from 'react';
import Navigation from './components/Navigation';
import Hero from './components/Hero';
import Work from './components/Work';
import Proof from './components/Proof';
import Origin from './components/Origin';
import Contact from './components/Contact';
import Footer from './components/Footer';

const AIChatWidget = lazy(() => import('./components/AIChatWidget'));

function App() {
  useEffect(() => {
    const routeToSection: Record<string, string> = {
      '/': 'hero',
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

  return (
    <div className="min-h-screen bg-midnight text-bone">
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <Navigation />
      <main id="main" className="main-content" tabIndex={-1}>
        <Hero />
        <Work />

        {/* Cinematic photo break — rhythm shift before proof */}
        <div
          className="relative w-full overflow-hidden"
          style={{ height: 'clamp(140px, 22vw, 280px)' }}
          aria-hidden="true"
        >
          <picture className="absolute inset-0">
            <source
              srcSet="/assets/optimized/running-vs-tivy-640w.webp 640w, /assets/optimized/running-vs-tivy-1024w.webp 1024w"
              sizes="100vw"
              type="image/webp"
            />
            <img
              src="/assets/running-vs-tivy.jpg"
              alt=""
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover"
            />
          </picture>
          <div className="absolute inset-0 bg-gradient-to-b from-midnight/50 via-transparent to-midnight/50" />
        </div>

        <Proof />
        <Origin />
        <Contact />
      </main>
      <Footer />

      <Suspense fallback={null}>
        <AIChatWidget />
      </Suspense>
    </div>
  );
}

export default App;
