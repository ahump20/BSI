const tiers = [
  {
    name: 'Free',
    price: '$0',
    description: 'Live scores and public intel headlines.',
    features: ['Scoreboard updates', 'Public news feed', 'Basic game context'],
    cta: 'Current plan',
    href: '',
  },
  {
    name: 'Pro',
    price: '$12/mo',
    description: 'Pitch-level data and premium live intelligence.',
    features: ['Win probability shifts', 'Leverage context', 'Pitch-by-pitch moments'],
    cta: 'Upgrade to Pro',
    href: process.env.NEXT_PUBLIC_STRIPE_CHECKOUT_PRO ?? '#',
  },
  {
    name: 'Data API',
    price: '$199/mo',
    description: 'Raw and historical data access for teams, scouts, and media.',
    features: ['API key access', 'Historical endpoints', 'Commercial usage rights'],
    cta: 'Start API plan',
    href: process.env.NEXT_PUBLIC_STRIPE_CHECKOUT_API ?? '#',
  },
];

export default function ProPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <section className="mx-auto max-w-6xl px-6 py-16">
        <p className="text-sm uppercase tracking-[0.16em] text-orange-400">BSI Pro</p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
          From live data to paid intelligence.
        </h1>
        <p className="mt-4 max-w-2xl text-zinc-300">
          Every premium endpoint is now protected by API keys. Choose a plan, complete checkout, and
          receive credentials through Stripe webhook provisioning.
        </p>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {tiers.map((tier) => (
            <article
              key={tier.name}
              className="rounded-xl border border-zinc-800 bg-zinc-950 p-6 shadow-xl"
            >
              <h2 className="text-2xl font-semibold">{tier.name}</h2>
              <p className="mt-2 text-3xl font-bold text-orange-400">{tier.price}</p>
              <p className="mt-3 text-sm text-zinc-300">{tier.description}</p>

              <ul className="mt-5 space-y-2 text-sm text-zinc-200">
                {tier.features.map((feature) => (
                  <li key={feature}>• {feature}</li>
                ))}
              </ul>

              {tier.href ? (
                <a
                  href={tier.href}
                  className="mt-6 inline-flex w-full items-center justify-center rounded-lg bg-orange-500 px-4 py-2 font-semibold text-black transition hover:bg-orange-400"
                >
                  {tier.cta}
                </a>
              ) : (
                <span className="mt-6 inline-flex w-full items-center justify-center rounded-lg border border-zinc-700 px-4 py-2 font-semibold text-zinc-300">
                  {tier.cta}
                </span>
              )}
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
