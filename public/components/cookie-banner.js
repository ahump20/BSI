/**
 * Cookie Consent Banner Component
 * GDPR/CCPA compliant cookie consent management
 * Mobile-first design
 */

class CookieConsentBanner {
  constructor() {
    this.consentKey = 'cookie_consent';
    this.userId = this.generateUserId();
    this.init();
  }

  generateUserId() {
    let userId = localStorage.getItem('user_id');
    if (!userId) {
      userId = 'user_' + Math.random().toString(36).substring(2, 15);
      localStorage.setItem('user_id', userId);
    }
    return userId;
  }

  async init() {
    // Check for Do Not Track
    if (this.isDNTEnabled()) {
      this.setConsent({ essential: true, analytics: false, dnt: true });
      return;
    }

    // Check if consent already given
    const existingConsent = this.getConsent();
    if (existingConsent && existingConsent.timestamp) {
      // Check if consent is less than 1 year old
      const consentAge = Date.now() - new Date(existingConsent.timestamp).getTime();
      const oneYear = 365 * 24 * 60 * 60 * 1000;

      if (consentAge < oneYear) {
        this.applyConsent(existingConsent);
        return;
      }
    }

    // Show consent banner
    this.showBanner();
  }

  isDNTEnabled() {
    return navigator.doNotTrack === '1' ||
           window.doNotTrack === '1' ||
           navigator.msDoNotTrack === '1';
  }

  getConsent() {
    const stored = localStorage.getItem(this.consentKey);
    return stored ? JSON.parse(stored) : null;
  }

  async setConsent(preferences) {
    const consent = {
      ...preferences,
      timestamp: new Date().toISOString(),
      version: '1.0'
    };

    // Store locally
    localStorage.setItem(this.consentKey, JSON.stringify(consent));

    // Send to server
    try {
      await fetch('/api/consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: this.userId,
          preferences: consent
        })
      });
    } catch (error) {
      console.warn('Failed to sync consent to server:', error);
    }

    // Apply consent
    this.applyConsent(consent);
  }

  applyConsent(consent) {
    if (!consent.analytics) {
      // Disable analytics
      this.disableAnalytics();
    }

    // Dispatch custom event for app to listen
    window.dispatchEvent(new CustomEvent('cookieConsentUpdated', {
      detail: consent
    }));
  }

  disableAnalytics() {
    // Disable Cloudflare Analytics beacon
    if (window.__CF$cv$params) {
      window.__CF$cv$params.disabled = true;
    }

    // Disable Sentry
    if (window.Sentry) {
      window.Sentry.close();
    }
  }

  showBanner() {
    const banner = document.createElement('div');
    banner.id = 'cookie-consent-banner';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-labelledby', 'cookie-banner-title');
    banner.setAttribute('aria-describedby', 'cookie-banner-description');

    banner.innerHTML = `
      <div class="cookie-banner-content">
        <div class="cookie-banner-text">
          <h2 id="cookie-banner-title">Cookie Preferences</h2>
          <p id="cookie-banner-description">
            We use cookies to provide essential functionality and optional analytics to improve your experience.
            Essential cookies are required; analytics cookies need your consent.
            <a href="/cookies" target="_blank" rel="noopener">Learn more</a>
          </p>
        </div>
        <div class="cookie-banner-buttons">
          <button class="btn-primary" id="accept-all-cookies" aria-label="Accept all cookies">
            Accept All
          </button>
          <button class="btn-secondary" id="reject-optional-cookies" aria-label="Reject optional cookies, accept essential only">
            Essential Only
          </button>
          <button class="btn-tertiary" id="customize-cookies" aria-label="Customize cookie preferences">
            Customize
          </button>
        </div>
      </div>
    `;

    // Add styles
    const style = document.createElement('style');
    style.textContent = `
      #cookie-consent-banner {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        background: #ffffff;
        border-top: 2px solid #ff6b00;
        box-shadow: 0 -4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        animation: slideUp 0.3s ease-out;
      }

      @keyframes slideUp {
        from {
          transform: translateY(100%);
        }
        to {
          transform: translateY(0);
        }
      }

      .cookie-banner-content {
        max-width: 1200px;
        margin: 0 auto;
        padding: 20px;
        display: flex;
        align-items: center;
        gap: 20px;
      }

      .cookie-banner-text {
        flex: 1;
      }

      .cookie-banner-text h2 {
        margin: 0 0 8px 0;
        font-size: 1.2rem;
        color: #1a1a1a;
      }

      .cookie-banner-text p {
        margin: 0;
        font-size: 0.95rem;
        color: #333;
        line-height: 1.5;
      }

      .cookie-banner-text a {
        color: #8B4513;
        text-decoration: underline;
      }

      .cookie-banner-buttons {
        display: flex;
        gap: 10px;
        flex-shrink: 0;
      }

      .cookie-banner-buttons button {
        padding: 10px 20px;
        border: none;
        border-radius: 5px;
        font-size: 0.95rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
      }

      .btn-primary {
        background: #8B4513;
        color: white;
      }

      .btn-primary:hover {
        background: #0052a3;
      }

      .btn-secondary {
        background: #6c757d;
        color: white;
      }

      .btn-secondary:hover {
        background: #545b62;
      }

      .btn-tertiary {
        background: #f8f9fa;
        color: #333;
        border: 1px solid #dee2e6;
      }

      .btn-tertiary:hover {
        background: #e9ecef;
      }

      @media (max-width: 768px) {
        .cookie-banner-content {
          flex-direction: column;
          align-items: stretch;
          padding: 15px;
        }

        .cookie-banner-buttons {
          flex-direction: column;
        }

        .cookie-banner-buttons button {
          width: 100%;
        }
      }

      /* Accessibility improvements */
      .cookie-banner-buttons button:focus {
        outline: 3px solid #ff6b00;
        outline-offset: 2px;
      }
    `;

    document.head.appendChild(style);
    document.body.appendChild(banner);

    // Add event listeners
    document.getElementById('accept-all-cookies').addEventListener('click', () => {
      this.setConsent({ essential: true, analytics: true });
      this.hideBanner();
    });

    document.getElementById('reject-optional-cookies').addEventListener('click', () => {
      this.setConsent({ essential: true, analytics: false });
      this.hideBanner();
    });

    document.getElementById('customize-cookies').addEventListener('click', () => {
      this.showCustomizeModal();
    });

    // Trap focus within banner for accessibility
    this.trapFocus(banner);
  }

  hideBanner() {
    const banner = document.getElementById('cookie-consent-banner');
    if (banner) {
      banner.style.animation = 'slideDown 0.3s ease-out';
      setTimeout(() => banner.remove(), 300);
    }
  }

  showCustomizeModal() {
    const modal = document.createElement('div');
    modal.id = 'cookie-customize-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-labelledby', 'customize-modal-title');
    modal.setAttribute('aria-modal', 'true');

    modal.innerHTML = `
      <div class="modal-backdrop"></div>
      <div class="modal-content">
        <h2 id="customize-modal-title">Customize Cookie Preferences</h2>

        <div class="cookie-category">
          <div class="cookie-category-header">
            <h3>Essential Cookies</h3>
            <input type="checkbox" checked disabled aria-label="Essential cookies (required)">
          </div>
          <p>Required for the website to function. Cannot be disabled.</p>
          <ul>
            <li>Session management and authentication</li>
            <li>User preferences and settings</li>
            <li>Game saves and progress</li>
            <li>Security and fraud prevention</li>
          </ul>
        </div>

        <div class="cookie-category">
          <div class="cookie-category-header">
            <h3>Analytics Cookies</h3>
            <input type="checkbox" id="analytics-toggle" aria-label="Analytics cookies (optional)">
          </div>
          <p>Help us understand how visitors use the site to improve performance.</p>
          <ul>
            <li>Privacy-preserving analytics (Cloudflare)</li>
            <li>Performance monitoring (Web Vitals)</li>
            <li>Error tracking (anonymized IP addresses)</li>
          </ul>
        </div>

        <div class="modal-buttons">
          <button class="btn-primary" id="save-preferences">Save Preferences</button>
          <button class="btn-secondary" id="cancel-customize">Cancel</button>
        </div>
      </div>
    `;

    const style = document.createElement('style');
    style.textContent = `
      #cookie-customize-modal {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 10001;
        display: flex;
        align-items: center;
        justify-content: center;
        animation: fadeIn 0.2s;
      }

      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }

      .modal-backdrop {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
      }

      .modal-content {
        position: relative;
        background: white;
        border-radius: 8px;
        padding: 30px;
        max-width: 600px;
        width: 90%;
        max-height: 80vh;
        overflow-y: auto;
        box-shadow: 0 4px 20px rgba(0,0,0,0.3);
      }

      .modal-content h2 {
        margin: 0 0 20px 0;
        color: #1a1a1a;
      }

      .cookie-category {
        margin-bottom: 20px;
        padding: 15px;
        border: 1px solid #dee2e6;
        border-radius: 5px;
      }

      .cookie-category-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 10px;
      }

      .cookie-category h3 {
        margin: 0;
        font-size: 1.1rem;
      }

      .cookie-category p {
        margin: 0 0 10px 0;
        color: #666;
      }

      .cookie-category ul {
        margin: 0;
        padding-left: 20px;
        font-size: 0.9rem;
        color: #666;
      }

      .modal-buttons {
        display: flex;
        gap: 10px;
        margin-top: 20px;
      }

      .modal-buttons button {
        flex: 1;
        padding: 12px;
        border: none;
        border-radius: 5px;
        font-size: 1rem;
        font-weight: 600;
        cursor: pointer;
      }

      @media (max-width: 768px) {
        .modal-content {
          padding: 20px;
        }

        .modal-buttons {
          flex-direction: column;
        }
      }
    `;

    document.head.appendChild(style);
    document.body.appendChild(modal);

    // Get current analytics preference
    const currentConsent = this.getConsent();
    if (currentConsent && currentConsent.analytics) {
      document.getElementById('analytics-toggle').checked = true;
    }

    // Event listeners
    document.getElementById('save-preferences').addEventListener('click', () => {
      const analytics = document.getElementById('analytics-toggle').checked;
      this.setConsent({ essential: true, analytics });
      this.hideBanner();
      modal.remove();
    });

    document.getElementById('cancel-customize').addEventListener('click', () => {
      modal.remove();
    });

    // Close on backdrop click
    modal.querySelector('.modal-backdrop').addEventListener('click', () => {
      modal.remove();
    });

    // Trap focus in modal
    this.trapFocus(modal.querySelector('.modal-content'));
  }

  trapFocus(element) {
    const focusableElements = element.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];

    element.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstFocusable) {
            e.preventDefault();
            lastFocusable.focus();
          }
        } else {
          if (document.activeElement === lastFocusable) {
            e.preventDefault();
            firstFocusable.focus();
          }
        }
      }

      if (e.key === 'Escape') {
        this.hideBanner();
        const modal = document.getElementById('cookie-customize-modal');
        if (modal) modal.remove();
      }
    });

    // Focus first element
    setTimeout(() => firstFocusable.focus(), 100);
  }
}

// Auto-initialize on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new CookieConsentBanner();
  });
} else {
  new CookieConsentBanner();
}

// Export for manual initialization
window.CookieConsentBanner = CookieConsentBanner;
