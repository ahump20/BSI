import { Metadata } from 'next';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { ScrollReveal } from '@/components/cinematic';
import { Footer } from '@/components/layout-ds/Footer';

export const metadata: Metadata = {
  title: 'Terms of Service | Blaze Sports Intel',
  description: 'Terms of Service for Blaze Sports Intel platform.',
};

export default function TermsPage() {
  return (
    <>
      <main id="main-content">
        <Section padding="lg" className="pt-24">
          <Container>
            <ScrollReveal direction="up">
              <h1 className="font-display text-4xl font-bold uppercase tracking-display mb-8">
                Terms of <span className="text-gradient-blaze">Service</span>
              </h1>
              <p className="text-text-tertiary text-sm mb-8">Last updated: December 14, 2025</p>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={100}>
              <div className="prose prose-invert max-w-none space-y-8">
                <section>
                  <h2 className="text-xl font-semibold text-white mb-4">1. Acceptance of Terms</h2>
                  <p className="text-text-secondary leading-relaxed">
                    By accessing Blaze Sports Intel, you agree to these Terms of Service.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-white mb-4">2. Subscriptions</h2>
                  <p className="text-text-secondary leading-relaxed">
                    Pro: $29/month with 14-day free trial. Enterprise: $199/month. Cancel anytime.
                    Automatic renewal unless cancelled.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-white mb-4">3. Acceptable Use</h2>
                  <p className="text-text-secondary leading-relaxed">
                    Do not resell data, scrape content, or share credentials. Data is for
                    informational purposes only.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-white mb-4">4. Contact</h2>
                  <p className="text-text-secondary leading-relaxed">
                    Questions?{' '}
                    <a
                      href="mailto:Austin@blazesportsintel.com"
                      className="text-burnt-orange hover:text-ember"
                    >
                      Austin@blazesportsintel.com
                    </a>
                  </p>
                </section>

                <section className="pt-8 border-t border-border-subtle">
                  <p className="text-text-tertiary text-sm">
                    Blaze Intelligence LLC · Boerne, Texas
                  </p>
                </section>
              </div>
            </ScrollReveal>
          </Container>
        </Section>
      </main>
      <Footer />
    </>
  );
}
