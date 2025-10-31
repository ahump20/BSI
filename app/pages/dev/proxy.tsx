import { FormEvent, useMemo, useState } from 'react';
import Head from 'next/head';

interface ProxyResponse {
  status: number;
  statusText: string;
  headers: Array<{ key: string; value: string }>;
  bodyPreview: string;
  durationMs: number;
}

const DEFAULT_PATH = '/health';

export default function ProxyPlayground() {
  const workerBaseUrl = process.env.NEXT_PUBLIC_WORKER_BASE_URL ?? 'http://localhost:8787';
  const [path, setPath] = useState(DEFAULT_PATH);
  const [method, setMethod] = useState<'GET' | 'POST'>('GET');
  const [payload, setPayload] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<ProxyResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const endpoint = useMemo(() => `${workerBaseUrl.replace(/\/$/, '')}${path.startsWith('/') ? path : `/${path}`}`, [
    workerBaseUrl,
    path
  ]);

  const canSubmit = method === 'GET' || payload.trim().length > 0;

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) {
      setError('Body is required for POST requests');
      return;
    }

    setLoading(true);
    setResponse(null);
    setError(null);

    const startedAt = typeof performance !== 'undefined' ? performance.now() : Date.now();

    try {
      const fetchResponse = await fetch(endpoint, {
        method,
        headers:
          method === 'POST'
            ? {
                'Content-Type': 'application/json'
              }
            : undefined,
        body: method === 'POST' ? payload : undefined
      });

      const text = await fetchResponse.text();
      const finishedAt = typeof performance !== 'undefined' ? performance.now() : Date.now();

      const proxyResponse: ProxyResponse = {
        status: fetchResponse.status,
        statusText: fetchResponse.statusText,
        headers: Array.from(fetchResponse.headers.entries()).map(([key, value]) => ({ key, value })),
        bodyPreview: text.slice(0, 1000),
        durationMs: Math.round(finishedAt - startedAt)
      };

      setResponse(proxyResponse);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Head>
        <title>Proxy Playground • BlazeSportsIntel</title>
      </Head>
      <main className="min-h-screen bg-bsi-surface text-bsi-text">
        <div className="mx-auto max-w-5xl px-6 py-16">
          <h1 className="text-3xl font-semibold text-bsi-gold">Proxy Playground</h1>
          <p className="mt-4 max-w-3xl text-base text-bsi-text/80">
            Hit the Cloudflare Worker directly and inspect response headers, cache behavior, and payload previews without
            leaving the browser.
          </p>

          <form onSubmit={onSubmit} className="mt-10 space-y-6 rounded-xl border border-bsi-panel bg-bsi-panel/70 p-6 shadow-xl">
            <div className="grid gap-4 sm:grid-cols-[120px_1fr]">
              <label className="text-sm font-medium uppercase tracking-wide text-bsi-text/60" htmlFor="method">
                Method
              </label>
              <select
                id="method"
                value={method}
                onChange={(event) => setMethod(event.target.value as 'GET' | 'POST')}
                className="rounded-lg border border-bsi-panel bg-bsi-surface/80 px-4 py-2 text-bsi-text focus:border-bsi-gold focus:outline-none"
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
              </select>

              <label className="text-sm font-medium uppercase tracking-wide text-bsi-text/60" htmlFor="path">
                Path
              </label>
              <input
                id="path"
                value={path}
                onChange={(event) => setPath(event.target.value)}
                className="rounded-lg border border-bsi-panel bg-bsi-surface/80 px-4 py-2 text-bsi-text focus:border-bsi-gold focus:outline-none"
                placeholder="/health"
              />

              <label className="text-sm font-medium uppercase tracking-wide text-bsi-text/60" htmlFor="body">
                Body
              </label>
              <textarea
                id="body"
                value={payload}
                onChange={(event) => setPayload(event.target.value)}
                className="h-40 rounded-lg border border-bsi-panel bg-bsi-surface/80 px-4 py-2 font-mono text-sm text-bsi-text focus:border-bsi-gold focus:outline-none"
                placeholder='{"sample":true}'
              />
            </div>

            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-lg border border-bsi-gold bg-bsi-gold/20 px-4 py-2 text-sm font-medium text-bsi-gold transition hover:bg-bsi-gold/30 disabled:opacity-60"
              disabled={loading}
            >
              {loading ? 'Sending…' : 'Send request'}
            </button>
          </form>

          <section className="mt-10 space-y-4">
            <div className="rounded-lg border border-bsi-panel bg-bsi-panel/70 p-6 shadow-lg">
              <h2 className="text-xl font-semibold text-bsi-text">Request preview</h2>
              <dl className="mt-4 grid gap-3 text-sm text-bsi-text/80">
                <div>
                  <dt className="uppercase tracking-wide text-bsi-text/60">Endpoint</dt>
                  <dd className="mt-1 break-all text-bsi-text">{endpoint}</dd>
                </div>
                <div>
                  <dt className="uppercase tracking-wide text-bsi-text/60">Method</dt>
                  <dd className="mt-1 text-bsi-text">{method}</dd>
                </div>
              </dl>
            </div>

            {error && (
              <div className="rounded-lg border border-rose-700/40 bg-rose-900/20 p-4 text-sm text-rose-200">
                <p className="font-semibold">Request failed</p>
                <p className="mt-2 text-rose-100/80">{error}</p>
              </div>
            )}

            {response && (
              <div className="space-y-4">
                <div className="rounded-lg border border-emerald-700/40 bg-emerald-900/20 p-4 text-sm text-emerald-200">
                  <p className="font-semibold">Response summary</p>
                  <ul className="mt-2 space-y-1">
                    <li>
                      <span className="text-emerald-400">Status:</span> {response.status} {response.statusText}
                    </li>
                    <li>
                      <span className="text-emerald-400">Duration:</span> {response.durationMs} ms
                    </li>
                  </ul>
                </div>
                <div className="rounded-lg border border-bsi-panel bg-bsi-surface/60 p-4 text-sm text-bsi-text/80">
                  <h3 className="text-base font-semibold text-bsi-text">Headers</h3>
                  <ul className="mt-2 space-y-1">
                    {response.headers.map(({ key, value }) => (
                      <li key={`${key}:${value}`} className="font-mono">
                        <span className="text-bsi-text/60">{key}:</span> {value}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-lg border border-bsi-panel bg-bsi-surface/60 p-4 text-sm text-bsi-text/80">
                  <h3 className="text-base font-semibold text-bsi-text">Body preview</h3>
                  <pre className="mt-2 max-h-72 overflow-y-auto whitespace-pre-wrap rounded bg-black/40 p-4 text-xs text-bsi-text/90">
                    {response.bodyPreview}
                  </pre>
                </div>
              </div>
            )}
          </section>
        </div>
      </main>
    </>
  );
}
