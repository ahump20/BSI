import { lazy, Suspense } from 'react';
import Navigation from './components/Navigation';
import Hero from './components/Hero';

const About = lazy(() => import('./components/About'));
const AthleticArc = lazy(() => import('./components/AthleticArc'));
const Experience = lazy(() => import('./components/Experience'));
const Education = lazy(() => import('./components/Education'));
const BSIShowcase = lazy(() => import('./components/BSIShowcase'));
const Projects = lazy(() => import('./components/Projects'));
const Writing = lazy(() => import('./components/Writing'));
const AIFeatures = lazy(() => import('./components/AIFeatures'));
const MediaShowcase = lazy(() => import('./components/MediaShowcase'));
const Podcast = lazy(() => import('./components/Podcast'));
const Philosophy = lazy(() => import('./components/Philosophy'));
const Contact = lazy(() => import('./components/Contact'));
const Footer = lazy(() => import('./components/Footer'));
const AIChatWidget = lazy(() => import('./components/AIChatWidget'));

function App() {
  return (
    <div className="min-h-screen bg-midnight text-bone">
      <Navigation />
      <Hero />

      <Suspense fallback={null}>
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

        <AIChatWidget />
      </Suspense>
    </div>
  );
}

export default App;
