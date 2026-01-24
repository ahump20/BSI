import { Metadata } from 'next';
import { Container } from '@/components/ui/Container';
import { Badge } from '@/components/ui/Badge';
import { Footer } from '@/components/layout-ds/Footer';
import { TriggerAlertClient } from './TriggerAlertClient';

export const metadata: Metadata = {
  title: 'SEC Fanbase Triggers | Blaze Sports Intel',
  description:
    'High-intensity emotional triggers for SEC fanbases. Use these insights for content planning around game days, rivalry matchups, and key moments.',
  openGraph: {
    title: 'SEC Fanbase Triggers | Blaze Sports Intel',
    description:
      'Discover emotional triggers that drive fan engagement for SEC college football teams.',
    url: 'https://blazesportsintel.com/fanbase/triggers',
    type: 'website',
  },
};

export default function TriggersPage() {
  return (
    <>
      <main className="min-h-screen bg-gradient-to-b from-midnight via-charcoal to-midnight">
        {/* Hero Section */}
        <section className="relative py-12 md:py-16 border-b border-border-subtle">
          <Container>
            <div className="max-w-3xl">
              <Badge variant="accent" className="mb-4">
                Content Planning
              </Badge>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
                SEC Fanbase Trigger Alerts
              </h1>
              <p className="text-lg text-white/70 mb-6">
                High-intensity emotional triggers that drive fan engagement. Use these insights for
                content planning around game days, rivalry matchups, and key moments in the season.
              </p>
              <div className="flex flex-wrap gap-4 text-sm">
                <div className="px-4 py-2 bg-error/10 border border-error/20 rounded-lg">
                  <span className="text-error font-medium">Max (10/10)</span>
                  <span className="text-white/50 ml-2">- Explosive reactions guaranteed</span>
                </div>
                <div className="px-4 py-2 bg-ember/10 border border-ember/20 rounded-lg">
                  <span className="text-ember font-medium">Critical (9/10)</span>
                  <span className="text-white/50 ml-2">- Very strong emotional response</span>
                </div>
                <div className="px-4 py-2 bg-warning/10 border border-warning/20 rounded-lg">
                  <span className="text-warning font-medium">High (8/10)</span>
                  <span className="text-white/50 ml-2">- Notable engagement driver</span>
                </div>
              </div>
            </div>
          </Container>
        </section>

        {/* Triggers Content */}
        <section className="py-8 md:py-12">
          <Container>
            <TriggerAlertClient />
          </Container>
        </section>
      </main>
      <Footer />
    </>
  );
}
