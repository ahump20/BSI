'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ScrollReveal } from '@/components/cinematic';

/* ─────────────────────────────────────────────
   Photo-driven origin story — Heritage v2.1
   ───────────────────────────────────────────── */

interface StorySection {
  stamp: string;
  heading: string;
  headingAccent?: string;
  photo: string;
  alt: string;
  photoW: number;
  photoH: number;
  paragraphs: string[];
}

const originSections: StorySection[] = [
  {
    stamp: 'The Beginning',
    heading: 'Before the data, ',
    headingAccent: 'the diamond',
    photo: '/images/austin-dad-baseball.webp',
    alt: 'Young Austin with his dad, bat and glove in hand',
    photoW: 400,
    photoH: 500,
    paragraphs: [
      'Austin grew up immersed in sports. Before he understood exit velocity or launch angle, he understood the feeling of standing in a batter\u2019s box \u2014 the dirt under your cleats, the way the pitcher looks bigger from sixty feet away, the sound a bat makes when you catch one clean.',
      'The analytical instinct came later. The love for the game came first.',
    ],
  },
  {
    stamp: 'Texas Roots',
    heading: 'Born into ',
    headingAccent: 'the game',
    photo: '/images/austin-childhood-longhorns.webp',
    alt: 'Toddler Austin in Texas Longhorns gear',
    photoW: 400,
    photoH: 500,
    paragraphs: [
      'Born in Memphis with Texas soil under the hospital bed \u2014 literally. His family carried dirt from Stephen F. Austin\u2019s gravesite to Baptist Memorial East, a tradition stretching back 127 years. Heritage chosen rather than accidental.',
      'The obsession with sports predates the analytics by decades. Texas gave the refusal to accept boundaries as permanent. Memphis gave constraint-based creativity \u2014 what happens when resources are limited and you build inside them anyway.',
    ],
  },
  {
    stamp: 'Friday Night Lights',
    heading: 'Chargers ',
    headingAccent: '#20',
    photo: '/images/austin-football-action.webp',
    alt: 'Austin Humphrey as Chargers #20, running with the football under Friday night lights',
    photoW: 400,
    photoH: 300,
    paragraphs: [
      'Hill Country varsity football \u2014 the kind of program that never gets a broadcast window. Austin played at Boerne-Champion, competed in the Texas Hill Country, and saw firsthand what it meant to be invisible to the national conversation.',
      'Private coaching from Danny Graves (two-time MLB All-Star, first Vietnamese-born MLB player) and Jason Marshall (former UTSA head coach) shaped the scouting eye before he had a name for it. The way a kid reads a pitcher\u2019s release point at fifteen is the same instinct that reads wOBA distributions at thirty.',
    ],
  },
  {
    stamp: 'The Namesake',
    heading: 'Blaze ',
    headingAccent: 'the original',
    photo: '/images/blaze-and-austin.webp',
    alt: 'Austin with Blaze the dachshund \u2014 the mascot, the namesake',
    photoW: 400,
    photoH: 400,
    paragraphs: [
      'Blaze the dachshund. The mascot, the namesake, the reason you\u2019re looking at a fire-breathing wiener dog logo. Austin\u2019s first baseball team in Bartlett, Texas was the Blaze \u2014 when his family got a dog, he named him after it.',
      'Years later, when he needed a name for what he\u2019d been building since he first noticed the coverage gap, Blaze was already there. Some brands are manufactured. This one was inherited.',
    ],
  },
];

export default function AboutPage() {
  return (
    <div
      className="min-h-screen grain-overlay bg-surface-scoreboard text-bsi-bone"
    >
      {/* ═══════════ HERO ═══════════ */}
      <section
        className="relative overflow-hidden"
        style={{
          paddingTop: 'clamp(4rem, 8vw, 7rem)',
          paddingBottom: 'clamp(3rem, 6vw, 5rem)',
        }}
      >
        {/* R2 stadium photograph — visible atmosphere, not decoration */}
        <img
          src="/api/assets/images/blaze-stadium-hero.png"
          alt=""
          aria-hidden="true"
          loading="eager"
          decoding="async"
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          style={{ opacity: 0.2 }}
        />

        {/* Gradient: dark edges, slightly transparent center to show stadium */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `linear-gradient(
              to bottom,
              rgba(10,10,10,0.55) 0%,
              rgba(10,10,10,0.3) 40%,
              rgba(10,10,10,0.5) 70%,
              var(--surface-scoreboard) 100%
            )`,
          }}
        />

        {/* R2 brand grid watermark — subtle but present on desktop */}
        <img
          src="/api/assets/brand/bsi-brand-grid.png"
          alt=""
          aria-hidden="true"
          loading="eager"
          decoding="async"
          className="absolute pointer-events-none hidden lg:block"
          style={{
            width: '500px',
            right: '-80px',
            top: '50%',
            transform: 'translateY(-50%)',
            opacity: 0.04,
          }}
        />

        {/* Burnt-orange warmth + vignette */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse 50% 55% at 50% 35%, rgba(191,87,0,0.12) 0%, transparent 70%)',
          }}
        />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse 90% 90% at 50% 50%, transparent 40%, rgba(0,0,0,0.5) 100%)',
          }}
        />

        {/* Grain */}
        <div className="absolute inset-0 pointer-events-none grain-overlay" style={{ opacity: 0.3 }} />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <ScrollReveal>
            {/* Shield logo */}
            <div className="flex justify-center mb-8">
              <div className="relative w-[180px] h-[180px] md:w-[200px] md:h-[200px]">
                <Image
                  src="/images/brand/bsi-logo-primary.webp"
                  alt="Blaze Sports Intel shield"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
            </div>

            <h1
              className="font-bold uppercase tracking-tight leading-none mb-6"
              style={{
                fontFamily: 'var(--bsi-font-display-hero)',
                fontSize: 'clamp(2.5rem, 7vw, 5rem)',
                color: 'var(--bsi-bone)',
                textShadow: '2px 2px 0px rgba(0,0,0,0.5)',
              }}
            >
              The Game Between{' '}
              <span className="text-bsi-primary">the Poles</span>
            </h1>

            <div className="flex justify-center mb-8">
              <div
                className="w-16 h-[2px]"
                style={{ background: 'var(--bsi-primary)', opacity: 0.6 }}
              />
            </div>

            <p
              className="font-serif italic text-lg md:text-xl leading-relaxed max-w-2xl mx-auto text-bsi-dust"
            >
              Major platforms paint a black-and-white picture &mdash; LeBron vs.
              MJ, Yankees or Dodgers, Cowboys or nothing. BSI exists to leave that
              binary behind. The real game lives in between: college baseball on a
              Tuesday night, a mid-major pitcher nobody scouted, a conference race
              no broadcast window will touch.
            </p>
          </ScrollReveal>

          {/* Desktop corner marks */}
          <div className="corner-marks hidden md:block" aria-hidden="true" />
        </div>
      </section>

      {/* ═══════════ ORIGIN STORY SECTIONS ═══════════ */}
      {originSections.map((section, i) => {
        const photoLeft = i % 2 === 0;
        return (
          <section
            key={section.stamp}
            className="relative"
            style={{
              padding: 'clamp(3rem, 6vw, 5rem) 0',
              background: i % 2 === 0 ? 'var(--surface-scoreboard)' : 'var(--surface-dugout)',
            }}
          >
            {/* Top border line */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[rgba(191,87,0,0.15)] to-transparent" />

            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
              <ScrollReveal delay={i * 80}>
                <div
                  className={`flex flex-col ${
                    photoLeft ? 'md:flex-row' : 'md:flex-row-reverse'
                  } gap-8 md:gap-14 items-center`}
                >
                  {/* Photo */}
                  <div className="w-full md:w-[45%] flex-shrink-0">
                    <div
                      className="relative overflow-hidden transition-all duration-500 group"
                      style={{
                        border: '1px solid var(--border-vintage)',
                        borderRadius: '2px',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = 'rgba(191,87,0,0.5)';
                        e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.4), 0 0 20px rgba(191,87,0,0.08)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'rgba(140,98,57,0.3)';
                        e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.3)';
                      }}
                    >
                      <Image
                        src={section.photo}
                        alt={section.alt}
                        width={section.photoW}
                        height={section.photoH}
                        className="w-full h-auto block transition-transform duration-700 group-hover:scale-[1.02]"
                        sizes="(max-width: 768px) 100vw, 45vw"
                      />
                      {/* Warm overlay on hover */}
                      <div
                        className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                        style={{
                          background:
                            'linear-gradient(180deg, rgba(191,87,0,0.08) 0%, transparent 50%)',
                        }}
                      />
                    </div>
                  </div>

                  {/* Copy */}
                  <div className="flex-1">
                    <span className="heritage-stamp mb-3">{section.stamp}</span>
                    <h2
                      className="mt-3 font-bold uppercase tracking-wide mb-6"
                      style={{
                        fontFamily: 'var(--bsi-font-display)',
                        fontSize: 'clamp(1.5rem, 3vw, 2.25rem)',
                        color: 'var(--bsi-bone)',
                      }}
                    >
                      {section.heading}
                      {section.headingAccent && (
                        <span className="text-bsi-primary">
                          {section.headingAccent}
                        </span>
                      )}
                    </h2>
                    <div
                      className="space-y-4 leading-[1.8] font-serif text-bsi-dust"
                    >
                      {section.paragraphs.map((p, j) => (
                        <p key={j}>{p}</p>
                      ))}
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            </div>
          </section>
        );
      })}

      {/* ═══════════ WHAT BSI DOES ═══════════ */}
      <section
        className="relative"
        style={{
          padding: 'clamp(4rem, 8vw, 6rem) 0',
          background: 'var(--surface-press-box)',
        }}
      >
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[rgba(191,87,0,0.15)] to-transparent" />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <div className="text-center mb-12">
              <span className="heritage-stamp mb-4">The Platform</span>
              <h2
                className="mt-4 font-bold uppercase tracking-wide"
                style={{
                  fontFamily: 'var(--bsi-font-display)',
                  fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
                  color: 'var(--bsi-bone)',
                }}
              >
                330 D1 Programs.{' '}
                <span className="text-bsi-primary">Every Game.</span>
              </h2>
              <p
                className="mt-4 font-serif italic text-base md:text-lg max-w-2xl mx-auto leading-relaxed text-bsi-dust"
              >
                Park-adjusted sabermetrics. Every conference, every Tuesday night
                mid-major matchup that nobody else covers. The same analytical depth
                that scouts and front offices use &mdash; open to every fan.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-5">
              {[
                {
                  metric: 'wOBA / wRC+ / FIP',
                  label: 'Advanced Sabermetrics',
                  desc: 'Park-adjusted, conference-weighted advanced metrics recomputed every 6 hours. Not retrosheet approximations \u2014 live formulas running against real box scores.',
                },
                {
                  metric: '40+ API Routes',
                  label: 'Live Data Engine',
                  desc: 'Scores, standings, rankings, team profiles, player analytics, and AI-powered scouting reports. Every response tagged with source and timestamp.',
                },
                {
                  metric: '5 Sports, 1 Builder',
                  label: 'Original Coverage',
                  desc: 'College baseball, MLB, NFL, NBA, and college football. Every pipeline, every article, every line of code built end to end by one person.',
                },
              ].map((card) => (
                <div
                  key={card.metric}
                  className="heritage-card p-6 transition-all duration-300 hover:-translate-y-1"
                  style={{ borderTop: '2px solid var(--bsi-primary)' }}
                >
                  <div
                    className="font-bold text-xl mb-1"
                    style={{
                      fontFamily: 'var(--font-mono, monospace)',
                      color: 'var(--bsi-primary)',
                      letterSpacing: '0.02em',
                    }}
                  >
                    {card.metric}
                  </div>
                  <p
                    className="text-xs uppercase tracking-[0.15em] mb-3 font-medium"
                    style={{
                      fontFamily: 'var(--bsi-font-display)',
                      color: 'var(--bsi-dust)',
                    }}
                  >
                    {card.label}
                  </p>
                  <p
                    className="text-sm leading-relaxed font-serif text-bsi-dust"
                  >
                    {card.desc}
                  </p>
                </div>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ═══════════ AUSTIN — THE BUILDER ═══════════ */}
      <section
        className="relative"
        style={{
          padding: 'clamp(4rem, 8vw, 6rem) 0',
          background: 'var(--surface-scoreboard)',
        }}
      >
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[rgba(191,87,0,0.15)] to-transparent" />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <div className="flex flex-col md:flex-row gap-10 md:gap-16 items-start">
              {/* Headshot */}
              <div className="w-full md:w-[280px] flex-shrink-0 flex justify-center md:justify-start">
                <div
                  className="relative overflow-hidden transition-colors duration-300"
                  style={{
                    border: '1px solid var(--border-vintage)',
                    borderRadius: '2px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                    width: '260px',
                  }}
                >
                  <Image
                    src="/images/austin-headshot.webp"
                    alt="Austin Humphrey"
                    width={260}
                    height={347}
                    className="w-full h-auto block"
                    priority
                  />
                  <div
                    className="absolute -inset-px pointer-events-none"
                    style={{
                      background:
                        'linear-gradient(180deg, rgba(191,87,0,0.08) 0%, transparent 40%)',
                    }}
                  />
                </div>
              </div>

              {/* Bio */}
              <div className="flex-1">
                <span className="heritage-stamp mb-3">The Builder</span>
                <h2
                  className="mt-3 font-bold uppercase tracking-wide mb-6"
                  style={{
                    fontFamily: 'var(--bsi-font-display)',
                    fontSize: 'clamp(1.5rem, 3vw, 2rem)',
                    color: 'var(--bsi-bone)',
                  }}
                >
                  Austin Humphrey
                </h2>

                <div
                  className="space-y-4 leading-[1.75] font-serif text-bsi-dust"
                >
                  <p>
                    The coverage I wanted didn&apos;t exist. Not because the audience
                    wasn&apos;t there &mdash; a mid-major kid working a two-seam
                    fastball he taught himself off YouTube deserves the same depth as
                    anyone on a prime-time broadcast &mdash; but because every platform
                    with the resources to build it decided that audience wasn&apos;t
                    worth the investment. They were wrong.
                  </p>
                  <p>
                    I played varsity baseball and football in the Texas Hill Country.
                    Studied international systems and entertainment business at UT
                    Austin &mdash; how power structures decide who gets seen and who
                    gets ignored. That framework maps onto sports media with
                    uncomfortable precision: the same forces that determine which
                    countries get a seat at the table determine which programs get a
                    broadcast window. The gap isn&apos;t editorial. It&apos;s
                    structural.
                  </p>
                  <p>
                    M.S. from Full Sail University (3.77 GPA). Background at Spectrum
                    Reach. Every data pipeline, every article, every line of code
                    &mdash; one person, end to end. Not out of stubbornness, but
                    because nobody with a content team and a VC check was going to make
                    this for the fans I had in mind.
                  </p>
                  <p className="text-bsi-bone">
                    A Wednesday night game between Rice and Sam Houston covered with the
                    same rigor as a Saturday showcase between Tennessee and LSU.
                    That&apos;s the standard, not the exception.
                  </p>
                </div>

                <div className="mt-8 flex flex-wrap gap-4 items-center">
                  <a
                    href="https://austinhumphrey.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-heritage px-6 py-2.5 text-sm"
                  >
                    austinhumphrey.com
                  </a>
                  <a
                    href="mailto:Austin@blazesportsintel.com"
                    className="text-sm font-serif transition-colors duration-200 text-heritage-columbia"
                  >
                    Austin@blazesportsintel.com
                  </a>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ═══════════ BRAND CREDIBILITY FOOTER ═══════════ */}
      <section
        className="relative overflow-hidden"
        style={{
          padding: 'clamp(4rem, 8vw, 5rem) 0',
          background: 'var(--surface-dugout)',
        }}
      >
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[rgba(191,87,0,0.15)] to-transparent" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <ScrollReveal>
            {/* Wordmark */}
            <div className="flex justify-center mb-6">
              <Image
                src="/brand/blaze-wordmark-wide.png"
                alt="Blaze Sports Intel"
                width={280}
                height={48}
                className="opacity-80"
              />
            </div>

            <p
              className="font-serif italic text-sm tracking-wide mb-10 text-bsi-primary opacity-85"
            >
              Born to Blaze the Path Beaten Less
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
              <Link
                href="/college-baseball"
                className="btn-heritage-fill px-8 py-3 text-sm"
              >
                College Baseball
              </Link>
              <Link href="/scores" className="btn-heritage px-8 py-3 text-sm">
                Live Scores
              </Link>
              <Link
                href="/college-baseball/savant"
                className="btn-heritage px-8 py-3 text-sm"
              >
                BSI Savant
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>

    </div>
  );
}
