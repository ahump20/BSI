import { ScrollReveal } from '@/components/cinematic';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import type { ReactNode } from 'react';

interface BSIVerdictProps {
  children: ReactNode;
}

export function BSIVerdict({ children }: BSIVerdictProps) {
  return (
    <Section background="charcoal" padding="lg">
      <Container>
        <ScrollReveal>
          <div className="max-w-3xl mx-auto relative">
            <div className="absolute -top-3 left-6">
              <span className="bg-burnt-orange text-white text-xs font-display uppercase tracking-widest px-3 py-1 rounded-sm">
                BSI Verdict
              </span>
            </div>
            <div className="bg-gradient-to-br from-burnt-orange/8 to-texas-soil/5 border border-burnt-orange/15 rounded-sm p-8 pt-10">
              <div className="font-serif text-lg leading-[1.78] text-text-secondary space-y-6">
                {children}
              </div>
            </div>
          </div>
        </ScrollReveal>
      </Container>
    </Section>
  );
}
