import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BaseballAnalyticsClient } from '../api/baseballAnalyticsClient';
import type { RequestOptions } from '../api/baseballAnalyticsClient';
import type {
  PitcherWorkloadRiskResponse,
  SituationalPredictionsResponse,
  UmpireZoneProbabilityResponse,
} from '../api/types';

export interface UseBaseballRequestOptions {
  /** Whether the hook should automatically fetch data. */
  enabled?: boolean;
  /** Optional shared client instance (useful for SSR/tests). */
  client?: BaseballAnalyticsClient;
}

interface AsyncState<TResult> {
  data?: TResult;
  error?: Error;
  isLoading: boolean;
}

interface UseBaseballRequestReturn<TResult> extends AsyncState<TResult> {
  refetch: () => Promise<void>;
}

function useBaseballRequest<TParams, TResult>(
  params: TParams | null,
  fetcher: (client: BaseballAnalyticsClient, params: TParams, options: RequestOptions) => Promise<TResult>,
  options: UseBaseballRequestOptions = {},
): UseBaseballRequestReturn<TResult> {
  const { enabled = true } = options;
  const client = useMemo(() => options.client ?? new BaseballAnalyticsClient(), [options.client]);
  const [state, setState] = useState<AsyncState<TResult>>({ isLoading: false });
  const paramsRef = useRef<TParams | null>(params);
  paramsRef.current = params;
  const abortRef = useRef<AbortController | null>(null);

  const execute = useCallback(async () => {
    if (!enabled || paramsRef.current === null) {
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setState((prev) => ({ ...prev, isLoading: true, error: undefined }));
    try {
      const result = await fetcher(client, paramsRef.current, { signal: controller.signal });
      setState({ data: result, error: undefined, isLoading: false });
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return;
      }
      setState((prev) => ({ ...prev, isLoading: false, error: error instanceof Error ? error : new Error(String(error)) }));
    }
  }, [client, enabled, fetcher]);

  useEffect(() => {
    if (!enabled || params === null) {
      return () => {
        abortRef.current?.abort();
      };
    }

    void execute();

    return () => {
      abortRef.current?.abort();
    };
  }, [enabled, execute, params]);

  return useMemo(
    () => ({
      data: state.data,
      error: state.error,
      isLoading: state.isLoading,
      refetch: async () => {
        await execute();
      },
    }),
    [execute, state.data, state.error, state.isLoading],
  );
}

export function useUmpireZoneProbabilities(
  params: { gameId?: string; umpireId?: string; season?: string },
  options: UseBaseballRequestOptions = {},
): UseBaseballRequestReturn<UmpireZoneProbabilityResponse> {
  const normalizedParams = params.gameId && params.umpireId
    ? { gameId: params.gameId, umpireId: params.umpireId, season: params.season }
    : null;

  return useBaseballRequest(normalizedParams, (client, requestParams, requestOptions) => (
    client.getUmpireZoneProbabilities(requestParams, requestOptions)
  ), options);
}

export function usePitcherWorkloadRisk(
  params: { pitcherId?: string; season?: string },
  options: UseBaseballRequestOptions = {},
): UseBaseballRequestReturn<PitcherWorkloadRiskResponse> {
  const normalizedParams = params.pitcherId
    ? { pitcherId: params.pitcherId, season: params.season }
    : null;

  return useBaseballRequest(normalizedParams, (client, requestParams, requestOptions) => (
    client.getPitcherWorkloadRisk(requestParams, requestOptions)
  ), options);
}

export function useSituationalPredictions(
  params: { gameId?: string; inning?: number; outs?: number; baseState?: string },
  options: UseBaseballRequestOptions = {},
): UseBaseballRequestReturn<SituationalPredictionsResponse> {
  const normalizedParams = params.gameId
    ? {
        gameId: params.gameId,
        inning: params.inning,
        outs: params.outs,
        baseState: params.baseState,
      }
    : null;

  return useBaseballRequest(normalizedParams, (client, requestParams, requestOptions) => (
    client.getSituationalPredictions(requestParams, requestOptions)
  ), options);
}
