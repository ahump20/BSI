import Head from 'next/head';
import Link from 'next/link';
import type { CSSProperties } from 'react';
import { DeveloperModePanel } from '../../components/DeveloperModePanel';

const WORKER_BASE_URL = process.env.NEXT_PUBLIC_WORKER_BASE_URL ?? '';

export default function DevLanding() {
  return (
    <main>
      <Head>
        <title>Developer Mode | BlazeSportsIntel</title>
      </Head>
      <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Developer Utilities</h1>
      <p style={{ marginBottom: '2rem', color: '#a0aec0' }}>
        Internal sandbox for testing worker integrations, UE experiments, and feature flag payloads.
      </p>
      <nav style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
        <Link href="/dev/ue" style={navButtonStyle}>
          Underdog Edge Proxy
        </Link>
        <Link href="/dev/labs" style={navButtonStyle}>
          Labs
        </Link>
      </nav>
      <DeveloperModePanel workerBaseUrl={WORKER_BASE_URL} />
    </main>
  );
}

const navButtonStyle: CSSProperties = {
  padding: '0.75rem 1.5rem',
  backgroundColor: '#2d3748',
  borderRadius: '999px',
  color: '#f7fafc',
  fontWeight: 600,
  border: '1px solid rgba(148, 163, 184, 0.3)',
};
