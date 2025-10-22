import WebGPUDemoWrapper from './webgpu-demo-wrapper';

const experiments = [
  {
    title: 'Cloudflare Worker Edge Cache',
    description: 'Workers KV caching for live innings. Target: < 60s TTL, 95% hit rate during SEC play.'
  },
  {
    title: 'Diamond Engine Telemetry',
    description: 'Event pipeline from TrackMan → Cloudflare D1 → Redis. Monitoring p99 latency inside Grafana.'
  }
];

export default function DeveloperLabsPage() {
  return (
    <div className="dev-stack">
      <section className="dev-section" aria-labelledby="labs-overview">
        <span className="dev-badge">Labs</span>
        <h1 id="labs-overview">Experimental Prototypes</h1>
        <p className="dev-section__subtitle">
          Test hardware-accelerated experiences and infrastructure experiments before they hit the Diamond Insights roadmap.
        </p>
      </section>

      <section className="dev-section" aria-labelledby="webgpu-demo">
        <h2 id="webgpu-demo">WebGPU Particle Playground</h2>
        <p className="dev-section__subtitle">
          Render pipeline proves Chrome 120+ handles GPU clears on low power hardware. Extend with WGSL compute shaders for live
          pitch tunnels.
        </p>
        <WebGPUDemoWrapper />
      </section>

      <section className="dev-section" aria-labelledby="labs-roadmap">
        <h2 id="labs-roadmap">Active Experiments</h2>
        <div className="dev-grid">
          {experiments.map((experiment) => (
            <article key={experiment.title} className="dev-card">
              <h3>{experiment.title}</h3>
              <p>{experiment.description}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
