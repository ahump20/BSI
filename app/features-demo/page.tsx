'use client';

/**
 * Features Demo Page
 * Showcases all new analytics suite features
 */

import React, { useState } from 'react';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ScrollReveal } from '@/components/cinematic';
import { Footer } from '@/components/layout-ds/Footer';

// TailAdmin Components
import { StatsCard, DataTable, ChartCard, ProgressBar, Dropdown, Tabs } from '@/components/ui';
import type { ColumnDef, Tab } from '@/components/ui';

// NFL Components
import { PlayByPlayFeed } from '@/components/nfl/PlayByPlayFeed';
import { EPAChart } from '@/components/nfl/EPAChart';

// Prediction Components
import { PredictionCard, ConfidenceMeter, FactorBreakdown } from '@/components/predictions';

// Odds Components
import { LiveOddsPanel, LineHistory } from '@/components/odds';

interface SampleData {
  name: string;
  value: number;
  status: string;
}

const sampleTableData: SampleData[] = [
  { name: 'Patrick Mahomes', value: 285, status: 'Active' },
  { name: 'Josh Allen', value: 270, status: 'Active' },
  { name: 'Lamar Jackson', value: 265, status: 'Questionable' },
];

const tableColumns: ColumnDef<SampleData>[] = [
  { key: 'name', header: 'Player', cell: (item) => item.name },
  { key: 'value', header: 'Passing Yards', cell: (item) => item.value },
  { key: 'status', header: 'Status', cell: (item) => item.status },
];

export default function FeaturesDemoPage() {
  const [activeDemo, setActiveDemo] = useState('ui-components');

  const demoTabs: Tab[] = [
    {
      id: 'ui-components',
      label: 'UI Components',
      content: <UIComponentsDemo />,
    },
    {
      id: 'nfl-analytics',
      label: 'NFL Analytics',
      content: <NFLAnalyticsDemo />,
    },
    {
      id: 'predictions',
      label: 'Predictions',
      content: <PredictionsDemo />,
    },
    {
      id: 'live-odds',
      label: 'Live Odds',
      content: <LiveOddsDemo />,
    },
  ];

  return (
    <>
      <main id="main-content">
        <Section padding="xl" className="relative overflow-hidden pt-24">
          <div className="absolute inset-0 bg-gradient-radial from-burnt-orange/15 via-transparent to-transparent pointer-events-none" />

          <Container>
            <ScrollReveal direction="up">
              <Badge variant="primary" className="mb-4">
                Features Demo
              </Badge>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={100}>
              <h1 className="font-display text-4xl md:text-6xl font-bold uppercase tracking-display text-gradient-blaze mb-6">
                Enhanced Analytics Suite
              </h1>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={150}>
              <p className="text-text-secondary text-lg max-w-2xl mb-8">
                Explore the new features: NFL Play-by-Play Analytics, SportsDataverse Integration,
                TailAdmin UI Components, AI Predictions, and Real-Time Odds.
              </p>
            </ScrollReveal>
          </Container>
        </Section>

        <Section padding="lg" background="midnight">
          <Container>
            <Tabs tabs={demoTabs} defaultTab={activeDemo} onChange={setActiveDemo} />
          </Container>
        </Section>
      </main>

      <Footer />
    </>
  );
}

function UIComponentsDemo() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-display font-bold text-white mb-4">Stats Cards</h3>
        <div className="grid gap-4 md:grid-cols-3">
          <StatsCard
            title="Total Games"
            value={156}
            change={{ value: 12, trend: 'up' }}
            icon="🏈"
            color="primary"
          />
          <StatsCard
            title="Win Rate"
            value="68%"
            change={{ value: 5, trend: 'up' }}
            icon="📈"
            color="success"
          />
          <StatsCard
            title="Avg Score"
            value={24.5}
            change={{ value: 3, trend: 'down' }}
            icon="🎯"
            color="warning"
          />
        </div>
      </div>

      <div>
        <h3 className="text-xl font-display font-bold text-white mb-4">Data Table</h3>
        <DataTable
          data={sampleTableData}
          columns={tableColumns}
          pagination={true}
          searchable={true}
          sortable={true}
        />
      </div>

      <div>
        <h3 className="text-xl font-display font-bold text-white mb-4">Progress Bars</h3>
        <div className="space-y-4">
          <ProgressBar value={75} color="primary" showLabel size="lg" />
          <ProgressBar value={50} color="success" showLabel size="md" />
          <ProgressBar value={25} color="warning" showLabel size="sm" />
        </div>
      </div>

      <div>
        <h3 className="text-xl font-display font-bold text-white mb-4">Chart Card</h3>
        <ChartCard title="Sample Chart" subtitle="Demo visualization">
          <div className="h-64 flex items-center justify-center bg-charcoal rounded-lg">
            <p className="text-text-secondary">Chart content goes here</p>
          </div>
        </ChartCard>
      </div>
    </div>
  );
}

function NFLAnalyticsDemo() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-display font-bold text-white mb-4">
          Play-by-Play Feed (Mock Data)
        </h3>
        <PlayByPlayFeed gameId="demo-game-1" />
      </div>

      <div>
        <h3 className="text-xl font-display font-bold text-white mb-4">EPA Analysis</h3>
        <EPAChart gameId="demo-game-1" />
      </div>
    </div>
  );
}

function PredictionsDemo() {
  const mockPrediction = {
    gameId: 'demo-game-1',
    sport: 'nfl',
    predictedWinner: 'Kansas City Chiefs',
    winProbability: 0.68,
    predictedSpread: -3.5,
    predictedTotal: 47.5,
    confidence: 'high' as const,
    factors: [
      {
        name: 'Recent Performance',
        impact: 0.35,
        description: 'Team has won 7 of last 10 games',
      },
      {
        name: 'Home Field Advantage',
        impact: 0.25,
        description: 'Home team wins 65% of games at this venue',
      },
      {
        name: 'Injury Report',
        impact: -0.15,
        description: 'Key players questionable or out',
      },
    ],
    modelVersion: 'v1.0.0',
    generatedAt: new Date().toISOString(),
  };

  return (
    <div className="space-y-6">
      <PredictionCard prediction={mockPrediction} />

      <div className="grid gap-6 md:grid-cols-2">
        <Card variant="default" padding="lg">
          <h3 className="text-lg font-display font-bold text-white mb-4">
            Confidence Meter
          </h3>
          <ConfidenceMeter confidence="high" value={0.68} />
        </Card>

        <FactorBreakdown factors={mockPrediction.factors} />
      </div>
    </div>
  );
}

function LiveOddsDemo() {
  return (
    <div className="space-y-6">
      <Card variant="default" padding="lg">
        <p className="text-text-secondary">
          Note: WebSocket odds require a live connection to SportsGameOdds API.
          Configure SPORTSGAMEODDS_API_KEY and SPORTSGAMEODDS_WS_URL in environment variables.
        </p>
      </Card>

      <div className="opacity-50 pointer-events-none">
        <LiveOddsPanel gameId="demo-game-1" sport="nfl" />
      </div>

      <Card variant="default" padding="lg">
        <h3 className="text-lg font-display font-bold text-white mb-4">
          How Live Odds Work
        </h3>
        <ul className="list-disc list-inside space-y-2 text-text-secondary text-sm">
          <li>Real-time WebSocket connection to odds providers</li>
          <li>Automatic reconnection with exponential backoff</li>
          <li>Tracks line movements and trends</li>
          <li>Displays odds from multiple sportsbooks</li>
          <li>Historical line movement tracking</li>
        </ul>
      </Card>
    </div>
  );
}
