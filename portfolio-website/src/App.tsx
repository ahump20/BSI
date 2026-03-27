import { lazy, Suspense, useEffect } from 'react';
import Navigation from './components/Navigation';
import Hero from './components/Hero';
import Projects from './components/Projects';
import Proof from './components/Proof';
import PlatformDepth from './components/PlatformDepth';
import Origin from './components/Origin';
import Career from './components/Career';
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
          <Projects />
          <Proof />
          <PlatformDepth />
          <Origin />
          <Career />
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
