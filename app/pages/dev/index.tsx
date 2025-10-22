import Head from 'next/head';

import DeveloperModePanel from '../../components/DeveloperModePanel';

const workerBaseUrl = process.env.NEXT_PUBLIC_WORKER_BASE_URL ?? 'http://localhost:8787';
const webgpuDemoUrl = process.env.NEXT_PUBLIC_WEBGPU_DEMO_URL ?? 'http://localhost:3000/dev/webgpu';

export default function DeveloperHome() {
  return (
    <>
      <Head>
        <title>Developer Mode • BlazeSportsIntel</title>
      </Head>
      <main className="min-h-screen bg-bsi-surface text-bsi-text">
        <div className="mx-auto max-w-5xl px-6 py-16">
          <div className="mb-10 flex flex-col gap-3">
            <h1 className="text-3xl font-semibold text-bsi-gold">Developer Mode</h1>
            <p className="text-base text-bsi-text/80">
              Run the worker health check, confirm WebGPU support, and review the manifest that powers the local Plotly +
              Babylon.js experiments.
            </p>
          </div>
          <DeveloperModePanel workerUrl={workerBaseUrl} webgpuDemoUrl={webgpuDemoUrl} />
        </div>
      </main>
    </>
  );
}
