/**
 * Graphics Engine Demo Page
 *
 * Comprehensive showcase of all graphics engine features:
 * - Charts (Line, Bar, Pie, Radar, Area, Sparkline)
 * - Data Tables with sorting/filtering
 * - Animations and Transitions
 * - Interactive components (Modal, Tooltip, Dropdown)
 * - Dashboard components (StatCard, MetricGrid)
 * - Sports visualizations
 * - Advanced animations
 * - Real-time data utilities
 */

'use client';

import React, { useState } from 'react';

// Charts
import { LineChart, Sparkline } from '@/components/charts/LineChart';
import { BarChart, SimpleBarChart } from '@/components/charts/BarChart';
import { PieChart, DoughnutChart, DoughnutChartWithCenter } from '@/components/charts/PieChart';
import { RadarChart, PlayerComparisonRadar } from '@/components/charts/RadarChart';
import { AreaChart, StackedAreaChart } from '@/components/charts/AreaChart';

// UI Components
import { DataTable, DataTableColumn } from '@/components/ui/DataTable';
import {
  FadeTransition,
  SlideTransition,
  CollapseTransition,
  ScaleTransition,
} from '@/components/ui/Transition';
import { Modal, ConfirmModal } from '@/components/ui/Modal';
import { Tooltip, InfoTooltip } from '@/components/ui/Tooltip';
import { Dropdown, Select } from '@/components/ui/Dropdown';
import { StatCard, MetricGrid, CompactStatCard } from '@/components/ui/StatCard';

// Sports Components
import { GameTimeline, CompactTimeline } from '@/components/sports/GameTimeline';
import { PlayerCard, CompactPlayerCard } from '@/components/sports/PlayerCard';
import { LiveScoreBoard } from '@/components/sports/LiveScoreBoard';
import { TeamComparison, CompactTeamComparison } from '@/components/sports/TeamComparison';

// Hooks and utilities
import {
  useCountUp,
  useRevealOnScroll,
  useMagnetic,
  useRipple,
  useDraggable,
  useParallax,
} from '@/lib/graphics';
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
  const [showModal, setShowModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedOption, setSelectedOption] = useState('option1');

  // Counter animation
  const totalGames = useCountUp(1247, 2000);
  const totalPlayers = useCountUp(8532, 2000);
  const totalTeams = useCountUp(347, 2000);

  // Advanced animation hooks
  const magneticRef = useMagnetic<HTMLButtonElement>({ strength: 0.4, radius: 120 });
  const rippleRef = useRipple<HTMLButtonElement>();

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
          GRAPHICS ENGINE V2.0
        </h1>
        <p style={{ color: graphicsTheme.colors.text.secondary, fontSize: '1.125rem' }}>
          Sophisticated visualization, elegantly simple to use
        </p>
      </header>

      {/* Dashboard Stats with StatCard */}
      <section style={{ marginBottom: '3rem' }}>
        <h2
          style={{
            fontSize: '1.5rem',
            color: graphicsTheme.colors.text.primary,
            marginBottom: '1rem',
          }}
        >
          Dashboard Components
        </h2>
        <MetricGrid columns={3}>
          <StatCard
            label="Total Games"
            value={1247}
            trend={{ value: 12.5, direction: 'up' }}
            trendData={[1100, 1150, 1180, 1210, 1230, 1247]}
            color={graphicsTheme.colors.primary}
            format="number"
          />
          <StatCard
            label="Active Players"
            value={8532}
            trend={{ value: 8.3, direction: 'up' }}
            color={graphicsTheme.colors.info}
            format="number"
          />
          <StatCard
            label="Win Rate"
            value={0.652}
            trend={{ value: 2.1, direction: 'down' }}
            trendData={[0.62, 0.64, 0.66, 0.67, 0.65, 0.652]}
            color={graphicsTheme.colors.success}
            format="percentage"
          />
        </MetricGrid>
      </section>

      {/* Advanced Chart Types */}
      <section style={{ marginBottom: '3rem' }}>
        <h2
          style={{
            fontSize: '1.5rem',
            color: graphicsTheme.colors.text.primary,
            marginBottom: '1rem',
          }}
        >
          Advanced Charts
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem' }}>
          <PieChart
            data={[
              { label: 'Wins', value: 28, color: graphicsTheme.colors.success },
              { label: 'Losses', value: 8, color: graphicsTheme.colors.error },
              { label: 'Draws', value: 2, color: graphicsTheme.colors.warning },
            ]}
            title="Season Results"
            size={300}
          />
          <DoughnutChartWithCenter
            data={[
              { label: 'Home', value: 15, color: graphicsTheme.colors.primary },
              { label: 'Away', value: 13, color: graphicsTheme.colors.info },
            ]}
            title="Home vs Away"
            size={300}
            centerValue="28"
            centerLabel="Total Wins"
          />
          <RadarChart
            labels={['Speed', 'Strength', 'Agility', 'Endurance', 'Skill']}
            datasets={[
              {
                label: 'Player A',
                data: [85, 90, 78, 92, 88],
                color: graphicsTheme.colors.primary,
              },
              {
                label: 'Player B',
                data: [78, 85, 92, 80, 95],
                color: graphicsTheme.colors.info,
              },
            ]}
            title="Player Comparison"
          />
        </div>
      </section>

      {/* Area Charts */}
      <section style={{ marginBottom: '3rem' }}>
        <h2
          style={{
            fontSize: '1.5rem',
            color: graphicsTheme.colors.text.primary,
            marginBottom: '1rem',
          }}
        >
          Area Charts
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
          <AreaChart
            labels={standingsData.labels}
            datasets={[standingsData.datasets[0]]}
            title="Team Performance Trend"
            height={300}
          />
          <StackedAreaChart
            labels={standingsData.labels}
            datasets={standingsData.datasets}
            title="Comparative Team Performance"
            height={300}
          />
        </div>
      </section>

      {/* Sports Visualizations */}
      <section style={{ marginBottom: '3rem' }}>
        <h2
          style={{
            fontSize: '1.5rem',
            color: graphicsTheme.colors.text.primary,
            marginBottom: '1rem',
          }}
        >
          Sports Visualizations
        </h2>

        {/* Live ScoreBoard */}
        <div style={{ marginBottom: '2rem' }}>
          <LiveScoreBoard
            game={{
              home: {
                name: 'Lakers',
                abbr: 'LAL',
                score: 98,
                color: '#552583',
                record: '12-5',
              },
              away: {
                name: 'Warriors',
                abbr: 'GSW',
                score: 95,
                color: '#1D428A',
                record: '11-6',
              },
              status: 'Q4 2:34',
              isLive: true,
              venue: 'Crypto.com Arena',
              broadcast: 'ESPN',
              lastPlay: 'LeBron James makes a 3-pointer from the corner',
            }}
            size="md"
          />
        </div>

        {/* Player Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
          <PlayerCard
            player={{
              name: 'LeBron James',
              number: 23,
              position: 'F',
              team: 'Lakers',
              teamColor: '#552583',
              stats: { ppg: 25.7, rpg: 7.3, apg: 7.3, fg: 0.521 },
              trend: [24.2, 24.8, 25.1, 25.5, 25.7],
              status: 'active',
            }}
            highlightStats={['ppg', 'apg']}
            size="md"
          />
          <PlayerCard
            player={{
              name: 'Stephen Curry',
              number: 30,
              position: 'G',
              team: 'Warriors',
              teamColor: '#1D428A',
              stats: { ppg: 29.4, rpg: 6.1, apg: 6.3, fg: 0.483 },
              trend: [27.8, 28.5, 29.0, 29.2, 29.4],
              status: 'active',
            }}
            highlightStats={['ppg']}
            size="md"
          />
        </div>

        {/* Team Comparison */}
        <TeamComparison
          teams={[
            {
              name: 'Lakers',
              abbr: 'LAL',
              color: '#552583',
              record: '12-5',
              stats: { ppg: 112.3, rpg: 45.2, apg: 25.8, fg: 0.478 },
            },
            {
              name: 'Warriors',
              abbr: 'GSW',
              color: '#1D428A',
              record: '11-6',
              stats: { ppg: 115.8, rpg: 42.1, apg: 27.5, fg: 0.492 },
            },
          ]}
          highlightWinner
        />
      </section>

      {/* Interactive Components */}
      <section style={{ marginBottom: '3rem' }}>
        <h2
          style={{
            fontSize: '1.5rem',
            color: graphicsTheme.colors.text.primary,
            marginBottom: '1rem',
          }}
        >
          Interactive Components
        </h2>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
          {/* Modal */}
          <button
            onClick={() => setShowModal(true)}
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
            Open Modal
          </button>

          <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Demo Modal" size="md">
            <div style={{ padding: '1rem' }}>
              <p style={{ color: graphicsTheme.colors.text.secondary, marginBottom: '1rem' }}>
                This is a modal with smooth animations, backdrop blur, and accessibility features built-in.
              </p>
              <p style={{ color: graphicsTheme.colors.text.secondary }}>
                Press ESC or click the backdrop to close.
              </p>
            </div>
          </Modal>

          {/* Confirm Modal */}
          <button
            onClick={() => setShowConfirmModal(true)}
            style={{
              padding: '0.75rem 1.5rem',
              background: graphicsTheme.colors.error,
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              fontWeight: '600',
            }}
          >
            Open Confirm
          </button>

          <ConfirmModal
            isOpen={showConfirmModal}
            onClose={() => setShowConfirmModal(false)}
            onConfirm={() => {
              alert('Confirmed!');
              setShowConfirmModal(false);
            }}
            title="Confirm Action"
            message="Are you sure you want to proceed with this action?"
            confirmText="Yes, Continue"
            cancelText="Cancel"
          />

          {/* Tooltip */}
          <Tooltip content="This is a helpful tooltip with auto-positioning" placement="top">
            <button
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
              Hover for Tooltip
            </button>
          </Tooltip>

          {/* Dropdown */}
          <Dropdown
            items={[
              { label: 'Action 1', value: 'action1' },
              { label: 'Action 2', value: 'action2' },
              { divider: true, label: '', value: 'divider' },
              { label: 'Delete', value: 'delete' },
            ]}
            onSelect={(item) => alert(`Selected: ${item.label}`)}
          >
            <button
              style={{
                padding: '0.75rem 1.5rem',
                background: graphicsTheme.colors.success,
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                fontWeight: '600',
              }}
            >
              Dropdown Menu ▼
            </button>
          </Dropdown>

          {/* Select */}
          <Select
            value={selectedOption}
            onChange={(val) => setSelectedOption(val as string)}
            options={[
              { label: 'Option 1', value: 'option1' },
              { label: 'Option 2', value: 'option2' },
              { label: 'Option 3', value: 'option3' },
            ]}
            placeholder="Select an option"
          />

          {/* Info Tooltip */}
          <InfoTooltip content="Quick info tooltip for inline help" />
        </div>
      </section>

      {/* Advanced Animations */}
      <section style={{ marginBottom: '3rem' }}>
        <h2
          style={{
            fontSize: '1.5rem',
            color: graphicsTheme.colors.text.primary,
            marginBottom: '1rem',
          }}
        >
          Advanced Animations
        </h2>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          {/* Magnetic button */}
          <button
            ref={magneticRef}
            style={{
              padding: '1rem 2rem',
              background: `linear-gradient(135deg, ${graphicsTheme.colors.primary}, ${graphicsTheme.colors.info})`,
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '1rem',
            }}
          >
            Magnetic Button
          </button>

          {/* Ripple button */}
          <button
            ref={rippleRef}
            style={{
              padding: '1rem 2rem',
              background: graphicsTheme.colors.success,
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '1rem',
            }}
          >
            Ripple Effect
          </button>
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
          Graphics Engine v2.0 - Built for Blaze Sports Intel
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
