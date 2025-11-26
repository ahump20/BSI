/**
 * Cookie Consent Integration Example
 *
 * Shows how to integrate the /api/consent endpoint with your cookie banner.
 * This example demonstrates GDPR/CCPA compliant consent management.
 *
 * Integration Points:
 * - Cookie consent banner (cookie-consent.js)
 * - Privacy dashboard (privacy-controls.js)
 * - Age gate (age-gate.js)
 *
 * Usage:
 * Import this module and call saveConsent() when user accepts/rejects cookies.
 */

const CONSENT_API_ENDPOINT = '/api/consent';
const CONSENT_VERSION = '1.0.0'; // Update this when privacy policy changes

/**
 * Generate or retrieve user ID for consent tracking
 * Uses existing cookie or generates new UUID
 */
function getUserId() {
  let userId = localStorage.getItem('blaze_user_id');

  if (!userId) {
    // Generate new UUID
    userId = `user_${Date.now()}_${crypto.randomUUID()}`;
    localStorage.setItem('blaze_user_id', userId);
  }

  return userId;
}

/**
 * Get current timestamp in America/Chicago timezone
 */
function getChicagoTimestamp() {
  const now = new Date();

  // Format in ISO 8601 with explicit timezone offset for Chicago
  // This handles CST (-06:00) and CDT (-05:00) automatically
  const chicagoTime = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Chicago',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(now);

  const parts = {};
  chicagoTime.forEach(({ type, value }) => {
    parts[type] = value;
  });

  // Calculate timezone offset (CST = -06:00, CDT = -05:00)
  const offset = isDST(now) ? '-05:00' : '-06:00';

  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}${offset}`;
}

/**
 * Check if date is in Daylight Saving Time (CDT vs CST)
 */
function isDST(date) {
  const jan = new Date(date.getFullYear(), 0, 1).getTimezoneOffset();
  const jul = new Date(date.getFullYear(), 6, 1).getTimezoneOffset();
  return Math.max(jan, jul) !== date.getTimezoneOffset();
}

/**
 * Save consent preferences to API
 *
 * @param {Object} preferences - User consent preferences
 * @param {boolean} preferences.essential - Essential cookies (always true)
 * @param {boolean} preferences.analytics - Analytics cookies
 * @returns {Promise<Object>} API response
 */
async function saveConsent(preferences) {
  const userId = getUserId();
  const timestamp = getChicagoTimestamp();

  const payload = {
    userId,
    preferences: {
      essential: preferences.essential !== false, // Essential always true
      analytics: preferences.analytics === true,
      timestamp,
      version: CONSENT_VERSION,
    },
  };

  try {
    const response = await fetch(CONSENT_API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    const result = await response.json();

    // Store consent locally for quick access
    localStorage.setItem('blaze_consent_id', result.id);
    localStorage.setItem('blaze_consent_timestamp', timestamp);
    localStorage.setItem('blaze_consent_analytics', preferences.analytics ? 'true' : 'false');

    console.log('Consent saved successfully:', result);
    return result;

  } catch (error) {
    console.error('Failed to save consent:', error);

    // Store locally even if API fails (offline support)
    localStorage.setItem('blaze_consent_timestamp', timestamp);
    localStorage.setItem('blaze_consent_analytics', preferences.analytics ? 'true' : 'false');
    localStorage.setItem('blaze_consent_pending', 'true');

    throw error;
  }
}

/**
 * Check if user has given consent for analytics
 *
 * @returns {boolean} True if analytics enabled
 */
function hasAnalyticsConsent() {
  return localStorage.getItem('blaze_consent_analytics') === 'true';
}

/**
 * Check if consent banner should be shown
 *
 * @returns {boolean} True if consent needed
 */
function needsConsent() {
  const hasConsent = localStorage.getItem('blaze_consent_timestamp');
  return !hasConsent;
}

/**
 * Retry failed consent submissions (call on page load)
 */
async function retryPendingConsent() {
  const isPending = localStorage.getItem('blaze_consent_pending');

  if (isPending === 'true') {
    const analytics = localStorage.getItem('blaze_consent_analytics') === 'true';

    try {
      await saveConsent({ essential: true, analytics });
      localStorage.removeItem('blaze_consent_pending');
      console.log('Pending consent submitted successfully');
    } catch (error) {
      console.log('Consent still pending, will retry later');
    }
  }
}

// ============================================================================
// Integration Examples
// ============================================================================

/**
 * Example 1: Cookie banner "Accept All" button
 */
document.getElementById('accept-all-cookies')?.addEventListener('click', async () => {
  try {
    await saveConsent({ essential: true, analytics: true });
    closeCookieBanner();
    initializeAnalytics(); // Start tracking
  } catch (error) {
    // Graceful degradation - consent saved locally
    closeCookieBanner();
  }
});

/**
 * Example 2: Cookie banner "Essential Only" button
 */
document.getElementById('essential-only-cookies')?.addEventListener('click', async () => {
  try {
    await saveConsent({ essential: true, analytics: false });
    closeCookieBanner();
  } catch (error) {
    // Graceful degradation - consent saved locally
    closeCookieBanner();
  }
});

/**
 * Example 3: Privacy dashboard toggle
 */
document.getElementById('analytics-toggle')?.addEventListener('change', async (e) => {
  const analyticsEnabled = e.target.checked;

  try {
    await saveConsent({ essential: true, analytics: analyticsEnabled });

    if (analyticsEnabled) {
      initializeAnalytics();
    } else {
      disableAnalytics();
    }

    showToast('Preferences saved successfully');
  } catch (error) {
    showToast('Failed to save preferences', 'error');
  }
});

/**
 * Example 4: Check consent on page load
 */
window.addEventListener('DOMContentLoaded', () => {
  // Retry any pending consent submissions
  retryPendingConsent();

  // Show banner if needed
  if (needsConsent()) {
    showCookieBanner();
  } else if (hasAnalyticsConsent()) {
    initializeAnalytics();
  }
});

// ============================================================================
// Helper Functions (implement these in your actual code)
// ============================================================================

function closeCookieBanner() {
  document.getElementById('cookie-banner')?.classList.add('hidden');
}

function showCookieBanner() {
  document.getElementById('cookie-banner')?.classList.remove('hidden');
}

function initializeAnalytics() {
  // Initialize Google Analytics, Cloudflare Analytics, etc.
  console.log('Analytics initialized');
}

function disableAnalytics() {
  // Disable tracking scripts
  console.log('Analytics disabled');
}

function showToast(message, type = 'success') {
  console.log(`Toast: ${message} (${type})`);
}

// Export functions for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    saveConsent,
    hasAnalyticsConsent,
    needsConsent,
    retryPendingConsent,
  };
}
