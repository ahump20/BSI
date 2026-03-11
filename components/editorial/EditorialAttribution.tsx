import Link from 'next/link';
import { DataSourceBadge } from '@/components/ui/Badge';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';

interface EditorialAttributionProps {
  source: string;
  timestamp: string;
  prevLink?: { label: string; href: string };
  nextLink?: { label: string; href: string };
}

export function EditorialAttribution({ source, timestamp, prevLink, nextLink }: EditorialAttributionProps) {
  return (
    <Section padding="md" className="border-t border-border">
      <Container>
        <div className="max-w-3xl mx-auto">
          <DataSourceBadge source={source} timestamp={timestamp} />
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
            {prevLink ? (
              <Link
                href={prevLink.href}
                className="text-text-muted hover:text-burnt-orange transition-colors text-sm"
              >
                &larr; {prevLink.label}
              </Link>
            ) : (
              <Link
                href="/college-baseball/editorial"
                className="text-text-muted hover:text-burnt-orange transition-colors text-sm"
              >
                &larr; All Editorial
              </Link>
            )}
            {nextLink && (
              <Link
                href={nextLink.href}
                className="text-text-muted hover:text-burnt-orange transition-colors text-sm"
              >
                {nextLink.label} &rarr;
              </Link>
            )}
          </div>
        </div>
      </Container>
    </Section>
  );
}
