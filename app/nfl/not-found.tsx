import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Button } from '@/components/ui/Button';

export default function NflNotFound() {
  return (
    <div>
      <Section padding="lg" className="pt-6 min-h-[70vh] flex items-center">
        <Container center>
          <div className="max-w-lg mx-auto text-center">
            <h1 className="font-display text-8xl font-bold text-burnt-orange mb-4">404</h1>
            <h2 className="font-display text-2xl font-bold uppercase tracking-display mb-4">
              NFL Page Not <span className="text-gradient-blaze">Found</span>
            </h2>
            <p className="text-text-secondary mb-8">
              This page doesn't exist or has been moved. Head back to the NFL hub to find what you're looking for.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/nfl">
                <Button variant="primary" size="lg">
                  NFL Hub
                </Button>
              </Link>
              <Link href="/nfl/games">
                <Button variant="secondary" size="lg">
                  NFL Scores
                </Button>
              </Link>
            </div>
          </div>
        </Container>
      </Section>
    </div>
  );
}
