'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Script from 'next/script';

const endpoints = [
  {
    method: 'GET',
    path: '/api/healthz',
    description: 'Check if all BSI services are running properly',
    useCase: 'Monitor system status before making requests',
    color: 'emerald',
  },
  {
    method: 'GET',
    path: '/api/health/{service}',
    description: 'Check a specific service (database, cache, etc.)',
    useCase: 'Diagnose issues with particular components',
    color: 'emerald',
  },
  {
    method: 'POST',
    path: '/api/vision/access-request',
    description: 'Request access to Blaze Vision AI tools',
    useCase: 'Apply for early access to neural coaching features',
    color: 'orange',
  },
];

const quickAnswers = [
  {
    question: 'What is an API?',
    answer:
      'An API lets apps talk to each other. When you check scores in an app, it uses our API to fetch that data.',
  },
  {
    question: 'Do I need to be a developer?',
    answer:
      'For basic status checks, no. The interactive docs below let you test endpoints with one click.',
  },
  {
    question: 'Is it free?',
    answer:
      'Public endpoints are free with rate limits. Pro access unlocks faster limits and more data.',
  },
];

export default function ApiDocsPage() {
  const [swaggerLoaded, setSwaggerLoaded] = useState(false);
  const [activeSection, setActiveSection] = useState<'guide' | 'reference'>('guide');

  useEffect(() => {
    const initSwagger = () => {
      if (typeof window !== 'undefined' && (window as any).SwaggerUIBundle) {
        (window as any).SwaggerUIBundle({
          url: '/openapi.json',
          dom_id: '#swagger-ui',
          deepLinking: true,
          presets: [(window as any).SwaggerUIBundle.presets.apis],
          plugins: [(window as any).SwaggerUIBundle.plugins.DownloadUrl],
          defaultModelsExpandDepth: -1,
          docExpansion: 'list',
        });
        setSwaggerLoaded(true);
      }
    };

    if ((window as any).SwaggerUIBundle) {
      initSwagger();
    } else {
      window.addEventListener('swagger-loaded', initSwagger);
      return () => window.removeEventListener('swagger-loaded', initSwagger);
    }
  }, []);

  return (
    <>
      <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui.css" />
      <Script
        src="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-bundle.js"
        strategy="afterInteractive"
        onLoad={() => {
          window.dispatchEvent(new Event('swagger-loaded'));
        }}
      />

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&family=Source+Sans+3:wght@400;500;600&display=swap');

        :root {
          --bsi-orange: #bf5700;
          --bsi-orange-light: #ff6b35;
          --bsi-charcoal: #1a1a1a;
          --bsi-midnight: #0d0d0d;
          --bsi-graphite: #2a2a2a;
          --bsi-text: #e5e5e5;
          --bsi-text-muted: #9ca3af;
          --bsi-border: #333;
        }

        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
          padding: 0;
          background: var(--bsi-midnight);
          color: var(--bsi-text);
          font-family:
            'Source Sans 3',
            -apple-system,
            sans-serif;
          line-height: 1.6;
        }

        /* Header */
        .docs-header {
          background: linear-gradient(180deg, var(--bsi-charcoal) 0%, var(--bsi-midnight) 100%);
          border-bottom: 1px solid var(--bsi-border);
          padding: 16px 24px;
          position: sticky;
          top: 0;
          z-index: 100;
        }

        .docs-header-inner {
          max-width: 1400px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .docs-logo {
          font-family: 'Oswald', sans-serif;
          font-size: 20px;
          font-weight: 700;
          color: white;
          text-decoration: none;
          letter-spacing: 0.05em;
        }

        .docs-logo span {
          color: var(--bsi-orange);
        }

        .docs-nav {
          display: flex;
          gap: 8px;
        }

        .docs-nav a {
          color: var(--bsi-text-muted);
          text-decoration: none;
          font-size: 14px;
          padding: 8px 16px;
          border-radius: 6px;
          transition: all 0.2s;
        }

        .docs-nav a:hover {
          color: white;
          background: var(--bsi-graphite);
        }

        /* Hero Section */
        .docs-hero {
          background:
            radial-gradient(ellipse at top, rgba(191, 87, 0, 0.15) 0%, transparent 60%),
            var(--bsi-midnight);
          padding: 80px 24px 60px;
          text-align: center;
        }

        .docs-hero-badge {
          display: inline-block;
          background: var(--bsi-orange);
          color: white;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          padding: 6px 14px;
          border-radius: 4px;
          margin-bottom: 20px;
        }

        .docs-hero h1 {
          font-family: 'Oswald', sans-serif;
          font-size: clamp(32px, 5vw, 48px);
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.02em;
          margin: 0 0 16px;
          color: white;
        }

        .docs-hero h1 span {
          background: linear-gradient(135deg, var(--bsi-orange) 0%, var(--bsi-orange-light) 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .docs-hero p {
          font-size: 18px;
          color: var(--bsi-text-muted);
          max-width: 600px;
          margin: 0 auto 32px;
        }

        /* Tab Navigation */
        .docs-tabs {
          display: flex;
          justify-content: center;
          gap: 4px;
          background: var(--bsi-graphite);
          padding: 4px;
          border-radius: 10px;
          max-width: 320px;
          margin: 0 auto;
        }

        .docs-tab {
          flex: 1;
          padding: 12px 24px;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          background: transparent;
          color: var(--bsi-text-muted);
        }

        .docs-tab:hover {
          color: white;
        }

        .docs-tab.active {
          background: var(--bsi-orange);
          color: white;
        }

        /* Main Content */
        .docs-content {
          max-width: 1200px;
          margin: 0 auto;
          padding: 48px 24px;
        }

        /* Quick Answers Grid */
        .quick-answers {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 20px;
          margin-bottom: 48px;
        }

        .quick-answer {
          background: var(--bsi-graphite);
          border: 1px solid var(--bsi-border);
          border-radius: 12px;
          padding: 24px;
          transition:
            transform 0.2s,
            border-color 0.2s;
        }

        .quick-answer:hover {
          transform: translateY(-2px);
          border-color: var(--bsi-orange);
        }

        .quick-answer h3 {
          font-family: 'Oswald', sans-serif;
          font-size: 16px;
          font-weight: 600;
          color: var(--bsi-orange);
          margin: 0 0 8px;
          text-transform: uppercase;
          letter-spacing: 0.02em;
        }

        .quick-answer p {
          font-size: 15px;
          color: var(--bsi-text-muted);
          margin: 0;
          line-height: 1.5;
        }

        /* Section Headers */
        .section-header {
          margin-bottom: 32px;
        }

        .section-header h2 {
          font-family: 'Oswald', sans-serif;
          font-size: 24px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.02em;
          color: white;
          margin: 0 0 8px;
        }

        .section-header p {
          font-size: 16px;
          color: var(--bsi-text-muted);
          margin: 0;
        }

        /* Endpoints List */
        .endpoints-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-bottom: 48px;
        }

        .endpoint-card {
          background: var(--bsi-graphite);
          border: 1px solid var(--bsi-border);
          border-radius: 12px;
          padding: 24px;
          display: grid;
          grid-template-columns: auto 1fr auto;
          gap: 20px;
          align-items: center;
          transition: border-color 0.2s;
        }

        .endpoint-card:hover {
          border-color: var(--bsi-orange);
        }

        .endpoint-method {
          font-family: 'Source Sans 3', monospace;
          font-size: 12px;
          font-weight: 700;
          padding: 6px 12px;
          border-radius: 6px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .endpoint-method.emerald {
          background: rgba(16, 185, 129, 0.15);
          color: #10b981;
        }

        .endpoint-method.orange {
          background: rgba(191, 87, 0, 0.15);
          color: var(--bsi-orange);
        }

        .endpoint-info h3 {
          font-family: 'Source Sans 3', monospace;
          font-size: 16px;
          font-weight: 600;
          color: white;
          margin: 0 0 6px;
        }

        .endpoint-info p {
          font-size: 14px;
          color: var(--bsi-text-muted);
          margin: 0 0 4px;
        }

        .endpoint-info .use-case {
          font-size: 13px;
          color: var(--bsi-text-muted);
          opacity: 0.7;
          font-style: italic;
        }

        .endpoint-action {
          color: var(--bsi-orange);
          font-size: 14px;
          font-weight: 600;
          text-decoration: none;
          white-space: nowrap;
          transition: opacity 0.2s;
        }

        .endpoint-action:hover {
          opacity: 0.8;
        }

        /* Try It Section */
        .try-it-section {
          background: linear-gradient(135deg, var(--bsi-graphite) 0%, var(--bsi-charcoal) 100%);
          border: 1px solid var(--bsi-border);
          border-radius: 16px;
          padding: 32px;
          text-align: center;
          margin-bottom: 48px;
        }

        .try-it-section h3 {
          font-family: 'Oswald', sans-serif;
          font-size: 20px;
          font-weight: 700;
          text-transform: uppercase;
          color: white;
          margin: 0 0 12px;
        }

        .try-it-section p {
          font-size: 15px;
          color: var(--bsi-text-muted);
          margin: 0 0 20px;
        }

        .try-it-button {
          display: inline-block;
          background: var(--bsi-orange);
          color: white;
          font-size: 14px;
          font-weight: 600;
          padding: 14px 28px;
          border-radius: 8px;
          text-decoration: none;
          transition:
            background 0.2s,
            transform 0.2s;
        }

        .try-it-button:hover {
          background: var(--bsi-orange-light);
          transform: translateY(-1px);
        }

        /* Swagger UI Container */
        .swagger-container {
          background: white;
          border-radius: 16px;
          overflow: hidden;
          margin-top: 48px;
        }

        .swagger-intro {
          background: var(--bsi-graphite);
          padding: 24px 32px;
          border-bottom: 1px solid var(--bsi-border);
        }

        .swagger-intro h3 {
          font-family: 'Oswald', sans-serif;
          font-size: 18px;
          font-weight: 700;
          text-transform: uppercase;
          color: white;
          margin: 0 0 8px;
        }

        .swagger-intro p {
          font-size: 14px;
          color: var(--bsi-text-muted);
          margin: 0;
        }

        #swagger-ui {
          min-height: 600px;
        }

        /* Swagger UI Overrides */
        .swagger-ui {
          font-family: 'Source Sans 3', sans-serif !important;
        }

        .swagger-ui .info {
          margin: 30px 0 !important;
        }

        .swagger-ui .info .title {
          font-family: 'Oswald', sans-serif !important;
          font-weight: 700 !important;
        }

        .swagger-ui .opblock-tag {
          font-family: 'Oswald', sans-serif !important;
          font-size: 18px !important;
        }

        .swagger-ui .opblock.opblock-get .opblock-summary-method {
          background: #10b981 !important;
        }

        .swagger-ui .opblock.opblock-post .opblock-summary-method {
          background: var(--bsi-orange) !important;
        }

        .swagger-ui .opblock.opblock-get {
          border-color: #10b981 !important;
          background: rgba(16, 185, 129, 0.05) !important;
        }

        .swagger-ui .opblock.opblock-post {
          border-color: var(--bsi-orange) !important;
          background: rgba(191, 87, 0, 0.05) !important;
        }

        .swagger-ui .btn.execute {
          background: var(--bsi-orange) !important;
          border-color: var(--bsi-orange) !important;
        }

        .swagger-ui .btn.execute:hover {
          background: #a34a00 !important;
        }

        .swagger-ui .topbar {
          display: none !important;
        }

        /* Loading State */
        .swagger-loading {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 80px;
          background: white;
        }

        .swagger-loading-spinner {
          width: 40px;
          height: 40px;
          border: 3px solid #e5e7eb;
          border-top-color: var(--bsi-orange);
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        /* Footer */
        .docs-footer {
          background: var(--bsi-charcoal);
          border-top: 1px solid var(--bsi-border);
          padding: 32px 24px;
          text-align: center;
        }

        .docs-footer p {
          font-size: 14px;
          color: var(--bsi-text-muted);
          margin: 0 0 16px;
        }

        .docs-footer a {
          color: var(--bsi-orange);
          text-decoration: none;
        }

        .docs-footer a:hover {
          text-decoration: underline;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .endpoint-card {
            grid-template-columns: 1fr;
            gap: 12px;
          }

          .endpoint-action {
            justify-self: start;
          }

          .docs-nav {
            display: none;
          }
        }
      `}</style>

      <header className="docs-header">
        <div className="docs-header-inner">
          <Link href="/" className="docs-logo">
            BLAZE<span>SPORTS</span>
          </Link>
          <nav className="docs-nav">
            <Link href="/developers">Developer Portal</Link>
            <a href="/openapi.json" target="_blank" rel="noopener noreferrer">
              OpenAPI Spec
            </a>
            <Link href="/status">System Status</Link>
          </nav>
        </div>
      </header>

      <section className="docs-hero">
        <span className="docs-hero-badge">Documentation</span>
        <h1>
          API <span>Reference</span>
        </h1>
        <p>
          Everything you need to connect to Blaze Sports Intel. Whether you are building an app or
          just curious, we have made it simple.
        </p>

        <div className="docs-tabs">
          <button
            className={`docs-tab ${activeSection === 'guide' ? 'active' : ''}`}
            onClick={() => setActiveSection('guide')}
          >
            Quick Guide
          </button>
          <button
            className={`docs-tab ${activeSection === 'reference' ? 'active' : ''}`}
            onClick={() => setActiveSection('reference')}
          >
            Full Reference
          </button>
        </div>
      </section>

      <main className="docs-content">
        {activeSection === 'guide' && (
          <>
            <div className="quick-answers">
              {quickAnswers.map((qa) => (
                <div key={qa.question} className="quick-answer">
                  <h3>{qa.question}</h3>
                  <p>{qa.answer}</p>
                </div>
              ))}
            </div>

            <div className="section-header">
              <h2>Available Endpoints</h2>
              <p>These are the main ways to interact with BSI data.</p>
            </div>

            <div className="endpoints-list">
              {endpoints.map((ep) => (
                <div key={ep.path} className="endpoint-card">
                  <span className={`endpoint-method ${ep.color}`}>{ep.method}</span>
                  <div className="endpoint-info">
                    <h3>{ep.path}</h3>
                    <p>{ep.description}</p>
                    <span className="use-case">{ep.useCase}</span>
                  </div>
                  <button className="endpoint-action" onClick={() => setActiveSection('reference')}>
                    Try it &rarr;
                  </button>
                </div>
              ))}
            </div>

            <div className="try-it-section">
              <h3>Ready to Explore?</h3>
              <p>
                The full reference below lets you test every endpoint live. Click &quot;Try it
                out&quot; on any endpoint, fill in the parameters, and hit Execute.
              </p>
              <button className="try-it-button" onClick={() => setActiveSection('reference')}>
                Open Full Reference
              </button>
            </div>
          </>
        )}

        {activeSection === 'reference' && (
          <div className="swagger-container">
            <div className="swagger-intro">
              <h3>Interactive API Reference</h3>
              <p>
                Expand any endpoint below, click &quot;Try it out&quot;, and execute requests
                directly from this page.
              </p>
            </div>
            {!swaggerLoaded && (
              <div className="swagger-loading">
                <div className="swagger-loading-spinner" />
              </div>
            )}
            <div id="swagger-ui" style={{ display: swaggerLoaded ? 'block' : 'none' }} />
          </div>
        )}
      </main>

      <footer className="docs-footer">
        <p>
          Questions? Email <a href="mailto:api@blazesportsintel.com">api@blazesportsintel.com</a>
        </p>
        <p>
          <Link href="/developers">Back to Developer Portal</Link>
          {' · '}
          <Link href="/">Blaze Sports Intel</Link>
        </p>
      </footer>
    </>
  );
}
