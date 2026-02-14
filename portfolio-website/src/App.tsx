import Navigation from './components/Navigation';
import Hero from './components/Hero';
import About from './components/About';
import Experience from './components/Experience';
import Education from './components/Education';
import BSIShowcase from './components/BSIShowcase';
import AIFeatures from './components/AIFeatures';
import Podcast from './components/Podcast';
import Philosophy from './components/Philosophy';
import Contact from './components/Contact';
import AIChatWidget from './components/AIChatWidget';

function App() {
  return (
    <div className="min-h-screen bg-midnight text-bone">
      <Navigation />
      <Hero />
      <About />
      <Experience />
      <Education />
      <BSIShowcase />
      <AIFeatures />
      <Podcast />
      <Philosophy />
      <Contact />

      {/* Footer */}
      <footer className="py-8 text-center border-t border-bone/5">
        <p className="text-sm font-mono text-warm-gray">
          &copy; {new Date().getFullYear()} Austin Humphrey. All rights reserved.
        </p>
      </footer>

      <AIChatWidget />
    </div>
  );
}

export default App;
