import {
  buildMeta,
  cachedJson,
  freshDataHeaders,
  logError,
  responseToJson,
} from '../shared/helpers';
import { HTTP_CACHE } from '../shared/constants';
import type { Env } from '../shared/types';
import { handleCollegeBaseballSchedule } from './college-baseball';
import { handleCFBScores } from './cfb';
import { handleMLBScores } from './mlb';
import { handleNBAScores } from './nba';
import { handleNFLScores } from './nfl';

type SportId = 'college-baseball' | 'mlb' | 'nfl' | 'nba' | 'cfb';

interface SportMetaSnapshot {
  endpoint: string;
  fetched_at: string;
  source: string;
  timezone: 'America/Chicago';
}

interface ScoresOverviewPayload {
  data: Record<SportId, Record<string, unknown> | null>;
  errors: Partial<Record<SportId, string>>;
  meta: {
    source: string;
    fetched_at: string;
    timezone: 'America/Chicago';
    sports: Record<SportId, SportMetaSnapshot>;
  };
}

interface SportDefinition {
  id: SportId;
  endpoint: string;
  fallbackSource: string;
  handler: (url: URL, env: Env, ctx?: ExecutionContext) => Promise<Response>;
}

const SPORT_DEFINITIONS: SportDefinition[] = [
  {
    id: 'college-baseball',
    endpoint: '/api/college-baseball/schedule',
    fallbackSource: 'ncaa',
    handler: handleCollegeBaseballSchedule,
  },
  {
    id: 'mlb',
    endpoint: '/api/mlb/scores',
    fallbackSource: 'espn',
    handler: handleMLBScores,
  },
  {
    id: 'nfl',
    endpoint: '/api/nfl/scores',
    fallbackSource: 'espn',
    handler: handleNFLScores,
  },
  {
    id: 'nba',
    endpoint: '/api/nba/scoreboard',
    fallbackSource: 'espn',
    handler: handleNBAScores,
  },
  {
    id: 'cfb',
    endpoint: '/api/cfb/scores',
    fallbackSource: 'espn',
    handler: handleCFBScores,
  },
];

function sanitizeErrorMessage(sport: SportId): string {
  return `${sport} scores temporarily unavailable`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function extractSportMeta(
  payload: unknown,
  definition: SportDefinition,
  fallbackFetchedAt: string,
): SportMetaSnapshot {
  const body = isRecord(payload) ? payload : {};
  const meta = isRecord(body.meta) ? body.meta : {};
  const source =
    (typeof meta.source === 'string' && meta.source) ||
    (typeof body.source === 'string' && body.source) ||
    definition.fallbackSource;
  const fetchedAt =
    (typeof meta.fetched_at === 'string' && meta.fetched_at) ||
    (typeof meta.lastUpdated === 'string' && meta.lastUpdated) ||
    (typeof body.fetched_at === 'string' && body.fetched_at) ||
    (typeof body.timestamp === 'string' && body.timestamp) ||
    fallbackFetchedAt;

  return {
    endpoint: definition.endpoint,
    fetched_at: fetchedAt,
    source,
    timezone: 'America/Chicago',
  };
}

export async function handleScoresOverview(
  url: URL,
  env: Env,
  ctx?: ExecutionContext,
): Promise<Response> {
  const fetchedAt = new Date().toISOString();
  const requestedDate = url.searchParams.get('date');
  const data: Record<SportId, Record<string, unknown> | null> = {
    'college-baseball': null,
    mlb: null,
    nfl: null,
    nba: null,
    cfb: null,
  };
  const errors: Partial<Record<SportId, string>> = {};
  const sportsMeta = {} as Record<SportId, SportMetaSnapshot>;

  await Promise.all(
    SPORT_DEFINITIONS.map(async (definition) => {
      const sportUrl = new URL(definition.endpoint, url.origin);
      if (requestedDate) {
        sportUrl.searchParams.set('date', requestedDate);
      }

      try {
        const response = await definition.handler(sportUrl, env, ctx);
        const payload = await responseToJson(response);

        if (!response.ok || (isRecord(payload) && typeof payload.error === 'string')) {
          errors[definition.id] = sanitizeErrorMessage(definition.id);
          sportsMeta[definition.id] = extractSportMeta(payload, definition, fetchedAt);
          await logError(
            env,
            `scores-overview:${definition.id}:${response.status}`,
            'scores-overview-upstream-response',
          );
          return;
        }

        data[definition.id] = isRecord(payload) ? payload : { data: payload };
        sportsMeta[definition.id] = extractSportMeta(payload, definition, fetchedAt);
      } catch (error) {
        errors[definition.id] = sanitizeErrorMessage(definition.id);
        sportsMeta[definition.id] = {
          endpoint: definition.endpoint,
          fetched_at: fetchedAt,
          source: definition.fallbackSource,
          timezone: 'America/Chicago',
        };
        await logError(
          env,
          error instanceof Error ? error.message : 'Unknown scores overview error',
          `scores-overview:${definition.id}`,
        );
      }
    }),
  );

  const payload: ScoresOverviewPayload = {
    data,
    errors,
    meta: {
      ...buildMeta('bsi-scores-overview', { fetchedAt }),
      sports: sportsMeta,
    } as ScoresOverviewPayload['meta'],
  };

  return cachedJson(payload, 200, HTTP_CACHE.scores, freshDataHeaders('bsi-scores-overview'));
}
