/**
 * Push Notification System for College Baseball
 * Granular controls for game alerts without spam
 * 
 * Features:
 * - Game start notifications
 * - Live inning updates
 * - Final score alerts
 * - Favorite team/player tracking
 */

export interface NotificationPreferences {
  enabled: boolean;
  gameStart: boolean;
  inningUpdates: boolean;
  finalScore: boolean;
  importantPlays: boolean;
  favoriteTeams: string[];
  favoritePlayers: string[];
  quietHours?: {
    start: string; // HH:MM format
    end: string;
  };
}

export interface NotificationPayload {
  type: 'game-start' | 'inning-update' | 'final-score' | 'important-play';
  gameId: string;
  title: string;
  body: string;
  data: {
    homeTeam: string;
    awayTeam: string;
    homeScore?: number;
    awayScore?: number;
    inning?: number;
    url: string;
  };
}

/**
 * Request notification permission from user
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    throw new Error('Notifications not supported');
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission;
  }

  return 'denied';
}

/**
 * Subscribe to push notifications
 */
export async function subscribeToPushNotifications(): Promise<PushSubscription | null> {
  try {
    // Check if service worker is supported
    if (!('serviceWorker' in navigator)) {
      throw new Error('Service workers not supported');
    }

    // Register service worker if not already registered
    const registration = await navigator.serviceWorker.ready;

    // Subscribe to push notifications
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(getVapidPublicKey()) as BufferSource
    });

    // Send subscription to server
    await saveSubscriptionToServer(subscription);

    return subscription;
  } catch (error) {
    console.error('Failed to subscribe to push notifications:', error);
    return null;
  }
}

/**
 * Unsubscribe from push notifications
 */
export async function unsubscribeFromPushNotifications(): Promise<boolean> {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      await subscription.unsubscribe();
      await removeSubscriptionFromServer(subscription);
      return true;
    }

    return false;
  } catch (error) {
    console.error('Failed to unsubscribe from push notifications:', error);
    return false;
  }
}

/**
 * Save notification preferences
 */
export function saveNotificationPreferences(preferences: NotificationPreferences): void {
  localStorage.setItem('college-baseball:notification-prefs', JSON.stringify(preferences));
}

/**
 * Load notification preferences
 */
export function loadNotificationPreferences(): NotificationPreferences {
  const stored = localStorage.getItem('college-baseball:notification-prefs');
  
  if (stored) {
    return JSON.parse(stored);
  }

  // Default preferences
  return {
    enabled: false,
    gameStart: true,
    inningUpdates: false,
    finalScore: true,
    importantPlays: false,
    favoriteTeams: [],
    favoritePlayers: []
  };
}

/**
 * Check if user should receive notification based on preferences
 */
export function shouldSendNotification(
  payload: NotificationPayload,
  preferences: NotificationPreferences
): boolean {
  // Check if notifications are enabled
  if (!preferences.enabled) {
    return false;
  }

  // Check notification type preferences
  switch (payload.type) {
    case 'game-start':
      if (!preferences.gameStart) return false;
      break;
    case 'inning-update':
      if (!preferences.inningUpdates) return false;
      break;
    case 'final-score':
      if (!preferences.finalScore) return false;
      break;
    case 'important-play':
      if (!preferences.importantPlays) return false;
      break;
  }

  // Check if notification is for a favorite team
  if (preferences.favoriteTeams.length > 0) {
    const isFavoriteTeam = 
      preferences.favoriteTeams.includes(payload.data.homeTeam) ||
      preferences.favoriteTeams.includes(payload.data.awayTeam);
    
    if (!isFavoriteTeam) {
      return false;
    }
  }

  // Check quiet hours
  if (preferences.quietHours) {
    if (isInQuietHours(preferences.quietHours)) {
      return false;
    }
  }

  return true;
}

/**
 * Display a local notification (for testing/demo)
 */
export async function showLocalNotification(payload: NotificationPayload): Promise<void> {
  const permission = await requestNotificationPermission();
  
  if (permission !== 'granted') {
    console.warn('Notification permission not granted');
    return;
  }

  const registration = await navigator.serviceWorker.ready;
  
  await registration.showNotification(payload.title, {
    body: payload.body,
    icon: '/assets/icon-192.png',
    badge: '/assets/badge-72.png',
    tag: `game-${payload.gameId}`,
    data: payload.data
  });
}

// Helper functions

function getVapidPublicKey(): string {
  // In production, this should be your actual VAPID public key
  if (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_VAPID_PUBLIC_KEY) {
    return process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  }
  return 'BEl62iUYgUivxIkv69yViEuiBIa-Ib37J8xYFraBudc';
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
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
}

async function saveSubscriptionToServer(subscription: PushSubscription): Promise<void> {
  try {
    await fetch('/api/college-baseball/notifications/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(subscription)
    });
  } catch (error) {
    console.error('Failed to save subscription to server:', error);
  }
}

async function removeSubscriptionFromServer(subscription: PushSubscription): Promise<void> {
  try {
    await fetch('/api/college-baseball/notifications/unsubscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(subscription)
    });
  } catch (error) {
    console.error('Failed to remove subscription from server:', error);
  }
}

function isInQuietHours(quietHours: { start: string; end: string }): boolean {
  const now = new Date();
  const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  
  // Simple time comparison (assumes same day)
  return currentTime >= quietHours.start && currentTime <= quietHours.end;
}

/**
 * Create notification payload for game start
 */
export function createGameStartNotification(game: any): NotificationPayload {
  return {
    type: 'game-start',
    gameId: game.id,
    title: '⚾ Game Starting',
    body: `${game.awayTeam.shortName} at ${game.homeTeam.shortName} - First pitch at ${game.time}`,
    data: {
      homeTeam: game.homeTeam.id,
      awayTeam: game.awayTeam.id,
      url: `/games/${game.id}`
    }
  };
}

/**
 * Create notification payload for final score
 */
export function createFinalScoreNotification(game: any, boxScore: any): NotificationPayload {
  const winner = boxScore.homeTeam.score > boxScore.awayTeam.score ? boxScore.homeTeam : boxScore.awayTeam;
  const loser = boxScore.homeTeam.score > boxScore.awayTeam.score ? boxScore.awayTeam : boxScore.homeTeam;
  
  return {
    type: 'final-score',
    gameId: game.id,
    title: '⚾ Final Score',
    body: `${winner.team.shortName} ${winner.score}, ${loser.team.shortName} ${loser.score}`,
    data: {
      homeTeam: boxScore.homeTeam.team.id,
      awayTeam: boxScore.awayTeam.team.id,
      homeScore: boxScore.homeTeam.score,
      awayScore: boxScore.awayTeam.score,
      url: `/games/${game.id}`
    }
  };
}
