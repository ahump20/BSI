import type { Metadata } from 'next';
import type { CSSProperties } from 'react';

const headingStyle: CSSProperties = {
  fontSize: 'clamp(2rem, 3vw, 2.75rem)',
  marginTop: 0,
  marginBottom: '0.5rem',
  fontWeight: 700,
  letterSpacing: '0.01em'
};

const subheadingStyle: CSSProperties = {
  margin: 0,
  color: 'rgba(255, 255, 255, 0.7)'
};

const sectionStyle: CSSProperties = {
  marginTop: '2rem',
  padding: '1.5rem',
  borderRadius: '1rem',
  backgroundColor: '#1a1d24',
  border: '1px solid rgba(255, 255, 255, 0.1)'
};

const listStyle: CSSProperties = {
  margin: '1rem 0 1rem 1.25rem'
};

export const metadata: Metadata = {
  title: 'Privacy Policy | Blaze Sports Intel',
  description:
    'Privacy Policy outlining Blaze Sports Intel data collection, security measures, and user rights under GDPR and CCPA.'
};

export default function PrivacyPolicyPage() {
  return (
    <article>
      <header>
        <h1 style={headingStyle}>Privacy Policy</h1>
        <p style={subheadingStyle}>Effective Date: 24 September 2025</p>
      </header>

      <section style={sectionStyle}>
        <h2 style={{ marginTop: 0 }}>1. Who We Are</h2>
        <p>
          Blaze Sports Intel ("Blaze Intelligence", "we", "our") provides sports intelligence and analytics services. We
          operate from Austin, Texas, USA and can be reached at{' '}
          <a href="mailto:privacy@blazesportsintel.com" style={{ color: '#ff8c42' }}>
            privacy@blazesportsintel.com
          </a>
          .
        </p>
      </section>

      <section style={sectionStyle}>
        <h2 style={{ marginTop: 0 }}>2. Data We Collect</h2>
        <ul style={listStyle}>
          <li>Contact data you provide (name, email, organization, message).</li>
          <li>Usage analytics (IP address, device, pages visited) collected via privacy-centric analytics tooling.</li>
          <li>Operational telemetry (error logs, performance metrics) with IPs truncated to remain pseudonymous.</li>
        </ul>
        <p>We do not knowingly collect information about individuals under 13 years of age.</p>
      </section>

      <section style={sectionStyle}>
        <h2 style={{ marginTop: 0 }}>3. Why We Process Data</h2>
        <ul style={listStyle}>
          <li>Deliver requested demos, proposals, and customer support.</li>
          <li>Secure and monitor our infrastructure.</li>
          <li>Comply with legal, regulatory, and contractual obligations.</li>
        </ul>
        <p>Processing is based on consent, legitimate interest, or contractual necessity depending on the interaction.</p>
      </section>

      <section style={sectionStyle}>
        <h2 style={{ marginTop: 0 }}>4. Sharing and International Transfers</h2>
        <p>
          We share personal data with vendors that support hosting, security, and analytics. Vendors are bound by data processing
          agreements and must implement industry standard safeguards. Data may be processed in the United States. When we transfer
          data from the European Economic Area, we rely on Standard Contractual Clauses.
        </p>
      </section>

      <section style={sectionStyle}>
        <h2 style={{ marginTop: 0 }}>5. Retention</h2>
        <p>
          Contact records are retained for up to 24 months after last interaction unless a shorter period is required by law.
          Security logs are retained for 12 months. We anonymize or delete data when it is no longer needed.
        </p>
      </section>

      <section style={sectionStyle}>
        <h2 style={{ marginTop: 0 }}>6. Your Rights</h2>
        <ul style={listStyle}>
          <li>Access, correction, deletion, restriction, and portability (GDPR Articles 15-22).</li>
          <li>Opt-out of sale/share of personal information (CCPA §1798.120).</li>
          <li>Withdraw consent at any time where processing relies on consent.</li>
        </ul>
        <p>
          Submit requests at{' '}
          <a href="mailto:privacy@blazesportsintel.com" style={{ color: '#ff8c42' }}>
            privacy@blazesportsintel.com
          </a>
          . EU residents may also contact our EU representative at{' '}
          <a href="mailto:eurep@blazesportsintel.com" style={{ color: '#ff8c42' }}>
            eurep@blazesportsintel.com
          </a>
          . If we cannot resolve a concern, you may contact your supervisory authority or the California Attorney General.
        </p>
      </section>

      <section style={sectionStyle}>
        <h2 style={{ marginTop: 0 }}>7. Cookies &amp; Similar Technologies</h2>
        <p>
          See our <a href="/legal/cookies" style={{ color: '#ff8c42' }}>Cookie Policy</a> for details about analytics and
          preference cookies. Where required, we obtain consent prior to placing non-essential cookies.
        </p>
      </section>

      <section style={sectionStyle}>
        <h2 style={{ marginTop: 0 }}>8. Data Security</h2>
        <p>
          We enforce encryption in transit and at rest, role-based access controls, continuous monitoring, and incident response
          procedures consistent with industry best practices.
        </p>
      </section>

      <section style={sectionStyle}>
        <h2 style={{ marginTop: 0 }}>9. Contact &amp; Complaints</h2>
        <p>
          Contact our Data Protection Officer at{' '}
          <a href="mailto:dpo@blazesportsintel.com" style={{ color: '#ff8c42' }}>
            dpo@blazesportsintel.com
          </a>{' '}
          or mail Blaze Sports Intel, Attn: Privacy, 500 W 2nd St, Suite 1900, Austin, TX 78701.
        </p>
      </section>

      <section style={sectionStyle}>
        <h2 style={{ marginTop: 0 }}>10. Updates</h2>
        <p>
          We will post updates on this page and revise the “Effective Date”. Material changes will be communicated via email to
          impacted users when feasible.
        </p>
      </section>
    </article>
  );
}
