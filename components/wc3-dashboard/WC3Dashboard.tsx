'use client';

export function WC3Dashboard() {
  return (
    <div className="min-h-screen bg-midnight p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="font-display text-3xl font-bold text-white mb-4">WC3 Productivity Dashboard</h1>
        <p className="text-text-secondary mb-8">Transform your dev workflow into Warcraft 3. Coming soon.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-charcoal border border-border-subtle rounded-xl p-6">
            <h3 className="text-white font-semibold mb-2">Base</h3>
            <p className="text-text-tertiary text-sm">Your deployment status and health metrics.</p>
          </div>
          <div className="bg-charcoal border border-border-subtle rounded-xl p-6">
            <h3 className="text-white font-semibold mb-2">Units</h3>
            <p className="text-text-tertiary text-sm">Commits spawn units. Track your army.</p>
          </div>
          <div className="bg-charcoal border border-border-subtle rounded-xl p-6">
            <h3 className="text-white font-semibold mb-2">Enemies</h3>
            <p className="text-text-tertiary text-sm">Errors spawn enemies. Defeat them all.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
