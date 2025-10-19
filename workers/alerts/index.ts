/**
 * Watchlist Alert Worker
 * --------------------------------------------
 * Evaluates watchlist preferences against live game telemetry and
 * dispatches push/email alerts when configured scenarios fire.
 *
 * Schedules: every minute for high-signal responsiveness.
 * Data sources: Blaze Sports Intel database (Postgres via Prisma Accelerate)
 * and live game snapshots exposed by the ingestion pipeline.
 */

import { PrismaClient } from '@prisma/client/edge';
import { withAccelerate } from '@prisma/extension-accelerate';
import type { Env, LiveGameSnapshot } from './types';

const prisma = new PrismaClient().$extends(withAccelerate());

const ALERT_WINDOW_MS = 5 * 60 * 1000; // 5 minutes dedupe window

interface DispatchContext {
  env: Env;
  preferenceId: string;
  scenario: 'LEAD_CHANGE' | 'UPSET_ALERT' | 'GAME_START';
  summary: string;
  payload: Record<string, unknown>;
}

async function dispatchAlert({ env, preferenceId, scenario, summary, payload }: DispatchContext): Promise<void> {
  await prisma.watchlistAlertLog.create({
    data: {
      watchlistId: preferenceId,
      scenario,
      details: payload
    }
  });

  const deliveries: Promise<Response>[] = [];

  if (env.WATCHLIST_ALERT_WEBHOOK) {
    deliveries.push(
      fetch(env.WATCHLIST_ALERT_WEBHOOK, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario, summary, payload })
      })
    );
  }

  if (env.WATCHLIST_ALERT_EMAIL_WEBHOOK) {
    deliveries.push(
      fetch(env.WATCHLIST_ALERT_EMAIL_WEBHOOK, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenario,
          subject: `Diamond Insights Alert · ${scenario.replace('_', ' ')}`,
          body: summary,
          data: payload
        })
      })
    );
  }

  if (deliveries.length > 0) {
    await Promise.allSettled(deliveries);
  }
}

async function alreadyTriggered(preferenceId: string, scenario: 'LEAD_CHANGE' | 'UPSET_ALERT' | 'GAME_START'): Promise<boolean> {
  const recent = await prisma.watchlistAlertLog.findFirst({
    where: {
      watchlistId: preferenceId,
      scenario,
      triggeredAt: {
        gte: new Date(Date.now() - ALERT_WINDOW_MS)
      }
    },
    orderBy: { triggeredAt: 'desc' }
  });

  return Boolean(recent);
}

async function fetchSnapshots(env: Env, entityIds: string[]): Promise<LiveGameSnapshot[]> {
  if (!env.LIVE_GAMES_API || entityIds.length === 0) {
    return [];
  }

  const url = new URL(env.LIVE_GAMES_API);
  url.searchParams.set('ids', entityIds.join(','));

  const response = await fetch(url.toString(), {
    headers: { 'Content-Type': 'application/json' }
  });

  if (!response.ok) {
    console.error('[alerts] Failed to fetch live snapshots', await response.text());
    return [];
  }

  const data = (await response.json()) as LiveGameSnapshot[];
  return Array.isArray(data) ? data : [];
}

function buildSummary(preference: { displayName: string | null; entityType: string; entityId: string }, snapshot: LiveGameSnapshot, scenario: 'LEAD_CHANGE' | 'UPSET_ALERT' | 'GAME_START'): string {
  const label = preference.displayName ?? `${preference.entityType === 'TEAM' ? 'Team' : 'Game'} ${preference.entityId}`;
  switch (scenario) {
    case 'LEAD_CHANGE':
      return `${label}: lead swung at ${snapshot.lastLeadChangeAt ?? 'latest update'}.`;
    case 'UPSET_ALERT':
      return `${label}: upset probability spiked to ${(snapshot.upsetProbability ?? 0).toFixed(2)}.`;
    case 'GAME_START':
      return `${label}: first pitch thrown.`;
    default:
      return `${label}: alert triggered.`;
  }
}

function shouldTriggerLeadChange(snapshot: LiveGameSnapshot): boolean {
  return snapshot.status === 'LIVE' && Boolean(snapshot.lastLeadChangeAt);
}

function shouldTriggerUpset(snapshot: LiveGameSnapshot, minDelta: number): boolean {
  if (snapshot.status !== 'LIVE' || typeof snapshot.upsetProbability !== 'number') {
    return false;
  }

  const previous = snapshot.previousUpsetProbability ?? 0;
  const delta = snapshot.upsetProbability - previous;
  return delta >= minDelta;
}

function shouldTriggerGameStart(snapshot: LiveGameSnapshot): boolean {
  return snapshot.status === 'LIVE' && snapshot.previousUpsetProbability === undefined && snapshot.lastLeadChangeAt === undefined;
}

async function evaluatePreferences(env: Env): Promise<void> {
  const preferences = await prisma.watchlistPreference.findMany({
    include: {
      alerts: {
        take: 1,
        orderBy: { triggeredAt: 'desc' }
      }
    }
  });

  if (preferences.length === 0) {
    return;
  }

  const entityIds = Array.from(new Set(preferences.map((pref) => pref.entityId)));
  const snapshots = await fetchSnapshots(env, entityIds);
  const snapshotById = new Map(snapshots.map((snapshot) => [snapshot.entityId, snapshot]));
  const minDelta = env.ALERT_MIN_PROBABILITY_DELTA ? Number(env.ALERT_MIN_PROBABILITY_DELTA) : 0.15;

  for (const preference of preferences) {
    const snapshot = snapshotById.get(preference.entityId);
    if (!snapshot) {
      continue;
    }

    if (preference.alertGameStart && (await alreadyTriggered(preference.id, 'GAME_START')) === false && shouldTriggerGameStart(snapshot)) {
      const summary = buildSummary(preference, snapshot, 'GAME_START');
      await dispatchAlert({
        env,
        preferenceId: preference.id,
        scenario: 'GAME_START',
        summary,
        payload: { snapshot }
      });
    }

    if (preference.alertLeadChange && (await alreadyTriggered(preference.id, 'LEAD_CHANGE')) === false && shouldTriggerLeadChange(snapshot)) {
      const summary = buildSummary(preference, snapshot, 'LEAD_CHANGE');
      await dispatchAlert({
        env,
        preferenceId: preference.id,
        scenario: 'LEAD_CHANGE',
        summary,
        payload: { snapshot }
      });
    }

    if (preference.alertUpsetProbability && (await alreadyTriggered(preference.id, 'UPSET_ALERT')) === false && shouldTriggerUpset(snapshot, minDelta)) {
      const summary = buildSummary(preference, snapshot, 'UPSET_ALERT');
      await dispatchAlert({
        env,
        preferenceId: preference.id,
        scenario: 'UPSET_ALERT',
        summary,
        payload: { snapshot, delta: (snapshot.upsetProbability ?? 0) - (snapshot.previousUpsetProbability ?? 0) }
      });
    }
  }
}

export default {
  async scheduled(_event: ScheduledEvent, env: Env, _ctx: ExecutionContext): Promise<void> {
    try {
      await evaluatePreferences(env);
    } catch (error) {
      console.error('[alerts] scheduled run failed', error);
      throw error;
    }
  },

  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/health') {
      return new Response(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (url.pathname === '/evaluate' && request.method === 'POST') {
      try {
        await evaluatePreferences(env);
        return new Response(JSON.stringify({ success: true }), {
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (error) {
        console.error('[alerts] manual trigger failed', error);
        return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    return new Response('Not Found', { status: 404 });
  }
};
