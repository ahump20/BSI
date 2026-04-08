/**
 * Generate a markdown source document for NotebookLM podcast production.
 *
 * Fetches data from BSI's live APIs:
 * - Weekly pulse (top hitters, pitchers, conference trends)
 * - Rankings (current Top 25)
 * - Savant leaderboard (advanced metrics leaders)
 * - League context (D1 run environment)
 *
 * Outputs a markdown document that can be uploaded to NotebookLM
 * as a source for audio overview generation.
 *
 * Usage:
 *   npx tsx scripts/generate-podcast-source.ts > output.md
 *   # Then upload output.md to NotebookLM as a source
 */

const BASE = 'https://blazesportsintel.com';

async function fetchJson<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${BASE}${path}`, {
      signal: AbortSignal.timeout(10000),
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

interface PulsePlayer {
  player_name: string;
  team: string;
  value: number;
  label: string;
}

interface PulseData {
  week: string;
  top_hitters: PulsePlayer[];
  top_pitchers: PulsePlayer[];
  movers_woba: PulsePlayer[];
  movers_fip: PulsePlayer[];
  conference_snapshot: Array<{ conference: string; strength_index: number; avg_woba: number }>;
}

interface RankingsTeam {
  rank: number;
  team: string;
  name?: string;
  record?: string;
  conference?: string;
}

interface LeaderboardPlayer {
  player_name: string;
  team: string;
  woba: number;
  wrc_plus: number;
  avg: number;
  ops: number;
}

interface LeagueContext {
  context: {
    woba: number;
    avg: number;
    obp: number;
    slg: number;
    era: number;
    fip_constant: number;
    sample_batting: number;
    sample_pitching: number;
  };
}

async function main() {
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];

  const [pulse, rankings, batting, pitching, context] = await Promise.all([
    fetchJson<PulseData>('/api/college-baseball/weekly-pulse'),
    fetchJson<{ rankings: RankingsTeam[] }>('/api/college-baseball/rankings'),
    fetchJson<{ data: LeaderboardPlayer[] }>('/api/savant/batting/leaderboard?limit=10'),
    fetchJson<{ data: Array<{ player_name: string; team: string; fip: number; era: number }> }>('/api/savant/pitching/leaderboard?limit=10'),
    fetchJson<LeagueContext>('/api/savant/league-context'),
  ]);

  console.log(`# BSI Weekly College Baseball Intelligence Brief`);
  console.log(`## Generated ${dateStr} | Week ${pulse?.week || 'Unknown'}`);
  console.log('');
  console.log('*This document is auto-generated from live BSI data for use as a NotebookLM podcast source.*');
  console.log('');

  // Rankings
  if (rankings?.rankings) {
    console.log('## Current Top 25 Rankings');
    console.log('');
    for (const t of rankings.rankings.slice(0, 25)) {
      const name = t.name || t.team || 'Unknown';
      console.log(`${t.rank}. ${name} ${t.record ? `(${t.record})` : ''} ${t.conference ? `- ${t.conference}` : ''}`);
    }
    console.log('');
  }

  // League Context
  if (context?.context) {
    const c = context.context;
    console.log('## D1 Run Environment (2026 Season Baselines)');
    console.log('');
    console.log(`- League wOBA: ${c.woba.toFixed(3)}`);
    console.log(`- League AVG: ${c.avg.toFixed(3)}`);
    console.log(`- League OBP: ${c.obp.toFixed(3)}`);
    console.log(`- League SLG: ${c.slg.toFixed(3)}`);
    console.log(`- League ERA: ${c.era.toFixed(2)}`);
    console.log(`- FIP Constant: ${c.fip_constant.toFixed(2)}`);
    console.log(`- Sample: ${c.sample_batting} batters, ${c.sample_pitching} pitchers`);
    console.log('');
  }

  // Weekly Pulse
  if (pulse) {
    console.log('## Top Hitters This Week');
    console.log('');
    for (const h of pulse.top_hitters || []) {
      console.log(`- **${h.player_name}** (${h.team}) — ${h.label}: ${h.value.toFixed(3)}`);
    }
    console.log('');

    console.log('## Top Pitchers This Week');
    console.log('');
    for (const p of pulse.top_pitchers || []) {
      console.log(`- **${p.player_name}** (${p.team}) — ${p.label}: ${p.value.toFixed(2)}`);
    }
    console.log('');

    if (pulse.conference_snapshot?.length) {
      console.log('## Conference Strength Snapshot');
      console.log('');
      for (const c of pulse.conference_snapshot.slice(0, 10)) {
        console.log(`- ${c.conference}: Strength ${c.strength_index.toFixed(1)}, Avg wOBA ${c.avg_woba.toFixed(3)}`);
      }
      console.log('');
    }
  }

  // Savant Batting Leaders
  if (batting?.data) {
    console.log('## Savant Batting Leaders (Park-Adjusted)');
    console.log('');
    for (const b of batting.data.slice(0, 10)) {
      console.log(`- **${b.player_name}** (${b.team}) — wOBA ${b.woba.toFixed(3)}, wRC+ ${b.wrc_plus.toFixed(1)}, AVG ${b.avg.toFixed(3)}`);
    }
    console.log('');
  }

  // Savant Pitching Leaders
  if (pitching?.data) {
    console.log('## Savant Pitching Leaders');
    console.log('');
    for (const p of pitching.data.slice(0, 10)) {
      console.log(`- **${p.player_name}** (${p.team}) — FIP ${p.fip.toFixed(2)}, ERA ${p.era.toFixed(2)}`);
    }
    console.log('');
  }

  console.log('---');
  console.log(`*Source: Blaze Sports Intel (blazesportsintel.com) | Generated ${now.toISOString()}*`);
}

main().catch(console.error);
