/**
 * Legal Footer Component
 * Consistent footer with legal links across all pages
 * Mobile-first, accessible design
 */

class LegalFooter extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.render();
  }

  render() {
    const currentYear = new Date().getFullYear();

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          margin-top: auto;
        }

        footer {
          background: #1a1a1a;
          color: #ffffff;
          padding: 40px 20px 20px;
          margin-top: 60px;
        }

        .footer-content {
          max-width: 1200px;
          margin: 0 auto;
        }

        .footer-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 30px;
          margin-bottom: 30px;
        }

        .footer-section h3 {
          color: #ff6b00;
          font-size: 1.1rem;
          margin: 0 0 15px 0;
          font-weight: 600;
        }

        .footer-section ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .footer-section li {
          margin-bottom: 10px;
        }

        .footer-section a {
          color: #ffffff;
          text-decoration: none;
          font-size: 0.95rem;
          transition: color 0.2s;
        }

        .footer-section a:hover {
          color: #ff6b00;
        }

        .footer-section a:focus {
          outline: 2px solid #ff6b00;
          outline-offset: 2px;
        }

        .footer-section p {
          margin: 0 0 10px 0;
          font-size: 0.9rem;
          line-height: 1.6;
        }

        .footer-bottom {
          border-top: 1px solid #444;
          padding-top: 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 15px;
        }

        .copyright {
          font-size: 0.9rem;
          color: #aaa;
        }

        .social-links {
          display: flex;
          gap: 15px;
        }

        .social-links a {
          color: #ffffff;
          font-size: 1.2rem;
          transition: color 0.2s;
        }

        .social-links a:hover {
          color: #ff6b00;
        }

        .gdpr-notice {
          background: #2a2a2a;
          padding: 15px;
          border-radius: 5px;
          margin-top: 20px;
          font-size: 0.85rem;
          color: #ccc;
          text-align: center;
        }

        .gdpr-notice a {
          color: #ff6b00;
          text-decoration: underline;
        }

        @media (max-width: 768px) {
          .footer-grid {
            grid-template-columns: 1fr;
          }

          .footer-bottom {
            flex-direction: column;
            text-align: center;
          }

          footer {
            padding: 30px 15px 15px;
          }
        }
      </style>

      <footer role="contentinfo">
        <div class="footer-content">
          <div class="footer-grid">
            <div class="footer-section">
              <h3>Blaze Sports Intel</h3>
              <p>
                Professional sports analytics and predictive insights for baseball, football, basketball, and track & field.
              </p>
              <p>
                Mobile-first platform with real-time data and original baseball game.
              </p>
            </div>

            <div class="footer-section">
              <h3>Sports Coverage</h3>
              <ul>
                <li><a href="/mlb">MLB Analytics</a></li>
                <li><a href="/nfl">NFL Analytics</a></li>
                <li><a href="/nba">NBA Analytics</a></li>
                <li><a href="/ncaa">NCAA Baseball</a></li>
                <li><a href="/predict">Predictive Models</a></li>
              </ul>
            </div>

            <div class="footer-section">
              <h3>Legal & Privacy</h3>
              <ul>
                <li><a href="/privacy">Privacy Policy</a></li>
                <li><a href="/terms">Terms of Service</a></li>
                <li><a href="/cookies">Cookie Policy</a></li>
                <li><a href="/accessibility">Accessibility</a></li>
                <li><a href="/api/privacy/export" id="gdpr-export">Export My Data (GDPR)</a></li>
              </ul>
            </div>

            <div class="footer-section">
              <h3>Contact & Support</h3>
              <ul>
                <li><a href="/contact">Contact Us</a></li>
                <li><a href="/about">About Us</a></li>
                <li><a href="https://github.com/ahump20/BSI" target="_blank" rel="noopener">GitHub</a></li>
                <li><a href="/sitemap.xml">Sitemap</a></li>
              </ul>
            </div>
          </div>

          <div class="gdpr-notice">
            <strong>Your Privacy Matters:</strong> We comply with GDPR (EU), CCPA (California), and COPPA (children under 13).
            You have the right to access, correct, and delete your data.
            <a href="/privacy#your-rights">Learn about your rights</a>.
          </div>

          <div class="footer-bottom">
            <div class="copyright">
              &copy; ${currentYear} Blaze Sports Intel. All rights reserved.
            </div>

            <div class="social-links">
              <a href="https://twitter.com/blazesportsai" target="_blank" rel="noopener" aria-label="Twitter">
                <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                </svg>
              </a>
              <a href="https://github.com/ahump20/BSI" target="_blank" rel="noopener" aria-label="GitHub">
                <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    `;

    // Add GDPR export click handler
    this.shadowRoot.getElementById('gdpr-export').addEventListener('click', (e) => {
      e.preventDefault();
      this.triggerGDPRExport();
    });
  }

  async triggerGDPRExport() {
    const userId = localStorage.getItem('user_id') || 'anonymous';

    if (userId === 'anonymous') {
      alert('You must be logged in to export your data. No personal data is stored for anonymous users.');
      return;
    }

    if (!confirm('This will generate a download of all your personal data. Continue?')) {
      return;
    }

    try {
      const response = await fetch(`/api/privacy/export?userId=${userId}`);

      if (!response.ok) {
        throw new Error('Export failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `blaze-sports-data-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      alert('Your data has been exported. Check your downloads folder.');
    } catch (error) {
      alert('Failed to export data. Please use our contact form at /contact for support.');
      console.error('GDPR export error:', error);
    }
  }
}

customElements.define('legal-footer', LegalFooter);
