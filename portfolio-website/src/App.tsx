import { lazy, Suspense } from 'react';
import Navigation from './components/Navigation';
import Hero from './components/Hero';
import About from './components/About';
import Experience from './components/Experience';
import Education from './components/Education';
import BSIShowcase from './components/BSIShowcase';
import Projects from './components/Projects';
import Writing from './components/Writing';
import AIFeatures from './components/AIFeatures';
import MediaShowcase from './components/MediaShowcase';
import Podcast from './components/Podcast';
import Philosophy from './components/Philosophy';
import Contact from './components/Contact';
import Footer from './components/Footer';
import AthleticArc from './components/AthleticArc';

const AIChatWidget = lazy(() => import('./components/AIChatWidget'));

function App() {
  return (
    <div className="min-h-screen bg-midnight text-bone">
      <a href="#origin" className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999] focus:px-4 focus:py-2 focus:bg-burnt-orange focus:text-white focus:rounded focus:font-mono focus:text-xs focus:uppercase focus:tracking-widest">
        Skip to content
      </a>
      <Navigation />
      <Hero />

      {/* Origin + Experience: subtle mesh background */}
      <div style={{
        background: 'radial-gradient(ellipse 100% 60% at 20% 30%, rgba(191,87,0,0.02) 0%, transparent 50%)',
      }}>
        <About />
        <AthleticArc />
        <Experience />
      </div>

      <Education />

      {/* BSI section has its own background gradient */}
      <BSIShowcase />

      <div style={{
        background: 'radial-gradient(ellipse 80% 60% at 80% 40%, rgba(139,69,19,0.02) 0%, transparent 50%)',
      }}>
        <Projects />
        <Writing />
      </div>

      <AIFeatures />
      <MediaShowcase />
      <Podcast />

      {/* Philosophy section has its own subtle radial */}
      <Philosophy />

      <Contact />
      <Footer />

      <Suspense fallback={null}>
        <AIChatWidget />
      </Suspense>
    </div>
  );
}

export default App;
