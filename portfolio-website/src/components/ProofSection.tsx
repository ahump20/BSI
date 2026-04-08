import { useState } from 'react';
import { motion } from 'framer-motion';
import Section from './Section';
import ScrollReveal from './ScrollReveal';
import { useAnimatedCounter } from '../utils/animations';
import { PROOF_STATS } from '../content/site';

function StatBlock({ value, label, suffix }: { value: number; label: string; suffix: string }) {
  const [inView, setInView] = useState(false);
  const count = useAnimatedCounter(value, inView, 1800);

  return (
    <motion.div
      className="text-center"
      onViewportEnter={() => setInView(true)}
      viewport={{ once: true }}
    >
      <p
        className="font-sans font-bold uppercase leading-none"
        style={{
          fontSize: 'clamp(2rem, 5vw, 3.5rem)',
          color: 'var(--color-text)',
        }}
      >
        {count}{suffix}
      </p>
      <p
        className="font-mono text-[10px] tracking-[0.15em] uppercase mt-2"
        style={{ color: 'var(--color-text-muted)' }}
      >
        {label}
      </p>
    </motion.div>
  );
}

export default function ProofSection() {
  return (
    <Section
      id="proof"
      label="Infrastructure"
      title="The Stack Is Public"
      glow
      className="relative"
    >
      {/* Cooler background surface */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'var(--surface-deep)' }}
      />

      <div className="relative z-10">
        <ScrollReveal>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-8 lg:gap-6">
            {PROOF_STATS.map(stat => (
              <StatBlock key={stat.label} value={stat.value} label={stat.label} suffix={stat.suffix} />
            ))}
          </div>
        </ScrollReveal>

        {/* Supporting text */}
        <ScrollReveal delay={0.2}>
          <p
            className="font-serif text-[15px] leading-relaxed text-center max-w-2xl mx-auto mt-12"
            style={{ color: 'var(--color-text-muted)' }}
          >
            Every Worker, database, and API route is in production right now.
            The architecture is deliberately constrained: Cloudflare only. No AWS. No Vercel.
            One person can debug the entire stack because one person built the entire stack.
          </p>
        </ScrollReveal>
      </div>
    </Section>
  );
}
