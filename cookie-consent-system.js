/**
 * Blaze Sports Intel - Granular Cookie Consent System
 * GDPR, CCPA, ePrivacy Directive Compliant
 *
 * Last Updated: October 16, 2025
 * Author: Austin Humphrey
 * Version: 1.0.0
 */

class BlazeCookieConsent {
    constructor() {
        this.consentKey = 'blaze_cookie_consent';
        this.consentVersion = '1.0.0';
        this.consentBanner = null;
        this.preferences = this.loadPreferences();

        // Cookie categories
        this.categories = {
            essential: {
                name: 'Essential',
                description: 'Required for the website to function properly. Cannot be disabled.',
                required: true,
                cookies: ['blaze_session', 'blaze_consent', '__cflb', '__cf_bm']
            },
            analytics: {
                name: 'Analytics',
                description: 'Help us understand how visitors use the site to improve functionality.',
                required: false,
                cookies: ['blaze_analytics_id', '_ga', '_gid']
            },
            preferences: {
                name: 'Preferences',
                description: 'Remember your settings and personalize your experience.',
                required: false,
                cookies: ['blaze_preferences', 'blaze_last_sport_viewed', 'blaze_theme']
            }
        };

        this.init();
    }

    /**
     * Initialize cookie consent system
     */
    init() {
        // Check if user has already consented
        if (!this.hasConsent()) {
            this.showBanner();
        } else {
            this.applyConsent();
        }

        // Handle "Do Not Track" browser setting
        if (navigator.doNotTrack === '1' || window.doNotTrack === '1') {
            this.preferences.analytics = false;
            this.savePreferences();
            this.applyConsent();
        }
    }

    /**
     * Check if user has provided consent
     */
    hasConsent() {
        try {
            const consent = localStorage.getItem(this.consentKey);
            if (!consent) {
                // Fallback to cookies for incognito mode
                return this.getCookie(this.consentKey) !== null;
            }

            const parsed = JSON.parse(consent);
            // Check if consent version matches (invalidate old consents)
            return parsed.version === this.consentVersion;
        } catch (e) {
            return false;
        }
    }

    /**
     * Load user preferences from storage
     */
    loadPreferences() {
        try {
            const stored = localStorage.getItem(this.consentKey) || this.getCookie(this.consentKey);
            if (stored) {
                const parsed = JSON.parse(stored);
                return {
                    essential: true, // Always true
                    analytics: parsed.analytics || false,
                    preferences: parsed.preferences || false,
                    timestamp: parsed.timestamp,
                    version: parsed.version
                };
            }
        } catch (e) {
            console.warn('Failed to load cookie preferences:', e);
        }

        // Default preferences (only essential)
        return {
            essential: true,
            analytics: false,
            preferences: false,
            timestamp: null,
            version: this.consentVersion
        };
    }

    /**
     * Save user preferences to storage
     */
    savePreferences() {
        const consent = {
            ...this.preferences,
            timestamp: new Date().toISOString(),
            version: this.consentVersion
        };

        try {
            // Try localStorage first
            localStorage.setItem(this.consentKey, JSON.stringify(consent));
        } catch (e) {
            console.warn('localStorage unavailable, using cookies');
        }

        // Always set cookie as fallback
        this.setCookie(this.consentKey, JSON.stringify(consent), 365);
    }

    /**
     * Show cookie consent banner
     */
    showBanner() {
        // Remove existing banner if present
        if (this.consentBanner) {
            this.consentBanner.remove();
        }

        // Create banner HTML
        this.consentBanner = document.createElement('div');
        this.consentBanner.id = 'blaze-cookie-banner';
        this.consentBanner.setAttribute('role', 'dialog');
        this.consentBanner.setAttribute('aria-label', 'Cookie Consent');
        this.consentBanner.setAttribute('aria-live', 'polite');

        this.consentBanner.innerHTML = `
            <div class="cookie-banner-content">
                <div class="cookie-banner-header">
                    <h3>🍪 Cookie Settings</h3>
                    <button class="cookie-close" aria-label="Close cookie banner" onclick="blazeCookieConsent.hideBanner()">×</button>
                </div>
                <p class="cookie-banner-text">
                    We use cookies to enhance your experience, analyze site traffic, and personalize content.
                    <a href="/legal/cookies" target="_blank" rel="noopener">Learn more</a>
                </p>

                <div class="cookie-categories">
                    <div class="cookie-category">
                        <label class="cookie-label">
                            <input type="checkbox" checked disabled>
                            <span class="cookie-category-name">Essential Cookies</span>
                        </label>
                        <p class="cookie-category-desc">Required for the website to function. Cannot be disabled.</p>
                    </div>

                    <div class="cookie-category">
                        <label class="cookie-label">
                            <input type="checkbox" id="analytics-consent" ${this.preferences.analytics ? 'checked' : ''}>
                            <span class="cookie-category-name">Analytics Cookies</span>
                        </label>
                        <p class="cookie-category-desc">Help us understand how visitors use the site.</p>
                    </div>

                    <div class="cookie-category">
                        <label class="cookie-label">
                            <input type="checkbox" id="preferences-consent" ${this.preferences.preferences ? 'checked' : ''}>
                            <span class="cookie-category-name">Preference Cookies</span>
                        </label>
                        <p class="cookie-category-desc">Remember your favorite teams and settings.</p>
                    </div>
                </div>

                <div class="cookie-actions">
                    <button class="cookie-btn cookie-btn-accept" onclick="blazeCookieConsent.acceptAll()">
                        Accept All
                    </button>
                    <button class="cookie-btn cookie-btn-save" onclick="blazeCookieConsent.saveSelections()">
                        Save Preferences
                    </button>
                    <button class="cookie-btn cookie-btn-decline" onclick="blazeCookieConsent.acceptEssential()">
                        Essential Only
                    </button>
                </div>
            </div>
        `;

        // Add styles (inline for self-contained component)
        const style = document.createElement('style');
        style.textContent = `
            #blaze-cookie-banner {
                position: fixed;
                bottom: 2rem;
                left: 2rem;
                max-width: 480px;
                background: rgba(26, 26, 26, 0.98);
                backdrop-filter: blur(20px);
                border-radius: 1.5rem;
                border: 1px solid rgba(255, 255, 255, 0.1);
                padding: 2rem;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
                z-index: 10000;
                animation: slideInUp 0.4s ease-out;
                font-family: 'Inter', system-ui, -apple-system, sans-serif;
            }

            @keyframes slideInUp {
                from {
                    transform: translateY(100%);
                    opacity: 0;
                }
                to {
                    transform: translateY(0);
                    opacity: 1;
                }
            }

            .cookie-banner-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 1rem;
            }

            .cookie-banner-header h3 {
                color: #ff6b00;
                font-size: 1.3rem;
                font-weight: 600;
                margin: 0;
            }

            .cookie-close {
                background: none;
                border: none;
                color: #b0b0b0;
                font-size: 2rem;
                cursor: pointer;
                line-height: 1;
                padding: 0;
                width: 2rem;
                height: 2rem;
                transition: color 0.2s;
            }

            .cookie-close:hover {
                color: #ffffff;
            }

            .cookie-banner-text {
                color: #b0b0b0;
                line-height: 1.6;
                margin-bottom: 1.5rem;
            }

            .cookie-banner-text a {
                color: #ff6b00;
                text-decoration: none;
                font-weight: 500;
            }

            .cookie-banner-text a:hover {
                color: #0066cc;
                text-decoration: underline;
            }

            .cookie-categories {
                margin-bottom: 1.5rem;
            }

            .cookie-category {
                margin-bottom: 1rem;
                padding: 0.75rem;
                background: rgba(255, 255, 255, 0.03);
                border-radius: 0.75rem;
            }

            .cookie-label {
                display: flex;
                align-items: center;
                cursor: pointer;
                color: #ffffff;
                font-weight: 500;
            }

            .cookie-label input[type="checkbox"] {
                margin-right: 0.75rem;
                width: 1.2rem;
                height: 1.2rem;
                cursor: pointer;
            }

            .cookie-label input[type="checkbox"]:disabled {
                cursor: not-allowed;
                opacity: 0.6;
            }

            .cookie-category-desc {
                color: #b0b0b0;
                font-size: 0.85rem;
                margin: 0.5rem 0 0 2rem;
                line-height: 1.4;
            }

            .cookie-actions {
                display: flex;
                gap: 0.75rem;
                flex-wrap: wrap;
            }

            .cookie-btn {
                flex: 1;
                min-width: 120px;
                padding: 0.75rem 1rem;
                border-radius: 0.75rem;
                border: none;
                font-weight: 600;
                font-size: 0.9rem;
                cursor: pointer;
                transition: all 0.3s ease;
                font-family: inherit;
            }

            .cookie-btn-accept {
                background: linear-gradient(135deg, #ff6b00, #0066cc);
                color: #ffffff;
            }

            .cookie-btn-accept:hover {
                transform: translateY(-2px);
                box-shadow: 0 10px 25px rgba(255, 107, 0, 0.3);
            }

            .cookie-btn-save {
                background: rgba(255, 255, 255, 0.1);
                color: #ffffff;
                border: 1px solid rgba(255, 255, 255, 0.2);
            }

            .cookie-btn-save:hover {
                background: rgba(255, 255, 255, 0.15);
            }

            .cookie-btn-decline {
                background: rgba(0, 0, 0, 0.3);
                color: #b0b0b0;
                border: 1px solid rgba(255, 255, 255, 0.1);
            }

            .cookie-btn-decline:hover {
                background: rgba(0, 0, 0, 0.5);
                color: #ffffff;
            }

            /* Mobile responsive */
            @media (max-width: 768px) {
                #blaze-cookie-banner {
                    bottom: 1rem;
                    left: 1rem;
                    right: 1rem;
                    max-width: none;
                    padding: 1.5rem;
                }

                .cookie-actions {
                    flex-direction: column;
                }

                .cookie-btn {
                    width: 100%;
                }
            }

            /* Accessibility: High contrast mode */
            @media (prefers-contrast: high) {
                #blaze-cookie-banner {
                    border: 3px solid #ffffff;
                }

                .cookie-btn {
                    border: 2px solid #ffffff;
                }
            }

            /* Accessibility: Reduced motion */
            @media (prefers-reduced-motion: reduce) {
                #blaze-cookie-banner {
                    animation: none;
                }

                .cookie-btn {
                    transition: none;
                }
            }
        `;

        document.head.appendChild(style);
        document.body.appendChild(this.consentBanner);

        // Announce to screen readers
        this.announceToScreenReader('Cookie consent banner displayed. Please review your cookie preferences.');
    }

    /**
     * Hide cookie banner
     */
    hideBanner() {
        if (this.consentBanner) {
            this.consentBanner.style.animation = 'slideOutDown 0.3s ease-out';
            setTimeout(() => {
                this.consentBanner.remove();
                this.consentBanner = null;
            }, 300);
        }
    }

    /**
     * Accept all cookies
     */
    acceptAll() {
        this.preferences.analytics = true;
        this.preferences.preferences = true;
        this.savePreferences();
        this.applyConsent();
        this.hideBanner();
        this.announceToScreenReader('All cookies accepted. Your preferences have been saved.');
    }

    /**
     * Accept only essential cookies
     */
    acceptEssential() {
        this.preferences.analytics = false;
        this.preferences.preferences = false;
        this.savePreferences();
        this.applyConsent();
        this.hideBanner();
        this.announceToScreenReader('Only essential cookies accepted. Your preferences have been saved.');
    }

    /**
     * Save custom selections
     */
    saveSelections() {
        const analyticsCheckbox = document.getElementById('analytics-consent');
        const preferencesCheckbox = document.getElementById('preferences-consent');

        if (analyticsCheckbox) {
            this.preferences.analytics = analyticsCheckbox.checked;
        }

        if (preferencesCheckbox) {
            this.preferences.preferences = preferencesCheckbox.checked;
        }

        this.savePreferences();
        this.applyConsent();
        this.hideBanner();
        this.announceToScreenReader('Your cookie preferences have been saved.');
    }

    /**
     * Apply consent by enabling/disabling tracking scripts
     */
    applyConsent() {
        // Analytics (Cloudflare Analytics, Google Analytics)
        if (this.preferences.analytics) {
            this.enableAnalytics();
        } else {
            this.disableAnalytics();
        }

        // Preferences (localStorage, favorite teams)
        if (this.preferences.preferences) {
            this.enablePreferences();
        } else {
            this.disablePreferences();
        }

        // Fire custom event for third-party integrations
        window.dispatchEvent(new CustomEvent('blazeConsentUpdated', {
            detail: this.preferences
        }));
    }

    /**
     * Enable analytics cookies
     */
    enableAnalytics() {
        // Cloudflare Analytics (automatically enabled via Cloudflare dashboard)
        // Google Analytics (if implemented)
        if (typeof gtag !== 'undefined') {
            gtag('consent', 'update', {
                analytics_storage: 'granted'
            });
        }

        // Set analytics cookie
        this.setCookie('blaze_analytics_id', this.generateAnalyticsId(), 90);
    }

    /**
     * Disable analytics cookies
     */
    disableAnalytics() {
        // Google Analytics opt-out
        if (typeof gtag !== 'undefined') {
            gtag('consent', 'update', {
                analytics_storage: 'denied'
            });
        }

        // Delete analytics cookies
        this.deleteCookie('blaze_analytics_id');
        this.deleteCookie('_ga');
        this.deleteCookie('_gid');
    }

    /**
     * Enable preference cookies
     */
    enablePreferences() {
        // Preference cookies enabled via localStorage
        // Example: Save favorite teams, theme preferences
    }

    /**
     * Disable preference cookies
     */
    disablePreferences() {
        // Delete preference cookies
        this.deleteCookie('blaze_preferences');
        this.deleteCookie('blaze_last_sport_viewed');
        this.deleteCookie('blaze_theme');

        // Clear localStorage preferences (but keep consent record)
        const consentData = localStorage.getItem(this.consentKey);
        localStorage.clear();
        if (consentData) {
            localStorage.setItem(this.consentKey, consentData);
        }
    }

    /**
     * Generate unique analytics ID
     */
    generateAnalyticsId() {
        return 'blaze_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
    }

    /**
     * Cookie utility: Set cookie
     */
    setCookie(name, value, days) {
        const expires = new Date();
        expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
        document.cookie = `${name}=${encodeURIComponent(value)};expires=${expires.toUTCString()};path=/;SameSite=Strict;Secure`;
    }

    /**
     * Cookie utility: Get cookie
     */
    getCookie(name) {
        const nameEQ = name + '=';
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            let c = cookies[i].trim();
            if (c.indexOf(nameEQ) === 0) {
                return decodeURIComponent(c.substring(nameEQ.length));
            }
        }
        return null;
    }

    /**
     * Cookie utility: Delete cookie
     */
    deleteCookie(name) {
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/`;
    }

    /**
     * Accessibility: Announce to screen readers
     */
    announceToScreenReader(message) {
        const announcement = document.createElement('div');
        announcement.setAttribute('aria-live', 'polite');
        announcement.setAttribute('aria-atomic', 'true');
        announcement.textContent = message;
        announcement.style.position = 'absolute';
        announcement.style.left = '-9999px';
        document.body.appendChild(announcement);

        setTimeout(() => {
            document.body.removeChild(announcement);
        }, 1000);
    }

    /**
     * Allow users to revoke consent
     */
    revokeConsent() {
        localStorage.removeItem(this.consentKey);
        this.deleteCookie(this.consentKey);
        this.preferences = this.loadPreferences();
        this.showBanner();
        this.announceToScreenReader('Cookie consent revoked. Please review your preferences again.');
    }

    /**
     * Export user preferences (GDPR Right to Data Portability)
     */
    exportPreferences() {
        const exportData = {
            consent: this.preferences,
            exportDate: new Date().toISOString(),
            version: this.consentVersion
        };

        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `blaze-cookie-preferences-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }
}

// Initialize globally
window.blazeCookieConsent = new BlazeCookieConsent();

// Expose methods for footer links
window.openCookieSettings = function() {
    window.blazeCookieConsent.showBanner();
};

window.revokeCookieConsent = function() {
    window.blazeCookieConsent.revokeConsent();
};

window.exportCookiePreferences = function() {
    window.blazeCookieConsent.exportPreferences();
};

// Listen for consent updates (for third-party integrations)
window.addEventListener('blazeConsentUpdated', function(event) {
    console.log('Cookie consent updated:', event.detail);
});
