import { useEffect, useMemo, useState } from 'react';

type Status = 'idle' | 'loading' | 'ready' | 'error';

type WebGpuState = 'unknown' | 'supported' | 'unavailable';

type ProxyResult = {
  status: number;
  upstream: string;
  cache: string | null;
  timestamp: string;
};

export interface DeveloperModePanelProps {
  workerUrl: string;
  webgpuDemoUrl: string;
}

function detectWebGpu(): WebGpuState {
  if (typeof navigator === 'undefined') {
    return 'unknown';
  }

  const nav = navigator as Navigator & { gpu?: { requestAdapter?: () => unknown } };
  if (typeof nav.gpu !== 'undefined') {
    return 'supported';
  }

  if (typeof nav.gpu?.requestAdapter === 'function') {
    return 'supported';
  }

  return 'unavailable';
}

export function DeveloperModePanel({ workerUrl, webgpuDemoUrl }: DeveloperModePanelProps) {
  const [status, setStatus] = useState<Status>('idle');
  const [webGpuState, setWebGpuState] = useState<WebGpuState>('unknown');
  const [result, setResult] = useState<ProxyResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const normalizedWorkerUrl = useMemo(() => workerUrl.replace(/\/$/, ''), [workerUrl]);

  useEffect(() => {
    setWebGpuState(detectWebGpu());
  }, []);

  async function pingWorker() {
    try {
      setStatus('loading');
      setError(null);
      setResult(null);

      const response = await fetch(`${normalizedWorkerUrl}/health`, {
        headers: {
          'BSI-Debug': 'developer-mode-panel'
        }
      });

      if (!response.ok) {
        throw new Error(`Worker responded with status ${response.status}`);
      }

      const payload = await response.json();
      const proxyStatus: ProxyResult = {
        status: response.status,
        upstream: payload?.upstreamConfigured ? 'configured' : 'missing',
        cache: response.headers.get('x-bsi-cache'),
        timestamp: payload?.timestamp ?? new Date().toISOString()
      };

      setResult(proxyStatus);
      setStatus('ready');
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }

  return (
    <section className="space-y-6 rounded-xl border border-bsi-panel bg-bsi-panel/70 p-6 shadow-xl">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-bsi-gold">Developer Mode</h2>
          <p className="text-sm text-bsi-text/70">
            Validate the Cloudflare proxy worker and confirm WebGPU readiness before flipping any feature flags.
          </p>
        </div>
        <button
          type="button"
          className="inline-flex items-center justify-center rounded-lg border border-bsi-gold bg-bsi-gold/20 px-4 py-2 text-sm font-medium text-bsi-gold transition hover:bg-bsi-gold/30"
          onClick={pingWorker}
          disabled={status === 'loading'}
        >
          {status === 'loading' ? 'Pinging…' : 'Run health check'}
        </button>
      </header>

      <dl className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-bsi-panel bg-bsi-surface/60 p-4">
          <dt className="text-sm uppercase tracking-wide text-bsi-text/60">Worker URL</dt>
          <dd className="mt-1 truncate text-base font-medium text-bsi-text">{normalizedWorkerUrl}</dd>
        </div>
        <div className="rounded-lg border border-bsi-panel bg-bsi-surface/60 p-4">
          <dt className="text-sm uppercase tracking-wide text-bsi-text/60">WebGPU Demo</dt>
          <dd className="mt-1 truncate text-base font-medium text-bsi-text">{webgpuDemoUrl}</dd>
        </div>
        <div className="rounded-lg border border-bsi-panel bg-bsi-surface/60 p-4">
          <dt className="text-sm uppercase tracking-wide text-bsi-text/60">WebGPU Support</dt>
          <dd
            className={`mt-1 text-base font-medium ${
              webGpuState === 'supported'
                ? 'text-emerald-400'
                : webGpuState === 'unavailable'
                ? 'text-rose-400'
                : 'text-bsi-text/80'
            }`}
          >
            {webGpuState === 'supported' && 'Detected'}
            {webGpuState === 'unavailable' && 'Unavailable'}
            {webGpuState === 'unknown' && 'Checking…'}
          </dd>
        </div>
      </dl>

      {status === 'ready' && result && (
        <div className="rounded-lg border border-emerald-700/40 bg-emerald-900/20 p-4 text-sm text-emerald-200">
          <p className="font-semibold">Worker healthy</p>
          <ul className="mt-2 space-y-1">
            <li>
              <span className="text-emerald-400">Status:</span> {result.status} ({result.upstream})
            </li>
            <li>
              <span className="text-emerald-400">Cache:</span> {result.cache ?? 'MISS'}
            </li>
            <li>
              <span className="text-emerald-400">Timestamp:</span> {new Date(result.timestamp).toLocaleString()}
            </li>
          </ul>
        </div>
      )}

      {status === 'error' && error && (
        <div className="rounded-lg border border-rose-700/40 bg-rose-900/20 p-4 text-sm text-rose-200">
          <p className="font-semibold">Worker check failed</p>
          <p className="mt-2 text-rose-100/80">{error}</p>
        </div>
      )}

      <footer className="rounded-lg border border-bsi-panel bg-bsi-surface/60 p-4 text-sm text-bsi-text/70">
        <p>
          The panel always hits <code className="rounded bg-black/40 px-1 py-0.5">/health</code> on the Worker. Use the
          <a className="ml-1 underline" href="/dev/proxy">
            Proxy Playground
          </a>
          to exercise real upstream endpoints.
        </p>
      </footer>
    </section>
  );
}

export default DeveloperModePanel;
