'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ScrollReveal } from '@/components/cinematic';
import { Footer } from '@/components/layout-ds/Footer';

export default function AboutPage() {
  return (
    <div className="min-h-screen grain-overlay" style={{ background: 'var(--surface-scoreboard)', color: 'var(--bsi-bone)' }}>
      {/* Hero — product thesis first */}
      <section className="relative overflow-hidden" style={{ paddingTop: 'clamp(3rem, 6vw, 5rem)', paddingBottom: 'clamp(4rem, 8vw, 6rem)' }}>
        {/* Ember glow */}
        <div
          className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at 50% 40%, rgba(191, 87, 0, 0.06) 0%, transparent 60%)' }}
          aria-hidden="true"
        />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <ScrollReveal>
            <span className="heritage-stamp mb-6">About Blaze Sports Intel</span>
            <h1
              className="mt-4 font-bold uppercase tracking-tight leading-none mb-6"
              style={{
                fontFamily: 'var(--bsi-font-display-hero)',
                fontSize: 'clamp(2.5rem, 6vw, 4.5rem)',
                color: 'var(--bsi-bone)',
                textShadow: '2px 2px 0px rgba(0,0,0,0.5)',
              }}
            >
              The Game Between{' '}
              <span style={{ color: 'var(--bsi-primary)' }}>the Poles</span>
            </h1>

            <div className="flex justify-center mb-8">
              <div className="section-rule-thick w-16" />
            </div>

            <p className="font-serif italic text-lg md:text-xl leading-relaxed max-w-2xl mx-auto" style={{ color: 'var(--bsi-dust)' }}>
              Major platforms paint a black-and-white picture — LeBron vs. MJ,
              Yankees or Dodgers, Cowboys or nothing. BSI exists to leave that
              binary behind. The real game lives in between: college baseball on a
              Tuesday night, a mid-major pitcher nobody scouted, a conference race
              no broadcast window will touch. Five sports. Every game. One person
              building what nobody else would.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* What BSI does — evidence strip */}
      <section
        className="relative surface-lifted"
        style={{ padding: 'clamp(3rem, 6vw, 5rem) 0' }}
      >
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[rgba(191,87,0,0.15)] to-transparent" />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <div className="grid md:grid-cols-3 gap-5">
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
                  className="heritage-card p-6 transition-all duration-300 hover:-translate-y-1"
                  style={{ borderTop: '2px solid var(--bsi-primary)' }}
                >
                  <div
                    className="font-bold text-3xl mb-2"
                    style={{ fontFamily: 'var(--bsi-font-display)', color: 'var(--bsi-primary)' }}
                  >
                    {card.stat}
                  </div>
                  <p className="text-xs uppercase tracking-[0.15em] mb-3 font-medium" style={{ color: 'var(--bsi-dust)' }}>
                    {card.label}
                  </p>
                  <p className="text-sm leading-relaxed font-serif" style={{ color: 'var(--bsi-dust)' }}>{card.desc}</p>
                </div>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* The builder */}
      <section
        className="relative"
        style={{ padding: 'clamp(4rem, 8vw, 6rem) 0', background: 'var(--surface-scoreboard)' }}
      >
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[rgba(191,87,0,0.15)] to-transparent" />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
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
                    className="border"
                    style={{ borderColor: 'var(--border-vintage)' }}
                    priority
                  />
                  <div
                    className="absolute -inset-px pointer-events-none"
                    style={{
                      background: 'linear-gradient(180deg, rgba(191,87,0,0.08) 0%, transparent 40%)',
                    }}
                  />
                </div>
              </div>

              {/* Story */}
              <div className="md:col-span-3">
                <span className="heritage-stamp mb-3">The Builder</span>
                <h2
                  className="mt-3 font-bold uppercase tracking-wide mb-8"
                  style={{ fontFamily: 'var(--bsi-font-display)', fontSize: 'clamp(1.5rem, 3vw, 2rem)', color: 'var(--bsi-bone)' }}
                >
                  Austin Humphrey
                </h2>

                <div className="space-y-5 leading-[1.75] font-serif" style={{ color: 'var(--bsi-dust)' }}>
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
                  <p style={{ color: 'var(--bsi-bone)' }}>
                    The name comes from a dachshund. My first baseball team in Bartlett, Texas
                    was the <span style={{ color: 'var(--bsi-primary)', fontWeight: 600 }}>Blaze</span> —
                    when my family got a dog, I named him after it. Years later, when I needed
                    a name for what I&apos;d been building since I first noticed the gap, Blaze
                    was already there. The people who end up here tend to arrive the same way —
                    they&apos;d been looking for coverage like this. They just didn&apos;t know
                    someone was building it.
                  </p>
                </div>

                {/* The Story — origin narrative */}
                <div className="mt-16 pt-12" style={{ borderTop: '1px solid var(--border-vintage)' }}>
                  <span className="heritage-stamp mb-3">The Story</span>
                  <h3
                    className="mt-3 font-bold uppercase tracking-wide mb-8"
                    style={{ fontFamily: 'var(--bsi-font-display)', fontSize: 'clamp(1.25rem, 2.5vw, 1.75rem)', color: 'var(--bsi-bone)' }}
                  >
                    Memphis Soil, <span style={{ color: 'var(--bsi-primary)' }}>Texas Roots</span>
                  </h3>
                  <div className="space-y-5 leading-[1.75] font-serif" style={{ color: 'var(--bsi-dust)' }}>
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
                    <p style={{ color: 'var(--bsi-bone)' }}>
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
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden" style={{ padding: 'clamp(4rem, 8vw, 6rem) 0', background: 'var(--surface-dugout)' }}>
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[rgba(191,87,0,0.15)] to-transparent" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <ScrollReveal>
            {/* BSI shield */}
            <div className="flex justify-center mb-6">
              <div className="relative w-[56px] h-[56px]">
                <Image
                  src="/images/brand/bsi-mascot-200.png"
                  alt="Blaze Sports Intel"
                  fill
                  className="object-contain opacity-80"
                />
              </div>
            </div>

            <h2
              className="font-bold uppercase tracking-wide mb-6"
              style={{ fontFamily: 'var(--bsi-font-display)', fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', color: 'var(--bsi-bone)' }}
            >
              Start with <span style={{ color: 'var(--bsi-primary)' }}>College Baseball</span>
            </h2>
            <p className="text-base mb-10 max-w-lg mx-auto leading-relaxed font-serif" style={{ color: 'var(--bsi-dust)' }}>
              The flagship. Live scores, full box scores, standings, analytics, and the
              editorial that covers the games nobody else will.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Link href="/college-baseball" className="btn-heritage-fill px-8 py-3.5 text-base">
                College Baseball Hub
              </Link>
              <a
                href="mailto:Austin@blazesportsintel.com"
                className="btn-heritage px-8 py-3.5 text-base"
              >
                Austin@blazesportsintel.com
              </a>
            </div>

            <p className="font-serif italic text-sm tracking-wide" style={{ color: 'var(--bsi-primary)', opacity: 0.7 }}>
              Born to Blaze the Path Beaten Less
            </p>
          </ScrollReveal>
        </div>
      </section>

      <Footer />
    </div>
  );
}
