import type { Metadata } from 'next';

const effectiveDate = 'October 23, 2025';

export const metadata: Metadata = {
  title: 'Terms of Service — Blaze Sports Intel',
  description: 'Review the Terms of Service governing access and use of the Blaze Sports Intel platform and APIs.'
};

export default function TermsOfServicePage() {
  return (
    <main className="legal-content" id="terms-of-service">
      <h1>Terms of Service</h1>
      <p>
        <strong>Effective Date:</strong> {effectiveDate}
      </p>
      <p>
        <strong>Last Updated:</strong> {effectiveDate}
      </p>

      <section>
        <h2>1. Acceptance of Terms</h2>
        <p>
          By accessing or using Blaze Sports Intel ("Service"), operated by Blaze Sports Intel ("Company," "we," "our," "us"), you
          ("User," "you," "your") agree to these Terms of Service ("Terms"). If you disagree, do not use the Service.
        </p>
      </section>

      <section>
        <h2>2. Service Description</h2>
        <h3>2.1 What We Provide</h3>
        <p>Blaze Sports Intel is a free, public sports analytics platform providing:</p>
        <ul>
          <li>Real-time live scores and game updates (MLB, NFL, NBA, NCAA, Texas HS Football)</li>
          <li>Historical sports data and statistics</li>
          <li>Advanced analytics (bullpen fatigue, clutch performance, QB pressure analysis)</li>
          <li>Game predictions and Monte Carlo simulations</li>
          <li>3D visualizations and interactive graphics</li>
          <li>AI-powered sports insights via chatbot</li>
          <li>Public API endpoints for data access</li>
          <li>Biomechanics analysis and player performance metrics</li>
        </ul>
        <h3>2.2 Current Service Status</h3>
        <p>The Service is currently provided:</p>
        <ul>
          <li><strong>Free of charge</strong> - No subscriptions, payments, or premium features</li>
          <li><strong>Read-only access</strong> - No user account registration required</li>
          <li><strong>Public data only</strong> - Minimal personal data collection (see Privacy Policy)</li>
          <li><strong>As-is basis</strong> - Features may change without notice as we develop the platform</li>
        </ul>
        <h3>2.3 Eligibility</h3>
        <ul>
          <li>You must be at least 13 years old to use the Service</li>
          <li>If under 18, parental consent is required</li>
          <li>You must not be prohibited from using the Service under applicable law</li>
          <li>You agree to comply with all applicable laws when using the Service</li>
        </ul>
      </section>

      <section>
        <h2>3. Acceptable Use</h2>
        <h3>3.1 User Accounts</h3>
        <p><strong>No Account Registration:</strong> The Service currently does not require or offer user account registration. All features are publicly accessible without login credentials.</p>
        <p><strong>Future Accounts:</strong> If we introduce user accounts in the future, you will be required to:</p>
        <ul>
          <li>Provide accurate, current information</li>
          <li>Maintain security of your credentials</li>
          <li>Notify us immediately of any unauthorized access</li>
          <li>Accept responsibility for all activity under your account</li>
        </ul>
        <h3>3.2 Prohibited Activities</h3>
        <p>You agree NOT to:</p>
        <ul>
          <li>Violate any applicable laws or regulations</li>
          <li>Infringe on intellectual property rights of Blaze Sports Intel or third parties</li>
          <li>Scrape, harvest, or collect data through automated means without written authorization</li>
          <li>Circumvent API rate limits, access controls, or security measures</li>
          <li>Distribute malware, viruses, or harmful code</li>
          <li>Impersonate any person or entity</li>
          <li>Use the Service for illegal gambling or betting where prohibited by law</li>
          <li>Resell, sublicense, or commercially exploit the Service without permission</li>
          <li>Overload or interfere with the proper functioning of the Service</li>
          <li>Reverse engineer or attempt to extract source code</li>
        </ul>
      </section>

      <section>
        <h2>4. Sports Data and Content</h2>
        <h3>4.1 Data Sources and Attribution</h3>
        <p>Our sports data is sourced from multiple providers, each with specific terms:</p>
        <ul>
          <li><strong>SportsDataIO:</strong> Primary provider for MLB, NFL, NCAA Football, and NCAA Basketball (licensed commercial API)</li>
          <li><strong>MLB Advanced Media:</strong> Official MLB statistics and game data</li>
          <li><strong>ESPN API:</strong> Live scores and game information (public endpoints)</li>
          <li><strong>NCAA Official Stats:</strong> College sports data and statistics</li>
          <li><strong>Perfect Game:</strong> Youth baseball tournament data</li>
          <li><strong>MaxPreps:</strong> High school sports data and coverage</li>
        </ul>
        <p>For detailed attribution requirements, see our <a href="/attribution">Data Attribution</a> page.</p>
        <h3>4.2 Data Accuracy and Timing</h3>
        <p><strong>Important Disclaimers:</strong></p>
        <ul>
          <li><strong>Live Score Delays:</strong> Real-time scores have a 15-60 second delay from official sources</li>
          <li><strong>"As-Is" Provision:</strong> All data provided without warranty of accuracy, completeness, or timeliness</li>
          <li><strong>Provider Dependency:</strong> Data quality and availability depend on third-party provider performance</li>
          <li><strong>Not Official:</strong> Our Service is not affiliated with or endorsed by any league, team, or official statistics provider</li>
          <li><strong>Historical Data:</strong> Accuracy subject to provider updates and corrections</li>
          <li><strong>Predictions:</strong> Game predictions and analytics are for informational and entertainment purposes only</li>
        </ul>
        <h3>4.3 Intellectual Property Rights</h3>
        <ul>
          <li><strong>Platform Content:</strong> All original content, analytics, visualizations, and code © 2025 Blaze Sports Intel</li>
          <li><strong>Sports Data:</strong> Remains property of respective data providers and leagues</li>
          <li><strong>Team Names & Logos:</strong> Trademarks and service marks belong to respective teams and leagues</li>
          <li><strong>User Content:</strong> Currently no user-generated content features (read-only platform)</li>
          <li><strong>Commercial Use:</strong> No unauthorized commercial use of platform content without written permission</li>
          <li><strong>Fair Use:</strong> Sports statistics, scores, and facts used under fair use doctrine for news and information purposes</li>
        </ul>
        <h3>4.4 AI-Generated Content</h3>
        <ul>
          <li>Predictions, insights, and chatbot responses are generated using AI models (Anthropic Claude, Cloudflare Workers AI)</li>
          <li>AI-generated content is for informational purposes only and should not be relied upon for betting or financial decisions</li>
          <li>We do not guarantee the accuracy or reliability of AI predictions</li>
        </ul>
      </section>

      <section>
        <h2>5. API Usage Terms</h2>
        <h3>5.1 Rate Limits</h3>
        <p>To ensure fair access and platform stability, the following rate limits apply:</p>
        <ul>
          <li><strong>Global Rate Limit:</strong> 100 requests per 15 minutes per IP address</li>
          <li><strong>Live Scores:</strong> Cached with 30-second refresh intervals</li>
          <li><strong>Sports Data:</strong> Cached with 5-minute refresh intervals</li>
          <li><strong>AI Copilot Queries:</strong> Cached with 3-5 minute refresh intervals</li>
          <li><strong>Automatic Throttling:</strong> Requests exceeding limits will receive HTTP 429 (Too Many Requests)</li>
          <li><strong>Exponential Backoff:</strong> Required when retrying failed requests</li>
        </ul>
        <p><strong>Future Tiers:</strong> We may introduce tiered access levels in the future with higher rate limits for premium users.</p>
        <h3>5.2 Acceptable API Use</h3>
        <ul>
          <li><strong>Personal & Research Use:</strong> Free for personal projects, academic research, and non-commercial applications</li>
          <li><strong>Attribution Required:</strong> Must display "Data powered by Blaze Sports Intel" or equivalent attribution</li>
          <li><strong>Commercial Use:</strong> Contact us at legal@blazesportsintel.com for commercial licensing</li>
          <li><strong>Prohibited Uses:</strong> No high-frequency trading, gambling platforms (where illegal), or unauthorized resale</li>
          <li><strong>Provider Compliance:</strong> You must comply with all third-party data provider terms and restrictions</li>
          <li><strong>Caching:</strong> You may cache API responses for up to 24 hours; live data must be refreshed appropriately</li>
        </ul>
        <h3>5.3 API Access Keys</h3>
        <p><strong>Current Status:</strong> Public API endpoints do not require authentication. Internal trigger endpoints require bearer token authentication.</p>
        <p><strong>Future Authentication:</strong> We may require API keys for access in the future. Registered users will receive notice before any authentication requirements are implemented.</p>
      </section>

      <section>
        <h2>6. Payment Terms (Future Use)</h2>
        <p><strong>Current Status:</strong> Blaze Sports Intel is currently <strong>completely free</strong> with no payment processing, subscriptions, or premium features.</p>
        <p><strong>Future Paid Features:</strong> If we introduce paid services in the future, the following terms will apply:</p>
        <h3>6.1 Subscription Services (When Available)</h3>
        <ul>
          <li>Monthly or annual billing cycles will be clearly disclosed</li>
          <li>Automatic renewal unless cancelled before the renewal date</li>
          <li>30-day advance notice for any price changes</li>
          <li>Payment processed through secure third-party payment processors (we do not store payment information)</li>
          <li>Pro-rata refunds may be offered at our discretion</li>
        </ul>
        <h3>6.2 Refund Policy (When Applicable)</h3>
        <ul>
          <li>14-day money-back guarantee for new subscriptions</li>
          <li>No refunds for API usage overages or add-on features</li>
          <li>Disputed charges subject to investigation and verification</li>
          <li>Refunds processed within 10 business days to original payment method</li>
        </ul>
        <h3>6.3 Tax Compliance</h3>
        <p>Prices exclude applicable taxes. You are responsible for all sales, use, and excise taxes, and any other similar taxes, duties, and charges of any kind imposed by any governmental authority on any amounts payable by you.</p>
      </section>

      <section>
        <h2>7. Privacy and Data Protection</h2>
        <p>Your use is subject to our Privacy Policy, incorporated by reference.</p>
      </section>

      <section>
        <h2>8. Disclaimer of Warranties</h2>
        <p>
          The Service is provided "as is" and "as available" without warranties of any kind, including merchantability, fitness for
          particular purpose, non-infringement, accuracy, or completeness.
        </p>
      </section>

      <section>
        <h2>9. Limitation of Liability</h2>
        <h3>9.1 Exclusion of Damages</h3>
        <p>In no event shall we be liable for:</p>
        <ul>
          <li>Indirect, incidental, special, or consequential damages</li>
          <li>Lost profits or revenue</li>
          <li>Loss of data or use</li>
          <li>Business interruption</li>
          <li>Damages exceeding fees paid in prior 12 months</li>
        </ul>
        <h3>9.2 Essential Purpose</h3>
        <p>These limitations apply even if a remedy fails of its essential purpose.</p>
      </section>

      <section>
        <h2>10. Indemnification</h2>
        <p>
          You agree to indemnify, defend, and hold harmless Blaze Sports Intel, its officers, directors, employees, and affiliates
          from any claims, damages, losses, liabilities, costs, and expenses arising from your violation of these Terms, third-party
          rights, or misuse of the Service.
        </p>
      </section>

      <section>
        <h2>11. Dispute Resolution</h2>
        <h3>11.1 Arbitration Agreement</h3>
        <p>
          You agree to arbitrate all disputes under AAA Commercial Rules in Austin, Texas. Individual claims only (no class actions).
          Each party bears its own costs.
        </p>
        <h3>11.2 Exceptions</h3>
        <ul>
          <li>Small claims court for qualifying claims</li>
          <li>Injunctive relief for IP violations</li>
        </ul>
        <h3>11.3 Opt-Out</h3>
        <p>Mail opt-out within 30 days to: legal@blazesportsintel.com</p>
      </section>

      <section>
        <h2>12. DMCA Compliance</h2>
        <h3>12.1 Copyright Policy</h3>
        <p>
          We respect intellectual property. To report infringement email dmca@blazesportsintel.com with identification, location,
          contact information, and a good-faith statement.
        </p>
        <h3>12.2 Counter-Notification</h3>
        <p>
          If content was wrongly removed, provide identification of removed material, statement of good faith belief, and consent to
          jurisdiction.
        </p>
      </section>

      <section>
        <h2>13. Modifications</h2>
        <h3>13.1 Changes to Terms</h3>
        <p>30-day notice for material changes. Continued use constitutes acceptance. You may terminate if you disagree.</p>
        <h3>13.2 Service Modifications</h3>
        <p>We may modify, suspend, or discontinue features with reasonable notice.</p>
      </section>

      <section>
        <h2>14. Termination</h2>
        <h3>14.1 By You</h3>
        <ul>
          <li>Cancel anytime through account settings</li>
          <li>Request data deletion per Privacy Policy</li>
        </ul>
        <h3>14.2 By Us</h3>
        <ul>
          <li>Violation of Terms</li>
          <li>Extended inactivity (12+ months)</li>
          <li>Legal requirements</li>
          <li>Service discontinuation</li>
        </ul>
        <h3>14.3 Effect of Termination</h3>
        <ul>
          <li>Access immediately revoked</li>
          <li>Data deleted per retention policy</li>
          <li>Surviving provisions remain effective</li>
        </ul>
      </section>

      <section>
        <h2>15. General Provisions</h2>
        <ul>
          <li>Governing Law: Texas law (excluding conflict provisions)</li>
          <li>Severability: Invalid provisions severed; remainder enforceable</li>
          <li>Entire Agreement: These Terms constitute entire agreement</li>
          <li>Assignment: We may assign; you may not without consent</li>
          <li>Force Majeure: No liability for circumstances beyond reasonable control</li>
        </ul>
      </section>

      <section>
        <h2>16. Accessibility</h2>
        <p>We strive for WCAG AA compliance. Report issues to accessibility@blazesportsintel.com.</p>
      </section>

      <section>
        <h2>17. Contact Information</h2>
        <ul>
          <li>Blaze Sports Intel</li>
          <li>Email: legal@blazesportsintel.com</li>
          <li>Support: support@blazesportsintel.com</li>
          <li>Address: Austin, Texas</li>
        </ul>
      </section>
    </main>
  );
}
