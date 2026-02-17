import type { PagesFunction } from '@cloudflare/workers-types';

const FALLBACK_RESPONSE = {
  mlb: [
    {
      id: 'fallback-mlb-1',
      away: 'Los Angeles Dodgers',
      home: 'San Diego Padres',
      status: 'Final',
      score: { away: 6, home: 3 },
    },
  ],
  nfl: [
    {
      id: 'fallback-nfl-1',
      away: 'Miami Dolphins',
      home: 'Buffalo Bills',
      status: 'Final',
      score: { away: 24, home: 20 },
    },
  ],
  nba: [
    {
      id: 'fallback-nba-1',
      away: 'Boston Celtics',
      home: 'New York Knicks',
      status: 'Final',
      score: { away: 112, home: 104 },
    },
  ],
  collegeBaseball: [
    {
      id: 'fallback-cbb-1',
      away: 'Texas A&M Aggies',
      home: 'Texas Longhorns',
      status: 'Final',
      score: { away: 4, home: 7 },
    },
  ],
  meta: {
    source: 'Blaze Sports Intel fallback snapshot',
    fetched_at: '',
    timezone: 'America/Chicago',
    note: 'Primary live score feeds are temporarily delayed.',
  },
};

export const onRequestGet: PagesFunction = async () => {
  const body = {
    ...FALLBACK_RESPONSE,
    meta: {
      ...FALLBACK_RESPONSE.meta,
      fetched_at: new Date().toISOString(),
    },
  };

  return new Response(JSON.stringify(body), {
    status: 200,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'public, max-age=30',
    },
  });
};
