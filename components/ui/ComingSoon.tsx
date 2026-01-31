import Link from 'next/link';
import { Container } from './Container';
import { Section } from './Section';
import { Button } from './Button';

interface ComingSoonProps {
  title: string;
  sport: string;
  backHref: string;
  backLabel?: string;
}

/**
 * Placeholder page for features under development.
 * Shows a clean message with a link back to the parent hub.
 */
export function ComingSoon({ title, sport, backHref, backLabel }: ComingSoonProps) {
  return (
    <main id="main-content">
      <Section padding="lg" className="pt-24 min-h-[60vh] flex items-center">
        <Container center>
          <div className="max-w-md mx-auto text-center">
            <div className="font-display text-5xl font-bold text-burnt-orange mb-4">2026</div>
            <h1 className="font-display text-2xl font-bold uppercase tracking-display mb-4">
              {title}
            </h1>
            <p className="text-text-secondary mb-8">
              {sport} {title.toLowerCase()} coverage is coming in 2026. We&apos;re building it right
              — not fast.
            </p>
            <Link href={backHref}>
              <Button variant="secondary" size="lg">
                {backLabel || `Back to ${sport}`}
              </Button>
            </Link>
          </div>
        </Container>
      </Section>
    </main>
  );
}
