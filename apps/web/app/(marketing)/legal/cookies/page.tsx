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
  title: 'Cookie Policy | Blaze Sports Intel',
  description:
    'Cookie Policy covering Blaze Sports Intel consent management, analytics tooling, and user preference controls.'
};

export default function CookiePolicyPage() {
  return (
    <article>
      <header>
        <h1 style={headingStyle}>Cookie Policy</h1>
        <p style={subheadingStyle}>Effective Date: 24 September 2025</p>
      </header>

      <section style={sectionStyle}>
        <h2 style={{ marginTop: 0 }}>1. Overview</h2>
        <p>
          This Cookie Policy explains how Blaze Sports Intel uses cookies, SDKs, and similar technologies on our websites,
          dashboards, and APIs.
        </p>
      </section>

      <section style={sectionStyle}>
        <h2 style={{ marginTop: 0 }}>2. Cookies We Use</h2>
        <ul style={listStyle}>
          <li>
            <strong>Strictly Necessary</strong>: Session cookies for security, authentication, and load balancing.
          </li>
          <li>
            <strong>Performance</strong>: Privacy-centric analytics (currently Plausible Analytics) with IP addresses truncated
            and no cross-site tracking.
          </li>
          <li>
            <strong>Preferences</strong>: Saves cookie consent state and accessibility settings.
          </li>
        </ul>
      </section>

      <section style={sectionStyle}>
        <h2 style={{ marginTop: 0 }}>3. Consent Management</h2>
        <p>
          On first visit from regions requiring consent (EU/EEA, UK, Brazil), we display a consent banner that enables you to
          accept or reject non-essential cookies. You can update your choices anytime via the “Cookie Settings” link in our site
          footer.
        </p>
      </section>

      <section style={sectionStyle}>
        <h2 style={{ marginTop: 0 }}>4. Third-Party Processors</h2>
        <p>
          Our analytics and infrastructure partners include Cloudflare, Plausible Analytics, and Supabase. Each partner is bound
          by a data processing agreement and required to implement technical and organizational safeguards.
        </p>
      </section>

      <section style={sectionStyle}>
        <h2 style={{ marginTop: 0 }}>5. Managing Cookies</h2>
        <p>
          You may disable cookies through your browser settings, though essential functionality may be limited. We honor Global
          Privacy Control (GPC) signals for opt-out where legally required.
        </p>
      </section>

      <section style={sectionStyle}>
        <h2 style={{ marginTop: 0 }}>6. Contact</h2>
        <p>
          Email{' '}
          <a href="mailto:privacy@blazesportsintel.com" style={{ color: '#ff8c42' }}>
            privacy@blazesportsintel.com
          </a>{' '}
          for cookie inquiries or to exercise privacy rights.
        </p>
      </section>
    </article>
  );
}
