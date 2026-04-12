#!/usr/bin/env node
/**
 * Stress test for the BSI MCP server at sabermetrics.blazesportsintel.com/mcp.
 *
 * Upstream-aware: segments BSI worker failures (5xx, timeouts, JSON-RPC
 * internal errors) from upstream throttling (Highlightly 429/503, ESPN 503,
 * RapidAPI quota-exceeded). Auto-stops the concurrency ramp if upstream
 * throttle rate exceeds 5% so we learn Highlightly's ceiling without burning
 * through it on every run.
 *
 * Usage:
 *   npx tsx scripts/stress-test-mcp.ts                 # defaults: ramp 10→20→50→100, 60s per step
 *   npx tsx scripts/stress-test-mcp.ts --concurrency 50 --duration 60
 *   npx tsx scripts/stress-test-mcp.ts --endpoint http://localhost:8796/mcp
 *
 * Or via npm: `npm run stress:mcp -- --concurrency 50 --duration 60`
 */

const DEFAULT_ENDPOINT = 'https://sabermetrics.blazesportsintel.com/mcp';
const DEFAULT_RAMP = [10, 20, 50, 100];
const DEFAULT_STEP_DURATION_S = 60;
const UPSTREAM_THROTTLE_ABORT_PCT = 0.05;

interface ToolCall {
  name: string;
  args: Record<string, unknown>;
}

const TOOL_ROTATION: ToolCall[] = [
  { name: 'bsi_get_scoreboard', args: {} },
  { name: 'bsi_get_standings', args: { conference: 'SEC' } },
  { name: 'bsi_get_standings', args: { conference: 'Big Ten' } },
  { name: 'bsi_get_standings', args: { conference: 'ACC' } },
  { name: 'bsi_get_rankings', args: {} },
  { name: 'bsi_get_team_sabermetrics', args: { team: 'texas' } },
  { name: 'bsi_get_team_sabermetrics', args: { team: 'lsu' } },
  { name: 'bsi_get_team_sabermetrics', args: { team: 'tennessee' } },
  { name: 'bsi_get_leaderboard', args: { metric: 'woba', type: 'batting', limit: 25 } },
  { name: 'bsi_get_leaderboard', args: { metric: 'fip', type: 'pitching', limit: 25 } },
  { name: 'bsi_get_conference_power_index', args: {} },
  { name: 'bsi_get_player_stats', args: { player: 'Carson Tinney' } },
  { name: 'bsi_get_team_schedule', args: { team: 'texas' } },
];

interface Sample {
  toolName: string;
  startedAt: number;
  durationMs: number;
  status: number;
  kind: 'ok' | 'bsi_error' | 'upstream_throttle' | 'client_error';
  errorMessage?: string;
}

interface StepSummary {
  concurrency: number;
  durationS: number;
  totalRequests: number;
  okCount: number;
  bsiErrorCount: number;
  upstreamThrottleCount: number;
  clientErrorCount: number;
  bsiErrorRate: number;
  upstreamThrottleRate: number;
  p50Ms: number;
  p95Ms: number;
  p99Ms: number;
  perTool: Record<string, { requests: number; p95Ms: number; errorRate: number }>;
  abortedForUpstreamThrottle: boolean;
}

/** Parse CLI args (minimal zero-dep parser). */
function parseArgs(): {
  endpoint: string;
  ramp: number[];
  durationS: number;
  overrideConcurrency: number | null;
} {
  const args = process.argv.slice(2);
  let endpoint = DEFAULT_ENDPOINT;
  let durationS = DEFAULT_STEP_DURATION_S;
  let overrideConcurrency: number | null = null;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const next = args[i + 1];
    if (arg === '--endpoint' && next) {
      endpoint = next;
      i++;
    } else if (arg === '--concurrency' && next) {
      overrideConcurrency = parseInt(next, 10);
      i++;
    } else if (arg === '--duration' && next) {
      durationS = parseInt(next, 10);
      i++;
    } else if (arg === '--help' || arg === '-h') {
      console.log(`Usage: stress-test-mcp.ts [--endpoint URL] [--concurrency N] [--duration S]

  --endpoint URL     MCP endpoint (default: ${DEFAULT_ENDPOINT})
  --concurrency N    Fixed concurrency instead of ramp (default: ramp ${DEFAULT_RAMP.join('→')})
  --duration S       Seconds per ramp step (default: ${DEFAULT_STEP_DURATION_S})`);
      process.exit(0);
    }
  }

  return {
    endpoint,
    ramp: overrideConcurrency ? [overrideConcurrency] : DEFAULT_RAMP,
    durationS,
    overrideConcurrency,
  };
}

/** Classify a JSON-RPC response as ok / bsi_error / upstream_throttle / client_error. */
function classifyResponse(
  status: number,
  body: unknown,
  fetchFailed: boolean
): { kind: Sample['kind']; errorMessage?: string } {
  if (fetchFailed) {
    return { kind: 'bsi_error', errorMessage: 'fetch failed' };
  }
  // HTTP-level upstream rate limits
  if (status === 429) {
    return { kind: 'upstream_throttle', errorMessage: `HTTP 429` };
  }
  if (status === 503) {
    return { kind: 'upstream_throttle', errorMessage: `HTTP 503` };
  }
  if (status >= 500) {
    return { kind: 'bsi_error', errorMessage: `HTTP ${status}` };
  }
  if (status >= 400) {
    return { kind: 'client_error', errorMessage: `HTTP ${status}` };
  }

  // 2xx but JSON-RPC error body
  const rpc = body as {
    error?: { code: number; message: string };
    result?: { isError?: boolean; content?: Array<{ text?: string }> };
  };
  if (rpc.error) {
    // -32029 from the worker is our own rate-limit response
    if (rpc.error.code === -32029) {
      return { kind: 'bsi_error', errorMessage: 'worker rate_limited' };
    }
    return { kind: 'bsi_error', errorMessage: rpc.error.message };
  }

  // MCP tool-level error (isError: true on the result content)
  if (rpc.result?.isError) {
    const text = rpc.result.content?.[0]?.text ?? '';
    // Distinguish upstream from our own based on message content
    if (/429|rate.?limit|throttle|quota/i.test(text)) {
      return { kind: 'upstream_throttle', errorMessage: text.slice(0, 120) };
    }
    if (/Highlightly 4\d\d|ESPN 4\d\d|ESPN 5\d\d|Highlightly 5\d\d/.test(text)) {
      return { kind: 'upstream_throttle', errorMessage: text.slice(0, 120) };
    }
    return { kind: 'bsi_error', errorMessage: text.slice(0, 120) };
  }

  return { kind: 'ok' };
}

/** Fire one request. Never throws — classifies all failures. */
async function callOnce(endpoint: string, tool: ToolCall, id: number): Promise<Sample> {
  const startedAt = Date.now();
  let status = 0;
  let body: unknown = null;
  let fetchFailed = false;

  const rpcBody = {
    jsonrpc: '2.0',
    id,
    method: 'tools/call',
    params: { name: tool.name, arguments: tool.args },
  };

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(rpcBody),
      signal: AbortSignal.timeout(30000),
    });
    status = res.status;
    try {
      body = await res.json();
    } catch {
      body = null;
    }
  } catch {
    fetchFailed = true;
  }

  const durationMs = Date.now() - startedAt;
  const classified = classifyResponse(status, body, fetchFailed);

  return {
    toolName: tool.name,
    startedAt,
    durationMs,
    status,
    kind: classified.kind,
    errorMessage: classified.errorMessage,
  };
}

/** Compute a percentile from a sorted numeric array (inclusive method). */
function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const rank = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, Math.min(rank, sorted.length - 1))];
}

/** Run a single concurrency step for `durationS` seconds. */
async function runStep(
  endpoint: string,
  concurrency: number,
  durationS: number,
  idOffset: number
): Promise<StepSummary> {
  const stopAt = Date.now() + durationS * 1000;
  const samples: Sample[] = [];
  let nextToolIndex = 0;
  let id = idOffset;
  let aborted = false;

  const worker = async (): Promise<void> => {
    while (Date.now() < stopAt && !aborted) {
      const tool = TOOL_ROTATION[nextToolIndex % TOOL_ROTATION.length];
      nextToolIndex++;
      const sample = await callOnce(endpoint, tool, id++);
      samples.push(sample);

      // Abort-on-upstream-throttle: check every ~50 requests whether the
      // upstream throttle ceiling has been hit. Prevents a stuck ramp from
      // blowing through Highlightly's tier.
      if (samples.length % 50 === 0) {
        const throttled = samples.filter((s) => s.kind === 'upstream_throttle').length;
        if (throttled / samples.length > UPSTREAM_THROTTLE_ABORT_PCT) {
          aborted = true;
        }
      }
    }
  };

  await Promise.all(Array.from({ length: concurrency }, () => worker()));

  const durations = samples.map((s) => s.durationMs).sort((a, b) => a - b);
  const okCount = samples.filter((s) => s.kind === 'ok').length;
  const bsiErrorCount = samples.filter((s) => s.kind === 'bsi_error').length;
  const upstreamThrottleCount = samples.filter(
    (s) => s.kind === 'upstream_throttle'
  ).length;
  const clientErrorCount = samples.filter((s) => s.kind === 'client_error').length;

  const perTool: Record<string, { requests: number; p95Ms: number; errorRate: number }> = {};
  const toolNames = [...new Set(samples.map((s) => s.toolName))];
  for (const name of toolNames) {
    const toolSamples = samples.filter((s) => s.toolName === name);
    const toolDurations = toolSamples.map((s) => s.durationMs).sort((a, b) => a - b);
    const errors = toolSamples.filter((s) => s.kind !== 'ok').length;
    perTool[name] = {
      requests: toolSamples.length,
      p95Ms: percentile(toolDurations, 95),
      errorRate: toolSamples.length ? errors / toolSamples.length : 0,
    };
  }

  return {
    concurrency,
    durationS,
    totalRequests: samples.length,
    okCount,
    bsiErrorCount,
    upstreamThrottleCount,
    clientErrorCount,
    bsiErrorRate: samples.length ? bsiErrorCount / samples.length : 0,
    upstreamThrottleRate: samples.length ? upstreamThrottleCount / samples.length : 0,
    p50Ms: percentile(durations, 50),
    p95Ms: percentile(durations, 95),
    p99Ms: percentile(durations, 99),
    perTool,
    abortedForUpstreamThrottle: aborted,
  };
}

function formatSummary(step: StepSummary): string {
  const pct = (n: number) => `${(n * 100).toFixed(2)}%`;
  const rps = step.totalRequests / step.durationS;
  const lines = [
    `  → concurrency=${step.concurrency}  duration=${step.durationS}s  total=${step.totalRequests}  rps=${rps.toFixed(1)}`,
    `    ok=${step.okCount}  bsi_error=${step.bsiErrorCount} (${pct(step.bsiErrorRate)})  upstream_throttle=${step.upstreamThrottleCount} (${pct(step.upstreamThrottleRate)})  client_error=${step.clientErrorCount}`,
    `    latency:  p50=${step.p50Ms}ms  p95=${step.p95Ms}ms  p99=${step.p99Ms}ms`,
  ];
  if (step.abortedForUpstreamThrottle) {
    lines.push(
      `    ⚠ aborted early — upstream throttle exceeded ${(UPSTREAM_THROTTLE_ABORT_PCT * 100).toFixed(0)}%; this is the ceiling for current Highlightly / RapidAPI tier`
    );
  }
  lines.push(`    per-tool p95:`);
  for (const [name, stats] of Object.entries(step.perTool).sort(
    (a, b) => b[1].p95Ms - a[1].p95Ms
  )) {
    lines.push(
      `      ${name.padEnd(36)}  req=${String(stats.requests).padStart(4)}  p95=${String(stats.p95Ms).padStart(5)}ms  err=${pct(stats.errorRate)}`
    );
  }
  return lines.join('\n');
}

async function main(): Promise<void> {
  const { endpoint, ramp, durationS } = parseArgs();
  console.log(
    `BSI MCP stress test\n  endpoint: ${endpoint}\n  ramp: ${ramp.join(' → ')}  (${durationS}s per step)\n  tools in rotation: ${TOOL_ROTATION.length}\n`
  );

  let idOffset = 1;
  let stopEarly = false;

  for (const concurrency of ramp) {
    if (stopEarly) {
      console.log(`[skipped] concurrency=${concurrency} — prior step hit upstream ceiling`);
      continue;
    }
    console.log(`\n[step] concurrency=${concurrency}`);
    const step = await runStep(endpoint, concurrency, durationS, idOffset);
    idOffset += step.totalRequests + 1;
    console.log(formatSummary(step));
    if (step.abortedForUpstreamThrottle) {
      stopEarly = true;
    }
  }

  console.log(
    `\nDone. Gate targets: bsi_error_rate < 1%, p95 cache-hit < 800ms, upstream_throttle < 3% at 50-concurrent steady state.`
  );
}

main().catch((err) => {
  console.error('Stress test crashed:', err);
  process.exit(1);
});
