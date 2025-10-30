/**
 * Graphics Engine Demo Page
 *
 * Comprehensive showcase of all graphics engine features:
 * - Charts (Line, Bar, Sparkline)
 * - Data Tables with sorting/filtering
 * - Animations and Transitions
 * - Interactive components
 */

'use client';

import React, { useState } from 'react';
import { LineChart, Sparkline } from '@/components/charts/LineChart';
import { BarChart, SimpleBarChart } from '@/components/charts/BarChart';
import { DataTable, DataTableColumn } from '@/components/ui/DataTable';
import {
  FadeTransition,
  SlideTransition,
  CollapseTransition,
  ScaleTransition,
} from '@/components/ui/Transition';
import { useCountUp, useRevealOnScroll } from '@/lib/graphics/hooks';
import { graphicsTheme } from '@/lib/graphics/theme';

// Sample data
const standingsData = {
  labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6'],
  datasets: [
    {
      label: 'Texas Longhorns',
      data: [12, 15, 18, 22, 25, 28],
      color: graphicsTheme.colors.primary,
    },
    {
      label: 'Oklahoma Sooners',
      data: [10, 14, 16, 20, 23, 26],
      color: graphicsTheme.colors.info,
    },
    {
      label: 'Alabama Crimson Tide',
      data: [8, 12, 15, 18, 22, 27],
      color: graphicsTheme.colors.error,
    },
  ],
};

const performanceData = {
  labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
  datasets: [
    {
      label: 'Wins',
      data: [12, 19, 15, 25, 22, 30],
      color: graphicsTheme.colors.success,
    },
  ],
};

const playerData = [
  {
    id: 1,
    name: 'Quinn Ewers',
    position: 'QB',
    team: 'Texas',
    stats: 342,
    rating: 98.5,
    trend: [85, 88, 92, 95, 98.5],
  },
  {
    id: 2,
    name: 'Bijan Robinson',
    position: 'RB',
    team: 'Texas',
    stats: 1580,
    rating: 94.2,
    trend: [89, 91, 92, 93, 94.2],
  },
  {
    id: 3,
    name: 'Xavier Worthy',
    position: 'WR',
    team: 'Texas',
    stats: 1265,
    rating: 92.8,
    trend: [88, 90, 91, 92, 92.8],
  },
  {
    id: 4,
    name: 'Dillon Gabriel',
    position: 'QB',
    team: 'Oklahoma',
    stats: 315,
    rating: 95.3,
    trend: [90, 92, 93, 94, 95.3],
  },
  {
    id: 5,
    name: 'Eric Gray',
    position: 'RB',
    team: 'Oklahoma',
    stats: 1420,
    rating: 91.7,
    trend: [87, 89, 90, 91, 91.7],
  },
];

const columns: DataTableColumn[] = [
  {
    key: 'name',
    header: 'Player',
    sortable: true,
    width: '200px',
  },
  {
    key: 'position',
    header: 'Pos',
    sortable: true,
    width: '80px',
    align: 'center',
  },
  {
    key: 'team',
    header: 'Team',
    sortable: true,
    width: '120px',
  },
  {
    key: 'stats',
    header: 'Total Stats',
    sortable: true,
    width: '120px',
    align: 'right',
    render: (value) => value.toLocaleString(),
  },
  {
    key: 'rating',
    header: 'Rating',
    sortable: true,
    width: '100px',
    align: 'right',
    render: (value) => (
      <span style={{ color: value >= 95 ? graphicsTheme.colors.success : graphicsTheme.colors.text.secondary }}>
        {value.toFixed(1)}
      </span>
    ),
  },
  {
    key: 'trend',
    header: 'Trend',
    width: '120px',
    align: 'center',
    render: (value) => <Sparkline data={value} width={100} height={30} />,
  },
];

export default function GraphicsDemoPage() {
  const [showTransition, setShowTransition] = useState(true);
  const [showCollapse, setShowCollapse] = useState(false);
  const [transitionType, setTransitionType] = useState<'fade' | 'slide' | 'scale'>('fade');

  // Counter animation
  const totalGames = useCountUp(1247, 2000);
  const totalPlayers = useCountUp(8532, 2000);
  const totalTeams = useCountUp(347, 2000);

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <header style={{ marginBottom: '3rem' }}>
        <h1
          style={{
            fontSize: '2.5rem',
            fontFamily: graphicsTheme.typography.fontFamily.display,
            color: graphicsTheme.colors.text.primary,
            marginBottom: '0.5rem',
          }}
        >
          GRAPHICS ENGINE DEMO
        </h1>
        <p style={{ color: graphicsTheme.colors.text.secondary, fontSize: '1.125rem' }}>
          Sophisticated visualization, elegantly simple to use
        </p>
      </header>

      {/* Stats Cards with Counter Animation */}
      <section style={{ marginBottom: '3rem' }}>
        <h2
          style={{
            fontSize: '1.5rem',
            color: graphicsTheme.colors.text.primary,
            marginBottom: '1rem',
          }}
        >
          Animated Counters
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          {[
            { label: 'Total Games', value: totalGames, color: graphicsTheme.colors.primary },
            { label: 'Players Tracked', value: totalPlayers, color: graphicsTheme.colors.info },
            { label: 'Teams', value: totalTeams, color: graphicsTheme.colors.success },
          ].map((stat) => (
            <div
              key={stat.label}
              style={{
                background: graphicsTheme.colors.background.secondary,
                padding: '1.5rem',
                borderRadius: '0.75rem',
                border: '1px solid rgba(148, 163, 184, 0.1)',
              }}
            >
              <div
                style={{
                  fontSize: '2rem',
                  fontWeight: '700',
                  color: stat.color,
                  fontFamily: graphicsTheme.typography.fontFamily.mono,
                }}
              >
                {stat.value.toLocaleString()}
              </div>
              <div style={{ color: graphicsTheme.colors.text.secondary, fontSize: '0.875rem', marginTop: '0.25rem' }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Line Charts */}
      <section style={{ marginBottom: '3rem' }}>
        <h2
          style={{
            fontSize: '1.5rem',
            color: graphicsTheme.colors.text.primary,
            marginBottom: '1rem',
          }}
        >
          Line Charts
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
          <LineChart
            labels={standingsData.labels}
            datasets={standingsData.datasets}
            title="Team Standings Progression"
            height={300}
            fill={true}
          />
          <LineChart
            labels={performanceData.labels}
            datasets={performanceData.datasets}
            title="Monthly Performance"
            height={300}
            yAxisLabel="Wins"
          />
        </div>
      </section>

      {/* Bar Charts */}
      <section style={{ marginBottom: '3rem' }}>
        <h2
          style={{
            fontSize: '1.5rem',
            color: graphicsTheme.colors.text.primary,
            marginBottom: '1rem',
          }}
        >
          Bar Charts
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
          <BarChart
            labels={['Texas', 'Oklahoma', 'Alabama', 'Georgia', 'Ohio State']}
            datasets={[
              {
                label: 'Total Wins',
                data: [28, 26, 27, 29, 25],
                color: graphicsTheme.colors.primary,
              },
            ]}
            title="Season Win Comparison"
            height={300}
          />
          <SimpleBarChart
            data={[85, 92, 78, 95, 88, 90]}
            labels={['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6']}
            title="Weekly Performance Score"
            height={300}
            color={graphicsTheme.colors.success}
          />
        </div>
      </section>

      {/* Data Table */}
      <section style={{ marginBottom: '3rem' }}>
        <h2
          style={{
            fontSize: '1.5rem',
            color: graphicsTheme.colors.text.primary,
            marginBottom: '1rem',
          }}
        >
          Interactive Data Table
        </h2>
        <DataTable
          data={playerData}
          columns={columns}
          pageSize={5}
          showSearch={true}
          showPagination={true}
          striped={true}
          hoverable={true}
        />
      </section>

      {/* Transitions */}
      <section style={{ marginBottom: '3rem' }}>
        <h2
          style={{
            fontSize: '1.5rem',
            color: graphicsTheme.colors.text.primary,
            marginBottom: '1rem',
          }}
        >
          Transitions & Animations
        </h2>

        {/* Transition Controls */}
        <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => setShowTransition(!showTransition)}
            style={{
              padding: '0.75rem 1.5rem',
              background: graphicsTheme.colors.primary,
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              fontWeight: '600',
            }}
          >
            Toggle Transition
          </button>

          <select
            value={transitionType}
            onChange={(e) => setTransitionType(e.target.value as any)}
            style={{
              padding: '0.75rem 1rem',
              background: graphicsTheme.colors.background.tertiary,
              color: graphicsTheme.colors.text.primary,
              border: '1px solid rgba(148, 163, 184, 0.2)',
              borderRadius: '0.5rem',
              cursor: 'pointer',
            }}
          >
            <option value="fade">Fade</option>
            <option value="slide">Slide</option>
            <option value="scale">Scale</option>
          </select>

          <button
            onClick={() => setShowCollapse(!showCollapse)}
            style={{
              padding: '0.75rem 1.5rem',
              background: graphicsTheme.colors.info,
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              fontWeight: '600',
            }}
          >
            Toggle Collapse
          </button>
        </div>

        {/* Transition Demos */}
        <div style={{ display: 'grid', gap: '1.5rem' }}>
          {transitionType === 'fade' && (
            <FadeTransition show={showTransition}>
              <DemoCard title="Fade Transition" description="Smooth fade in/out effect" />
            </FadeTransition>
          )}

          {transitionType === 'slide' && (
            <SlideTransition show={showTransition} direction="bottom">
              <DemoCard title="Slide Transition" description="Slides in from the bottom" />
            </SlideTransition>
          )}

          {transitionType === 'scale' && (
            <ScaleTransition show={showTransition}>
              <DemoCard title="Scale Transition" description="Scales in/out with fade" />
            </ScaleTransition>
          )}

          <CollapseTransition show={showCollapse}>
            <DemoCard
              title="Collapse Transition"
              description="Smoothly expands and collapses content. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris."
            />
          </CollapseTransition>
        </div>
      </section>

      {/* Sparklines */}
      <section style={{ marginBottom: '3rem' }}>
        <h2
          style={{
            fontSize: '1.5rem',
            color: graphicsTheme.colors.text.primary,
            marginBottom: '1rem',
          }}
        >
          Inline Sparklines
        </h2>
        <div style={{ display: 'grid', gap: '1rem' }}>
          {[
            { label: 'Passing Yards', data: [245, 280, 310, 295, 342], color: graphicsTheme.colors.primary },
            { label: 'Rushing Yards', data: [125, 140, 138, 152, 165], color: graphicsTheme.colors.success },
            { label: 'Touchdowns', data: [2, 3, 2, 4, 3], color: graphicsTheme.colors.info },
          ].map((item) => (
            <div
              key={item.label}
              style={{
                background: graphicsTheme.colors.background.secondary,
                padding: '1rem',
                borderRadius: '0.5rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span style={{ color: graphicsTheme.colors.text.primary, fontWeight: '600' }}>{item.label}</span>
              <Sparkline data={item.data} color={item.color} width={150} height={40} />
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer style={{ marginTop: '4rem', paddingTop: '2rem', borderTop: '1px solid rgba(148, 163, 184, 0.1)' }}>
        <p style={{ color: graphicsTheme.colors.text.tertiary, textAlign: 'center' }}>
          Graphics Engine v1.0 - Built for Blaze Sports Intel
        </p>
      </footer>
    </div>
  );
}

function DemoCard({ title, description }: { title: string; description: string }) {
  return (
    <div
      style={{
        background: graphicsTheme.colors.background.secondary,
        padding: '2rem',
        borderRadius: '0.75rem',
        border: '1px solid rgba(148, 163, 184, 0.1)',
      }}
    >
      <h3 style={{ color: graphicsTheme.colors.text.primary, fontSize: '1.25rem', marginBottom: '0.5rem' }}>
        {title}
      </h3>
      <p style={{ color: graphicsTheme.colors.text.secondary }}>{description}</p>
    </div>
  );
}
