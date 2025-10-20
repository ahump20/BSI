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
  marginTop: '1.75rem',
  padding: '1.5rem',
  borderRadius: '1rem',
  backgroundColor: '#1a1d24',
  border: '1px solid rgba(255, 255, 255, 0.1)'
};

const listStyle: CSSProperties = {
  margin: '1rem 0 1rem 1.25rem'
};

export const metadata: Metadata = {
  title: 'Terms of Service | Blaze Sports Intel',
  description:
    'Terms of Service that govern Blaze Sports Intel platform access, licensing, dispute resolution, and compliance duties.'
};

export default function TermsOfServicePage() {
  return (
    <article>
      <header>
        <h1 style={headingStyle}>Terms of Service</h1>
        <p style={subheadingStyle}>Effective Date: 24 September 2025</p>
      </header>

      <section style={sectionStyle}>
        <h2 style={{ marginTop: 0 }}>1. Acceptance</h2>
        <p>
          By accessing or using the Blaze Sports Intel platform, content, or APIs (collectively, the "Services"), you agree to
          these Terms of Service and our <a href="/legal/privacy" style={{ color: '#ff8c42' }}>Privacy Policy</a>. If you are
          accepting on behalf of an organization, you represent that you have authority to bind that organization.
        </p>
      </section>

      <section style={sectionStyle}>
        <h2 style={{ marginTop: 0 }}>2. Services &amp; Eligibility</h2>
        <p>
          The Services provide sports analytics for professional, collegiate, and high school programs. You must be at least 13
          years old to use the Services. Accounts may be suspended or terminated for misuse, security threats, or violation of
          these terms.
        </p>
      </section>

      <section style={sectionStyle}>
        <h2 style={{ marginTop: 0 }}>3. Data Rights &amp; Licensing</h2>
        <ul style={listStyle}>
          <li>Official data is sourced from league partners including MLB, NCAA LiveStats, and MaxPreps where applicable.</li>
          <li>Historical datasets may combine public domain statistics with proprietary modeling.</li>
          <li>Team names, logos, and league marks are used under license or fair use guidelines and remain the property of their respective owners.</li>
          <li>Unless explicitly agreed in writing, you may not resell or sublicense Blaze Sports Intel data feeds.</li>
        </ul>
        <p>
          Each integration must honor the attribution statement: “Data provided by Blaze Sports Intel and league partners. Accuracy not guaranteed.”
        </p>
      </section>

      <section style={sectionStyle}>
        <h2 style={{ marginTop: 0 }}>4. User Obligations</h2>
        <ul style={listStyle}>
          <li>Use the Services only for lawful, authorized purposes.</li>
          <li>Implement reasonable safeguards to protect credentials and API keys.</li>
          <li>Notify us immediately of unauthorized access or suspected security incidents.</li>
        </ul>
      </section>

      <section style={sectionStyle}>
        <h2 style={{ marginTop: 0 }}>5. Intellectual Property</h2>
        <p>
          All Blaze Sports Intel software, models, and content are protected by copyright, trade secret, and trademark laws. ©
          2025 Blaze Sports Intel. All rights reserved. Blaze Sports Intel™ and Blaze Intelligence™ are pending trademarks.
        </p>
      </section>

      <section style={sectionStyle}>
        <h2 style={{ marginTop: 0 }}>6. Disclaimers</h2>
        <p>
          The Services are provided “as is” without warranties of any kind. Data outputs are probabilistic and should not be
          relied on as the sole basis for high-risk decisions. We disclaim liability for league schedule changes, data feed
          interruptions, or third-party system failures.
        </p>
      </section>

      <section style={sectionStyle}>
        <h2 style={{ marginTop: 0 }}>7. Limitation of Liability</h2>
        <p>
          To the maximum extent permitted by law, Blaze Sports Intel’s total liability arising out of or related to the Services
          is limited to the fees paid to us for the 12 months preceding the claim. We are not liable for indirect, incidental,
          consequential, or punitive damages.
        </p>
      </section>

      <section style={sectionStyle}>
        <h2 style={{ marginTop: 0 }}>8. Indemnification</h2>
        <p>
          You agree to indemnify and hold Blaze Sports Intel harmless from claims arising out of your use of the Services,
          breach of these terms, or violation of law.
        </p>
      </section>

      <section style={sectionStyle}>
        <h2 style={{ marginTop: 0 }}>9. Dispute Resolution</h2>
        <p>
          Any dispute will be resolved through confidential binding arbitration administered by the American Arbitration
          Association in Travis County, Texas, except that either party may seek injunctive relief in court for intellectual
          property infringement.
        </p>
      </section>

      <section style={sectionStyle}>
        <h2 style={{ marginTop: 0 }}>10. Compliance</h2>
        <p>
          Both parties will comply with all applicable laws including GDPR, CCPA/CPRA, CAN-SPAM, and anti-doping regulations.
          If Services involve EU personal data, the Blaze Sports Intel Data Processing Addendum becomes part of these terms.
        </p>
      </section>

      <section style={sectionStyle}>
        <h2 style={{ marginTop: 0 }}>11. Termination</h2>
        <p>
          Either party may terminate with 30 days’ written notice. Sections covering intellectual property, confidentiality,
          indemnification, and dispute resolution survive termination.
        </p>
      </section>

      <section style={sectionStyle}>
        <h2 style={{ marginTop: 0 }}>12. Contact</h2>
        <p>
          Legal notices: Blaze Sports Intel, Attn: Legal, 500 W 2nd St, Suite 1900, Austin, TX 78701, USA. Email:{' '}
          <a href="mailto:legal@blazesportsintel.com" style={{ color: '#ff8c42' }}>
            legal@blazesportsintel.com
          </a>
          .
        </p>
      </section>
    </article>
  );
}
