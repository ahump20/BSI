import { NextResponse } from 'next/server';
import type { CFPTop25Response } from '@/lib/cfp';
import { cfpTop25Data } from '@/lib/cfp';

function cloneTop25(): CFPTop25Response {
  return JSON.parse(JSON.stringify(cfpTop25Data)) as CFPTop25Response;
}

export async function GET() {
  const workerBase = process.env.CFP_WORKER_BASE_URL;

  if (workerBase) {
    try {
      const response = await fetch(`${workerBase.replace(/\/$/u, '')}/cfp/top25`, {
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store'
      });

      if (response.ok) {
        const data = (await response.json()) as CFPTop25Response;
        return NextResponse.json(data, {
          headers: {
            'Cache-Control': 's-maxage=120, stale-while-revalidate=300'
          }
        });
      }
    } catch (error) {
      console.error('[CFP API] Worker request failed, falling back to static data:', error);
    }
  }

  const fallback = cloneTop25();
  fallback.meta = { fetchedFrom: 'static', cache: 'bypass' };

  return NextResponse.json(fallback, {
    headers: {
      'Cache-Control': 's-maxage=60'
    }
  });
}
