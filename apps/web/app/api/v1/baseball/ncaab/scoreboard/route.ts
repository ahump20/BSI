import { NextResponse } from 'next/server';
import {
  ScoreboardFetchError,
  fetchNcaaBaseballScoreboard,
} from '../../../../../../lib/baseball/scoreboard';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(): Promise<NextResponse> {
  try {
    const scoreboard = await fetchNcaaBaseballScoreboard();
    return NextResponse.json(scoreboard, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error) {
    if (error instanceof ScoreboardFetchError) {
      return NextResponse.json(
        { error: error.message },
        {
          status: error.status ?? 502,
          headers: {
            'Cache-Control': 'no-store, max-age=0',
          },
        }
      );
    }

    if ((error as Error).name === 'AbortError') {
      return NextResponse.json(
        { error: 'Scoreboard request aborted' },
        {
          status: 499,
          headers: {
            'Cache-Control': 'no-store, max-age=0',
          },
        }
      );
    }

    return NextResponse.json(
      { error: 'Unexpected scoreboard failure' },
      {
        status: 500,
        headers: {
          'Cache-Control': 'no-store, max-age=0',
        },
      }
    );
  }
}
