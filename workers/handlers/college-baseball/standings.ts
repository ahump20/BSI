/**
 * College Baseball — standings, rankings, and leaders handlers.
 */

import type { Env } from './shared';
import { json, cachedJson, kvGet, kvPut, dataHeaders, cachedPayloadHeaders, withMeta, getCollegeClient, getHighlightlyClient, archiveRawResponse, HTTP_CACHE, CACHE_TTL, teamMetadata, metaByEspnId, getLogoUrl, lookupConference, buildLeaderCategories } from './shared';

/**
 * Normalize a conference slug (from URL params like "america-east") to the
 * canonical display name used in teamMetadata (e.g. "America East").
 * Falls through to the raw value for conferences where slug === name (SEC, ACC).
 */
const CONFERENCE_SLUG_MAP: Record<string, string> = {
  'america-east': 'America East',
  'big-12': 'Big 12',
  'big-east': 'Big East',
  'big-south': 'Big South',
  'big-ten': 'Big Ten',
  'big-west': 'Big West',
  'missouri-valley': 'Missouri Valley',
  'mountain-west': 'Mountain West',
  'patriot-league': 'Patriot League',
  'sun-belt': 'Sun Belt',
  'a-10': 'A-10',
};

function normalizeConference(raw: string): string {
  if (!raw || raw === 'NCAA') return raw;
  // Check slug map first
  const mapped = CONFERENCE_SLUG_MAP[raw.toLowerCase()];
  if (mapped) return mapped;
  // Single-word conferences: uppercase if short (SEC, ACC, AAC, WAC, CAA, WCC, CUSA)
  if (raw.length <= 4 && /^[a-z]+$/i.test(raw)) return raw.toUpperCase();
  // Title-case fallback for remaining multi-word slugs (e.g. "asun" → "ASUN", "southern" → "Southern")
  const upper = raw.toUpperCase();
  const knownUpper = ['ASUN', 'CUSA', 'CAA', 'WAC', 'WCC', 'AAC'];
  if (knownUpper.includes(upper)) return upper;
  // Capitalize first letter for display names like "Southern", "Horizon", "Summit", "Southland", "Independent"
  return raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
}

export async function handleCollegeBaseballStandings(
  url: URL,
  env: Env,
  ctx?: ExecutionContext,
): Promise<Response> {
  try {
  const rawConference = url.searchParams.get('conference') || 'NCAA';
  const conference = normalizeConference(rawConference);
  const cacheKey = `cb:standings:v3:${conference}`;
  const now = new Date().toISOString();

  const cached = await kvGet<Record<string, unknown>>(env.KV, cacheKey);
  // Only serve cache if it's a properly formatted response (has success + data keys).
  // Raw ESPN arrays from the ingest worker or empty arrays are skipped.
  if (cached && typeof cached === 'object' && !Array.isArray(cached) && 'success' in cached && 'data' in cached) {
    return cachedJson(cached, 200, HTTP_CACHE.standings, cachedPayloadHeaders(cached));
  }

  const sources: string[] = [];
  let degraded = false;

  // ---------------------------------------------------------------------------
  // Step 1: ESPN skeleton (structural source — conference membership, stable IDs)
  // ---------------------------------------------------------------------------
  const client = getCollegeClient();
  let espnStandings: Array<Record<string, unknown>> = [];
  let espnTimestamp = now;
  let espnOk = false;

  try {
    const result = await client.getStandings();
    espnTimestamp = result.timestamp;
    if (result.data) {
      ctx?.waitUntil(archiveRawResponse(env.DATA_LAKE, 'espn', 'college-baseball-standings', result.data));
    }

    if (result.success && Array.isArray(result.data)) {
      // Flatten nested conference groups: each child has .standings.entries
      const children = result.data as Array<Record<string, unknown>>;
      const entries = children.flatMap((child) => {
        const st = (child.standings as Record<string, unknown>) || {};
        return (st.entries as Array<Record<string, unknown>>) || [];
      });

      // Filter teams by conference
      espnStandings = conference === 'NCAA'
        ? entries
        : entries.filter((entry) => {
            const team = (entry.team as Record<string, unknown>) || {};
            const teamId = String(team.id ?? '');
            const meta = metaByEspnId[teamId];
            if (meta) return meta.conference === conference;
            const name = (team.displayName as string) ?? '';
            return lookupConference(name) === conference;
          });
      espnOk = true;
      sources.push('espn-v2');
    }
  } catch (err) {
    console.error('[espn] standings critical failure:', err instanceof Error ? err.message : err);
  }

  // ---------------------------------------------------------------------------
  // Step 2: Highlightly enrichment (optional overlay — richer conference W-L)
  // Parameter fix: was sending abbreviation= (400 error), now sends league= (correct).
  // ---------------------------------------------------------------------------
  const hlClient = getHighlightlyClient(env);
  let hlData: unknown[] = [];
  let hlOk = false;

  if (hlClient) {
    try {
      // Always fetch NCAA (all conferences) — per-conference filtering is unreliable
      const result = await hlClient.getStandings('NCAA');
      hlData = Array.isArray(result.data) ? result.data : [];
      if (result.success && hlData.length > 0) {
        ctx?.waitUntil(archiveRawResponse(env.DATA_LAKE, 'highlightly', 'college-baseball-standings', result.data));
        hlOk = true;
        sources.push('highlightly');
        console.info(`[highlightly] standings enrichment: ${hlData.length} conferences, ${result.duration_ms}ms`);
      } else {
        console.warn(`[highlightly] standings: success=${result.success}, data_length=${hlData.length}, error=${result.error ?? 'none'}, ${result.duration_ms}ms`);
      }
    } catch (err) {
      console.error('[highlightly] standings enrichment failed:', err instanceof Error ? err.message : err);
    }
  }

  // ---------------------------------------------------------------------------
  // Step 3: Resolve — build final response from available sources
  // ---------------------------------------------------------------------------

  // If ESPN succeeded: use ESPN skeleton, optionally enriched by Highlightly
  if (espnOk && espnStandings.length > 0) {
    // Transform ESPN entries into TeamStanding shape
    const standings = espnStandings.map((entry, index) => {
      const team = (entry.team as Record<string, unknown>) || {};
      const teamId = String(team.id ?? '');
      const meta = metaByEspnId[teamId];

      // ESPN v2 standings entries carry stats in a stats[] array, not flat fields.
      // Each element: { name, abbreviation, displayValue, value }
      const statsList = (entry.stats as Array<Record<string, unknown>>) || [];
      const stat = (name: string): number => {
        const s = statsList.find((s) => s.name === name || s.abbreviation === name);
        return Number(s?.value ?? s?.displayValue ?? 0) || 0;
      };

      const wins = stat('wins');
      const losses = stat('losses');
      const total = wins + losses;
      const winPct = total > 0 ? wins / total : 0;

      // Conference record — ESPN uses different stat names per sport.
      // Try multiple known field names, then fall back to records[] array.
      const confStatNames = ['conferenceRecord', 'Conference', 'vsConf', 'vsconf', 'leagueRecord', 'confRecord'];
      let confStat = statsList.find((s) =>
        confStatNames.includes(String(s.name ?? '')) ||
        confStatNames.includes(String(s.abbreviation ?? '')) ||
        String(s.name ?? '').toLowerCase().includes('conf')
      );

      // ESPN sometimes embeds conference record in a records[] array with type 'vsconf'
      if (!confStat) {
        const records = (entry.records as Array<Record<string, unknown>>) || [];
        const vsConf = records.find((r) =>
          String(r.type ?? '').toLowerCase() === 'vsconf' ||
          String(r.type ?? '').toLowerCase() === 'conference' ||
          String(r.name ?? '').toLowerCase().includes('conference')
        );
        if (vsConf) {
          confStat = { displayValue: vsConf.summary ?? vsConf.displayValue ?? '0-0' } as Record<string, unknown>;
        }
      }

      // Also check for separate conferenceWins/conferenceLosses stats
      let confWins = 0;
      let confLosses = 0;
      const confWinsStat = statsList.find((s) => s.name === 'conferenceWins' || s.name === 'confWins');
      const confLossesStat = statsList.find((s) => s.name === 'conferenceLosses' || s.name === 'confLosses');
      if (confWinsStat && confLossesStat) {
        confWins = Number(confWinsStat.value ?? confWinsStat.displayValue ?? 0);
        confLosses = Number(confLossesStat.value ?? confLossesStat.displayValue ?? 0);
      } else {
        const confStatStr = String(confStat?.displayValue ?? '0-0');
        const confParts = confStatStr.match(/(\d+)-(\d+)/);
        confWins = confParts ? Number(confParts[1]) : 0;
        confLosses = confParts ? Number(confParts[2]) : 0;
      }

      // ESPN college baseball doesn't return conference W-L, only leagueWinPercent (LPCT).
      // Highlightly /standings returns 400. As a fallback, use LPCT to derive approximate
      // conference record. College baseball teams play ~30 conference games per season.
      // LPCT alone lets us sort correctly even when the raw W-L are estimated.
      // We track `estimated: true` so the client can show the breakdown honestly.
      let leagueWinPct = 0;
      let confEstimated = false;
      const confTotal = confWins + confLosses;
      if (confTotal > 0) {
        leagueWinPct = confWins / confTotal;
      } else {
        // Derive from LPCT — ESPN provides leagueWinPercent for conference win rate.
        // The percentage is real; the W-L breakdown is estimated.
        const lpct = stat('leagueWinPercent');
        if (lpct > 0) {
          leagueWinPct = lpct;
          // Conference games played estimate: ~55% of total games are conference.
          // This holds across mid-late season for most D1 programs.
          // Cap at total games played and cap conf wins/losses at overall wins/losses
          // so we never produce impossible numbers (e.g. 22-0 conf when overall is 15-17).
          const gp = stat('gamesPlayed') || (wins + losses);
          const estimatedConfGames = Math.min(Math.round(gp * 0.55), 30, gp);
          const rawConfWins = Math.round(lpct * estimatedConfGames);
          const rawConfLosses = estimatedConfGames - rawConfWins;
          // Clamp so the estimate is arithmetically consistent with overall record.
          confWins = Math.min(rawConfWins, wins);
          confLosses = Math.min(rawConfLosses, losses);
          confEstimated = true;
        }
      }

      const logo = meta
        ? getLogoUrl(meta.espnId, meta.logoId)
        : (team.logo as string) ?? '';

      return {
        rank: index + 1,
        team: {
          id: meta?.slug ?? teamId,
          name: (team.displayName as string) ?? '',
          shortName: meta?.shortName ?? (team.abbreviation as string) ?? '',
          logo,
        },
        conferenceRecord: {
          wins: confWins,
          losses: confLosses,
          pct: leagueWinPct,
          estimated: confEstimated,
        },
        overallRecord: { wins, losses },
        winPct,
        streak: String(statsList.find((s) => s.name === 'streak')?.displayValue ?? ''),
        pointDifferential: stat('pointDifferential') || stat('pointsFor') - stat('pointsAgainst'),
      };
    });

    // Enrich with Highlightly conference records when available (overrides LPCT estimates)
    if (hlOk && hlData.length > 0) {
      const hlByName = new Map<string, { confWins: number; confLosses: number; streak?: string }>();
      const hlByAbbr = new Map<string, { confWins: number; confLosses: number; streak?: string }>();
      for (const conf of hlData as Array<Record<string, unknown>>) {
        const teams = (conf.teams as Array<Record<string, unknown>>) || [];
        for (const t of teams) {
          const teamDetail = (t.team as Record<string, unknown>) || {};
          const name = String(teamDetail.name ?? '').toLowerCase();
          const abbr = String(teamDetail.abbreviation ?? teamDetail.shortName ?? '').toLowerCase();
          const record = {
            confWins: Number(t.conferenceWins ?? t.confWins ?? 0),
            confLosses: Number(t.conferenceLosses ?? t.confLosses ?? 0),
            streak: t.streak ? String(t.streak) : undefined,
          };
          if (name) hlByName.set(name, record);
          if (abbr) hlByAbbr.set(abbr, record);
        }
      }

      for (const s of standings) {
        const nameKey = s.team.name.toLowerCase();
        const abbrKey = s.team.shortName.toLowerCase();
        let hl = hlByName.get(nameKey) ?? hlByAbbr.get(abbrKey);
        if (!hl) {
          for (const [hlName, hlRecord] of hlByName) {
            if (nameKey.includes(hlName) || hlName.includes(nameKey)) { hl = hlRecord; break; }
          }
        }
        if (hl && (hl.confWins + hl.confLosses) > 0) {
          s.conferenceRecord.wins = hl.confWins;
          s.conferenceRecord.losses = hl.confLosses;
          const ct = hl.confWins + hl.confLosses;
          s.conferenceRecord.pct = ct > 0 ? hl.confWins / ct : 0;
          s.conferenceRecord.estimated = false; // Real data from Highlightly
          if (hl.streak && !s.streak) s.streak = hl.streak;
        }
      }
    }

    // Sort by conference win percentage, then overall win percentage
    standings.sort((a, b) => {
      if (b.conferenceRecord.pct !== a.conferenceRecord.pct) return b.conferenceRecord.pct - a.conferenceRecord.pct;
      if (b.winPct !== a.winPct) return b.winPct - a.winPct;
      return b.pointDifferential - a.pointDifferential;
    });
    standings.forEach((s, i) => { s.rank = i + 1; });

    // Degraded means: conference W-L breakdowns are estimated (not real).
    // If Highlightly enriched EVERY team, degraded=false. If any team still
    // has estimated=true after enrichment, degraded=true.
    const estimatedCount = standings.filter((s) => s.conferenceRecord.estimated).length;
    degraded = estimatedCount > 0;
    const estimationNote = degraded
      ? `Conference win-loss breakdowns for ${estimatedCount} team${estimatedCount === 1 ? '' : 's'} are estimated from ESPN win percentage. Percentages and rankings are accurate.`
      : undefined;

    const payload = withMeta({
      success: true,
      data: standings,
      conference,
      timestamp: espnTimestamp,
    }, 'espn-v2', {
      fetchedAt: espnTimestamp,
      sources,
      degraded,
      extra: {
        sport: 'college-baseball',
        ...(estimationNote ? { estimationNote } : {}),
        estimatedCount,
      },
    });

    await kvPut(env.KV, cacheKey, payload, CACHE_TTL.standings);
    return cachedJson(payload, 200, HTTP_CACHE.standings, {
      ...dataHeaders(espnTimestamp, 'espn-v2'), 'X-Cache': 'MISS',
    });
  }

  // ESPN failed — try Highlightly as sole source
  if (hlOk && hlData.length > 0) {
    const payload = withMeta({
      success: true,
      data: hlData,
      conference,
      timestamp: now,
    }, 'highlightly', {
      fetchedAt: now,
      sources: ['highlightly'],
      degraded: true,
      extra: { sport: 'college-baseball' },
    });
    await kvPut(env.KV, cacheKey, payload, CACHE_TTL.standings);
    return cachedJson(payload, 200, HTTP_CACHE.standings, {
      ...dataHeaders(now, 'highlightly'), 'X-Cache': 'MISS',
    });
  }

  // Both failed — serve last-known-good from KV (stale key with longer TTL)
  const staleKey = `cb:standings:stale:${conference}`;
  const stale = await kvGet<unknown>(env.KV, staleKey);
  if (stale) {
    const staleHeaders = cachedPayloadHeaders(stale, 'stale-cache');
    return cachedJson(stale, 200, HTTP_CACHE.standings, {
      ...staleHeaders,
      'X-Cache': 'STALE',
      'X-Cache-State': 'stale',
      'X-Data-Source': 'stale-cache',
    });
  }

  // No data for this conference from any source — return 200 with empty array
  // so the frontend renders a clean "no data" state instead of an error page.
  // Small conferences (America East, Patriot League, etc.) may not be covered
  // by ESPN or Highlightly, so empty is the correct response, not an error.
  const emptyPayload = withMeta({
    success: true,
    data: [],
    conference,
    timestamp: now,
  }, 'none', {
    fetchedAt: now,
    sources: [],
    degraded: false,
    extra: { sport: 'college-baseball', note: `No standings data available for ${conference}` },
  });
  return cachedJson(emptyPayload, 200, HTTP_CACHE.standings, {
    ...dataHeaders(now, 'none'), 'X-Cache': 'MISS',
  });
  } catch (err) {
    console.error('[handleCollegeBaseballStandings]', err instanceof Error ? err.message : err);
    return json({ error: 'Internal server error', status: 500 }, 500);
  }
}

/** Flatten ESPN nested poll format into simple { rank, team, record, ... } entries. */
export function flattenESPNPolls(polls: unknown[]): unknown[] {
  if (!polls?.length) return [];
  // ESPN returns an array of polls — take the first (D1Baseball Top 25)
  const poll = polls[0] as Record<string, unknown>;
  const ranks = poll?.ranks as Array<Record<string, unknown>> | undefined;
  if (!ranks?.length) return polls; // Not ESPN format, pass through
  return ranks.map((entry) => {
    const team = entry.team as Record<string, unknown> | undefined;
    const teamName = team?.location
      ? `${team.location} ${team.name}`
      : (team?.nickname as string) || (team?.name as string) || 'Unknown';
    return {
      rank: entry.current,
      prev_rank: entry.previous,
      team: teamName,
      record: entry.recordSummary || '',
      points: entry.points,
      firstPlaceVotes: entry.firstPlaceVotes,
      espnId: team?.id || null,
      slug: teamName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
    };
  });
}

export async function handleCollegeBaseballRankings(env: Env): Promise<Response> {
  try {
  const cacheKey = 'cb:rankings:v2';
  const prevKey = 'cb:rankings:prev';
  const now = new Date().toISOString();
  const sources: string[] = [];

  async function rotatePrevious() {
    try {
      const current = await kvGet<unknown>(env.KV, cacheKey);
      if (current) {
        await kvPut(env.KV, prevKey, current, 604800); // 7 days
      }
    } catch { /* non-critical */ }
  }

  const cached = await kvGet<Record<string, unknown>>(env.KV, cacheKey);
  if (cached) {
    const prev = await kvGet<unknown>(env.KV, prevKey);
    return cachedJson({ ...cached, previousRankings: prev || null }, 200, HTTP_CACHE.rankings, cachedPayloadHeaders(cached));
  }

  // Step 1: ESPN rankings (skeleton)
  let espnRankings: unknown[] | null = null;
  try {
    const espnUrl = 'https://site.api.espn.com/apis/site/v2/sports/baseball/college-baseball/rankings';
    const res = await fetch(espnUrl, { signal: AbortSignal.timeout(8000) });
    if (res.ok) {
      const raw = (await res.json()) as Record<string, unknown>;
      espnRankings = (raw.rankings as unknown[]) || [];
      if (espnRankings.length > 0) sources.push('espn');
    }
  } catch {
    // ESPN rankings failed — non-critical, try other sources
  }

  // Step 2: Highlightly enrichment
  let hlRankings: unknown | null = null;
  const hlClient = getHighlightlyClient(env);
  if (hlClient) {
    try {
      const result = await hlClient.getRankings();
      if (result.success && result.data) {
        hlRankings = result.data;
        sources.push('highlightly');
      }
    } catch (err) {
      console.error('[highlightly] rankings enrichment failed:', err instanceof Error ? err.message : err);
    }
  }

  // Step 3: Resolve — prefer Highlightly (richer data), ESPN flattened as fallback
  const flatEspn = espnRankings ? flattenESPNPolls(espnRankings) : null;
  const finalRankings = hlRankings || flatEspn;
  const degraded = !hlRankings && !!flatEspn;

  if (finalRankings) {
    await rotatePrevious();
    const source = sources.join('+') || 'unknown';
    const payload = withMeta({
      rankings: finalRankings,
      timestamp: now,
    }, source, {
      fetchedAt: now,
      sources,
      degraded,
      extra: { sport: 'college-baseball' },
    });
    await kvPut(env.KV, cacheKey, payload, CACHE_TTL.rankings);
    // rotatePrevious() just moved the old snapshot into prevKey — read it back so
    // the response includes week-over-week movement instead of null.
    const prevAfterRotate = await kvGet<unknown>(env.KV, prevKey);
    return cachedJson({ ...payload, previousRankings: prevAfterRotate || null }, 200, HTTP_CACHE.rankings, {
      ...dataHeaders(now, source), 'X-Cache': 'MISS',
    });
  }

  // Both failed — try NCAA client as last resort
  try {
    const client = getCollegeClient();
    const result = await client.getRankings();
    const rankings = Array.isArray(result.data) ? result.data : [];
    await rotatePrevious();
    const payload = withMeta({
      rankings,
      timestamp: result.timestamp,
    }, 'ncaa', {
      fetchedAt: result.timestamp,
      sources: ['ncaa'],
      degraded: true,
      extra: { sport: 'college-baseball' },
    });
    if (result.success) {
      await kvPut(env.KV, cacheKey, payload, CACHE_TTL.rankings);
    }
    const prevAfterRotateNcaa = await kvGet<unknown>(env.KV, prevKey);
    return cachedJson({ ...payload, previousRankings: prevAfterRotateNcaa || null }, result.success ? 200 : 502, HTTP_CACHE.rankings, {
      ...dataHeaders(result.timestamp, 'ncaa'), 'X-Cache': 'MISS',
    });
  } catch {
    return json(withMeta({
      rankings: [],
      previousRankings: null,
    }, 'error', {
      fetchedAt: now,
      sources: [],
      degraded: true,
      extra: { sport: 'college-baseball' },
    }), 502, { ...dataHeaders(now, 'error'), 'X-Cache': 'ERROR' });
  }
  } catch (err) {
    console.error('[handleCollegeBaseballRankings]', err instanceof Error ? err.message : err);
    return json({ error: 'Internal server error', status: 500 }, 500);
  }
}

export async function handleCollegeBaseballLeaders(env: Env): Promise<Response> {
  const cacheKey = 'cb:leaders';
  const now = new Date().toISOString();

  const cached = await kvGet<unknown>(env.KV, cacheKey);
  if (cached) return cachedJson(cached, 200, HTTP_CACHE.standings, cachedPayloadHeaders(cached));

  try {
    // Query D1 for accumulated season leaders
    const categories = await buildLeaderCategories(env);

    const payload = withMeta({
      categories,
    }, 'd1-accumulated', { fetchedAt: now });

    await kvPut(env.KV, cacheKey, payload, 300); // 5 min TTL
    return cachedJson(payload, 200, HTTP_CACHE.standings, { 'X-Cache': 'MISS' });
  } catch {
    // Fallback: empty categories so the UI renders its placeholder state
    const empty = withMeta({ categories: [] }, 'unavailable', { fetchedAt: now });
    await kvPut(env.KV, cacheKey, empty, 300);
    return cachedJson(empty, 200, HTTP_CACHE.standings, { 'X-Cache': 'MISS' });
  }
}
