import { lazy, Suspense, useEffect } from 'react';
import ErrorBoundary from './components/ErrorBoundary';
import Navigation from './components/Navigation';
import Hero from './components/Hero';
import BSIShowcase from './components/BSIShowcase';
import Projects from './components/Projects';
import Proof from './components/Proof';
import About from './components/About';
import AthleticArc from './components/AthleticArc';
import Experience from './components/Experience';
import Education from './components/Education';
import Philosophy from './components/Philosophy';
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
    <ErrorBoundary>
      <div className="min-h-screen bg-midnight text-bone">
        <a href="#main" className="skip-link">
        Skip to content
        </a>
        <Navigation />
        <main id="main" className="main-content" tabIndex={-1}>
          <Hero />

          {/* Proof: authority first */}
          <BSIShowcase />

          <div className="section-divider" />

          <Projects />

          <div className="section-divider" />

          <Proof />

          {/* Origin narrative — warm seam from authority into biography */}
          <div className="origin-bridge-shell">
            <div className="section-seam" />
            <About />
            <AthleticArc />
          </div>

          <Experience />

          <Education />

          {/* Emotional close */}
          <Philosophy />

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
