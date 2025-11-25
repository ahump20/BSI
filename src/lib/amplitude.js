/**
 * Amplitude Analytics + Session Replay
 * BlazeSportsIntel.com
 */
import * as amplitude from '@amplitude/analytics-browser';
import { sessionReplayPlugin } from '@amplitude/plugin-session-replay-browser';

let isInitialized = false;

export function initAmplitude() {
  // Client-side only
  if (typeof window === 'undefined') return;

  // Prevent double initialization
  if (isInitialized) return;

  // Add Session Replay plugin BEFORE init
  amplitude.add(sessionReplayPlugin({ sampleRate: 1 }));

  // Initialize with autocapture
  amplitude.init('ce08c2d67be4819262f3cdccbe031686', { autocapture: true });

  isInitialized = true;
}

// Export for custom event tracking
export { amplitude };
