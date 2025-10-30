'use client';

import React, { useState } from 'react';
import {
  HeatMap,
  RadarChart,
  StrikeZone,
  AnimatedChartWrapper,
  StaggeredChartContainer,
  AnimatedCounter,
  ChartLoadingSkeleton,
  LiveUpdateIndicator,
  type HeatMapDataPoint,
  type RadarDataSet,
  type Pitch
} from '@/components/charts';

/**
 * Charts Demo & Showcase Page
 * Demonstrates all new Tier 1 visualization components
 */
export default function ChartsDemoPage() {
  const [isLoading, setIsLoading] = useState(false);

  // Sample data for Heat Map (Spray Chart)
  const sprayChartData: HeatMapDataPoint[] = Array.from({ length: 100 }, (_, i) => ({
    x: (Math.random() - 0.5) * 400, // Field position
    y: Math.random() * 350,
    value: Math.random() * 100,
    label: `Hit ${i + 1}`
  }));

  // Sample data for Pitch Zone Heat Map
  const pitchZoneData: HeatMapDataPoint[] = Array.from({ length: 150 }, (_, i) => ({
    x: (Math.random() - 0.5) * 3,
    y: Math.random() * 4 + 0.5,
    value: Math.random() * 10,
    label: `Pitch ${i + 1}`
  }));

  // Sample data for Radar Chart (Player Comparison)
  const playerCategories = ['Power', 'Contact', 'Speed', 'Fielding', 'Arm Strength'];
  const playerDatasets: RadarDataSet[] = [
    {
      name: 'Player A',
      values: [85, 92, 78, 88, 90],
      color: 'rgba(191, 87, 0, 0.7)',
      fillOpacity: 0.5
    },
    {
      name: 'Player B',
      values: [95, 80, 85, 75, 82],
      color: 'rgba(59, 130, 246, 0.7)',
      fillOpacity: 0.5
    },
    {
      name: 'League Average',
      values: [70, 70, 70, 70, 70],
      color: 'rgba(148, 163, 184, 0.5)',
      fillOpacity: 0.2
    }
  ];

  // Sample data for Pitcher Arsenal Radar
  const pitcherCategories = ['Fastball', 'Slider', 'Curveball', 'Changeup', 'Control'];
  const pitcherDatasets: RadarDataSet[] = [
    {
      name: 'Pitcher A',
      values: [95, 85, 70, 78, 88],
      color: 'rgba(220, 38, 38, 0.7)'
    },
    {
      name: 'Pitcher B',
      values: [88, 92, 85, 90, 75],
      color: 'rgba(34, 197, 94, 0.7)'
    }
  ];

  // Sample data for Strike Zone
  const samplePitches: Pitch[] = [
    // Fastballs
    ...Array.from({ length: 30 }, (_, i) => ({
      x: (Math.random() - 0.5) * 1.5,
      y: 1.5 + Math.random() * 2,
      type: '4FB',
      velocity: 92 + Math.random() * 6,
      result: ['ball', 'called_strike', 'swinging_strike', 'foul', 'in_play'][
        Math.floor(Math.random() * 5)
      ] as Pitch['result'],
      spin: 2200 + Math.random() * 400
    })),
    // Sliders
    ...Array.from({ length: 20 }, (_, i) => ({
      x: (Math.random() - 0.5) * 1.8,
      y: 1.2 + Math.random() * 2.5,
      type: 'SL',
      velocity: 82 + Math.random() * 6,
      result: ['ball', 'called_strike', 'swinging_strike', 'foul', 'in_play'][
        Math.floor(Math.random() * 5)
      ] as Pitch['result'],
      spin: 2500 + Math.random() * 300
    })),
    // Changeups
    ...Array.from({ length: 15 }, (_, i) => ({
      x: (Math.random() - 0.5) * 1.6,
      y: 1.3 + Math.random() * 2.2,
      type: 'CH',
      velocity: 78 + Math.random() * 5,
      result: ['ball', 'called_strike', 'swinging_strike', 'foul', 'in_play'][
        Math.floor(Math.random() * 5)
      ] as Pitch['result'],
      spin: 1600 + Math.random() * 400
    })),
    // Curveballs
    ...Array.from({ length: 15 }, (_, i) => ({
      x: (Math.random() - 0.5) * 1.7,
      y: 1.0 + Math.random() * 2.5,
      type: 'CB',
      velocity: 74 + Math.random() * 6,
      result: ['ball', 'called_strike', 'swinging_strike', 'foul', 'in_play'][
        Math.floor(Math.random() * 5)
      ] as Pitch['result'],
      spin: 2700 + Math.random() * 400
    }))
  ];

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, rgba(15, 23, 42, 1) 0%, rgba(30, 41, 59, 1) 100%)',
      padding: '2rem 1rem',
      color: 'rgba(248, 250, 252, 0.95)'
    }}>
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto'
      }}>
        {/* Header */}
        <AnimatedChartWrapper animationType="slide" duration={0.8}>
          <div style={{
            textAlign: 'center',
            marginBottom: '3rem'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '1rem',
              marginBottom: '1rem'
            }}>
              <h1 style={{
                fontSize: 'clamp(2rem, 5vw, 3.5rem)',
                fontWeight: 700,
                background: 'linear-gradient(135deg, #BF5700, #F59E0B)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                margin: 0
              }}>
                Advanced Charts & Visualizations
              </h1>
              <LiveUpdateIndicator isLive={true} />
            </div>
            <p style={{
              fontSize: '1.125rem',
              color: 'rgba(148, 163, 184, 0.9)',
              maxWidth: '800px',
              margin: '0 auto'
            }}>
              Interactive data visualization components powered by Plotly.js, D3, and Framer Motion.
              Optimized for sports analytics with glassmorphism design.
            </p>

            {/* Stats counters */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              gap: '1rem',
              marginTop: '2rem',
              maxWidth: '800px',
              margin: '2rem auto 0'
            }}>
              {[
                { label: 'Components', value: 4, suffix: '' },
                { label: 'Chart Types', value: 8, suffix: '+' },
                { label: 'Animations', value: 12, suffix: '+' },
                { label: 'Data Points', value: 500, suffix: '+' }
              ].map((stat, idx) => (
                <AnimatedChartWrapper key={stat.label} animationType="scale" delay={0.2 + idx * 0.1}>
                  <div style={{
                    background: 'var(--glass-medium, rgba(15, 23, 42, 0.5))',
                    backdropFilter: 'blur(8px)',
                    padding: '1rem',
                    borderRadius: '8px',
                    border: '1px solid rgba(191, 87, 0, 0.2)'
                  }}>
                    <div style={{
                      fontSize: '2rem',
                      fontWeight: 700,
                      color: '#BF5700'
                    }}>
                      <AnimatedCounter to={stat.value} duration={2} suffix={stat.suffix} />
                    </div>
                    <div style={{
                      fontSize: '0.875rem',
                      color: 'rgba(148, 163, 184, 0.9)',
                      marginTop: '0.25rem'
                    }}>
                      {stat.label}
                    </div>
                  </div>
                </AnimatedChartWrapper>
              ))}
            </div>
          </div>
        </AnimatedChartWrapper>

        {/* Charts Grid */}
        <StaggeredChartContainer staggerDelay={0.15}>
          {/* Strike Zone Visualization */}
          <div style={{ marginBottom: '2rem' }}>
            <h2 style={{
              fontSize: '1.75rem',
              fontWeight: 600,
              marginBottom: '1rem',
              color: 'rgba(248, 250, 252, 0.95)'
            }}>
              Strike Zone Visualization
            </h2>
            <p style={{
              fontSize: '1rem',
              color: 'rgba(148, 163, 184, 0.9)',
              marginBottom: '1rem'
            }}>
              Interactive pitch location chart with filtering by pitch type, colored by velocity or result.
              Click on a pitch to see detailed information.
            </p>
            <StrikeZone
              pitches={samplePitches}
              title="Sample Pitcher Arsenal"
              showStrikeZone={true}
              colorBy="type"
              height={550}
              onPitchClick={(pitch) => {
                console.log('Pitch clicked:', pitch);
                alert(`Pitch: ${pitch.type} at ${pitch.velocity}mph`);
              }}
            />
          </div>

          {/* Radar Charts */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))',
            gap: '2rem',
            marginBottom: '2rem'
          }}>
            <div>
              <h2 style={{
                fontSize: '1.75rem',
                fontWeight: 600,
                marginBottom: '1rem',
                color: 'rgba(248, 250, 252, 0.95)'
              }}>
                Player Comparison Radar
              </h2>
              <p style={{
                fontSize: '1rem',
                color: 'rgba(148, 163, 184, 0.9)',
                marginBottom: '1rem'
              }}>
                Multi-dimensional player analysis with up to 6 datasets overlaid.
                Perfect for scouting and talent evaluation.
              </p>
              <RadarChart
                categories={playerCategories}
                datasets={playerDatasets}
                title="5-Tool Player Analysis"
                height={500}
                maxValue={100}
              />
            </div>

            <div>
              <h2 style={{
                fontSize: '1.75rem',
                fontWeight: 600,
                marginBottom: '1rem',
                color: 'rgba(248, 250, 252, 0.95)'
              }}>
                Pitcher Arsenal Radar
              </h2>
              <p style={{
                fontSize: '1rem',
                color: 'rgba(148, 163, 184, 0.9)',
                marginBottom: '1rem'
              }}>
                Compare pitchers across multiple dimensions including pitch quality and control.
              </p>
              <RadarChart
                categories={pitcherCategories}
                datasets={pitcherDatasets}
                title="Pitcher Effectiveness"
                height={500}
                maxValue={100}
              />
            </div>
          </div>

          {/* Heat Maps */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))',
            gap: '2rem',
            marginBottom: '2rem'
          }}>
            <div>
              <h2 style={{
                fontSize: '1.75rem',
                fontWeight: 600,
                marginBottom: '1rem',
                color: 'rgba(248, 250, 252, 0.95)'
              }}>
                Spray Chart Heat Map
              </h2>
              <p style={{
                fontSize: '1rem',
                color: 'rgba(148, 163, 184, 0.9)',
                marginBottom: '1rem'
              }}>
                Visualize batted ball distribution across the field with density overlays.
              </p>
              <HeatMap
                data={sprayChartData}
                title="Batted Ball Distribution"
                type="spray-chart"
                colorScale="hot"
                height={450}
                xLabel="Field Position (ft)"
                yLabel="Distance (ft)"
                onPointClick={(point) => {
                  console.log('Heat map point:', point);
                }}
              />
            </div>

            <div>
              <h2 style={{
                fontSize: '1.75rem',
                fontWeight: 600,
                marginBottom: '1rem',
                color: 'rgba(248, 250, 252, 0.95)'
              }}>
                Pitch Zone Heat Map
              </h2>
              <p style={{
                fontSize: '1rem',
                color: 'rgba(148, 163, 184, 0.9)',
                marginBottom: '1rem'
              }}>
                Analyze pitch location tendencies and identify hot zones.
              </p>
              <HeatMap
                data={pitchZoneData}
                title="Pitch Location Density"
                type="pitch-zone"
                colorScale="diverging"
                height={450}
                xLabel="Horizontal Location"
                yLabel="Vertical Location"
              />
            </div>
          </div>

          {/* Loading States Demo */}
          <div style={{ marginBottom: '2rem' }}>
            <h2 style={{
              fontSize: '1.75rem',
              fontWeight: 600,
              marginBottom: '1rem',
              color: 'rgba(248, 250, 252, 0.95)'
            }}>
              Loading States & Animations
            </h2>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '1rem'
            }}>
              <ChartLoadingSkeleton height={200} />
              <ChartLoadingSkeleton height={200} />
              <ChartLoadingSkeleton height={200} variant="rectangular" />
            </div>
          </div>

          {/* Feature Grid */}
          <div style={{ marginTop: '3rem' }}>
            <h2 style={{
              fontSize: '1.75rem',
              fontWeight: 600,
              marginBottom: '1.5rem',
              textAlign: 'center',
              color: 'rgba(248, 250, 252, 0.95)'
            }}>
              Key Features
            </h2>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '1.5rem'
            }}>
              {[
                {
                  title: 'Interactive',
                  description: 'Hover, click, and zoom on all charts with real-time feedback',
                  icon: '🖱️'
                },
                {
                  title: 'Responsive',
                  description: 'Fully optimized for mobile, tablet, and desktop viewing',
                  icon: '📱'
                },
                {
                  title: 'Animated',
                  description: 'Smooth entrance animations and transitions using Framer Motion',
                  icon: '✨'
                },
                {
                  title: 'Customizable',
                  description: 'Extensive theming options matching your brand palette',
                  icon: '🎨'
                },
                {
                  title: 'Accessible',
                  description: 'WCAG compliant with keyboard navigation and screen reader support',
                  icon: '♿'
                },
                {
                  title: 'Exportable',
                  description: 'Download charts as high-resolution PNG images',
                  icon: '💾'
                }
              ].map((feature, idx) => (
                <AnimatedChartWrapper key={feature.title} animationType="scale" delay={idx * 0.1}>
                  <div style={{
                    background: 'var(--glass-medium, rgba(15, 23, 42, 0.5))',
                    backdropFilter: 'blur(8px)',
                    padding: '1.5rem',
                    borderRadius: '12px',
                    border: '1px solid rgba(191, 87, 0, 0.2)',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>
                      {feature.icon}
                    </div>
                    <h3 style={{
                      fontSize: '1.25rem',
                      fontWeight: 600,
                      marginBottom: '0.5rem',
                      color: '#BF5700'
                    }}>
                      {feature.title}
                    </h3>
                    <p style={{
                      fontSize: '0.875rem',
                      color: 'rgba(148, 163, 184, 0.9)',
                      margin: 0
                    }}>
                      {feature.description}
                    </p>
                  </div>
                </AnimatedChartWrapper>
              ))}
            </div>
          </div>
        </StaggeredChartContainer>
      </div>
    </div>
  );
}
