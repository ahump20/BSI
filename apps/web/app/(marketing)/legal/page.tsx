import Link from 'next/link';
import type { Metadata } from 'next';
import type { CSSProperties } from 'react';

const listStyle: CSSProperties = {
  display: 'grid',
  gap: '1.5rem',
  marginTop: '2rem'
};

const cardStyle: CSSProperties = {
  padding: '1.5rem',
  borderRadius: '1rem',
  backgroundColor: '#1a1d24',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  color: '#ffffff',
  textDecoration: 'none'
};

const headingStyle: CSSProperties = {
  margin: '0 0 0.5rem',
  fontSize: '1.5rem',
  fontWeight: 700
};

const descriptionStyle: CSSProperties = {
  margin: 0,
  color: 'rgba(255, 255, 255, 0.7)'
};

const legalPages = [
  {
    href: '/legal/privacy',
    title: 'Privacy Policy',
    description: 'How we process, safeguard, and honor rights around personal data.'
  },
  {
    href: '/legal/terms',
    title: 'Terms of Service',
    description: 'The rules of the road for Blaze Sports Intel software, APIs, and data feeds.'
  },
  {
    href: '/legal/cookies',
    title: 'Cookie Policy',
    description: 'Consent flows, analytics tooling, and options to manage tracking.'
  }
];

export const metadata: Metadata = {
  title: 'Legal Center | Blaze Sports Intel',
  description: 'Centralized access to Blaze Sports Intel policies including privacy, terms, and cookies.'
};

export default function LegalIndexPage() {
  return (
    <article>
      <header>
        <h1 style={{ fontSize: 'clamp(2rem, 3vw, 2.75rem)', marginBottom: '0.5rem' }}>Legal Center</h1>
        <p style={{ margin: 0, color: 'rgba(255, 255, 255, 0.7)' }}>
          One-stop hub for compliance, contracts, and privacy controls across Blaze Sports Intel.
        </p>
      </header>
      <div style={listStyle}>
        {legalPages.map((page) => (
          <Link key={page.href} href={page.href} style={cardStyle}>
            <h2 style={headingStyle}>{page.title}</h2>
            <p style={descriptionStyle}>{page.description}</p>
          </Link>
        ))}
      </div>
    </article>
  );
}
