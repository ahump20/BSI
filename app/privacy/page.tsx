import { Metadata } from 'next';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { ScrollReveal } from '@/components/cinematic';
import { Navbar } from '@/components/layout-ds/Navbar';
import { Footer } from '@/components/layout-ds/Footer';

export const metadata: Metadata = {
  title: 'Privacy Policy | Blaze Sports Intel',
  description: 'Privacy Policy for Blaze Sports Intel. How we handle your data.',
};

const navItems = [
  { label: 'Home', href: '/' },
  { label: 'Privacy', href: '/privacy' },
  { label: 'Terms', href: '/terms' },
];

export default function PrivacyPage() {
  return (
    <>
      <Navbar items={navItems} />
      <main id="main-content">
        <Section padding="lg" className="pt-24">
          <Container>
            <ScrollReveal direction="up">
              <h1 className="font-display text-4xl font-bold uppercase tracking-display mb-8">
                Privacy <span className="text-gradient-blaze">Policy</span>
              </h1>
              <p className="text-text-tertiary text-sm mb-8">Last updated: December 14, 2025</p>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={100}>
              <div className="prose prose-invert max-w-none space-y-8">
                <section>
                  <h2 className="text-xl font-semibold text-white mb-4">What We Collect</h2>
                  <p className="text-text-secondary leading-relaxed">
                    Account info (email, name), usage data, and device info. Payments via Stripe—we
                    never store card numbers.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-white mb-4">How We Use It</h2>
                  <p className="text-text-secondary leading-relaxed">
                    To provide the service, process payments, improve the platform, and send
                    important updates.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-white mb-4">We Don't Sell Your Data</h2>
                  <p className="text-text-secondary leading-relaxed">
                    We only share with Stripe (payments) and Cloudflare (hosting). No data brokers,
                    no advertisers.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-white mb-4">Your Rights</h2>
                  <p className="text-text-secondary leading-relaxed">
                    Access, correct, or delete your data anytime. Email{' '}
                    <a
                      href="mailto:ahump20@outlook.com"
                      className="text-burnt-orange hover:text-ember"
                    >
                      ahump20@outlook.com
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
