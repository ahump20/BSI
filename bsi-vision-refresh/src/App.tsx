import './index.css'

const kpis = [
  { label: 'Live Games', value: '214', note: 'across 4 leagues' },
  { label: 'Signal Latency', value: '38ms', note: 'edge-optimized' },
  { label: 'Active Teams', value: '392', note: 'pro + NCAA' },
  { label: 'Model Accuracy', value: '91.7%', note: 'last 30 days' },
]

const features = [
  {
    title: 'Real-time signal fusion',
    text: 'Unify official feeds, injury context, and momentum shifts into a single decision layer.',
  },
  {
    title: 'League-aware forecasting',
    text: 'Custom weighting per sport to avoid one-size-fits-all projections.',
  },
  {
    title: 'Operator-grade workflows',
    text: 'Command-center UI with rapid filters, tactical alerts, and stitched narratives.',
  },
]

export default function App() {
  return (
    <div className="min-h-screen bg-ink text-white">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-hero" />
        <div className="absolute inset-0 bg-grid" />
      </div>

      <header className="relative z-10 px-6 py-6">
        <nav className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-ember/20 border border-ember/30 grid place-items-center text-ember font-bold">
              B
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-white/50">Blaze Sports Intel</p>
              <p className="font-display text-lg tracking-tight">Command Layer</p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm text-white/70">
            <span className="hover:text-white transition">Platform</span>
            <span className="hover:text-white transition">Analytics</span>
            <span className="hover:text-white transition">Pricing</span>
            <button className="btn-primary">Launch</button>
          </div>
        </nav>
      </header>

      <main className="relative z-10 px-6 pb-20">
        <section className="max-w-6xl mx-auto pt-12">
          <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-10 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-ember/30 bg-ember/10 text-ember text-xs uppercase tracking-[0.25em]">
                Live Signal Mesh
              </div>
              <h1 className="mt-6 text-4xl md:text-6xl font-display leading-[0.9]">
                Ignite every decision
                <span className="block text-gradient">with real-time sports intelligence</span>
              </h1>
              <p className="mt-6 text-lg text-white/60 max-w-xl">
                Blaze Sports Intel turns live data into tactical clarity. Track momentum, detect anomalies, and act before the scoreboard catches up.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <button className="btn-primary">Open Command Center</button>
                <button className="btn-secondary">View Coverage Map</button>
              </div>
              <div className="mt-8 flex items-center gap-6 text-xs uppercase tracking-[0.2em] text-white/40">
                <span>MLB</span>
                <span>NFL</span>
                <span>NBA</span>
                <span>NCAA</span>
              </div>
            </div>
            <div className="glass-panel p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.25em] text-white/40">Live Radar</p>
                  <p className="text-xl font-display mt-1">Signal Strength</p>
                </div>
                <div className="pulse-dot" />
              </div>
              <div className="mt-6 space-y-4">
                {kpis.map((kpi) => (
                  <div key={kpi.label} className="flex items-center justify-between border-b border-white/10 pb-4 last:border-b-0 last:pb-0">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-white/40">{kpi.label}</p>
                      <p className="text-2xl font-display mt-1 text-white">{kpi.value}</p>
                    </div>
                    <p className="text-xs text-white/50 max-w-[120px] text-right">{kpi.note}</p>
                  </div>
                ))}
              </div>
              <div className="mt-6 rounded-xl border border-ember/30 bg-ember/10 p-4 text-sm text-ember">
                24/7 monitoring across 400+ live data endpoints.
              </div>
            </div>
          </div>
        </section>

        <section className="max-w-6xl mx-auto mt-16 grid md:grid-cols-3 gap-6">
          {features.map((feature) => (
            <div key={feature.title} className="card-edge p-6">
              <p className="text-sm uppercase tracking-[0.22em] text-ember">{feature.title}</p>
              <p className="mt-4 text-white/60 text-sm leading-relaxed">{feature.text}</p>
            </div>
          ))}
        </section>

        <section className="max-w-6xl mx-auto mt-16 grid lg:grid-cols-[1.4fr_0.6fr] gap-6">
          <div className="card-edge p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-white/40">Coverage Map</p>
                <p className="text-xl font-display mt-1">League Signal Density</p>
              </div>
              <button className="btn-ghost">Expand</button>
            </div>
            <div className="mt-6 grid md:grid-cols-2 gap-4">
              {['MLB', 'NFL', 'NBA', 'NCAA'].map((league) => (
                <div key={league} className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <p className="text-sm text-white/70">{league}</p>
                  <div className="mt-2 h-2 rounded-full bg-white/10">
                    <div className="h-2 rounded-full bg-gradient-to-r from-ember via-gold to-cyan" style={{ width: `${60 + league.length * 8}%` }} />
                  </div>
                  <p className="mt-2 text-xs text-white/40">Data freshness: &lt; 60s</p>
                </div>
              ))}
            </div>
          </div>
          <div className="card-edge p-6 flex flex-col justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-white/40">Operator Notes</p>
              <p className="text-lg font-display mt-2">Today&apos;s targets</p>
              <ul className="mt-4 space-y-3 text-sm text-white/60">
                <li>Monitor SEC pitcher workloads for fatigue spikes.</li>
                <li>Flag NBA back-to-backs with travel distance &gt; 1,200 miles.</li>
                <li>Watch NFL red-zone efficiency deviations.</li>
              </ul>
            </div>
            <button className="btn-primary mt-6">Create Alert</button>
          </div>
        </section>
      </main>
    </div>
  )
}
