import React from 'react';
import SportSwitcher from '../components/SportSwitcher';
import './tools.css';

const ToolsShowcase = () => {
  const tools = [
    {
      id: 'college-baseball',
      title: 'Live College Baseball Box Scores',
      description: 'Comprehensive game tracking that fills ESPN\'s coverage void. Real-time play-by-play, advanced metrics (OPS, WHIP, K/9, BB%), pitch counts, and lineup cards. The only source for complete digital coverage of college baseball.',
      icon: '⚾',
      badge: 'Core Differentiator',
      features: [
        'Real-time play-by-play updates',
        'Advanced metrics: OPS, WHIP, K/9, BB%',
        'Pitch count tracking',
        'Searchable by conference/team/date'
      ],
      status: 'production',
      link: '/baseball'
    },
    {
      id: 'win-probability',
      title: 'Win Probability Engine',
      description: 'Monte Carlo game simulator with live probability curves. Input any matchup to get win probability distribution, expected margin, and upset likelihood. Pitch-by-pitch model for college baseball—no competitor offers this level of granularity.',
      icon: '📊',
      badge: 'Unique Technology',
      features: [
        'Monte Carlo simulation engine',
        'Live probability curves',
        'Pitch-by-pitch modeling',
        'Cross-sport support (Baseball, MLB, NFL)'
      ],
      status: 'production',
      link: '#win-probability'
    },
    {
      id: 'player-projections',
      title: 'Player Development Projections',
      description: 'ML models that predict trajectory and injury risk for college prospects. Searchable database with development curves, MLB draft projections, and injury risk scores based on workload and biomechanics. Surfaces intelligence for under-covered programs.',
      icon: '🎯',
      badge: 'Predictive Intelligence',
      features: [
        'Development curve predictions',
        'MLB draft projections',
        'Injury risk scoring',
        'Workload & biomechanics analysis'
      ],
      status: 'production',
      link: '#player-projections'
    },
    {
      id: 'recruiting-tracker',
      title: 'Cross-Sport Recruiting Tracker',
      description: 'Aggregated recruiting intelligence across football, baseball, and basketball. Live class rankings, transfer portal activity, composite ratings, and commits by date. Filterable by sport, position, rating, and geography—with emphasis on Group of Five and FCS programs mainstream sites ignore.',
      icon: '🎓',
      badge: 'Comprehensive Coverage',
      features: [
        'Live class rankings',
        'Transfer portal tracking',
        'Composite ratings',
        'Group of Five & FCS focus'
      ],
      status: 'production',
      link: '#recruiting'
    },
    {
      id: 'breaking-news',
      title: 'Breaking News Push Alerts',
      description: 'Mobile notification system with game updates, roster moves, injuries, and recruiting commits. Customize by team, sport, and alert type. Connects to our Trend and Highlights Analyzer for automated content generation with editorial voice. Time-stamped in America/Chicago.',
      icon: '🔔',
      badge: 'Real-Time Intelligence',
      features: [
        'Customizable notifications',
        'Automated content generation',
        'Multi-sport coverage',
        'Smart noise filtering'
      ],
      status: 'production',
      link: '#alerts'
    }
  ];

  return (
    <>
      <SportSwitcher currentSport="tools" />
      <div className="tools-showcase">
      <div className="hero-section">
        <h1 className="hero-title">Production Sports Tools</h1>
        <p className="hero-subtitle">
          Five production-ready tools built on Cloudflare Workers/D1/KV/R2,
          addressing mainstream coverage gaps in college sports analytics.
        </p>
      </div>

      <div className="tools-grid">
        {tools.map((tool) => (
          <div key={tool.id} className="tool-card">
            <div className="tool-header">
              <span className="tool-icon">{tool.icon}</span>
              <span className="tool-badge">{tool.badge}</span>
            </div>

            <h3 className="tool-title">{tool.title}</h3>
            <p className="tool-description">{tool.description}</p>

            <ul className="tool-features">
              {tool.features.map((feature, idx) => (
                <li key={idx}>{feature}</li>
              ))}
            </ul>

            <div className="tool-footer">
              <span className="tool-status">{tool.status}</span>
              <a href={tool.link} className="tool-cta">
                Explore Tool →
              </a>
            </div>
          </div>
        ))}
      </div>

      <section className="coverage-gap-section">
        <h2>Addressing Coverage Gaps</h2>
        <div className="gap-highlights">
          <div className="gap-card">
            <h3>College Baseball Digital Coverage</h3>
            <p>
              ESPN and major outlets provide minimal digital coverage for college baseball
              despite it being revenue-generating. Our Live Box Scores (#1), Win Probability
              Engine (#2), and Player Projections (#3) fill this void with comprehensive,
              real-time analytics.
            </p>
          </div>
          <div className="gap-card">
            <h3>Group of Five & FCS Programs</h3>
            <p>
              Mainstream recruiting sites focus on Power 5 conferences. Our Cross-Sport
              Recruiting Tracker (#4) highlights Group of Five and FCS programs, providing
              equal visibility to under-covered talent pipelines.
            </p>
          </div>
          <div className="gap-card">
            <h3>Real-Time Intelligence</h3>
            <p>
              Our Breaking News Push Alerts (#5) connects to the Trend and Highlights
              Analyzer for automated, editorially-voiced content generation—delivering
              insights before mainstream outlets even notice the story.
            </p>
          </div>
        </div>
      </section>

      <section className="tech-stack-section">
        <h2>Built on Modern Infrastructure</h2>
        <p className="tech-description">
          All five tools run on Cloudflare's edge network for global performance:
        </p>
        <div className="tech-stack">
          <span className="tech-badge">Cloudflare Workers</span>
          <span className="tech-badge">D1 Database</span>
          <span className="tech-badge">KV Storage</span>
          <span className="tech-badge">R2 Object Storage</span>
          <span className="tech-badge">React 19</span>
          <span className="tech-badge">ML Models</span>
        </div>
      </section>
    </div>
    </>
  );
};

export default ToolsShowcase;
