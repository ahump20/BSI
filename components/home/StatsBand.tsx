'use client';

const STATS = [
  { value: '6', label: 'Sports Covered' },
  { value: '53', label: 'Live Workers' },
  { value: '24/7', label: 'Data Pipeline' },
  { value: '100%', label: 'Independent' },
];

/**
 * StatsBand — horizontal trust metrics strip.
 */
export function StatsBand() {
  return (
    <section className="py-10 border-y border-white/5 bg-[#0D0D12]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {STATS.map((stat) => (
            <div key={stat.label}>
              <p className="text-3xl md:text-4xl font-display font-bold text-[#BF5700]">
                {stat.value}
              </p>
              <p className="text-sm text-white/50 mt-1 uppercase tracking-wider">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
