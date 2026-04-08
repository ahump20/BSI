import Nav from '../components/Nav';
import Hero from '../components/Hero';
import BSIShowcase from '../components/BSIShowcase';
import ProjectGrid from '../components/ProjectGrid';
import ProofSection from '../components/ProofSection';
import OriginSection from '../components/OriginSection';
import CovenantSection from '../components/CovenantSection';
import ContactSection from '../components/ContactSection';
import Footer from '../components/Footer';
import ScrollReveal from '../components/ScrollReveal';
import { useScrollProgress } from '../hooks/useScrollProgress';

function Landing() {
  const progress = useScrollProgress();

  return (
    <>
      {/* Scroll progress bar */}
      <div
        className="scroll-progress"
        style={{ width: `${progress * 100}%` }}
      />

      <Nav />

      {/* Hero animates on load — NOT wrapped in ScrollReveal */}
      <Hero />

      {/* All content sections wrapped in ScrollReveal for scroll-triggered entrance */}
      <ScrollReveal>
        <BSIShowcase />
      </ScrollReveal>

      <ScrollReveal>
        <ProjectGrid />
      </ScrollReveal>

      <ScrollReveal>
        <ProofSection />
      </ScrollReveal>

      <ScrollReveal>
        <OriginSection />
      </ScrollReveal>

      <ScrollReveal>
        <CovenantSection />
      </ScrollReveal>

      <ScrollReveal>
        <ContactSection />
      </ScrollReveal>

      <Footer />
    </>
  );
}

export default Landing;
