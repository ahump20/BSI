'use client';

import { useState } from 'react';
import Link from 'next/link';
import { PlaygroundMetrics } from '@/components/analytics/PlaygroundMetrics';
import { PlaygroundApiSim } from '@/components/analytics/PlaygroundApiSim';
import { PlaygroundERD } from '@/components/analytics/PlaygroundERD';
import { Footer } from '@/components/layout-ds/Footer';

type Tab = 'metrics' | 'api' | 'schema';

const TABS: { id: Tab; label: string; description: string }[] = [
  { id: 'metrics', label: 'Metrics Library', description: 'Interactive formula reference with live calculators for every batting and pitching metric' },
  { id: 'api', label: 'API Simulator', description: 'Mock CBB Savant endpoints with real-time data cycling and response inspection' },
  { id: 'schema', label: 'Schema ERD', description: 'Draggable entity-relationship diagram for the bsi-prod-db college baseball schema' },
];

export default function SabermetricsPlaygroundPage() {
  const [activeTab, setActiveTab] = useState<Tab>('metrics');

  const tab = TABS.find(t => t.id === activeTab)!;

  return (
    <div style={{ minHeight: '100vh', background: '#0D0D0D', color: '#FAF8F5' }}>
      {/* Nav */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(13,13,13,0.96)', backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(191,87,0,0.15)',
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0.875rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
              <img src="/images/bsi-logo-nav.png" alt="BSI" style={{ height: '28px' }} loading="lazy" decoding="async" />
            </Link>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem', color: 'rgba(250,248,245,0.4)' }}>
              <Link href="/college-baseball/analytics" style={{ color: 'rgba(250,248,245,0.5)', textDecoration: 'none' }}>Analytics</Link>
              <span>/</span>
              <span style={{ color: '#BF5700' }}>Playground</span>
            </div>
          </div>
          <span style={{
            background: 'rgba(191,87,0,0.12)', border: '1px solid rgba(191,87,0,0.25)',
            color: '#BF5700', padding: '3px 10px', borderRadius: '4px',
            fontSize: '0.65rem', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.08em',
          }}>
            INTERNAL TOOL
          </span>
        </div>
      </nav>

      {/* Hero */}
      <div style={{ borderBottom: '1px solid rgba(191,87,0,0.1)', padding: '2.5rem 1.5rem 2rem' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h1 style={{
            fontFamily: 'Oswald, sans-serif', fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
            fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em',
            color: '#FAF8F5', margin: '0 0 0.5rem',
          }}>
            College Baseball Sabermetrics
          </h1>
          <p style={{ color: 'rgba(250,248,245,0.55)', fontSize: '0.9375rem', margin: '0 0 1.5rem', fontFamily: 'Cormorant Garamond, serif', lineHeight: 1.6 }}>
            Interactive reference for the BSI NCAA Analytics Platform. Formula library, API contract, and D1 schema — all in one place.
          </p>

          {/* Tab selector */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {TABS.map(t => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                style={{
                  padding: '8px 20px', borderRadius: '4px', cursor: 'pointer',
                  fontFamily: 'Oswald, sans-serif', fontSize: '0.875rem',
                  textTransform: 'uppercase', letterSpacing: '0.06em',
                  background: activeTab === t.id ? 'rgba(191,87,0,0.2)' : 'rgba(26,26,26,0.6)',
                  border: activeTab === t.id ? '1px solid #BF5700' : '1px solid rgba(191,87,0,0.2)',
                  color: activeTab === t.id ? '#FAF8F5' : 'rgba(250,248,245,0.5)',
                  transition: 'all 0.15s',
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab description bar */}
      <div style={{ background: 'rgba(191,87,0,0.06)', borderBottom: '1px solid rgba(191,87,0,0.1)', padding: '0.625rem 1.5rem' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', fontSize: '0.8125rem', color: 'rgba(250,248,245,0.5)', fontFamily: 'JetBrains Mono, monospace' }}>
          {tab.description}
        </div>
      </div>

      {/* Main content */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1.5rem 4rem' }}>
        {activeTab === 'metrics' && <PlaygroundMetrics />}
        {activeTab === 'api' && <PlaygroundApiSim />}
        {activeTab === 'schema' && <PlaygroundERD />}
      </div>

      <Footer />
    </div>
  );
}
