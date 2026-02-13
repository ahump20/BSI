import { Toaster } from 'react-hot-toast';
import { motion, useScroll } from 'framer-motion';
import Navigation from './components/Navigation';
import BackToTop from './components/BackToTop';
import CTABanner from './components/CTABanner';
import Hero from './components/Hero';
import About from './components/About';
import Experience from './components/Experience';
import Projects from './components/Projects';
import Philosophy from './components/Philosophy';
import Contact from './components/Contact';

function App() {
  const { scrollYProgress } = useScroll();

  return (
    <div className="min-h-screen">
      {/* Scroll Progress Indicator */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-burnt-orange via-ember to-burnt-orange origin-left z-[100]"
        style={{ scaleX: scrollYProgress }}
      />
      <Toaster
        position="bottom-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#1A1A1A',
            color: '#F4EEE7',
            border: '1px solid #BF5700',
            borderRadius: '0.5rem',
            fontFamily: 'JetBrains Mono, monospace',
          },
          success: {
            iconTheme: {
              primary: '#BF5700',
              secondary: '#F4EEE7',
            },
          },
        }}
      />

      <Navigation />
      <Hero />
      <About />
      <CTABanner
        text="Want to see how this philosophy shapes real platforms?"
        linkText="View Projects"
        href="#projects"
      />
      <Experience />
      <Projects />
      <CTABanner
        text="Ready to discuss how these skills apply to your vision?"
        linkText="Let's Connect"
        href="#contact"
      />
      <Philosophy />
      <Contact />
      <BackToTop />
    </div>
  );
}

export default App;
