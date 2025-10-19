import Head from 'next/head';
import Link from 'next/link';
import type { CSSProperties } from 'react';

export default function LabsPage() {
  return (
    <main>
      <Head>
        <title>Labs | BlazeSportsIntel</title>
      </Head>
      <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Labs</h1>
      <p style={{ color: '#a0aec0', marginBottom: '2rem' }}>
        Prototype locker for features we have not promoted to the full Diamond platform. Only surfaced when
        the developer flags expose a matching key.
      </p>
      <section style={sectionStyle}>
        <h2 style={{ marginTop: 0 }}>Highlighted Experiments</h2>
        <ul style={listStyle}>
          <li>Pitch-by-pitch win expectancy visualizer</li>
          <li>Portal tracker heat map for SEC & ACC programs</li>
          <li>Automated scouting blurbs with database verification</li>
        </ul>
        <Link href="/dev" style={linkStyle}>
          Return to Developer Utilities
        </Link>
      </section>
    </main>
  );
}

const sectionStyle: CSSProperties = {
  backgroundColor: '#2d3748',
  borderRadius: '1rem',
  padding: '1.75rem',
  border: '1px solid rgba(148, 163, 184, 0.35)',
  display: 'flex',
  flexDirection: 'column',
  gap: '1rem',
};

const listStyle: CSSProperties = {
  margin: 0,
  paddingLeft: '1.2rem',
  display: 'grid',
  gap: '0.5rem',
  listStyle: 'disc',
};

const linkStyle: CSSProperties = {
  alignSelf: 'flex-start',
  padding: '0.65rem 1.2rem',
  backgroundColor: '#1a202c',
  borderRadius: '0.75rem',
  border: '1px solid rgba(226, 232, 240, 0.1)',
  color: '#fbbf24',
  fontWeight: 600,
};
