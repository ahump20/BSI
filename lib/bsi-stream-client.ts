/**
 * bsi-stream-client.ts
 *
 * Drop-in SSE client for the bsi-intelligence-stream Worker.
 * Handles token rendering, abort, and cache-hit detection.
 *
 * Usage:
 *   import { streamAnalysis } from '@/lib/bsi-stream-client';
 *
 *   const abort = streamAnalysis({
 *     question: "What's driving the bullpen collapse?",
 *     context: { sport: 'college-baseball', homeTeam: 'Texas', awayTeam: 'LSU', score: '4-6', inning: 'B7', outs: 1 },
 *     analysisType: 'live',
 *     onToken: (text) => setOutput(prev => prev + text),
 *     onDone: (meta) => console.log('TTFT:', meta.ttftMs, 'Cached:', meta.cached),
 *     onError: (err) => console.error(err),
 *   });
 *
 *   // Abort mid-stream:
 *   abort();
 */

export type Sport = 'college-baseball' | 'mlb' | 'ncaa-football' | 'nfl';
export type AnalysisType = 'live' | 'postgame' | 'pregame' | 'stat';

interface GameContext {
  sport: Sport;
  homeTeam: string;
  awayTeam: string;
  score?: string;
  inning?: string;
  outs?: number;
  pitcher?: string;
  pitchCount?: number;
  recentPlays?: string;
  gameId?: string;
}

interface StreamOptions {
  question: string;
  context?: GameContext;
  analysisType?: AnalysisType;
  onToken: (text: string) => void;
  onDone: (meta: { ttftMs: number | null; cached: boolean }) => void;
  onError: (err: Error) => void;
  baseUrl?: string;
}

const DEFAULT_BASE_URL = 'https://blazesportsintel.com/api/intelligence';

export function streamAnalysis(options: StreamOptions): () => void {
  const {
    question,
    context,
    analysisType = 'live',
    onToken,
    onDone,
    onError,
    baseUrl = DEFAULT_BASE_URL,
  } = options;

  const controller = new AbortController();
  const startTime = performance.now();
  let firstTokenTime: number | null = null;
  let isCached = false;

  (async () => {
    let response: Response;
    try {
      response = await fetch(`${baseUrl}/v1/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, context, analysisType }),
        signal: controller.signal,
      });
    } catch (err) {
      if ((err as Error).name === 'AbortError') return;
      onError(new Error(`Network error: ${(err as Error).message}`));
      return;
    }

    if (!response.ok) {
      onError(new Error(`BSI API error: ${response.status}`));
      return;
    }

    isCached = response.headers.get('X-BSI-Cache') === 'HIT';

    const reader = response.body?.getReader();
    if (!reader) { onError(new Error('No stream body')); return; }

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      let done: boolean;
      let value: Uint8Array | undefined;

      try {
        ({ done, value } = await reader.read());
      } catch (err) {
        if ((err as Error).name === 'AbortError') return;
        onError(err as Error);
        return;
      }

      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        try {
          const parsed = JSON.parse(line.slice(6));

          if (parsed.text) {
            if (firstTokenTime === null) {
              firstTokenTime = performance.now() - startTime;
            }
            onToken(parsed.text);
          }

          if (parsed.done) {
            onDone({
              ttftMs: firstTokenTime !== null ? Math.round(firstTokenTime) : null,
              cached: isCached || !!parsed.cached,
            });
            return;
          }
        } catch {
          // Malformed SSE line — skip
        }
      }
    }
  })();

  return () => controller.abort();
}
