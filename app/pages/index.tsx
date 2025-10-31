import Head from 'next/head';
import Link from 'next/link';

export default function Home() {
  return (
    <>
      <Head>
        <title>BlazeSportsIntel Developer Tools</title>
      </Head>
      <main className="min-h-screen bg-bsi-surface text-bsi-text">
        <div className="mx-auto max-w-4xl px-6 py-16">
          <h1 className="text-3xl font-semibold text-bsi-gold">Developer Tools</h1>
          <p className="mt-4 text-lg text-bsi-text/80">
            This workspace bundles the proxy worker and WebGPU diagnostics needed to iterate quickly on the
            BlazeSportsIntel edge stack.
          </p>
          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            <Link
              href="/dev"
              className="rounded-lg border border-bsi-panel bg-bsi-panel/70 p-6 shadow-lg transition hover:border-bsi-gold hover:shadow-bsi-gold/20"
            >
              <h2 className="text-xl font-medium text-bsi-text">Developer Mode</h2>
              <p className="mt-2 text-sm text-bsi-text/70">
                Run proxy smoke tests, confirm WebGPU support, and validate end-to-end connectivity.
              </p>
            </Link>
            <Link
              href="/dev/proxy"
              className="rounded-lg border border-bsi-panel bg-bsi-panel/70 p-6 shadow-lg transition hover:border-bsi-gold hover:shadow-bsi-gold/20"
            >
              <h2 className="text-xl font-medium text-bsi-text">Proxy Playground</h2>
              <p className="mt-2 text-sm text-bsi-text/70">
                Fire requests through the Cloudflare Worker without leaving the browser.
              </p>
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
