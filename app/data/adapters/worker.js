/**
 * Cloudflare Worker Adapter
 * Base: https://blaze-worker.humphrey-austin20.workers.dev
 */

import { KPI, AccuracySeries, AlertBuckets, Teams, Leaderboard } from '../schema.js';

const WORKER_BASE = 'https://blaze-worker.humphrey-austin20.workers.dev';

async function fetchJSON(endpoint, options = {}) {
  const url = `${WORKER_BASE}${endpoint}`;
  console.log(`Fetching: ${url}`);

  try {
    const response = await fetch(url, {
      cache: 'no-store',
      ...options,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText} for ${url}`);
    }

    const data = await response.json();
    console.log(`Success: ${url}`, data);
    return data;
  } catch (error) {
    console.error(`Failed to fetch ${url}:`, error);
    throw error;
  }
}

export async function getKPI() {
  try {
    const raw = await fetchJSON('/kpi');
    return KPI.parse(raw);
  } catch (error) {
    console.error('KPI fetch failed:', error);
    // Return error state - do not fake data
    throw new Error('KPI data unavailable');
  }
}

export async function getAccuracy() {
  try {
    const raw = await fetchJSON('/analytics/accuracy');
    return AccuracySeries.parse(raw);
  } catch (error) {
    console.error('Accuracy data fetch failed:', error);
    throw new Error('Accuracy data unavailable');
  }
}

export async function getAlerts() {
  try {
    const raw = await fetchJSON('/alerts/buckets');
    return AlertBuckets.parse(raw);
  } catch (error) {
    console.error('Alerts data fetch failed:', error);
    throw new Error('Alerts data unavailable');
  }
}

export async function getTeams(league) {
  try {
    const raw = await fetchJSON(`/teams/${league}`);
    return Teams.parse(raw);
  } catch (error) {
    console.error(`Teams data fetch failed for ${league}:`, error);
    throw new Error(`Teams data unavailable for ${league}`);
  }
}

export async function getLeaderboard() {
  try {
    const raw = await fetchJSON('/multiplayer/leaderboard');
    return Leaderboard.parse(raw);
  } catch (error) {
    console.error('Leaderboard fetch failed:', error);
    throw new Error('Leaderboard data unavailable');
  }
}

export async function getYearlyTrend() {
  try {
    const raw = await fetchJSON('/analytics/yearly-trend');
    return AccuracySeries.parse(raw);
  } catch (error) {
    console.error('Yearly trend fetch failed:', error);
    throw new Error('Yearly trend data unavailable');
  }
}

export async function incrementScore(playerName) {
  try {
    const raw = await fetchJSON('/multiplayer/leaderboard', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'increment', player: playerName }),
    });
    return Leaderboard.parse(raw);
  } catch (error) {
    console.error('Score increment failed:', error);
    throw new Error('Score update unavailable');
  }
}
