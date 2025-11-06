import { NextResponse } from 'next/server';
import { cfpTop25Data } from '@/lib/cfp';

export async function GET() {
  const workerBase = process.env.CFP_WORKER_BASE_URL;

  if (workerBase) {
    try {
      const response = await fetch(`${workerBase.replace(/\/$/u, '')}/cfp/summary`, {
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store'
      });
      if (response.ok) {
        return NextResponse.json(await response.json(), {
          headers: { 'Cache-Control': 's-maxage=180' }
        });
      }
    } catch (error) {
      console.error('[CFP API] Summary worker call failed:', error);
    }
  }

  return NextResponse.json(
    {
      season: cfpTop25Data.season,
      lastUpdated: cfpTop25Data.lastUpdated,
      projectedField: cfpTop25Data.modelBaseline.projectedField,
      bubbleTeams: cfpTop25Data.modelBaseline.bubbleTeams,
      headline: `${cfpTop25Data.modelBaseline.projectedField[0]?.team ?? 'Top contender'} still pacing the CFP composite.`,
      notes: cfpTop25Data.modelBaseline.notes,
      meta: { fetchedFrom: 'static' }
    },
    { headers: { 'Cache-Control': 's-maxage=120' } }
  );
}
