import type { Metadata } from 'next';

const effectiveDate = 'October 23, 2025';

export const metadata: Metadata = {
  title: 'Privacy Policy — Blaze Sports Intel',
  description:
    'Learn how Blaze Sports Intel collects, uses, and protects personal data in compliance with GDPR, CCPA, and other privacy regulations.'
};

export default function PrivacyPolicyPage() {
  return (
    <main className="legal-content" id="privacy-policy">
      <h1>Privacy Policy</h1>
      <p>
        <strong>Effective Date:</strong> {effectiveDate}
      </p>
      <p>
        <strong>Last Updated:</strong> {effectiveDate}
      </p>

      <section>
        <h2>1. Introduction</h2>
        <p>
          Blaze Sports Intel ("BSI," "we," "our," or "us") operates the website blazesportsintel.com (the "Service"). This Privacy
          Policy governs the collection, use, and disclosure of information when you use our Service in compliance with the General
          Data Protection Regulation (GDPR), California Consumer Privacy Act (CCPA), and other applicable privacy laws.
        </p>
        <p>
          <strong>Contact Information:</strong>
        </p>
        <ul>
          <li>Email: privacy@blazesportsintel.com</li>
          <li>Data Protection Officer: dpo@blazesportsintel.com</li>
        </ul>
      </section>

      <section>
        <h2>2. Information We Collect</h2>
        <p><strong>Minimal Data Collection Philosophy:</strong> Blaze Sports Intel is designed as a read-only, public information platform. We collect minimal personal information necessary to operate and improve the Service.</p>

        <h3>2.1 Information You Provide Directly</h3>
        <p><strong>Current Status:</strong> We currently collect minimal user-provided information:</p>
        <ul>
          <li>
            <strong>Contact Form Submissions:</strong> When you contact us, we temporarily receive your message content. This data is not stored in our databases long-term.
          </li>
          <li>
            <strong>Feedback:</strong> Voluntary feedback submissions you choose to provide
          </li>
          <li>
            <strong>No Account Data:</strong> We do NOT currently collect email addresses, usernames, passwords, or any account registration information (no user accounts exist)
          </li>
        </ul>

        <h3>2.2 Automatically Collected Information</h3>
        <ul>
          <li>
            <strong>Analytics Data (Cloudflare Analytics Engine):</strong> Anonymized page views, basic usage patterns, and performance metrics
          </li>
          <li>
            <strong>Technical Information:</strong> IP address (anonymized), browser type, operating system, device type (collected by Cloudflare for security and analytics)
          </li>
          <li>
            <strong>Session Data:</strong> Temporary session identifiers for Service functionality (not linked to personal identity)
          </li>
          <li>
            <strong>Cookies:</strong> Essential cookies for Service functionality and analytics cookies (with consent) - see Cookie Policy for details
          </li>
        </ul>

        <h3>2.3 Data We Do NOT Collect (Current Platform)</h3>
        <ul>
          <li><strong>No Personal Accounts:</strong> No email addresses, usernames, or passwords</li>
          <li><strong>No Payment Information:</strong> No credit cards, billing addresses, or financial data (completely free service)</li>
          <li><strong>No Precise Location:</strong> No GPS coordinates or precise geolocation tracking</li>
          <li><strong>No Persistent User Profiles:</strong> No saved preferences, favorite teams, or personalized settings (stored locally in browser only)</li>
          <li><strong>No Behavioral Tracking:</strong> No cross-site tracking, advertising pixels, or third-party advertising cookies</li>
          <li><strong>No Biometric Data:</strong> Despite biomechanics analysis features, we do not collect or store personal biometric information</li>
          <li><strong>No Sensitive Data:</strong> No government IDs, health information, financial data, or social security numbers</li>
        </ul>

        <h3>2.4 Future Data Collection (If User Accounts Are Introduced)</h3>
        <p>If we introduce user account features in the future, we will:</p>
        <ul>
          <li>Provide clear notice before implementing account registration</li>
          <li>Update this Privacy Policy with at least 30 days advance notice</li>
          <li>Obtain explicit consent for any additional data collection</li>
          <li>Allow users to continue using the Service without an account (where possible)</li>
        </ul>
      </section>

      <section>
        <h2>3. Legal Basis for Processing</h2>
        <p>
          We process your information under the following legal bases:
        </p>
        <p>
          <strong>GDPR (European Users):</strong>
        </p>
        <ul>
          <li>
            <strong>Consent:</strong> For marketing communications and cookies
          </li>
          <li>
            <strong>Legitimate Interests:</strong> Service improvement, fraud prevention, analytics
          </li>
          <li>
            <strong>Contract Performance:</strong> To provide requested services
          </li>
          <li>
            <strong>Legal Obligation:</strong> Compliance with applicable laws
          </li>
        </ul>
        <p>
          <strong>CCPA (California Users):</strong>
        </p>
        <ul>
          <li>With your consent or as permitted under California law</li>
          <li>To fulfill the business purpose for which you provided the information</li>
          <li>For compliance with legal obligations</li>
        </ul>
      </section>

      <section>
        <h2>4. How We Use Your Information</h2>
        <p>Given our minimal data collection, we use information only for the following limited purposes:</p>

        <h3>4.1 Service Delivery</h3>
        <ul>
          <li><strong>Provide Sports Data:</strong> Deliver real-time scores, statistics, analytics, and visualizations</li>
          <li><strong>API Functionality:</strong> Process API requests and return sports data</li>
          <li><strong>Session Management:</strong> Maintain temporary sessions for Service functionality</li>
          <li><strong>Browser Preferences:</strong> Store user preferences locally in browser (not on our servers)</li>
        </ul>

        <h3>4.2 Service Improvement and Analytics</h3>
        <ul>
          <li><strong>Performance Monitoring:</strong> Track Service uptime, response times, and technical performance</li>
          <li><strong>Usage Analytics:</strong> Understand which features are most used to prioritize development (anonymized, aggregated data only)</li>
          <li><strong>Error Detection:</strong> Identify and fix bugs, crashes, and technical issues</li>
          <li><strong>Feature Development:</strong> Analyze aggregated usage patterns to improve user experience</li>
        </ul>

        <h3>4.3 Security and Fraud Prevention</h3>
        <ul>
          <li><strong>DDoS Protection:</strong> Prevent denial-of-service attacks via Cloudflare</li>
          <li><strong>Rate Limiting:</strong> Enforce API rate limits to prevent abuse</li>
          <li><strong>Security Monitoring:</strong> Detect unauthorized access attempts and malicious activity</li>
          <li><strong>Terms Enforcement:</strong> Identify and prevent violations of our Terms of Service</li>
        </ul>

        <h3>4.4 Legal Compliance and Safety</h3>
        <ul>
          <li>Comply with applicable laws and regulations</li>
          <li>Respond to valid legal requests (subpoenas, court orders)</li>
          <li>Protect our legal rights and interests</li>
          <li>Ensure user safety and platform integrity</li>
        </ul>

        <h3>4.5 What We Do NOT Do With Your Data</h3>
        <ul>
          <li><strong>No Selling:</strong> We never sell, rent, or trade your information to third parties</li>
          <li><strong>No Advertising Profiles:</strong> We do not build advertising profiles or share data with ad networks</li>
          <li><strong>No Cross-Site Tracking:</strong> We do not track you across other websites</li>
          <li><strong>No Marketing (Currently):</strong> We do not send marketing emails or promotional communications</li>
        </ul>
      </section>

      <section>
        <h2>5. Data Sharing and Disclosure</h2>
        <p>We share minimal anonymized data with essential service providers only. We never sell your personal information.</p>

        <h3>5.1 Third-Party Service Providers</h3>
        <p><strong>Cloudflare (Infrastructure & Security):</strong></p>
        <ul>
          <li><strong>Purpose:</strong> Hosting, content delivery, DDoS protection, analytics, caching, serverless functions</li>
          <li><strong>Data Shared:</strong> Anonymized IP addresses, browser information, page views, request metadata</li>
          <li><strong>Services Used:</strong> Cloudflare Pages, Workers, D1, KV, R2, Analytics Engine, Workers AI</li>
          <li><strong>Privacy Policy:</strong> https://www.cloudflare.com/privacypolicy/</li>
        </ul>

        <p><strong>Sports Data Providers:</strong></p>
        <ul>
          <li><strong>SportsDataIO:</strong> Commercial API for MLB, NFL, NCAA data (no personal data shared)</li>
          <li><strong>MLB Advanced Media:</strong> Official MLB statistics (public API, no user data shared)</li>
          <li><strong>ESPN:</strong> Live scores and game data (public endpoints, no user data shared)</li>
          <li><strong>NCAA/Perfect Game/MaxPreps:</strong> College and youth sports data (no user data shared)</li>
        </ul>

        <p><strong>AI Service Providers:</strong></p>
        <ul>
          <li><strong>Anthropic Claude:</strong> AI chatbot and content generation (no personal data shared beyond chat queries)</li>
          <li><strong>Cloudflare Workers AI:</strong> Embeddings and LLM inference (processed within Cloudflare infrastructure)</li>
          <li><strong>OpenAI (Future):</strong> May be used for advanced AI features (text analysis, not personal data)</li>
        </ul>

        <h3>5.2 What We Do NOT Share</h3>
        <ul>
          <li><strong>No Advertising Networks:</strong> We do not share data with Google Ads, Facebook Pixel, or other ad platforms</li>
          <li><strong>No Data Brokers:</strong> We do not sell or share data with data brokers or marketing companies</li>
          <li><strong>No Social Media Tracking:</strong> No Facebook, Twitter, or social media tracking pixels</li>
          <li><strong>No Cross-Site Tracking:</strong> No third-party cookies for tracking across websites</li>
        </ul>

        <h3>5.3 Legal Requirements and Compliance</h3>
        <p>We may disclose information when required by law:</p>
        <ul>
          <li>Valid court orders, subpoenas, or warrants</li>
          <li>Government agency requests (with legal basis)</li>
          <li>Legal proceedings or investigations</li>
          <li>Protection of our rights, property, or safety</li>
          <li>Prevention of fraud, abuse, or illegal activity</li>
          <li>Compliance with DMCA, GDPR, CCPA, or other legal obligations</li>
        </ul>
        <p><strong>Transparency Commitment:</strong> Where legally permitted, we will notify users before disclosing their information to law enforcement or government agencies.</p>

        <h3>5.4 Business Transfers</h3>
        <p>In the event of a merger, acquisition, bankruptcy, or sale of assets, user information may be transferred to the acquiring entity. We will:</p>
        <ul>
          <li>Provide notice via email (if we have contact information) and prominent website notice</li>
          <li>Require the acquiring entity to honor this Privacy Policy</li>
          <li>Provide users the option to delete their data before transfer (if accounts exist)</li>
        </ul>

        <h3>5.5 No Sale of Personal Information</h3>
        <p><strong>CCPA Compliance:</strong> We do not sell, rent, trade, or otherwise monetize your personal information. We have never sold personal information and have no plans to do so.</p>
      </section>

      <section>
        <h2>6. Data Retention</h2>
        <p>We retain data only as long as necessary for the purposes outlined in this Privacy Policy.</p>

        <table style={{width: '100%', marginTop: '1rem'}}>
          <thead>
            <tr>
              <th>Data Category</th>
              <th>Retention Period</th>
              <th>Justification</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Analytics Data (Cloudflare)</td>
              <td>90 days (aggregated)</td>
              <td>Performance monitoring and service improvement</td>
            </tr>
            <tr>
              <td>Server Logs</td>
              <td>30 days</td>
              <td>Security, debugging, abuse prevention</td>
            </tr>
            <tr>
              <td>Contact Form Submissions</td>
              <td>Temporary (not persisted)</td>
              <td>Response to inquiries only</td>
            </tr>
            <tr>
              <td>Session Cookies</td>
              <td>End of session</td>
              <td>Service functionality</td>
            </tr>
            <tr>
              <td>Analytics Cookies</td>
              <td>13 months (if consented)</td>
              <td>Usage analysis</td>
            </tr>
            <tr>
              <td>Preference Cookies</td>
              <td>12 months</td>
              <td>User preferences (stored locally)</td>
            </tr>
            <tr>
              <td>Legal/Compliance Records</td>
              <td>7 years</td>
              <td>Legal obligations</td>
            </tr>
            <tr>
              <td>Account Data</td>
              <td>N/A (no accounts currently)</td>
              <td>Not applicable - no user accounts</td>
            </tr>
          </tbody>
        </table>

        <p style={{marginTop: '1rem'}}><strong>Data Deletion:</strong></p>
        <ul>
          <li>Automated deletion after retention period expires</li>
          <li>Manual deletion upon user request (see Your Rights section)</li>
          <li>Secure deletion methods to prevent data recovery</li>
          <li>Archived backups deleted within 90 days of retention expiration</li>
        </ul>
      </section>

      <section>
        <h2>7. Your Rights</h2>
        <h3>7.1 GDPR Rights (EU Users)</h3>
        <ul>
          <li>
            <strong>Access:</strong> Request copy of your data
          </li>
          <li>
            <strong>Rectification:</strong> Correct inaccurate data
          </li>
          <li>
            <strong>Erasure:</strong> "Right to be forgotten"
          </li>
          <li>
            <strong>Portability:</strong> Receive data in portable format
          </li>
          <li>
            <strong>Restriction:</strong> Limit processing
          </li>
          <li>
            <strong>Objection:</strong> Opt-out of certain processing
          </li>
          <li>
            <strong>Automated Decision-Making:</strong> Right to human review
          </li>
        </ul>
        <h3>7.2 CCPA Rights (California Users)</h3>
        <ul>
          <li>
            <strong>Know:</strong> What personal information is collected, used, shared
          </li>
          <li>
            <strong>Delete:</strong> Request deletion of personal information
          </li>
          <li>
            <strong>Opt-Out:</strong> Decline sale of personal information (we do not sell)
          </li>
          <li>
            <strong>Non-Discrimination:</strong> Equal service regardless of privacy choices
          </li>
        </ul>
        <h3>7.3 Exercising Your Rights</h3>
        <p>Submit requests to: privacy@blazesportsintel.com</p>
        <p>Response time: Within 30 days (GDPR) or 45 days (CCPA). Verification required for security.</p>
      </section>

      <section>
        <h2>8. Data Security</h2>
        <h3>8.1 Technical Measures</h3>
        <ul>
          <li>TLS 1.3 encryption for data transmission</li>
          <li>Encrypted data storage</li>
          <li>Regular security audits</li>
          <li>Penetration testing</li>
          <li>DDoS protection via Cloudflare</li>
        </ul>
        <h3>8.2 Organizational Measures</h3>
        <ul>
          <li>Limited access on need-to-know basis</li>
          <li>Employee confidentiality agreements</li>
          <li>Regular security training</li>
          <li>Incident response procedures</li>
        </ul>
        <h3>8.3 Breach Notification</h3>
        <ul>
          <li>Notification within 72 hours (GDPR requirement)</li>
          <li>Direct communication if high risk</li>
          <li>Regulatory authority notification as required</li>
        </ul>
      </section>

      <section>
        <h2>9. International Transfers</h2>
        <p>
          Data may be transferred to and processed in the United States. We ensure adequate protection through Standard
          Contractual Clauses and other safeguards consistent with GDPR Article 46.
        </p>
      </section>

      <section>
        <h2>10. Children's Privacy</h2>
        <p>
          Our Service is not directed to children under 13. We do not knowingly collect personal information from children under
          13. If discovered, such information will be immediately deleted.
        </p>
      </section>

      <section>
        <h2>11. Cookies and Tracking</h2>
        <h3>11.1 Essential Cookies</h3>
        <p>Required for Service functionality:</p>
        <ul>
          <li>Session management</li>
          <li>Security tokens</li>
          <li>User preferences</li>
        </ul>
        <h3>11.2 Analytics Cookies</h3>
        <p>With your consent:</p>
        <ul>
          <li>Google Analytics (anonymized)</li>
          <li>Cloudflare Analytics</li>
          <li>Performance monitoring</li>
        </ul>
        <h3>11.3 Managing Cookies</h3>
        <ul>
          <li>Browser settings</li>
          <li>Cookie preference center on our site</li>
          <li>Opt-out tools: https://tools.google.com/dlpage/gaoptout</li>
        </ul>
      </section>

      <section>
        <h2>12. Third-Party Links</h2>
        <p>
          Our Service may contain links to third-party sites. We are not responsible for their privacy practices. Review their
          policies before providing information.
        </p>
      </section>

      <section>
        <h2>13. Changes to This Policy</h2>
        <p>
          We will notify you of material changes via email notification, prominent website notice, and 30-day advance notice for
          material changes.
        </p>
      </section>

      <section>
        <h2>14. Complaints</h2>
        <p>
          EU Users: Contact our DPO first, then your local supervisory authority if unsatisfied.
          <br />
          California Users: California Attorney General — https://oag.ca.gov/privacy
        </p>
      </section>

      <section>
        <h2>15. Accessibility</h2>
        <p>This policy is available in accessible formats upon request.</p>
      </section>
    </main>
  );
}
