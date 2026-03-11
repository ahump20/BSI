import { lazy, Suspense } from 'react';
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
  return (
    <ErrorBoundary>
    <div className="min-h-screen bg-midnight text-bone">
      <a href="#bsi" className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999] focus:px-4 focus:py-2 focus:bg-burnt-orange focus:text-white focus:rounded focus:font-mono focus:text-xs focus:uppercase focus:tracking-widest">
        Skip to content
      </a>
      <Navigation />
      <Hero />

      {/* Proof: authority first */}
      <BSIShowcase />

      <div className="section-divider" />

      <Projects />

      <div className="section-divider" />

      <Proof />

      {/* Origin narrative — ambient warm glow bridges Proof into the personal story */}
      <div
        className="relative"
        style={{
          background: `
            radial-gradient(ellipse 120% 50% at 15% 20%, rgba(191,87,0,0.04) 0%, transparent 60%),
            radial-gradient(ellipse 80% 40% at 85% 80%, rgba(139,69,19,0.03) 0%, transparent 50%),
            linear-gradient(180deg, var(--surface-deep) 0%, var(--surface-mid) 8%, var(--surface-mid) 92%, var(--surface-deep) 100%)
          `,
        }}
      >
        {/* Top seam — gradient line from Proof into Origin */}
        <div
          className="h-px"
          style={{
            background: 'linear-gradient(90deg, transparent 5%, rgba(191,87,0,0.5) 50%, transparent 95%)',
          }}
        />
        <About />
        <AthleticArc />
      </div>

      <Experience />

      <Education />

      {/* Emotional close */}
      <Philosophy />

      <Contact />
      <Footer />

      <Suspense fallback={null}>
        <AIChatWidget />
      </Suspense>
    </div>
    </ErrorBoundary>
  );
}

export default App;
