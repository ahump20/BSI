'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { ScrollReveal } from '@/components/cinematic';
import { Footer } from '@/components/layout-ds/Footer';

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-background-primary text-text-primary pt-16 md:pt-20">
      {/* Hero — product thesis first */}
      <Section className="pt-28 md:pt-36 pb-20">
        <Container size="narrow" center>
          <ScrollReveal>
            <p className="text-sm tracking-[0.2em] text-burnt-orange uppercase mb-8 font-medium">
              Why This Exists
            </p>
            <h1 className="font-display uppercase text-4xl md:text-5xl lg:text-6xl font-bold mb-10 tracking-wide leading-[1.1]">
              The Coverage Gap{' '}
              <span className="text-burnt-orange">Is the Product</span>
            </h1>
            <p className="text-xl md:text-2xl text-text-secondary leading-relaxed max-w-2xl mx-auto">
              Try finding a box score for a Tuesday night game between Rice and Houston.
              Try tracking conference standings without clicking through fifteen pages.
              That gap between interest and access — that is what BSI covers.
            </p>
          </ScrollReveal>
        </Container>
      </Section>

      {/* What BSI does — evidence strip */}
      <Section className="py-20 border-t border-border-subtle">
        <Container>
          <ScrollReveal>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  stat: '300+',
                  label: 'D1 Baseball Programs',
                  desc: 'Every team. Every conference. Not just the thirty programs ESPN decides to cover on a given weekend.',
                },
                {
                  stat: '30s',
                  label: 'Live Score Updates',
                  desc: 'Real-time scores across college baseball, MLB, NFL, NBA, and college football. Multi-source verified.',
                },
                {
                  stat: '100%',
                  label: 'Sourced & Timestamped',
                  desc: 'Every data point shows where it came from and when. No anonymous data. No stale caches passed off as live.',
                },
              ].map((card) => (
                <div
                  key={card.stat}
                  className="p-6 rounded-lg bg-background-secondary border border-border-subtle
                             hover:border-border-accent transition-all duration-300 ease-out-expo"
                >
                  <div className="font-display text-3xl font-bold text-burnt-orange mb-2">
                    {card.stat}
                  </div>
                  <p className="text-xs text-text-tertiary uppercase tracking-[0.15em] mb-3 font-medium">
                    {card.label}
                  </p>
                  <p className="text-text-secondary text-sm leading-relaxed">{card.desc}</p>
                </div>
              ))}
            </div>
          </ScrollReveal>
        </Container>
      </Section>

      {/* The builder */}
      <Section className="py-24 border-t border-border-subtle">
        <Container>
          <ScrollReveal>
            <div className="grid md:grid-cols-5 gap-12 md:gap-16 items-start">
              {/* Headshot */}
              <div className="md:col-span-2 flex justify-center md:justify-end">
                <div className="relative w-56 md:w-64">
                  <Image
                    src="/images/headshot.jpg"
                    alt="Austin Humphrey"
                    width={256}
                    height={341}
                    className="rounded-lg border border-border-subtle"
                    priority
                  />
                  <div
                    className="absolute -inset-px rounded-lg pointer-events-none"
                    style={{
                      background:
                        'linear-gradient(180deg, rgba(191,87,0,0.08) 0%, transparent 40%)',
                    }}
                  />
                </div>
              </div>

              {/* Story */}
              <div className="md:col-span-3">
                <p className="text-xs tracking-[0.2em] text-text-muted uppercase mb-3 font-medium">
                  The Builder
                </p>
                <h2 className="font-display uppercase text-2xl md:text-3xl font-bold mb-8 tracking-wide">
                  Austin Humphrey
                </h2>

                <div className="space-y-5 text-text-secondary leading-[1.75]">
                  <p>
                    Born in Memphis with Texas soil under the hospital bed — a Humphrey tradition going
                    back generations from West Columbia, birthplace of the Republic of Texas. My family
                    has held the same four season tickets to Longhorn football for over forty years.
                  </p>
                  <p>
                    I studied international systems at UT Austin to understand how power structures
                    decide who gets covered and who gets ignored. Finished a master&apos;s in
                    entertainment business at Full Sail because the coverage gap is a product problem,
                    not just an editorial one. Made top 10% nationally at Northwestern Mutual because
                    I learned how to build something from nothing with no safety net.
                  </p>
                  <p>
                    Every credential pointed the same direction: build the thing nobody else would.
                    I pitched a perfect game once — 27 up, 27 down — but that is not the story.
                    The story is the Tuesday night games that nobody covers, the mid-major programs
                    with real talent that never make the broadcast window, and the fans who care
                    about depth instead of highlights.
                  </p>
                  <p className="text-text-primary">
                    <span className="text-burnt-orange font-semibold">Blaze Sports Intel</span> — named
                    after my first baseball team and a dachshund, built for fans who got tired of waiting.
                  </p>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </Container>
      </Section>

      {/* Infrastructure strip */}
      <Section className="py-20 bg-background-secondary border-t border-border-subtle">
        <Container size="narrow">
          <ScrollReveal>
            <div className="text-center mb-12">
              <h2 className="font-display uppercase text-2xl md:text-3xl font-bold tracking-wide">
                One <span className="text-burnt-orange">Operator</span>. Full Stack.
              </h2>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              {[
                { value: '15', label: 'Workers Deployed' },
                { value: '6', label: 'Databases' },
                { value: '18', label: 'Storage Buckets' },
                { value: '6', label: 'Sports Covered' },
              ].map((item) => (
                <div key={item.label}>
                  <div className="font-display text-3xl md:text-4xl font-bold text-text-primary">
                    {item.value}
                  </div>
                  <p className="text-xs text-text-muted uppercase tracking-[0.15em] mt-2 font-medium">
                    {item.label}
                  </p>
                </div>
              ))}
            </div>

            <p className="text-center text-text-tertiary mt-10 max-w-xl mx-auto leading-relaxed">
              Every line of code, every article, every data pipeline — built and maintained by one person
              on Cloudflare infrastructure. No VC funding, no content team, no shortcuts.
            </p>
          </ScrollReveal>
        </Container>
      </Section>

      {/* CTA */}
      <Section className="py-24 border-t border-border-subtle">
        <Container size="narrow" center>
          <ScrollReveal>
            <h2 className="font-display uppercase text-3xl md:text-4xl font-bold mb-6 tracking-wide">
              See What <span className="text-burnt-orange">Real Coverage</span> Looks Like
            </h2>
            <p className="text-lg text-text-tertiary mb-10 max-w-lg mx-auto leading-relaxed">
              Start with college baseball — the flagship. Live scores, full box scores,
              standings, analytics, and editorial that goes where ESPN won&apos;t.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/college-baseball"
                className="inline-flex items-center justify-center px-8 py-3.5 rounded-lg
                           bg-burnt-orange text-white font-medium
                           hover:bg-burnt-orange-500 hover:shadow-glow-sm
                           transition-all duration-300 ease-out-expo"
              >
                College Baseball Hub
              </Link>
              <a
                href="mailto:Austin@blazesportsintel.com"
                className="inline-flex items-center justify-center px-8 py-3.5 rounded-lg
                           border border-border text-text-secondary font-medium
                           hover:border-border-strong hover:text-text-primary
                           transition-all duration-300 ease-out-expo"
              >
                Austin@blazesportsintel.com
              </a>
            </div>
          </ScrollReveal>
        </Container>
      </Section>

      <Footer />
    </main>
  );
}
