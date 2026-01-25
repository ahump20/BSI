'use client';

import { useEffect } from 'react';
import Script from 'next/script';

export default function ApiDocsPage() {
  useEffect(() => {
    const initSwagger = () => {
      if (typeof window !== 'undefined' && (window as any).SwaggerUIBundle) {
        (window as any).SwaggerUIBundle({
          url: '/openapi.json',
          dom_id: '#swagger-ui',
          deepLinking: true,
          presets: [(window as any).SwaggerUIBundle.presets.apis],
          plugins: [(window as any).SwaggerUIBundle.plugins.DownloadUrl],
        });
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
        body {
          margin: 0;
          padding: 0;
        }

        .swagger-ui {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .swagger-ui .topbar {
          background-color: #1a1a1a;
          padding: 10px 0;
        }

        .swagger-ui .topbar .download-url-wrapper {
          display: flex;
          align-items: center;
        }

        .swagger-ui .topbar .download-url-wrapper .download-url-button {
          background: #bf5700;
          border: none;
          color: white;
        }

        .swagger-ui .topbar a {
          max-width: 200px;
        }

        .swagger-ui .topbar-wrapper {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 20px;
        }

        .swagger-ui .info {
          margin: 30px 0;
        }

        .swagger-ui .info .title {
          font-family: 'Oswald', sans-serif;
          font-weight: 700;
        }

        .swagger-ui .info hgroup.main a {
          color: #bf5700;
        }

        .swagger-ui .opblock-tag {
          font-family: 'Oswald', sans-serif;
          border-bottom: 1px solid rgba(0, 0, 0, 0.1);
        }

        .swagger-ui .opblock.opblock-get .opblock-summary-method {
          background: #10b981;
        }

        .swagger-ui .opblock.opblock-post .opblock-summary-method {
          background: #bf5700;
        }

        .swagger-ui .opblock.opblock-get {
          border-color: #10b981;
          background: rgba(16, 185, 129, 0.05);
        }

        .swagger-ui .opblock.opblock-post {
          border-color: #bf5700;
          background: rgba(191, 87, 0, 0.05);
        }

        .swagger-ui .btn.execute {
          background: #bf5700;
          border-color: #bf5700;
        }

        .swagger-ui .btn.execute:hover {
          background: #a34a00;
        }

        .swagger-ui .scheme-container {
          background: #f8f8f8;
          padding: 20px;
        }

        .swagger-ui section.models {
          border: 1px solid rgba(0, 0, 0, 0.1);
          border-radius: 4px;
        }

        .swagger-ui .model-box {
          background: #f8f8f8;
        }

        #swagger-ui {
          min-height: 100vh;
        }

        .bsi-header {
          background: #1a1a1a;
          padding: 12px 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid #333;
        }

        .bsi-header-left {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .bsi-header-logo {
          font-family: 'Oswald', sans-serif;
          font-size: 18px;
          font-weight: 700;
          color: white;
          text-decoration: none;
        }

        .bsi-header-logo span {
          color: #bf5700;
        }

        .bsi-header-nav {
          display: flex;
          gap: 16px;
        }

        .bsi-header-nav a {
          color: #9ca3af;
          text-decoration: none;
          font-size: 14px;
          transition: color 0.2s;
        }

        .bsi-header-nav a:hover {
          color: #bf5700;
        }

        .bsi-header-badge {
          background: #bf5700;
          color: white;
          padding: 4px 10px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
        }
      `}</style>

      <header className="bsi-header">
        <div className="bsi-header-left">
          <a href="/" className="bsi-header-logo">
            BLAZE<span>SPORTS</span>
          </a>
          <nav className="bsi-header-nav">
            <a href="/developers">Developer Portal</a>
            <a href="/openapi.json" target="_blank" rel="noopener noreferrer">
              OpenAPI Spec
            </a>
            <a href="/">Back to Site</a>
          </nav>
        </div>
        <span className="bsi-header-badge">API Docs</span>
      </header>

      <div id="swagger-ui" />
    </>
  );
}
