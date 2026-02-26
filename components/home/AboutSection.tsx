'use client';

/**
 * AboutSection — merged OriginStory + CovenantValues.
 * Origin narrative as intro text, followed by three value cards.
 */

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

export function AboutSection() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-background-primary">
      <div className="max-w-7xl mx-auto">
        {/* Origin narrative */}
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-display text-text-primary uppercase tracking-wide mb-8">
            <span className="text-gradient-brand">The Origin</span>
          </h2>
          <p className="text-lg text-text-secondary leading-relaxed mb-6">
            BSI started with a simple frustration: the games that matter most to real fans
            don&apos;t get the coverage they deserve. College baseball buried behind football
            replays. Mid-major hoops ignored entirely. The data existed — it just wasn&apos;t
            accessible.
          </p>
          <p className="text-lg text-text-secondary leading-relaxed">
            So we built the pipeline ourselves. Cloudflare Workers pulling data from
            every source that matters, transforming it into the analytics platform we always
            wanted. No venture money. No compromise. Just depth.
          </p>
        </div>

        {/* Value cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {VALUES.map((value) => (
            <div
              key={value.title}
              className="glass-default rounded-2xl p-8 text-center border border-border-subtle hover:border-border-strong transition-all duration-300"
            >
              <h3 className="text-xl font-display text-text-primary uppercase tracking-wide mb-4">
                {value.title}
              </h3>
              <p className="text-sm text-text-muted leading-relaxed">
                {value.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
