import type { BiomechPitcherMetric } from './biomechAlertEngine';

export interface BiomechDataPayload {
  metadata: {
    season: number;
    updated: string;
    source: string;
    notes?: string;
  };
  pitchers: BiomechPitcherMetric[];
}

export async function fetchBiomechMetrics(options: { signal?: AbortSignal } = {}): Promise<BiomechDataPayload> {
  const response = await fetch('/data/college-baseball/biomechanics/pitcher-metrics.json', {
    headers: { 'Accept': 'application/json' },
    signal: options.signal,
  });

  if (!response.ok) {
    throw new Error(`Failed to load biomechanics metrics (${response.status})`);
  }

  const payload = (await response.json()) as BiomechDataPayload;
  return {
    ...payload,
    pitchers: payload.pitchers.map((pitcher) => ({
      ...pitcher,
      handedness: pitcher.handedness ?? 'R',
    })),
  };
}
