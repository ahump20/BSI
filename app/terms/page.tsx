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
      <div>
        <Section padding="lg" className="pt-6">
          <Container>
            <ScrollReveal direction="up">
              <h1 className="font-display text-4xl font-bold uppercase tracking-display mb-8">
                Terms of <span className="text-gradient-blaze">Service</span>
              </h1>
              <p className="text-text-tertiary text-sm mb-8">Last updated: January 31, 2026</p>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={100}>
              <div className="prose prose-invert max-w-none space-y-8">

                <section>
                  <h2 className="text-xl font-semibold text-text-primary mb-4">1. Acceptance of Terms</h2>
                  <p className="text-text-secondary leading-relaxed">
                    By accessing or using Blaze Sports Intel (&ldquo;BSI,&rdquo; &ldquo;the Service&rdquo;),
                    you agree to be bound by these Terms of Service (&ldquo;Terms&rdquo;). If you do not
                    agree, do not use the Service. These Terms constitute a legally binding agreement
                    between you and Blaze Intelligence LLC (&ldquo;Company,&rdquo; &ldquo;we,&rdquo; &ldquo;us&rdquo;).
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-text-primary mb-4">2. Description of Service</h2>
                  <p className="text-text-secondary leading-relaxed">
                    BSI provides sports analytics, live scores, statistical data, transfer portal tracking,
                    and related intelligence tools for college and professional sports. The Service is
                    provided on a subscription basis and through free-tier access.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-text-primary mb-4">3. Subscriptions and Payment</h2>
                  <ul className="list-disc pl-5 space-y-2 text-text-secondary">
                    <li><strong className="text-text-primary">Plans:</strong> Pro ($29/month), Enterprise ($199/month). Pricing is subject to change with 30 days&apos; notice.</li>
                    <li><strong className="text-text-primary">Free trial:</strong> Pro plan includes a 14-day free trial. You will not be charged until the trial ends.</li>
                    <li><strong className="text-text-primary">Billing:</strong> Subscriptions renew automatically. You authorize recurring charges to your payment method on file.</li>
                    <li><strong className="text-text-primary">Cancellation:</strong> You may cancel at any time. Access continues through the end of your current billing period. No refunds for partial periods.</li>
                    <li><strong className="text-text-primary">Payment processing:</strong> All payments are processed by Stripe, Inc. Your use of Stripe is subject to Stripe&apos;s terms of service.</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-text-primary mb-4">4. Acceptable Use</h2>
                  <p className="text-text-secondary leading-relaxed mb-3">You agree not to:</p>
                  <ul className="list-disc pl-5 space-y-1 text-text-secondary">
                    <li>Resell, redistribute, sublicense, or commercially exploit BSI data without written permission</li>
                    <li>Scrape, crawl, or systematically extract data from the Service</li>
                    <li>Share account credentials with unauthorized users</li>
                    <li>Use the Service for any unlawful purpose</li>
                    <li>Attempt to gain unauthorized access to any part of the Service</li>
                    <li>Interfere with the operation of the Service or impose unreasonable load on our infrastructure</li>
                    <li>Use automated systems (bots, scripts) to access the Service without our written consent</li>
                  </ul>
                  <p className="text-text-secondary leading-relaxed mt-3">
                    Violation of these terms may result in immediate suspension or termination of your account.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-text-primary mb-4">5. Intellectual Property</h2>
                  <p className="text-text-secondary leading-relaxed">
                    The BSI platform, including its design, code, features, branding, and presentation
                    of data, is the intellectual property of Blaze Intelligence LLC. The underlying sports
                    data is sourced from third-party providers and public sources and is subject to their
                    respective terms.
                  </p>
                  <p className="text-text-secondary leading-relaxed mt-2">
                    You retain ownership of any content you submit to BSI (e.g., feedback, feature requests).
                    By submitting content, you grant us a non-exclusive, royalty-free license to use it to
                    improve the Service.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-text-primary mb-4">6. Data Accuracy Disclaimer</h2>
                  <p className="text-text-secondary leading-relaxed">
                    <strong className="text-text-primary">BSI provides sports data for informational purposes only.</strong>{' '}
                    While we strive for accuracy, we do not guarantee that any data, statistics, scores,
                    rankings, valuations, or analytics provided through the Service are complete, accurate,
                    or current. Data is sourced from third-party APIs and public sources and may contain
                    errors, delays, or omissions.
                  </p>
                  <p className="text-text-secondary leading-relaxed mt-2">
                    <strong className="text-text-primary">
                      You should not rely solely on BSI data for recruiting decisions, financial decisions,
                      NIL valuations, roster management, or any other decision with material consequences.
                    </strong>{' '}
                    Always verify critical information through official sources.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-text-primary mb-4">7. Disclaimer of Warranties</h2>
                  <p className="text-text-secondary leading-relaxed uppercase text-xs tracking-wide">
                    THE SERVICE IS PROVIDED &ldquo;AS IS&rdquo; AND &ldquo;AS AVAILABLE&rdquo; WITHOUT
                    WARRANTIES OF ANY KIND, WHETHER EXPRESS, IMPLIED, STATUTORY, OR OTHERWISE, INCLUDING
                    WITHOUT LIMITATION WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE,
                    TITLE, AND NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED,
                    ERROR-FREE, OR SECURE, OR THAT ANY DEFECTS WILL BE CORRECTED.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-text-primary mb-4">8. Limitation of Liability</h2>
                  <p className="text-text-secondary leading-relaxed uppercase text-xs tracking-wide">
                    TO THE MAXIMUM EXTENT PERMITTED BY LAW, BLAZE INTELLIGENCE LLC AND ITS OFFICERS,
                    DIRECTORS, EMPLOYEES, AND AGENTS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL,
                    SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS, DATA, USE,
                    OR GOODWILL, ARISING OUT OF OR RELATED TO YOUR USE OF THE SERVICE, REGARDLESS OF
                    THE THEORY OF LIABILITY.
                  </p>
                  <p className="text-text-secondary leading-relaxed uppercase text-xs tracking-wide mt-2">
                    OUR TOTAL AGGREGATE LIABILITY FOR ALL CLAIMS ARISING OUT OF OR RELATED TO THESE
                    TERMS OR THE SERVICE SHALL NOT EXCEED THE GREATER OF (A) THE AMOUNT YOU PAID TO
                    US IN THE TWELVE (12) MONTHS PRECEDING THE CLAIM, OR (B) ONE HUNDRED DOLLARS ($100).
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-text-primary mb-4">9. Indemnification</h2>
                  <p className="text-text-secondary leading-relaxed">
                    You agree to indemnify, defend, and hold harmless Blaze Intelligence LLC and its
                    officers, directors, employees, and agents from any claims, damages, losses, liabilities,
                    and expenses (including reasonable attorneys&apos; fees) arising out of or related to
                    your use of the Service, your violation of these Terms, or your violation of any
                    third-party rights.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-text-primary mb-4">10. Termination</h2>
                  <p className="text-text-secondary leading-relaxed">
                    We may suspend or terminate your access to the Service at any time for any reason,
                    including violation of these Terms, with or without notice. Upon termination, your
                    right to use the Service ceases immediately. Sections 5&ndash;13 of these Terms survive
                    termination.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-text-primary mb-4">11. Governing Law and Dispute Resolution</h2>
                  <p className="text-text-secondary leading-relaxed">
                    These Terms are governed by the laws of the State of Texas, without regard to conflict
                    of law principles.
                  </p>
                  <p className="text-text-secondary leading-relaxed mt-2">
                    Any dispute arising out of or relating to these Terms or the Service shall be resolved
                    through binding arbitration administered by the American Arbitration Association (AAA)
                    under its Commercial Arbitration Rules. The arbitration shall take place in Bexar County,
                    Texas. The arbitrator&apos;s decision shall be final and binding and may be entered as a
                    judgment in any court of competent jurisdiction.
                  </p>
                  <p className="text-text-secondary leading-relaxed mt-2">
                    <strong className="text-text-primary">CLASS ACTION WAIVER:</strong> You agree that any dispute
                    resolution proceedings will be conducted only on an individual basis and not in a class,
                    consolidated, or representative action.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-text-primary mb-4">12. Modifications</h2>
                  <p className="text-text-secondary leading-relaxed">
                    We reserve the right to modify these Terms at any time. Material changes will be
                    communicated via email to registered users at least 30 days before they take effect.
                    Continued use of the Service after changes become effective constitutes acceptance
                    of the updated Terms.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-text-primary mb-4">13. General Provisions</h2>
                  <ul className="list-disc pl-5 space-y-2 text-text-secondary">
                    <li><strong className="text-text-primary">Entire Agreement:</strong> These Terms, together with our Privacy Policy, constitute the entire agreement between you and Blaze Intelligence LLC regarding the Service.</li>
                    <li><strong className="text-text-primary">Severability:</strong> If any provision of these Terms is found unenforceable, the remaining provisions remain in full force and effect.</li>
                    <li><strong className="text-text-primary">Waiver:</strong> Our failure to enforce any provision of these Terms does not constitute a waiver of that provision.</li>
                    <li><strong className="text-text-primary">Assignment:</strong> You may not assign your rights under these Terms without our written consent. We may assign our rights without restriction.</li>
                    <li><strong className="text-text-primary">Force Majeure:</strong> We are not liable for failures or delays caused by events beyond our reasonable control.</li>
                  </ul>
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
