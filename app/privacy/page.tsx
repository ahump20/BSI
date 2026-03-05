import { Metadata } from 'next';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { ScrollReveal } from '@/components/cinematic';
import { Footer } from '@/components/layout-ds/Footer';

export const metadata: Metadata = {
  title: 'Privacy Policy | Blaze Sports Intel',
  description: 'Privacy Policy for Blaze Sports Intel. How we handle your data.',
};

export default function PrivacyPage() {
  return (
    <>
      <div>
        <Section padding="lg" className="pt-6">
          <Container>
            <ScrollReveal direction="up">
              <h1 className="font-display text-4xl font-bold uppercase tracking-display mb-8">
                Privacy <span className="text-gradient-blaze">Policy</span>
              </h1>
              <p className="text-text-tertiary text-sm mb-8">Last updated: January 31, 2026</p>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={100}>
              <div className="prose prose-invert max-w-none space-y-8">

                <section>
                  <h2 className="text-xl font-semibold text-text-primary mb-4">1. Who We Are</h2>
                  <p className="text-text-secondary leading-relaxed">
                    Blaze Sports Intel (&ldquo;BSI,&rdquo; &ldquo;we,&rdquo; &ldquo;us&rdquo;) is a product of
                    Blaze Intelligence LLC, a Texas limited liability company. We provide sports analytics,
                    live scores, and data intelligence tools for college and professional sports.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-text-primary mb-4">2. Information We Collect</h2>
                  <p className="text-text-secondary leading-relaxed font-medium mb-3">Information you provide directly:</p>
                  <ul className="list-disc pl-5 space-y-1 text-text-secondary">
                    <li>Account information: name, email address</li>
                    <li>Contact form submissions: name, email, organization, sport, message</li>
                    <li>Newsletter subscriptions: email address</li>
                    <li>Payment information: processed by Stripe &mdash; we never receive or store your card number, expiration date, or CVC</li>
                  </ul>
                  <p className="text-text-secondary leading-relaxed font-medium mt-4 mb-3">Information collected automatically:</p>
                  <ul className="list-disc pl-5 space-y-1 text-text-secondary">
                    <li>Usage data: pages viewed, features used, timestamps</li>
                    <li>Device information: browser type, operating system, screen resolution</li>
                    <li>Network information: IP address, approximate geographic location</li>
                    <li>Performance data: page load times, error reports (via Cloudflare analytics)</li>
                  </ul>
                  <p className="text-text-secondary leading-relaxed mt-4">
                    We do not use session replay tools, keystroke logging, or behavioral recording software.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-text-primary mb-4">3. How We Use Your Information</h2>
                  <ul className="list-disc pl-5 space-y-1 text-text-secondary">
                    <li>Provide and operate the BSI platform and services</li>
                    <li>Process payments and manage subscriptions</li>
                    <li>Send transactional communications (account confirmations, payment receipts)</li>
                    <li>Send marketing communications (newsletter) &mdash; only with your explicit consent, and you can unsubscribe at any time</li>
                    <li>Improve platform performance, reliability, and user experience</li>
                    <li>Respond to your inquiries and support requests</li>
                    <li>Comply with legal obligations</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-text-primary mb-4">4. Third-Party Service Providers</h2>
                  <p className="text-text-secondary leading-relaxed mb-3">
                    We share data only with service providers necessary to operate BSI:
                  </p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-text-secondary">
                      <thead>
                        <tr className="text-left border-b border-border-subtle">
                          <th className="pb-2 pr-4 text-text-tertiary">Provider</th>
                          <th className="pb-2 pr-4 text-text-tertiary">Purpose</th>
                          <th className="pb-2 text-text-tertiary">Data Shared</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border-subtle/50">
                        <tr><td className="py-2 pr-4">Cloudflare</td><td className="py-2 pr-4">Hosting, CDN, edge compute</td><td className="py-2">IP address, request data</td></tr>
                        <tr><td className="py-2 pr-4">Stripe</td><td className="py-2 pr-4">Payment processing</td><td className="py-2">Name, email, payment method (handled by Stripe directly)</td></tr>
                      </tbody>
                    </table>
                  </div>
                  <p className="text-text-secondary leading-relaxed mt-3">
                    We do not sell, rent, or share your personal information with data brokers, advertisers, or any other third parties.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-text-primary mb-4">5. Data Retention</h2>
                  <ul className="list-disc pl-5 space-y-1 text-text-secondary">
                    <li>Contact form submissions: retained for 90 days, then automatically deleted</li>
                    <li>Newsletter subscriptions: retained until you unsubscribe</li>
                    <li>Account data: retained for the duration of your account, plus 30 days after deletion</li>
                    <li>Payment records: retained as required by law (typically 7 years for tax purposes)</li>
                    <li>Usage and analytics data: aggregated and anonymized after 90 days</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-text-primary mb-4">6. Your Rights</h2>
                  <p className="text-text-secondary leading-relaxed mb-3">
                    Depending on your location, you may have the following rights regarding your personal data:
                  </p>
                  <ul className="list-disc pl-5 space-y-1 text-text-secondary">
                    <li><strong className="text-text-primary">Access:</strong> Request a copy of the personal data we hold about you</li>
                    <li><strong className="text-text-primary">Correction:</strong> Request correction of inaccurate data</li>
                    <li><strong className="text-text-primary">Deletion:</strong> Request deletion of your personal data</li>
                    <li><strong className="text-text-primary">Portability:</strong> Request your data in a portable format</li>
                    <li><strong className="text-text-primary">Opt-out:</strong> Opt out of marketing communications at any time</li>
                    <li><strong className="text-text-primary">Non-discrimination:</strong> We will not discriminate against you for exercising your privacy rights</li>
                  </ul>
                  <p className="text-text-secondary leading-relaxed mt-3">
                    To exercise any of these rights, email{' '}
                    <a href="mailto:Austin@blazesportsintel.com" className="text-burnt-orange hover:text-ember">
                      Austin@blazesportsintel.com
                    </a>. We will respond within 45 days as required by applicable law.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-text-primary mb-4">7. Texas Data Privacy and Security Act (TDPSA)</h2>
                  <p className="text-text-secondary leading-relaxed">
                    As a Texas-based company, we comply with the Texas Data Privacy and Security Act.
                    Texas residents have the right to access, correct, delete, and obtain a copy of their
                    personal data, and to opt out of the processing of personal data for targeted advertising,
                    sale of personal data, or profiling. We do not engage in any of these activities.
                    To submit a TDPSA request, contact us at the email above. We will authenticate your
                    identity and respond within 45 days.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-text-primary mb-4">8. California Consumer Privacy Act (CCPA)</h2>
                  <p className="text-text-secondary leading-relaxed">
                    If you are a California resident, you have additional rights under the CCPA including
                    the right to know what personal information we collect, the right to delete, and the
                    right to opt out of the sale of personal information. We do not sell personal information.
                    To submit a CCPA request, contact us at the email above.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-text-primary mb-4">9. Cookies</h2>
                  <p className="text-text-secondary leading-relaxed">
                    BSI uses only essential cookies required for the platform to function (session management,
                    security). We do not use advertising cookies, tracking cookies, or third-party analytics
                    cookies.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-text-primary mb-4">10. Data Security</h2>
                  <p className="text-text-secondary leading-relaxed">
                    We implement industry-standard security measures including encryption in transit (TLS),
                    encryption at rest, access controls, and regular security reviews. Our infrastructure
                    is hosted on Cloudflare&apos;s global network with built-in DDoS protection.
                    No method of electronic storage is 100% secure, and we cannot guarantee absolute security.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-text-primary mb-4">11. Data Breach Notification</h2>
                  <p className="text-text-secondary leading-relaxed">
                    In the event of a data breach affecting your personal information, we will notify
                    affected individuals and the Texas Attorney General within 60 days as required by
                    Texas law, and California residents as required by the CCPA.
                    Notification will include the nature of the breach, the data affected, and steps
                    you can take to protect yourself.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-text-primary mb-4">12. Children&apos;s Privacy</h2>
                  <p className="text-text-secondary leading-relaxed">
                    BSI is not directed at individuals under the age of 16. We do not knowingly collect
                    personal information from children. If we learn we have collected data from a child
                    under 16, we will delete it promptly.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-text-primary mb-4">13. Changes to This Policy</h2>
                  <p className="text-text-secondary leading-relaxed">
                    We may update this policy from time to time. Material changes will be communicated
                    via email to registered users and posted on this page with an updated date. Continued
                    use of BSI after changes constitutes acceptance of the updated policy.
                  </p>
                </section>

                <section className="pt-8 border-t border-border-subtle">
                  <p className="text-text-tertiary text-sm">
                    Blaze Intelligence LLC &middot; Boerne, Texas &middot;{' '}
                    <a href="mailto:Austin@blazesportsintel.com" className="text-burnt-orange hover:text-ember">
                      Austin@blazesportsintel.com
                    </a>
                  </p>
                </section>
              </div>
            </ScrollReveal>
          </Container>
        </Section>
      </div>
      <Footer />
    </>
  );
}
