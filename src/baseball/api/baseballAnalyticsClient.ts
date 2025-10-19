import type {
  ApiErrorPayload,
  PitcherWorkloadRiskResponse,
  SituationalPredictionsResponse,
  UmpireZoneProbabilityResponse,
} from './types';

export interface BaseballAnalyticsClientConfig {
  /**
   * Base URL for API requests. Defaults to the same origin.
   */
  baseUrl?: string;
  /**
   * Custom fetch implementation, useful for tests.
   */
  fetchImpl?: typeof fetch;
}

export interface RequestOptions {
  signal?: AbortSignal;
}

export class BaseballAnalyticsClient {
  private readonly baseUrl: string;
  private readonly fetchImpl: typeof fetch;

  constructor(config: BaseballAnalyticsClientConfig = {}) {
    this.baseUrl = config.baseUrl ?? '';
    this.fetchImpl = config.fetchImpl ?? fetch.bind(globalThis);
  }

  async getUmpireZoneProbabilities(
    params: { gameId: string; umpireId: string; season?: string },
    options: RequestOptions = {},
  ): Promise<UmpireZoneProbabilityResponse> {
    const query = new URLSearchParams({ gameId: params.gameId, umpireId: params.umpireId });
    if (params.season) {
      query.set('season', params.season);
    }

    return this.request<UmpireZoneProbabilityResponse>(`/api/v1/baseball/umpire-zones?${query.toString()}`, options);
  }

  async getPitcherWorkloadRisk(
    params: { pitcherId: string; season?: string },
    options: RequestOptions = {},
  ): Promise<PitcherWorkloadRiskResponse> {
    const query = new URLSearchParams({ pitcherId: params.pitcherId });
    if (params.season) {
      query.set('season', params.season);
    }

    return this.request<PitcherWorkloadRiskResponse>(`/api/v1/baseball/workload-risk?${query.toString()}`, options);
  }

  async getSituationalPredictions(
    params: { gameId: string; inning?: number; outs?: number; baseState?: string },
    options: RequestOptions = {},
  ): Promise<SituationalPredictionsResponse> {
    const query = new URLSearchParams({ gameId: params.gameId });
    if (typeof params.inning === 'number' && Number.isFinite(params.inning)) {
      query.set('inning', params.inning.toString());
    }
    if (typeof params.outs === 'number' && Number.isFinite(params.outs)) {
      query.set('outs', params.outs.toString());
    }
    if (params.baseState) {
      query.set('baseState', params.baseState);
    }

    return this.request<SituationalPredictionsResponse>(`/api/v1/baseball/situational-predictions?${query.toString()}`, options);
  }

  async callTrpcProcedure<TInput extends Record<string, unknown>, TResult>(
    procedure: 'umpireZones' | 'pitcherWorkloadRisk' | 'situationalPredictions',
    input: TInput,
    options: RequestOptions = {},
  ): Promise<TResult> {
    const response = await this.fetchImpl(`${this.baseUrl}/api/v1/baseball/trpc/${procedure}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ input }),
      signal: options.signal,
    });

    if (!response.ok) {
      throw await this.toApiError(response);
    }

    const payload = (await response.json()) as { result?: { data?: TResult } } & ApiErrorPayload;
    if ('error' in payload && payload.error) {
      throw payload.error;
    }

    if (!payload.result?.data) {
      throw new Error('Malformed tRPC response payload.');
    }

    return payload.result.data;
  }

  private async request<TResult>(path: string, options: RequestOptions = {}): Promise<TResult> {
    const response = await this.fetchImpl(`${this.baseUrl}${path}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      signal: options.signal,
    });

    if (!response.ok) {
      throw await this.toApiError(response);
    }

    return (await response.json()) as TResult;
  }

  private async toApiError(response: Response): Promise<Error> {
    try {
      const payload = (await response.json()) as ApiErrorPayload;
      if (payload && payload.error) {
        if (typeof payload.error === 'string') {
          return new Error(payload.error);
        }
        return new Error(payload.error.message ?? 'Unknown API error');
      }
    } catch (error) {
      console.warn('Failed to parse error payload', error);
    }
    return new Error(`Request failed with status ${response.status}`);
  }
}
