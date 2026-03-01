import { useSyncExternalStore } from 'react';

type StatusLevel = 'online' | 'degraded' | 'offline';

interface HealthState {
  status: StatusLevel;
  loading: boolean;
}

const BSI_HEALTH_URL = 'https://blazesportsintel.com/api/health';
const POLL_INTERVAL = 60_000;

// Module-level singleton — shared across all component instances
let state: HealthState = { status: 'offline', loading: true };
let listeners: Set<() => void> = new Set();
let intervalId: ReturnType<typeof setInterval> | null = null;
let subscriberCount = 0;

function notify() {
  for (const listener of listeners) listener();
}

async function checkHealth() {
  try {
    const res = await fetch(BSI_HEALTH_URL, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) {
      state = { status: 'degraded', loading: false };
    } else {
      const data = await res.json();
      state = { status: data.status === 'ok' ? 'online' : 'degraded', loading: false };
    }
  } catch {
    state = { status: 'offline', loading: false };
  }
  notify();
}

function startPolling() {
  if (intervalId !== null) return;
  checkHealth();
  intervalId = setInterval(checkHealth, POLL_INTERVAL);
}

function stopPolling() {
  if (intervalId !== null) {
    clearInterval(intervalId);
    intervalId = null;
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  subscriberCount++;
  if (subscriberCount === 1) startPolling();

  return () => {
    listeners.delete(listener);
    subscriberCount--;
    if (subscriberCount === 0) stopPolling();
  };
}

function getSnapshot(): HealthState {
  return state;
}

/** Shared health check — one poller regardless of how many components mount */
export function usePlatformHealth(): HealthState {
  return useSyncExternalStore(subscribe, getSnapshot);
}
