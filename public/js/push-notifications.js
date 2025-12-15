/**
 * Blaze Sports Intel | Push Notifications Manager
 *
 * Handles push notification registration, team following,
 * and game alert preferences.
 *
 * @author Blaze Sports Intel
 * @version 1.0.0
 */

const PushNotifications = {
  // VAPID public key (replace with your actual key from Cloudflare or your push service)
  VAPID_PUBLIC_KEY: 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U',

  // Storage keys
  STORAGE_KEYS: {
    followedTeams: 'bsi_followed_teams',
    notificationPrefs: 'bsi_notification_prefs',
    pushSubscription: 'bsi_push_subscription'
  },

  // Default notification preferences
  DEFAULT_PREFS: {
    gameStart: true,
    finalScores: true,
    closeGames: true,      // Alert when game is within 2 runs in 7th+
    bigPlays: false,       // Home runs, grand slams
    injuryAlerts: false,
    dailyDigest: false
  },

  /**
   * Initialize push notifications
   */
  async init() {
    // Check if push is supported
    if (!('PushManager' in window)) {
      console.log('[Push] Push notifications not supported');
      return false;
    }

    // Check if service worker is registered
    if (!('serviceWorker' in navigator)) {
      console.log('[Push] Service Worker not supported');
      return false;
    }

    // Load saved data
    this.loadFollowedTeams();
    this.loadPreferences();

    // Check existing subscription
    const subscription = await this.getExistingSubscription();
    if (subscription) {
      console.log('[Push] Existing subscription found');
      this.subscription = subscription;
    }

    return true;
  },

  /**
   * Request notification permission
   * @returns {Promise<boolean>} True if permission granted
   */
  async requestPermission() {
    const permission = await Notification.requestPermission();

    if (permission === 'granted') {
      console.log('[Push] Notification permission granted');
      return true;
    }

    console.log('[Push] Notification permission denied');
    return false;
  },

  /**
   * Subscribe to push notifications
   * @returns {Promise<PushSubscription|null>}
   */
  async subscribe() {
    try {
      // Request permission first
      const hasPermission = await this.requestPermission();
      if (!hasPermission) return null;

      // Get service worker registration
      const registration = await navigator.serviceWorker.ready;

      // Check if already subscribed
      let subscription = await registration.pushManager.getSubscription();

      if (!subscription) {
        // Create new subscription
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: this.urlBase64ToUint8Array(this.VAPID_PUBLIC_KEY)
        });

        console.log('[Push] New subscription created');

        // Send subscription to server
        await this.sendSubscriptionToServer(subscription);
      }

      // Save locally
      this.subscription = subscription;
      localStorage.setItem(this.STORAGE_KEYS.pushSubscription, JSON.stringify(subscription));

      return subscription;
    } catch (error) {
      console.error('[Push] Failed to subscribe:', error);
      return null;
    }
  },

  /**
   * Unsubscribe from push notifications
   */
  async unsubscribe() {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await subscription.unsubscribe();

        // Notify server
        await this.removeSubscriptionFromServer(subscription);

        // Clear local storage
        localStorage.removeItem(this.STORAGE_KEYS.pushSubscription);
        this.subscription = null;

        console.log('[Push] Unsubscribed successfully');
        return true;
      }

      return false;
    } catch (error) {
      console.error('[Push] Failed to unsubscribe:', error);
      return false;
    }
  },

  /**
   * Get existing push subscription
   */
  async getExistingSubscription() {
    try {
      const registration = await navigator.serviceWorker.ready;
      return await registration.pushManager.getSubscription();
    } catch (error) {
      console.error('[Push] Failed to get subscription:', error);
      return null;
    }
  },

  /**
   * Follow a team for notifications
   * @param {Object} team - Team object with id, name, espnId, conference
   */
  followTeam(team) {
    const teams = this.getFollowedTeams();

    // Check if already following
    if (teams.some(t => t.id === team.id)) {
      console.log('[Push] Already following team:', team.name);
      return;
    }

    teams.push({
      id: team.id,
      name: team.name,
      espnId: team.espnId,
      conference: team.conference,
      followedAt: new Date().toISOString()
    });

    localStorage.setItem(this.STORAGE_KEYS.followedTeams, JSON.stringify(teams));
    console.log('[Push] Now following:', team.name);

    // Sync with server
    this.syncFollowedTeams();
  },

  /**
   * Unfollow a team
   * @param {string} teamId - Team ID to unfollow
   */
  unfollowTeam(teamId) {
    let teams = this.getFollowedTeams();
    teams = teams.filter(t => t.id !== teamId);
    localStorage.setItem(this.STORAGE_KEYS.followedTeams, JSON.stringify(teams));
    console.log('[Push] Unfollowed team:', teamId);

    // Sync with server
    this.syncFollowedTeams();
  },

  /**
   * Get list of followed teams
   * @returns {Array}
   */
  getFollowedTeams() {
    const stored = localStorage.getItem(this.STORAGE_KEYS.followedTeams);
    return stored ? JSON.parse(stored) : [];
  },

  /**
   * Check if following a specific team
   * @param {string} teamId
   * @returns {boolean}
   */
  isFollowingTeam(teamId) {
    return this.getFollowedTeams().some(t => t.id === teamId);
  },

  /**
   * Load followed teams from storage
   */
  loadFollowedTeams() {
    this.followedTeams = this.getFollowedTeams();
  },

  /**
   * Update notification preferences
   * @param {Object} prefs - Preference object
   */
  updatePreferences(prefs) {
    const current = this.getPreferences();
    const updated = { ...current, ...prefs };
    localStorage.setItem(this.STORAGE_KEYS.notificationPrefs, JSON.stringify(updated));
    this.preferences = updated;

    // Sync with server
    this.syncPreferences();
  },

  /**
   * Get notification preferences
   * @returns {Object}
   */
  getPreferences() {
    const stored = localStorage.getItem(this.STORAGE_KEYS.notificationPrefs);
    return stored ? JSON.parse(stored) : { ...this.DEFAULT_PREFS };
  },

  /**
   * Load preferences from storage
   */
  loadPreferences() {
    this.preferences = this.getPreferences();
  },

  /**
   * Send subscription to server
   */
  async sendSubscriptionToServer(subscription) {
    try {
      const response = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscription: subscription.toJSON(),
          teams: this.getFollowedTeams(),
          preferences: this.getPreferences()
        })
      });

      if (!response.ok) throw new Error('Server subscription failed');
      console.log('[Push] Subscription synced with server');
    } catch (error) {
      console.error('[Push] Failed to sync subscription:', error);
      // Store for later retry
      localStorage.setItem('bsi_pending_subscription', JSON.stringify(subscription.toJSON()));
    }
  },

  /**
   * Remove subscription from server
   */
  async removeSubscriptionFromServer(subscription) {
    try {
      await fetch('/api/push/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: subscription.endpoint })
      });
    } catch (error) {
      console.error('[Push] Failed to remove subscription from server:', error);
    }
  },

  /**
   * Sync followed teams with server
   */
  async syncFollowedTeams() {
    if (!this.subscription) return;

    try {
      await fetch('/api/push/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: this.subscription.endpoint,
          teams: this.getFollowedTeams()
        })
      });
    } catch (error) {
      console.error('[Push] Failed to sync teams:', error);
    }
  },

  /**
   * Sync preferences with server
   */
  async syncPreferences() {
    if (!this.subscription) return;

    try {
      await fetch('/api/push/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: this.subscription.endpoint,
          preferences: this.getPreferences()
        })
      });
    } catch (error) {
      console.error('[Push] Failed to sync preferences:', error);
    }
  },

  /**
   * Show local notification (for testing)
   */
  async showTestNotification() {
    if (Notification.permission !== 'granted') {
      await this.requestPermission();
    }

    if (Notification.permission === 'granted') {
      const registration = await navigator.serviceWorker.ready;
      registration.showNotification('Blaze Sports Intel', {
        body: 'Push notifications are working!',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/badge-72x72.png',
        vibrate: [100, 50, 100],
        data: { url: '/' }
      });
    }
  },

  /**
   * Convert VAPID key from base64 to Uint8Array
   */
  urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  },

  /**
   * Create follow button UI component
   * @param {Object} team - Team data
   * @returns {HTMLElement}
   */
  createFollowButton(team) {
    const isFollowing = this.isFollowingTeam(team.id);

    const button = document.createElement('button');
    button.className = `follow-btn ${isFollowing ? 'following' : ''}`;
    button.innerHTML = isFollowing
      ? '<span class="icon">&#10003;</span> Following'
      : '<span class="icon">&#9734;</span> Follow';

    button.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();

      // Ensure notifications are enabled
      if (!this.subscription) {
        const subscribed = await this.subscribe();
        if (!subscribed) {
          alert('Please enable notifications to follow teams.');
          return;
        }
      }

      if (this.isFollowingTeam(team.id)) {
        this.unfollowTeam(team.id);
        button.classList.remove('following');
        button.innerHTML = '<span class="icon">&#9734;</span> Follow';
      } else {
        this.followTeam(team);
        button.classList.add('following');
        button.innerHTML = '<span class="icon">&#10003;</span> Following';
      }
    });

    return button;
  },

  /**
   * Create notification preferences UI
   * @returns {HTMLElement}
   */
  createPreferencesUI() {
    const prefs = this.getPreferences();

    const container = document.createElement('div');
    container.className = 'notification-prefs';
    container.innerHTML = `
      <h3>Notification Settings</h3>
      <label class="pref-toggle">
        <input type="checkbox" data-pref="gameStart" ${prefs.gameStart ? 'checked' : ''}>
        <span>Game start alerts</span>
      </label>
      <label class="pref-toggle">
        <input type="checkbox" data-pref="finalScores" ${prefs.finalScores ? 'checked' : ''}>
        <span>Final scores</span>
      </label>
      <label class="pref-toggle">
        <input type="checkbox" data-pref="closeGames" ${prefs.closeGames ? 'checked' : ''}>
        <span>Close game alerts (within 2 runs in 7th+)</span>
      </label>
      <label class="pref-toggle">
        <input type="checkbox" data-pref="bigPlays" ${prefs.bigPlays ? 'checked' : ''}>
        <span>Big plays (home runs, grand slams)</span>
      </label>
      <label class="pref-toggle">
        <input type="checkbox" data-pref="injuryAlerts" ${prefs.injuryAlerts ? 'checked' : ''}>
        <span>Injury updates</span>
      </label>
      <label class="pref-toggle">
        <input type="checkbox" data-pref="dailyDigest" ${prefs.dailyDigest ? 'checked' : ''}>
        <span>Daily digest (morning summary)</span>
      </label>
    `;

    // Handle changes
    container.querySelectorAll('input[type="checkbox"]').forEach(input => {
      input.addEventListener('change', (e) => {
        const pref = e.target.dataset.pref;
        this.updatePreferences({ [pref]: e.target.checked });
      });
    });

    return container;
  }
};

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
  PushNotifications.init();
});

// Export
window.PushNotifications = PushNotifications;
