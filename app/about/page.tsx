'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { HeroGlow } from '@/components/ui/HeroGlow';
import { ScrollReveal } from '@/components/cinematic';
import { Footer } from '@/components/layout-ds/Footer';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background-primary text-text-primary pt-6">
      {/* Hero — product thesis first */}
      <Section className="pt-6 md:pt-10 pb-20 relative overflow-hidden">
        <HeroGlow />
        <Container size="narrow" center className="relative z-10">
          <ScrollReveal>
            <span className="section-label block mb-6">About Blaze Sports Intel</span>
            <h1 className="font-display uppercase text-4xl md:text-5xl lg:text-6xl font-bold mb-10 tracking-wide leading-[1.1]">
              The Game Between{' '}
              <span className="text-burnt-orange">the Poles</span>
            </h1>
            <p className="text-burnt-orange font-serif italic text-xl md:text-2xl leading-relaxed max-w-2xl mx-auto">
              Major platforms paint a black-and-white picture — LeBron vs. MJ,
              Yankees or Dodgers, Cowboys or nothing. BSI exists to leave that
              binary behind. The real game lives in between: college baseball on a
              Tuesday night, a mid-major pitcher nobody scouted, a conference race
              no broadcast window will touch. Five sports. Every game. One person
              building what nobody else would.
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
                  stat: 'Every Game',
                  label: 'Not Just the Top 25',
                  desc: 'Full box scores, live standings, and analytics for every D1 baseball program and every major pro league. The mid-major Tuesday night game covered with the same depth as a primetime showcase.',
                },
                {
                  stat: 'Deep Intel',
                  label: 'Beyond the Box Score',
                  desc: 'Transfer portal tracking, conference strength rankings, and advanced metrics like wOBA and wRC+. The kind of analysis scouts and front offices use — open to every fan.',
                },
                {
                  stat: 'No Filter',
                  label: 'Independent Coverage',
                  desc: 'Every stat shows its source and timestamp. Free access to scores and standings across every sport. Original editorial from someone who actually watches.',
                },
              ].map((card) => (
                <div
                  key={card.stat}
                  className="p-6 rounded-lg bg-background-secondary border border-border-subtle
                             hover:border-border-accent hover:shadow-glow-sm transition-all duration-300 ease-out-expo"
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
                    I grew up watching Tuesday night college baseball games that nobody would
                    talk about the next morning. Not because they weren&apos;t worth watching —
                    a kid from a mid-major program working a two-seam fastball he taught himself
                    off YouTube deserves coverage as much as anyone on ESPN — but because no
                    platform thought the audience was large enough to justify it. The audience
                    was always there. It just never had anywhere to go.
                  </p>
                  <p>
                    I studied international systems at UT Austin — how power structures decide
                    who gets seen and who gets ignored. That framework maps onto sports media
                    with uncomfortable precision: the same forces that determine which countries
                    get a seat at the table determine which programs get a broadcast window,
                    which athletes get scouted, and which markets get written off. A graduate
                    degree in entertainment business sharpened the conviction: this gap
                    isn&apos;t editorial. It&apos;s structural. And structural problems need
                    someone willing to build what closes them.
                  </p>
                  <p>
                    BSI is that build. Every data pipeline, every article, every line of code —
                    written and maintained by one person. Not out of stubbornness, but because
                    the thing I wanted didn&apos;t exist and nobody with a content team and a
                    VC check was going to make it for the fans I had in mind. Five sports, college
                    and pro. Live scores from multiple verified sources. Analytics deeper than a
                    box score. A Wednesday night game between Rice and Sam Houston covered with
                    the same rigor as a Saturday showcase between Tennessee and LSU — because
                    that&apos;s the standard, not the exception.
                  </p>
                  <p className="text-text-primary">
                    The name comes from a dachshund. My first baseball team in Bartlett, Texas
                    was the <span className="text-burnt-orange font-semibold">Blaze</span> —
                    when my family got a dog, I named him after it. Years later, when I needed
                    a name for what I&apos;d been building since I first noticed the gap, Blaze
                    was already there. The people who end up here tend to arrive the same way —
                    they&apos;d been looking for coverage like this. They just didn&apos;t know
                    someone was building it.
                  </p>
                </div>

                {/* The Story — origin narrative */}
                <div className="mt-16 pt-12 border-t border-border-subtle">
                  <p className="text-xs tracking-[0.2em] text-text-muted uppercase mb-3 font-medium">
                    The Story
                  </p>
                  <h3 className="font-display uppercase text-xl md:text-2xl font-bold mb-8 tracking-wide">
                    Memphis Soil, <span className="text-burnt-orange">Texas Roots</span>
                  </h3>
                  <div className="space-y-5 text-text-secondary leading-[1.75]">
                    <p>
                      I was born in Memphis with Texas dirt under the hospital bed. That
                      wasn&apos;t metaphor — my family carried soil from Stephen F. Austin&apos;s
                      gravesite in West Columbia to Baptist Memorial East, a tradition stretching
                      back 127 years. The deliberate act kept the moment from tipping into
                      sentimentality. Heritage chosen rather than accidental.
                    </p>
                    <p>
                      Memphis gave me constraint-based creativity — what happens when resources
                      are limited, when you build inside boundaries. Texas gave the refusal to
                      accept those boundaries as permanent. The analytical instinct that runs
                      through BSI — systems-level thinking, pattern recognition, finding the
                      hidden lever — emerged from holding both at once.
                    </p>
                    <p>
                      I played varsity baseball and football at Boerne-Champion in the Hill
                      Country. Private coaching from Danny Graves (two-time All-Star, first
                      Vietnamese-born MLB player) and Jason Marshall (former UTSA head coach)
                      shaped the scouting eye before I had a name for it. The way a kid reads
                      a pitcher&apos;s release point at fifteen is the same instinct that reads
                      wOBA distributions and conference strength indexes at thirty. The data
                      sharpened something the field started.
                    </p>
                    <p className="text-text-primary">
                      Ricky Williams breaking the NCAA rushing record in 1998 — I was three years
                      old — is the single best emblem of why BSI exists. The moment where sports
                      transcends box scores and becomes something a family passes down. That&apos;s
                      the gap. The connection between what happens on the field and what it means
                      to the people watching. BSI fills it.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </Container>
      </Section>

      {/* CTA */}
      <Section className="py-24 border-t border-border-subtle">
        <Container size="narrow" center>
          <ScrollReveal>
            <h2 className="font-display uppercase text-3xl md:text-4xl font-bold mb-6 tracking-wide">
              Start with <span className="text-burnt-orange">College Baseball</span>
            </h2>
            <p className="text-lg text-text-tertiary mb-10 max-w-lg mx-auto leading-relaxed">
              The flagship. Live scores, full box scores, standings, analytics, and the
              editorial that covers the games nobody else will.
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
    </div>
  );
}
