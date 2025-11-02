'use client';

import { useState } from 'react';
import Stadium3D from '@/components/visuals/Stadium3D';
import ParticleField from '@/components/visuals/ParticleField';
import GlassmorphicCard, { StatCard } from '@/components/visuals/GlassmorphicCard';
import HolographicProjection from '@/components/visuals/HolographicProjection';
import WinProbabilityWave from '@/components/visuals/WinProbabilityWave';
import NeuralConnectionMap from '@/components/visuals/NeuralConnectionMap';
import MomentumIndicator from '@/components/visuals/MomentumIndicator';
import CinematicTransition from '@/components/visuals/CinematicTransition';
import {
  BaseballSwing,
  BasketballBounce,
  FootballSpiral,
  ScoreCounter,
  WinCelebration,
  LivePulse,
  StatChangeFlash,
  SportsLoadingSpinner,
  TeamHoverCard,
  MomentumArrow,
  ScoreboardFlip,
} from '@/components/visuals/SportsMicroInteractions';
import '@/lib/visuals/shaderEffects.css';
import styles from './page.module.css';

/**
 * Next-Gen Visuals Showcase
 * Comprehensive demonstration of all cutting-edge visual components
 */
export default function VisualsShowcase() {
  const [showParticles, setShowParticles] = useState(true);
  const [showTransition, setShowTransition] = useState(false);
  const [transitionType, setTransitionType] = useState<'wipe' | 'iris' | 'curtain' | 'shatter' | 'ripple'>('wipe');
  const [showCelebration, setShowCelebration] = useState(false);

  // Mock data for visualizations
  const mockWinProbData = Array.from({ length: 20 }, (_, i) => ({
    time: `${i * 5}'`,
    homeTeamProb: 0.5 + Math.sin(i * 0.5) * 0.3,
    awayTeamProb: 0.5 - Math.sin(i * 0.5) * 0.3,
    event: i % 5 === 0 ? 'Goal!' : undefined,
    leverage: Math.random(),
  }));

  const mockHoloData = [
    { label: 'Q1', value: 28, color: '#BF5700' },
    { label: 'Q2', value: 21, color: '#FF7D3C' },
    { label: 'Q3', value: 35, color: '#B0E0E6' },
    { label: 'Q4', value: 24, color: '#FFD700' },
  ];

  const mockPlayers = [
    { id: '1', name: 'John Smith', position: 'PG' },
    { id: '2', name: 'Mike Johnson', position: 'SG' },
    { id: '3', name: 'David Williams', position: 'SF' },
    { id: '4', name: 'Chris Brown', position: 'PF' },
    { id: '5', name: 'James Davis', position: 'C' },
  ];

  const mockConnections = [
    { from: '1', to: '2', strength: 0.8, type: 'pass' as const },
    { from: '1', to: '3', strength: 0.6, type: 'assist' as const },
    { from: '2', to: '4', strength: 0.7, type: 'pass' as const },
    { from: '3', to: '5', strength: 0.9, type: 'assist' as const },
    { from: '4', to: '5', strength: 0.5, type: 'block' as const },
  ];

  return (
    <div className={styles.container}>
      {/* Particle Background */}
      {showParticles && (
        <ParticleField
          particleCount={80}
          colors={['#BF5700', '#FF7D3C', '#B0E0E6']}
          speed={0.3}
        />
      )}

      {/* Header */}
      <header className={styles.header}>
        <h1 className="holographic-text">Blaze Sports Intel</h1>
        <h2 className={styles.subtitle}>Next-Gen Visuals Showcase</h2>
        <p className={styles.description}>
          Revolutionary visual design that sets us apart from the entire sports industry
        </p>
      </header>

      {/* Controls */}
      <div className={styles.controls}>
        <button
          className={styles.button}
          onClick={() => setShowParticles(!showParticles)}
        >
          {showParticles ? 'Hide' : 'Show'} Particles
        </button>
        <button
          className={styles.button}
          onClick={() => {
            setShowTransition(true);
            setTimeout(() => setShowTransition(false), 1000);
          }}
        >
          Trigger Transition
        </button>
        <select
          className={styles.select}
          value={transitionType}
          onChange={(e) => setTransitionType(e.target.value as any)}
        >
          <option value="wipe">Wipe</option>
          <option value="iris">Iris</option>
          <option value="curtain">Curtain</option>
          <option value="shatter">Shatter</option>
          <option value="ripple">Ripple</option>
        </select>
        <button
          className={styles.button}
          onClick={() => {
            setShowCelebration(true);
            setTimeout(() => setShowCelebration(false), 3000);
          }}
        >
          🎉 Celebrate
        </button>
      </div>

      {/* Main Content Grid */}
      <div className={styles.grid}>
        {/* Section 1: 3D Visualizations */}
        <section className={styles.section}>
          <h3 className="neon-text" style={{ '--neon-color': '#BF5700' } as React.CSSProperties}>
            3D Stadium Visualizations
          </h3>
          <div className={styles.showcase}>
            <Stadium3D
              sport="baseball"
              teamColors={{ primary: '#BF5700', secondary: '#FF7D3C' }}
              width={600}
              height={400}
              showParticles
              animated
            />
            <p className={styles.caption}>
              Fully interactive 3D baseball diamond with real-time lighting and particle effects
            </p>
          </div>
        </section>

        {/* Section 2: Glassmorphic Cards */}
        <section className={styles.section}>
          <h3 className="neon-text" style={{ '--neon-color': '#FF7D3C' } as React.CSSProperties}>
            Glassmorphic Stat Cards
          </h3>
          <div className={styles.cardGrid}>
            <StatCard
              label="Points"
              value="124"
              trend="up"
              trendValue="+12%"
              variant="default"
              icon="🏀"
            />
            <StatCard
              label="Win Rate"
              value="87.5%"
              trend="up"
              trendValue="+5.2%"
              variant="elevated"
              icon="📈"
            />
            <StatCard
              label="Momentum"
              value="+42"
              trend="up"
              trendValue="Hot"
              variant="neon"
              icon="🔥"
            />
            <StatCard
              label="Ranking"
              value="#3"
              trend="up"
              trendValue="+1"
              variant="holographic"
              icon="⭐"
            />
          </div>
        </section>

        {/* Section 3: Holographic Projections */}
        <section className={styles.section}>
          <h3 className="neon-text" style={{ '--neon-color': '#00FFFF' } as React.CSSProperties}>
            Holographic Data Projections
          </h3>
          <div className={styles.holoGrid}>
            <HolographicProjection
              data={mockHoloData}
              title="Quarter Scoring"
              type="bar"
              animated
              width={400}
              height={300}
            />
            <HolographicProjection
              data={mockHoloData}
              title="Score Distribution"
              type="circle"
              animated
              width={400}
              height={300}
            />
          </div>
        </section>

        {/* Section 4: Win Probability Wave */}
        <section className={styles.section}>
          <h3 className="neon-text" style={{ '--neon-color': '#B0E0E6' } as React.CSSProperties}>
            Win Probability Wave
          </h3>
          <WinProbabilityWave
            data={mockWinProbData}
            homeTeam={{ name: 'Texas', color: '#BF5700' }}
            awayTeam={{ name: 'Oklahoma', color: '#B0E0E6' }}
            width={900}
            height={400}
            animated
            showEvents
          />
        </section>

        {/* Section 5: Neural Connection Map */}
        <section className={styles.section}>
          <h3 className="neon-text" style={{ '--neon-color': '#FFD700' } as React.CSSProperties}>
            Team Chemistry Network
          </h3>
          <NeuralConnectionMap
            players={mockPlayers}
            connections={mockConnections}
            width={600}
            height={600}
            animated
            interactive
          />
        </section>

        {/* Section 6: Momentum Indicators */}
        <section className={styles.section}>
          <h3 className="neon-text" style={{ '--neon-color': '#FF6B6B' } as React.CSSProperties}>
            Physics-Based Momentum
          </h3>
          <div className={styles.momentumGrid}>
            <MomentumIndicator
              momentum={35}
              homeTeam={{ name: 'Texas', color: '#BF5700' }}
              awayTeam={{ name: 'Oklahoma', color: '#B0E0E6' }}
              size="large"
              animated
            />
          </div>
        </section>

        {/* Section 7: Micro-Interactions */}
        <section className={styles.section}>
          <h3 className="neon-text" style={{ '--neon-color': '#9B59B6' } as React.CSSProperties}>
            Sports Micro-Interactions
          </h3>
          <div className={styles.microGrid}>
            <div className={styles.microItem}>
              <BaseballSwing />
              <p>Baseball Swing</p>
            </div>
            <div className={styles.microItem}>
              <BasketballBounce score={87} />
              <p>Basketball Bounce</p>
            </div>
            <div className={styles.microItem}>
              <FootballSpiral isActive />
              <p>Football Spiral</p>
            </div>
            <div className={styles.microItem}>
              <ScoreCounter score={42} teamColor="#BF5700" />
              <p>Score Counter</p>
            </div>
            <div className={styles.microItem}>
              <LivePulse isLive />
              <p>Live Indicator</p>
            </div>
            <div className={styles.microItem}>
              <StatChangeFlash value="124" change="up" />
              <p>Stat Change</p>
            </div>
            <div className={styles.microItem}>
              <SportsLoadingSpinner sport="basketball" />
              <p>Loading Spinner</p>
            </div>
            <div className={styles.microItem}>
              <MomentumArrow direction="up" />
              <p>Momentum Arrow</p>
            </div>
            <div className={styles.microItem}>
              <ScoreboardFlip score={21} />
              <p>Scoreboard Flip</p>
            </div>
          </div>
        </section>

        {/* Section 8: CSS Shader Effects */}
        <section className={styles.section}>
          <h3 className="neon-text" style={{ '--neon-color': '#FF7D3C' } as React.CSSProperties}>
            Advanced Shader Effects
          </h3>
          <div className={styles.shaderGrid}>
            <div className="frosted-glass" style={{ padding: '2rem', borderRadius: '16px' }}>
              <h4>Frosted Glass</h4>
              <p>Glassmorphic backdrop blur effect</p>
            </div>
            <div className="plasma-gradient" style={{ padding: '2rem', borderRadius: '16px' }}>
              <h4>Plasma Gradient</h4>
              <p>Animated flowing colors</p>
            </div>
            <div className="neon-border" style={{ '--neon-color': '#BF5700', padding: '2rem', borderRadius: '16px' } as React.CSSProperties}>
              <h4>Neon Border</h4>
              <p>Glowing pulsing border</p>
            </div>
            <div className="energy-pulse" style={{ '--pulse-color': '#00FFFF', padding: '2rem', borderRadius: '16px', background: 'rgba(0, 255, 255, 0.1)' } as React.CSSProperties}>
              <h4>Energy Pulse</h4>
              <p>Pulsating glow effect</p>
            </div>
            <div className="particle-border" style={{ padding: '2rem', borderRadius: '16px' }}>
              <h4>Particle Border</h4>
              <p>Animated gradient border</p>
            </div>
            <div className="scanlines" style={{ padding: '2rem', borderRadius: '16px', background: '#0A0E1A' }}>
              <h4>Scanlines</h4>
              <p>Retro CRT monitor effect</p>
            </div>
          </div>
        </section>

        {/* Section 9: Team Hover Cards */}
        <section className={styles.section}>
          <h3 className="neon-text" style={{ '--neon-color': '#10B981' } as React.CSSProperties}>
            Interactive Team Cards
          </h3>
          <div className={styles.teamGrid}>
            <TeamHoverCard teamColor="#BF5700">
              <h4>Texas Longhorns</h4>
              <p>12-2 Record</p>
              <p>Big 12 Champions</p>
            </TeamHoverCard>
            <TeamHoverCard teamColor="#B0E0E6">
              <h4>Oklahoma Sooners</h4>
              <p>10-4 Record</p>
              <p>Big 12 Runner-up</p>
            </TeamHoverCard>
            <TeamHoverCard teamColor="#FFD700">
              <h4>Kansas Jayhawks</h4>
              <p>9-5 Record</p>
              <p>Bowl Eligible</p>
            </TeamHoverCard>
          </div>
        </section>
      </div>

      {/* Cinematic Transitions */}
      <CinematicTransition
        show={showTransition}
        type={transitionType}
        duration={1000}
      />

      {/* Win Celebration */}
      <WinCelebration show={showCelebration} />

      {/* Footer */}
      <footer className={styles.footer}>
        <p className="shimmer-text">
          Powered by Blaze Sports Intel - Where Innovation Meets Sports Analytics
        </p>
      </footer>
    </div>
  );
}
