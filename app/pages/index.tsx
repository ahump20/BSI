import Head from 'next/head';
import Link from 'next/link';
import type { NextPage } from 'next';

const HomePage: NextPage = () => {
  return (
    <>
      <Head>
        <title>BlazeSportsIntel Developer Console</title>
        <meta
          name="description"
          content="Access the BlazeSportsIntel developer toolkit, Unreal Engine bridges, and labs previews."
        />
      </Head>
      <main
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '3rem 1.5rem',
          gap: '2rem',
          textAlign: 'center',
        }}
      >
        <div style={{ maxWidth: '640px' }}>
          <h1
            style={{
              fontFamily: '"Source Serif Pro", Georgia, serif',
              fontSize: '2.5rem',
              marginBottom: '1rem',
            }}
          >
            BlazeSportsIntel Developer Hub
          </h1>
          <p style={{ color: 'rgba(226, 232, 240, 0.78)', lineHeight: 1.75 }}>
            Standard over vibes. Clarity beats noise. This lightweight Next.js console keeps our dev,
            Unreal Engine, and Labs teams in sync with a single source of truth.
          </p>
        </div>

        <nav
          style={{
            display: 'grid',
            gap: '1rem',
            width: '100%',
            maxWidth: '560px',
          }}
        >
          <Link
            href="/dev"
            style={{
              display: 'block',
              padding: '1.25rem',
              borderRadius: '16px',
              border: '1px solid rgba(251, 191, 36, 0.35)',
              background: 'rgba(30, 41, 59, 0.55)',
              fontWeight: 600,
            }}
          >
            Developer Mode Overview
          </Link>
          <Link
            href="/dev/ue"
            style={{
              display: 'block',
              padding: '1.25rem',
              borderRadius: '16px',
              border: '1px solid rgba(248, 113, 113, 0.35)',
              background: 'rgba(30, 41, 59, 0.45)',
              fontWeight: 600,
            }}
          >
            Unreal Engine Sync
          </Link>
          <Link
            href="/dev/labs"
            style={{
              display: 'block',
              padding: '1.25rem',
              borderRadius: '16px',
              border: '1px solid rgba(34, 197, 94, 0.35)',
              background: 'rgba(30, 41, 59, 0.45)',
              fontWeight: 600,
            }}
          >
            Labs & Experiments
          </Link>
        </nav>
      </main>
    </>
  );
};

export default HomePage;
