'use client';

/**
 * OriginStory — editorial section about BSI's founding mission.
 */
export function OriginStory() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-[#0D0D12]">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-3xl md:text-4xl font-display text-white uppercase tracking-wide mb-8">
          <span className="text-gradient-brand">The Origin</span>
        </h2>
        <p className="text-lg text-white/60 leading-relaxed mb-6">
          BSI started with a simple frustration: the games that matter most to real fans
          don&apos;t get the coverage they deserve. College baseball buried behind football
          replays. Mid-major hoops ignored entirely. The data existed — it just wasn&apos;t
          accessible.
        </p>
        <p className="text-lg text-white/60 leading-relaxed">
          So we built the pipeline ourselves. 53 Cloudflare Workers pulling data from
          every source that matters, transforming it into the analytics platform we always
          wanted. No venture money. No compromise. Just depth.
        </p>
      </div>
    </section>
  );
}
