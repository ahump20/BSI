'use client';

import { useState, useEffect, useRef, useCallback, type ReactNode } from 'react';

// ---------------------------------------------------------------------------
// Mock data — plausible SEC players cycling through updates
// ---------------------------------------------------------------------------

const MOCK_PLAYERS = [
  [
    { player_id: 'hl:1001', player_name: 'Cole Fontenelle', team: 'LSU Tigers', conference: 'SEC', position: 'SS', season: 2026, pa: 87, woba: 0.502, wrc_plus: 187, ops_plus: 174, iso: 0.312, babip: 0.418, k_pct: 0.172, bb_pct: 0.138, e_ba: 0.398, e_woba: 0.479 },
    { player_id: 'hl:1002', player_name: 'Blake Burkhalter', team: 'Auburn Tigers', conference: 'SEC', position: 'RHP', season: 2026, pa: 48, woba: 0.201, wrc_plus: 42, ops_plus: 39, iso: 0.044, babip: 0.261, k_pct: 0.625, bb_pct: 0.042, e_ba: 0.119, e_woba: 0.188 },
    { player_id: 'hl:1003', player_name: 'Tommy Troy', team: 'Tennessee Volunteers', conference: 'SEC', position: '1B', season: 2026, pa: 93, woba: 0.488, wrc_plus: 174, ops_plus: 162, iso: 0.291, babip: 0.392, k_pct: 0.194, bb_pct: 0.118, e_ba: 0.361, e_woba: 0.451 },
    { player_id: 'hl:1004', player_name: 'Hunter Haas', team: 'Vanderbilt Commodores', conference: 'SEC', position: '3B', season: 2026, pa: 79, woba: 0.421, wrc_plus: 148, ops_plus: 135, iso: 0.214, babip: 0.344, k_pct: 0.228, bb_pct: 0.089, e_ba: 0.308, e_woba: 0.399 },
    { player_id: 'hl:1005', player_name: 'Zach Dezenzo', team: 'Mississippi State Bulldogs', conference: 'SEC', position: 'C', season: 2026, pa: 71, woba: 0.379, wrc_plus: 124, ops_plus: 118, iso: 0.176, babip: 0.311, k_pct: 0.254, bb_pct: 0.070, e_ba: 0.279, e_woba: 0.358 },
  ],
  [
    { player_id: 'hl:1001', player_name: 'Cole Fontenelle', team: 'LSU Tigers', conference: 'SEC', position: 'SS', season: 2026, pa: 91, woba: 0.507, wrc_plus: 191, ops_plus: 177, iso: 0.318, babip: 0.421, k_pct: 0.165, bb_pct: 0.143, e_ba: 0.403, e_woba: 0.484 },
    { player_id: 'hl:1002', player_name: 'Blake Burkhalter', team: 'Auburn Tigers', conference: 'SEC', position: 'RHP', season: 2026, pa: 51, woba: 0.198, wrc_plus: 40, ops_plus: 37, iso: 0.039, babip: 0.258, k_pct: 0.627, bb_pct: 0.039, e_ba: 0.116, e_woba: 0.184 },
    { player_id: 'hl:1003', player_name: 'Tommy Troy', team: 'Tennessee Volunteers', conference: 'SEC', position: '1B', season: 2026, pa: 97, woba: 0.492, wrc_plus: 178, ops_plus: 165, iso: 0.296, babip: 0.396, k_pct: 0.186, bb_pct: 0.124, e_ba: 0.368, e_woba: 0.457 },
    { player_id: 'hl:1004', player_name: 'Hunter Haas', team: 'Vanderbilt Commodores', conference: 'SEC', position: '3B', season: 2026, pa: 82, woba: 0.428, wrc_plus: 151, ops_plus: 138, iso: 0.219, babip: 0.348, k_pct: 0.220, bb_pct: 0.098, e_ba: 0.313, e_woba: 0.406 },
    { player_id: 'hl:1005', player_name: 'Zach Dezenzo', team: 'Mississippi State Bulldogs', conference: 'SEC', position: 'C', season: 2026, pa: 75, woba: 0.385, wrc_plus: 127, ops_plus: 121, iso: 0.181, babip: 0.315, k_pct: 0.240, bb_pct: 0.080, e_ba: 0.284, e_woba: 0.363 },
  ],
];

const MOCK_CONFERENCE = [
  { conference: 'SEC', season: 2026, strength_index: 88.4, avg_woba: 0.342, avg_era: 3.41, inter_conf_win_pct: 0.562, is_power: 1 },
  { conference: 'ACC', season: 2026, strength_index: 81.2, avg_woba: 0.331, avg_era: 3.67, inter_conf_win_pct: 0.518, is_power: 1 },
  { conference: 'Big 12', season: 2026, strength_index: 78.9, avg_woba: 0.328, avg_era: 3.79, inter_conf_win_pct: 0.502, is_power: 1 },
  { conference: 'Pac-12', season: 2026, strength_index: 74.1, avg_woba: 0.319, avg_era: 3.91, inter_conf_win_pct: 0.487, is_power: 1 },
  { conference: 'Big Ten', season: 2026, strength_index: 68.3, avg_woba: 0.308, avg_era: 4.12, inter_conf_win_pct: 0.471, is_power: 1 },
];

const MOCK_PLAYER_DETAIL = {
  player_id: 'hl:1001',
  player_name: 'Cole Fontenelle',
  team: 'LSU Tigers',
  conference: 'SEC',
  position: 'SS',
  season: 2026,
  batting: {
    pa: 91, ab: 78, h: 31, doubles: 8, triples: 1, hr: 9,
    bb: 13, hbp: 2, so: 15, avg: 0.397, obp: 0.495, slg: 0.731, ops: 1.226,
    iso: 0.334, babip: 0.421, woba: 0.507, wrc_plus: 191, ops_plus: 177,
    k_pct: 0.165, bb_pct: 0.143, e_ba: 0.403, e_slg: 0.719, e_woba: 0.484,
  },
};

// ---------------------------------------------------------------------------
// Endpoint definitions
// ---------------------------------------------------------------------------

type EndpointId = 'leaderboard' | 'conference' | 'player';

const ENDPOINTS = [
  {
    id: 'leaderboard' as EndpointId,
    path: '/api/college-baseball/savant/leaderboard',
    params: ['conference=SEC', 'limit=10', 'sort=woba', 'season=2026'],
    description: 'Batting leaderboard sorted by advanced metric. Pro tier unlocks wOBA, wRC+, OPS+, e-stats.',
    tier: 'pro' as const,
  },
  {
    id: 'conference' as EndpointId,
    path: '/api/college-baseball/savant/conference',
    params: ['season=2026', 'sort=strength_index'],
    description: 'Conference strength index rankings. Composite: inter-conf win %, RPI, avg wOBA, avg ERA.',
    tier: 'free' as const,
  },
  {
    id: 'player' as EndpointId,
    path: '/api/college-baseball/savant/player/hl:1001',
    params: ['season=2026', 'key={BSI_API_KEY}'],
    description: 'Full advanced batting + pitching line for a single player.',
    tier: 'pro' as const,
  },
];

function getMockData(id: EndpointId, snapshotIdx: number): unknown {
  const ts = new Date().toISOString();
  const baseMeta = { source: 'bsi-savant-compute', fetched_at: ts, timezone: 'America/Chicago' };
  switch (id) {
    case 'leaderboard':
      return { data: MOCK_PLAYERS[snapshotIdx], meta: { ...baseMeta, season: 2026, conference: 'SEC', total: 5 } };
    case 'conference':
      return { data: MOCK_CONFERENCE, meta: { ...baseMeta, season: 2026 } };
    case 'player':
      return { data: MOCK_PLAYER_DETAIL, meta: baseMeta };
  }
}

// ---------------------------------------------------------------------------
// JSON coloring — line-by-line, no innerHTML, no regex.exec
// ---------------------------------------------------------------------------

function colorJsonLine(line: string): ReactNode[] {
  // Split into: key, string-value, number, bool/null, other
  const parts: ReactNode[] = [];

  // Find key pattern: "word": → orange
  const keyMatch = line.match(/^(\s*)("[\w_]+")(\s*:\s*)(.*)?$/);
  if (keyMatch) {
    parts.push(<span key="indent">{keyMatch[1]}</span>);
    parts.push(<span key="key" style={{ color: '#BF5700' }}>{keyMatch[2]}</span>);
    parts.push(<span key="colon">{keyMatch[3]}</span>);
    const rest = keyMatch[4] ?? '';
    // Color value portion
    if (rest.match(/^"/) ) {
      parts.push(<span key="val" style={{ color: '#86efac' }}>{rest}</span>);
    } else if (rest.match(/^-?\d/)) {
      const numEnd = rest.match(/^(-?\d+\.?\d*)(,?)$/);
      if (numEnd) {
        parts.push(<span key="val" style={{ color: '#fde68a' }}>{numEnd[1]}</span>);
        if (numEnd[2]) parts.push(<span key="comma" style={{ color: 'rgba(250,248,245,0.4)' }}>{numEnd[2]}</span>);
      } else {
        parts.push(<span key="val" style={{ color: '#fde68a' }}>{rest}</span>);
      }
    } else if (rest.match(/^(true|false|null)/)) {
      parts.push(<span key="val" style={{ color: '#93c5fd' }}>{rest}</span>);
    } else {
      parts.push(<span key="val">{rest}</span>);
    }
    return parts;
  }

  // Structural lines ({ } [ ] ,)
  return [<span key="line" style={{ color: 'rgba(250,248,245,0.4)' }}>{line}</span>];
}

function JsonView({ json }: { json: string }): ReactNode {
  const lines = json.split('\n');
  return (
    <>
      {lines.map((line, i) => (
        <div key={i}>{colorJsonLine(line)}</div>
      ))}
    </>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PlaygroundApiSim() {
  const [activeEndpoint, setActiveEndpoint] = useState<EndpointId>('leaderboard');
  const [snapshotIdx, setSnapshotIdx] = useState(0);
  const [secondsSince, setSecondsSince] = useState(0);
  const [latency, setLatency] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const cycleRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const simulateFetch = useCallback(() => {
    setIsLoading(true);
    setLatency(null);
    const ms = 80 + Math.floor(Math.random() * 120);
    setTimeout(() => {
      setLatency(ms);
      setIsLoading(false);
      setSnapshotIdx(prev => (prev + 1) % MOCK_PLAYERS.length);
      setSecondsSince(0);
    }, ms);
  }, []);

  useEffect(() => {
    simulateFetch();
    timerRef.current = setInterval(() => setSecondsSince(s => s + 1), 1000);
    cycleRef.current = setInterval(() => simulateFetch(), 30_000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (cycleRef.current) clearInterval(cycleRef.current);
    };
  }, [simulateFetch]);

  const endpoint = ENDPOINTS.find(e => e.id === activeEndpoint)!;
  const responseData = getMockData(activeEndpoint, snapshotIdx);
  const responseJson = JSON.stringify(responseData, null, 2);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Endpoint selector */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        {ENDPOINTS.map(ep => (
          <button
            key={ep.id}
            onClick={() => { setActiveEndpoint(ep.id); simulateFetch(); }}
            style={{
              padding: '6px 14px', borderRadius: '4px', cursor: 'pointer',
              fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem',
              background: activeEndpoint === ep.id ? 'rgba(191,87,0,0.2)' : 'rgba(26,26,26,0.8)',
              border: activeEndpoint === ep.id ? '1px solid #BF5700' : '1px solid rgba(191,87,0,0.25)',
              color: activeEndpoint === ep.id ? '#FF6B35' : 'rgba(250,248,245,0.6)',
            }}
          >
            {ep.id}
          </button>
        ))}
      </div>

      {/* Endpoint info */}
      <div style={{ background: '#1A1A1A', borderRadius: '8px', border: '1px solid rgba(191,87,0,0.2)', padding: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
          <span style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981', padding: '2px 8px', borderRadius: '4px', fontSize: '0.7rem', fontFamily: 'JetBrains Mono, monospace', fontWeight: 600 }}>
            GET
          </span>
          <code style={{ color: '#FAF8F5', fontSize: '0.8125rem', fontFamily: 'JetBrains Mono, monospace' }}>
            {endpoint.path}
          </code>
          <span style={{
            background: endpoint.tier === 'pro' ? 'rgba(255,107,53,0.15)' : 'rgba(250,248,245,0.08)',
            color: endpoint.tier === 'pro' ? '#FF6B35' : 'rgba(250,248,245,0.5)',
            padding: '2px 8px', borderRadius: '4px', fontSize: '0.65rem', fontFamily: 'JetBrains Mono, monospace',
          }}>
            {endpoint.tier}
          </span>
        </div>
        <p style={{ color: 'rgba(250,248,245,0.6)', fontSize: '0.8125rem', margin: '0 0 0.75rem' }}>
          {endpoint.description}
        </p>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {endpoint.params.map(p => (
            <code key={p} style={{ background: 'rgba(191,87,0,0.12)', color: '#BF5700', padding: '2px 8px', borderRadius: '4px', fontSize: '0.7rem', fontFamily: 'JetBrains Mono, monospace' }}>
              {p}
            </code>
          ))}
        </div>
      </div>

      {/* Fetch controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <button
          onClick={simulateFetch}
          disabled={isLoading}
          style={{
            padding: '8px 20px', borderRadius: '4px', cursor: isLoading ? 'not-allowed' : 'pointer',
            background: isLoading ? 'rgba(191,87,0,0.08)' : 'rgba(191,87,0,0.15)',
            border: '1px solid rgba(191,87,0,0.4)', color: '#FF6B35',
            fontFamily: 'JetBrains Mono, monospace', fontSize: '0.8125rem',
          }}
        >
          {isLoading ? 'Fetching…' : 'Try it'}
        </button>

        {latency !== null && !isLoading && (
          <span style={{ fontSize: '0.75rem', color: 'rgba(250,248,245,0.5)', fontFamily: 'JetBrains Mono, monospace' }}>
            <span style={{ color: '#10b981' }}>200 OK</span>{' · '}{latency}ms
          </span>
        )}

        <span style={{ marginLeft: 'auto', fontSize: '0.7rem', color: 'rgba(250,248,245,0.35)', fontFamily: 'JetBrains Mono, monospace', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
          {secondsSince}s since last update · auto-refresh ~30s
        </span>
      </div>

      {/* Response viewer */}
      <div style={{ background: '#111', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
        <div
          style={{ padding: '8px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
          onClick={() => setExpanded(v => !v)}
        >
          <span style={{ fontSize: '0.75rem', color: 'rgba(250,248,245,0.5)', fontFamily: 'JetBrains Mono, monospace' }}>Response Body</span>
          <span style={{ fontSize: '0.75rem', color: 'rgba(250,248,245,0.35)', fontFamily: 'JetBrains Mono, monospace' }}>
            {expanded ? '▲ collapse' : '▼ expand'}
          </span>
        </div>
        {expanded && (
          <pre style={{
            margin: 0, padding: '1rem', overflowX: 'auto', maxHeight: '320px', overflowY: 'auto',
            fontSize: '0.7rem', lineHeight: 1.6, fontFamily: 'JetBrains Mono, monospace', color: '#FAF8F5',
          }}>
            <JsonView json={responseJson} />
          </pre>
        )}
      </div>
    </div>
  );
}
