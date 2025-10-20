'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { CSSProperties, ReactNode } from 'react';

const containerStyle: CSSProperties = {
  minHeight: '100vh',
  backgroundColor: '#0f1115',
  color: '#ffffff',
  fontFamily: "'Inter', system-ui, sans-serif",
  display: 'flex',
  flexDirection: 'column'
};

const headerStyle: CSSProperties = {
  borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
  background: 'rgba(15, 17, 21, 0.9)',
  backdropFilter: 'blur(12px)',
  position: 'sticky',
  top: 0,
  zIndex: 10
};

const navStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  maxWidth: '960px',
  margin: '0 auto',
  padding: '1rem 1.5rem'
};

const navLinksStyle: CSSProperties = {
  display: 'flex',
  gap: '1rem',
  flexWrap: 'wrap'
};

const linkStyle: CSSProperties = {
  color: '#ff8c42',
  textDecoration: 'none',
  fontWeight: 600
};

const mainStyle: CSSProperties = {
  maxWidth: '960px',
  width: '100%',
  margin: '0 auto',
  padding: '2rem 1.5rem 4rem'
};

const footerStyle: CSSProperties = {
  borderTop: '1px solid rgba(255, 255, 255, 0.1)',
  padding: '2rem 1.5rem 3rem',
  background: 'rgba(15, 17, 21, 0.9)'
};

const footerInnerStyle: CSSProperties = {
  maxWidth: '960px',
  margin: '0 auto',
  display: 'flex',
  flexDirection: 'column',
  gap: '0.75rem'
};

const navLinks = [
  { href: '/legal/privacy', label: 'Privacy' },
  { href: '/legal/terms', label: 'Terms' },
  { href: '/legal/cookies', label: 'Cookies' }
];

export default function LegalLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div style={containerStyle}>
      <header style={headerStyle} role="banner">
        <nav style={navStyle} aria-label="Legal navigation">
          <Link href="/" style={{ ...linkStyle, fontWeight: 700 }} aria-label="Back to Blaze Sports Intel home">
            Blaze Sports Intel
          </Link>
          <div style={navLinksStyle}>
            {navLinks.map(({ href, label }) => {
              const isActive = pathname === href;

              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={isActive ? 'page' : undefined}
                  style={{
                    ...linkStyle,
                    borderBottom: isActive ? '2px solid #ff8c42' : '2px solid transparent',
                    paddingBottom: '0.25rem'
                  }}
                >
                  {label}
                </Link>
              );
            })}
          </div>
        </nav>
      </header>
      <main style={mainStyle} role="main">
        {children}
      </main>
      <footer style={footerStyle} role="contentinfo">
        <div style={footerInnerStyle}>
          <p style={{ margin: 0 }}>© {new Date().getFullYear()} Blaze Sports Intel. All rights reserved.</p>
          <p style={{ margin: 0 }}>
            This site complies with GDPR, CCPA/CPRA, CalOPPA, and applicable U.S. privacy laws.
          </p>
        </div>
      </footer>
    </div>
  );
}
