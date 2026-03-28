import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Button } from '@/components/ui/Button';

export default function CollegebaseballNotFound() {
  return (
    <div>
      <Section padding="lg" className="pt-6 min-h-[70vh] flex items-center">
        <Container center>
          <div className="max-w-lg mx-auto text-center">
            <h1 className="font-display text-8xl font-bold text-[var(--bsi-primary)] mb-4">404</h1>
            <h2 className="font-display text-2xl font-bold uppercase tracking-display mb-4">
              College Baseball Page Not <span className="text-[var(--bsi-primary)]">Found</span>
            </h2>
            <p className="text-[var(--bsi-dust)] mb-8">
              This page doesn't exist or has been moved. Head back to the College Baseball hub to find what you're looking for.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/college-baseball">
                <Button variant="primary" size="lg">
                  College Baseball Hub
                </Button>
              </Link>
              <Link href="/college-baseball/scores">
                <Button variant="secondary" size="lg">
                  Live Scores
                </Button>
              </Link>
            </div>
          </div>
        </Container>
      </Section>
    </div>
  );
}
