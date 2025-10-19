import { useEffect, useState } from 'react';
import Head from 'next/head';

interface Manifest {
  name: string;
  origin: string;
  entrypoints: Record<string, string>;
}

type Status = 'idle' | 'loading' | 'ready' | 'error';

type WebGpuSupport = 'unknown' | 'supported' | 'unavailable';

export default function WebGpuDiagnostics() {
  const workerBaseUrl = process.env.NEXT_PUBLIC_WORKER_BASE_URL ?? 'http://localhost:8787';
  const [manifest, setManifest] = useState<Manifest | null>(null);
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);
  const [support, setSupport] = useState<WebGpuSupport>('unknown');

  useEffect(() => {
    if (typeof navigator === 'undefined') {
      return;
    }

    const nav = navigator as Navigator & { gpu?: { requestAdapter?: () => Promise<unknown> } };
    if (nav.gpu && typeof nav.gpu.requestAdapter === 'function') {
      setSupport('supported');
      return;
    }

    setSupport(typeof nav.gpu !== 'undefined' ? 'supported' : 'unavailable');
  }, []);

  async function loadManifest() {
    try {
      setStatus('loading');
      setError(null);
      setManifest(null);

      const response = await fetch(`${workerBaseUrl.replace(/\/$/, '')}/webgpu/manifest`);
      if (!response.ok) {
        throw new Error(`Manifest request failed (${response.status})`);
      }

      const payload = (await response.json()) as Manifest;
      setManifest(payload);
      setStatus('ready');
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }

  useEffect(() => {
    void loadManifest();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <Head>
        <title>WebGPU Diagnostics • BlazeSportsIntel</title>
      </Head>
      <main className="min-h-screen bg-bsi-surface text-bsi-text">
        <div className="mx-auto max-w-5xl px-6 py-16">
          <div className="flex flex-col gap-3">
            <h1 className="text-3xl font-semibold text-bsi-gold">WebGPU Diagnostics</h1>
            <p className="text-base text-bsi-text/80">
              Inspect the manifest served by the Cloudflare Worker and confirm that this device is cleared for WebGPU demos.
            </p>
          </div>

          <section className="mt-10 grid gap-6 md:grid-cols-2">
            <article className="space-y-4 rounded-xl border border-bsi-panel bg-bsi-panel/70 p-6 shadow-xl">
              <header>
                <h2 className="text-xl font-semibold text-bsi-text">Client capability</h2>
              </header>
              <p className="text-sm text-bsi-text/70">
                The browser reports WebGPU support as
                <span
                  className={`ml-2 font-semibold ${
                    support === 'supported' ? 'text-emerald-400' : support === 'unavailable' ? 'text-rose-400' : ''
                  }`}
                >
                  {support}
                </span>
                .
              </p>
              <p className="text-xs text-bsi-text/50">
                Chrome 120+, Edge 120+, and Safari 17 (TP) should all report <strong className="text-emerald-300">supported</strong>.
                If you see <strong className="text-rose-300">unavailable</strong>, expect a WebGL2 fallback.
              </p>
            </article>

            <article className="space-y-4 rounded-xl border border-bsi-panel bg-bsi-panel/70 p-6 shadow-xl">
              <header className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-bsi-text">Worker manifest</h2>
                <button
                  type="button"
                  className="rounded-lg border border-bsi-gold bg-bsi-gold/20 px-3 py-1.5 text-sm font-medium text-bsi-gold transition hover:bg-bsi-gold/30"
                  onClick={loadManifest}
                  disabled={status === 'loading'}
                >
                  {status === 'loading' ? 'Refreshing…' : 'Refresh'}
                </button>
              </header>

              {status === 'error' && error && (
                <p className="rounded-lg border border-rose-700/40 bg-rose-900/20 p-3 text-sm text-rose-200">{error}</p>
              )}

              {manifest && (
                <div className="space-y-2 text-sm text-bsi-text/80">
                  <p>
                    <span className="text-bsi-text/60">Name:</span> {manifest.name}
                  </p>
                  <p>
                    <span className="text-bsi-text/60">Origin:</span> {manifest.origin}
                  </p>
                  <div>
                    <h3 className="text-bsi-text/60">Entrypoints</h3>
                    <ul className="mt-2 space-y-1">
                      {Object.entries(manifest.entrypoints).map(([key, value]) => (
                        <li key={key} className="font-mono">
                          <span className="text-bsi-text/60">{key}:</span> {value}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {status === 'loading' && (
                <p className="text-sm text-bsi-text/60">Loading manifest…</p>
              )}
            </article>
          </section>
        </div>
      </main>
    </>
  );
}
