'use client';

const VALUES = [
  {
    title: 'Depth Over Flash',
    description: 'Real analytics, not hot takes. Every data point is sourced and timestamped.',
  },
  {
    title: 'Every Game Matters',
    description: 'From College World Series to Tuesday night mid-major hoops — we cover it all.',
  },
  {
    title: 'Built in the Open',
    description: 'Independent platform. No corporate filter. The coverage fans deserve.',
  },
];

/**
 * CovenantValues — BSI values / principles section.
 */
export function CovenantValues() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-[#0A0A0F]">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-display text-white uppercase tracking-wide text-center mb-12">
          <span className="text-gradient-brand">The Covenant</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {VALUES.map((value) => (
            <div
              key={value.title}
              className="glass-default rounded-2xl p-8 text-center hover:shadow-glow-sm transition-shadow duration-300"
            >
              <h3 className="text-xl font-display text-white uppercase tracking-wide mb-4">
                {value.title}
              </h3>
              <p className="text-sm text-white/50 leading-relaxed">
                {value.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
