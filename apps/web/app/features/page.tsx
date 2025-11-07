import Link from 'next/link';
import { recordRuntimeEvent } from '../../lib/observability/datadog-runtime';

const features = [
  {
    category: 'Data & Intelligence',
    items: [
      { name: 'Monte Carlo Simulations', description: '10,000+ scenarios per prediction', proof: '10k sims' },
      { name: 'Real-Time Game Telemetry', description: 'Live scores updated every 30 seconds', proof: '<30s latency' },
      { name: 'Historical Archive', description: '212 verified real games', proof: '212 games' },
      { name: 'Multi-Provider Failover', description: 'Automatic data source redundancy', proof: '99.9% uptime' },
      { name: 'Source Transparency', description: 'Every metric shows its source and timestamp', proof: '100% attributed' }
    ]
  },
  {
    category: 'AI & Analytics',
    items: [
      { name: 'AI Copilot', description: 'Choose Gemini, GPT-5, or Claude', proof: '3 providers' },
      { name: 'Natural Language Queries', description: 'Ask questions, get sourced answers', proof: 'NLQ' },
      { name: 'Automated Insights', description: 'AI-generated game recaps and briefings', proof: 'NLG' },
      { name: 'Clutch Performance (LEI)', description: 'Leverage & Intensity metrics with wearables', proof: 'Whoop integration' },
      { name: 'Win Probability Engine', description: 'Live WebSocket updates during games', proof: 'Real-time WP' }
    ]
  },
  {
    category: 'Platform & Performance',
    items: [
      { name: 'Edge Caching', description: 'Cloudflare KV for sub-100ms response', proof: '<100ms p95' },
      { name: 'Mobile-First Design', description: 'Optimized for thumb navigation', proof: 'Core Web Vitals' },
      { name: 'Dark Mode Native', description: 'High-contrast, WCAG 2.2 AA compliant', proof: 'AA compliant' },
      { name: '3D Visualizations', description: 'Babylon.js stadium rendering, pitch tunnels', proof: 'WebGPU' },
      { name: 'API Access', description: 'REST + WebSocket endpoints', proof: 'Full API' }
    ]
  }
];

const pricingTiers = [
  {
    name: 'Scout',
    price: 'Free',
    description: 'Essential analytics for fans',
    features: [
      'Live scores and standings',
      'Basic historical comparisons',
      '10 AI Copilot queries/day',
      'Public dashboards',
      'Mobile app access'
    ],
    cta: 'Start Free',
    href: '/auth/sign-up',
    highlight: false
  },
  {
    name: 'Coach',
    price: '$49/mo',
    description: 'Advanced analytics for serious analysts',
    features: [
      'Everything in Scout',
      'Unlimited AI Copilot queries',
      'Monte Carlo playoff scenarios',
      'Historical deep dives (all games)',
      'LEI clutch performance metrics',
      'Export reports (PDF, CSV)',
      'Priority support'
    ],
    cta: 'Start Free Trial',
    href: '/auth/sign-up?tier=coach',
    highlight: true
  },
  {
    name: 'Organization',
    price: 'Custom',
    description: 'Team collaboration and custom integrations',
    features: [
      'Everything in Coach',
      'Team collaboration workspace',
      'API access (REST + WebSocket)',
      'Custom data integrations',
      'White-label reports',
      'Dedicated support',
      'SLA guarantees'
    ],
    cta: 'Contact Sales',
    href: '/contact?tier=organization',
    highlight: false
  }
];

const comparisonRows = [
  { feature: 'Monte Carlo Simulations', statusQuo: 'Single-point predictions', bsi: '10,000 scenario runs with probability distributions' },
  { feature: 'Data Transparency', statusQuo: 'Black-box metrics', bsi: 'Every metric shows source + timestamp' },
  { feature: 'AI Provider Choice', statusQuo: 'Locked to one model', bsi: 'Choose Gemini, GPT-5, or Claude per query' },
  { feature: 'Historical Data', statusQuo: 'Aggregate stats only', bsi: '212 real games with play-by-play context' },
  { feature: 'Mobile Experience', statusQuo: 'Desktop-first, clunky mobile', bsi: 'Thumb-optimized, <2.5s LCP on mobile' },
  { feature: 'Live Updates', statusQuo: 'Manual refresh, 5+ min lag', bsi: 'WebSocket updates every 30 seconds' }
];

export default function FeaturesPage() {
  void recordRuntimeEvent('route_render', { route: '/features' });

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Product',
            name: 'Blaze Sports Intel Championship Analytics Platform',
            description: 'Real-time sports analytics with AI copilot, Monte Carlo simulations, and historical research for baseball, football, and basketball.',
            brand: {
              '@type': 'Brand',
              name: 'Blaze Sports Intel'
            },
            offers: {
              '@type': 'AggregateOffer',
              priceCurrency: 'USD',
              lowPrice: '0',
              highPrice: '49',
              offerCount: '3',
              offers: pricingTiers.map((tier) => ({
                '@type': 'Offer',
                name: tier.name,
                price: tier.price === 'Free' ? '0' : tier.price === 'Custom' ? '0' : tier.price.replace(/[^0-9]/g, ''),
                priceCurrency: 'USD',
                description: tier.description,
                url: `https://blazesportsintel.com${tier.href}`
              }))
            }
          })
        }}
      />
      <div className="di-page">
        <div className="di-section">
          <span className="di-kicker">Platform Features</span>
          <h1 className="di-title">Championship Analytics, Built Different</h1>
          <p className="di-subtitle">
            Real data. Source transparency. Provider choice. Here's what sets Blaze Sports Intel apart from the status quo.
          </p>
        </div>

        <section className="di-section">
          <h2 className="di-page-title">Features vs. Status Quo</h2>
          <div style={{
            overflowX: 'auto',
            background: 'var(--di-surface)',
            border: '1px solid var(--di-border)',
            borderRadius: 'var(--di-radius)',
            padding: '1.5rem'
          }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '0.95rem'
            }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--di-border)' }}>
                  <th style={{ textAlign: 'left', padding: '1rem', color: 'var(--di-text-muted)', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.08em' }}>Feature</th>
                  <th style={{ textAlign: 'left', padding: '1rem', color: 'var(--di-text-muted)', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.08em' }}>Status Quo</th>
                  <th style={{ textAlign: 'left', padding: '1rem', color: 'var(--di-accent)', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.08em' }}>Blaze Sports Intel</th>
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map((row, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid var(--di-border)' }}>
                    <td style={{ padding: '1rem', fontWeight: 600 }}>{row.feature}</td>
                    <td style={{ padding: '1rem', color: 'var(--di-text-muted)' }}>{row.statusQuo}</td>
                    <td style={{ padding: '1rem', color: 'var(--di-text)' }}>{row.bsi}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="di-section">
          <h2 className="di-page-title">Complete Feature Set</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {features.map((category) => (
              <div key={category.category}>
                <h3 className="di-kicker" style={{ marginBottom: '1rem' }}>{category.category}</h3>
                <div className="di-card-grid">
                  {category.items.map((item) => (
                    <article key={item.name} className="di-card">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                        <h4 style={{ fontWeight: 600, fontSize: '1.05rem' }}>{item.name}</h4>
                        <span className="di-pill" style={{ fontSize: '0.7rem', padding: '0.25rem 0.6rem' }}>{item.proof}</span>
                      </div>
                      <p>{item.description}</p>
                    </article>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="di-section">
          <h2 className="di-page-title">Pricing</h2>
          <p className="di-page-subtitle">Choose the plan that fits your workflow. All plans include core analytics and can be upgraded anytime.</p>
          <div className="di-card-grid" style={{ marginTop: '2rem' }}>
            {pricingTiers.map((tier) => (
              <article
                key={tier.name}
                className="di-card"
                style={{
                  border: tier.highlight ? '2px solid var(--di-accent)' : '1px solid var(--di-border)',
                  position: 'relative'
                }}
              >
                {tier.highlight && (
                  <span className="di-pill" style={{
                    position: 'absolute',
                    top: '-0.75rem',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'linear-gradient(135deg, var(--di-accent), #f59e0b)',
                    color: '#0b1120'
                  }}>
                    Most Popular
                  </span>
                )}
                <div>
                  <h3 style={{ fontFamily: 'var(--di-font-heading)', fontSize: '1.5rem' }}>{tier.name}</h3>
                  <p style={{ color: 'var(--di-text-muted)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>{tier.description}</p>
                  <p style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--di-accent)', marginTop: '1rem' }}>
                    {tier.price}
                    {tier.price !== 'Free' && tier.price !== 'Custom' && <span style={{ fontSize: '1rem', fontWeight: 400, color: 'var(--di-text-muted)' }}>/month</span>}
                  </p>
                </div>
                <ul className="di-list" style={{ marginTop: '1.5rem', marginBottom: '1.5rem' }}>
                  {tier.features.map((feature) => (
                    <li key={feature}>{feature}</li>
                  ))}
                </ul>
                <Link
                  className="di-action"
                  href={tier.href}
                  style={{
                    marginTop: 'auto',
                    textAlign: 'center',
                    ...(tier.highlight ? {} : {
                      background: 'transparent',
                      color: 'var(--di-text)',
                      border: '1px solid var(--di-border)'
                    })
                  }}
                >
                  {tier.cta}
                </Link>
              </article>
            ))}
          </div>
        </section>

        <section className="di-section">
          <div className="di-card" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
            <h2 className="di-page-title" style={{ marginBottom: '1rem' }}>Ready to Get Started?</h2>
            <p className="di-page-subtitle" style={{ marginBottom: '2rem', maxWidth: '50ch', marginLeft: 'auto', marginRight: 'auto' }}>
              Try the platform free with the Scout plan, or jump straight to advanced analytics with a 14-day Coach trial.
            </p>
            <div className="di-actions" style={{ justifyContent: 'center' }}>
              <Link className="di-action" href="/copilot">
                Try Copilot Now
              </Link>
              <Link className="di-action di-action--secondary" href="/command-center">
                View Live Scores
              </Link>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
