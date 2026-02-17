'use client';

import { useState, FormEvent } from 'react';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ScrollReveal } from '@/components/cinematic';
import { Footer } from '@/components/layout-ds/Footer';

const colors = {
  dirt: '#3E2C1C',
  clay: '#C4703F',
  chalk: '#F5F0E8',
  chalkDim: '#E8E0D2',
  field: '#2D5A27',
  fieldDark: '#1A3A16',
  midnight: '#111111',
  gold: '#D4A843',
  hotCoral: '#FF4D4D',
};

const painPoints = [
  {
    title: 'No Certification Filters',
    description:
      'ASA, USSSA, ISA, Senior — you need to know your league\'s stamp before you buy. Generic platforms don\'t even know what that means.',
  },
  {
    title: 'Zero Seller Accountability',
    description:
      'No ratings, no transaction history, no recourse. Just a profile picture and a promise the barrel isn\'t cracked.',
  },
  {
    title: 'Buried Listings',
    description:
      'Good gear sells in minutes. If you aren\'t refreshing the group feed constantly, you\'re already too late.',
  },
];

const features = [
  {
    icon: '⚾',
    title: 'Filter by What Matters',
    description:
      'Certification stamp, barrel length, swing weight, flex rating, condition. Search the way you actually shop for gear.',
  },
  {
    icon: '🛡️',
    title: 'Verified Seller Profiles',
    description:
      'Transaction history, buyer reviews, and a reputation score built on completed sales — not likes.',
  },
  {
    icon: '📲',
    title: 'Instant Drop Alerts',
    description:
      'Set saved searches and get notified the second a matching listing goes live. No more refreshing feeds.',
  },
  {
    icon: '💬',
    title: 'Offer & Negotiate',
    description:
      'Make offers, counter, and close deals inside the platform. Real-time messaging with read receipts.',
  },
  {
    icon: '📦',
    title: 'Integrated Shipping',
    description:
      'Pre-calculated rates, printable labels, and tracking built in. No more DMing about "how much to ship to Florida."',
  },
  {
    icon: '🔒',
    title: 'Buyer Protection',
    description:
      'Escrow-style payment holds until the buyer confirms delivery and condition. If it\'s not as described, you\'re covered.',
  },
];

const categories = [
  { name: 'Bats', subtitle: 'Slowpitch bats, all stamps' },
  { name: 'Gloves', subtitle: 'Infield, outfield, catcher' },
  { name: 'Uniforms', subtitle: 'Jerseys, pants, socks' },
  { name: 'Equipment', subtitle: 'Bags, cages, machines' },
  { name: 'Cleats', subtitle: 'Molded, metal, turfs' },
  { name: 'Protection', subtitle: 'Masks, guards, wraps' },
  { name: 'Packages', subtitle: 'Full kits, bundles' },
];

const stats = [
  { value: '2,400+', label: 'Waitlist Signups' },
  { value: '$340', label: 'Avg. Bat Price' },
  { value: '52%', label: 'Buy Used First' },
];

export default function YardSalePage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const response = await fetch('/api/lead', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'Yard Sale Waitlist Signup',
          email: trimmedEmail,
          sport: 'slowpitch-softball',
          source: 'yardsale-waitlist',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to join waitlist.');
      }

      setSubmitted(true);
      setEmail('');
    } catch (_error) {
      setSubmitError('We could not save your signup. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main id="main-content" className="min-h-screen" style={{ background: colors.midnight, color: colors.chalk }}>
      {/* ═══ HERO ═══ */}
      <Section className="relative min-h-screen flex flex-col justify-center overflow-hidden" padding="none">
        {/* Background gradients */}
        <div
          className="absolute inset-0 z-0"
          style={{
            background: `
              radial-gradient(ellipse 80% 60% at 70% 40%, rgba(196,112,63,0.12) 0%, transparent 70%),
              radial-gradient(ellipse 50% 50% at 20% 80%, rgba(45,90,39,0.10) 0%, transparent 60%),
              linear-gradient(180deg, ${colors.midnight} 0%, #1a1510 50%, ${colors.midnight} 100%)
            `,
          }}
        />
        <Container className="relative z-10 py-20">
          <div className="max-w-4xl mx-auto text-center">
            <ScrollReveal>
              <Badge variant="accent" className="mb-6">
                The Softball Marketplace
              </Badge>
            </ScrollReveal>
            <ScrollReveal delay={200}>
              <h1
                className="font-display uppercase leading-[0.9] tracking-tight mb-4"
                style={{ fontSize: 'clamp(4rem, 12vw, 9rem)' }}
              >
                YARD
                <span
                  className="block"
                  style={{
                    background: `linear-gradient(135deg, ${colors.clay}, ${colors.gold})`,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  SALE
                </span>
              </h1>
            </ScrollReveal>
            <ScrollReveal delay={400}>
              <p
                className="text-lg md:text-xl max-w-xl mx-auto mb-8 leading-relaxed"
                style={{ color: colors.chalkDim }}
              >
                Buy, sell, and trade slow pitch softball gear with players who actually know what a
                26oz endload hits like.
              </p>
            </ScrollReveal>
            <ScrollReveal delay={600}>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  href="#waitlist"
                  size="lg"
                  style={{
                    background: `linear-gradient(135deg, ${colors.clay}, #D4803F)`,
                    color: colors.midnight,
                    boxShadow: '0 4px 24px rgba(196,112,63,0.3)',
                  }}
                >
                  Join the Waitlist
                </Button>
                <Button href="#how" variant="outline" size="lg">
                  How It Works
                </Button>
              </div>
            </ScrollReveal>
          </div>
        </Container>

        {/* Scroll indicator */}
        <ScrollReveal delay={1000} className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10">
          <div className="flex flex-col items-center gap-2">
            <span
              className="text-[0.7rem] uppercase tracking-[3px]"
              style={{ color: 'rgba(245,240,232,0.3)' }}
            >
              Scroll
            </span>
            <div
              className="w-px h-10 animate-pulse"
              style={{
                background: `linear-gradient(to bottom, ${colors.clay}, transparent)`,
              }}
            />
          </div>
        </ScrollReveal>
      </Section>

      {/* ═══ THE PROBLEM ═══ */}
      <section
        className="py-16 md:py-24"
        style={{ background: `linear-gradient(180deg, ${colors.midnight} 0%, #151210 100%)` }}
      >
        <Container>
          <ScrollReveal>
            <span
              className="font-display text-xs uppercase tracking-[4px] block mb-6"
              style={{ color: colors.clay }}
            >
              The Problem
            </span>
            <h2
              className="font-display uppercase text-3xl md:text-4xl lg:text-5xl leading-tight max-w-2xl mb-6"
              style={{ color: colors.chalk }}
            >
              Buying Softball Gear Shouldn&apos;t Feel Like Digging Through a Garage
            </h2>
            <p
              className="text-lg leading-relaxed max-w-xl mb-10"
              style={{ color: colors.chalkDim }}
            >
              You&apos;re scrolling through Facebook groups, sifting past fishing rods and golf clubs
              for that one Miken Freak post buried under 200 comments. There&apos;s no way to filter
              by stamp, no seller ratings, and you&apos;re Venmoing strangers on faith.
            </p>
          </ScrollReveal>

          <div className="grid md:grid-cols-3 gap-6">
            {painPoints.map((pain, i) => (
              <ScrollReveal key={pain.title} delay={i * 100}>
                <Card
                  className="h-full relative overflow-hidden transition-all duration-300 hover:bg-white/[0.04]"
                  style={{ borderLeft: `3px solid ${colors.hotCoral}` }}
                >
                  <CardContent className="p-6">
                    <h3 className="font-semibold text-white mb-3">{pain.title}</h3>
                    <p className="text-sm leading-relaxed" style={{ color: 'rgba(245,240,232,0.55)' }}>
                      {pain.description}
                    </p>
                  </CardContent>
                </Card>
              </ScrollReveal>
            ))}
          </div>
        </Container>
      </section>

      {/* ═══ FEATURES ═══ */}
      <Section
        id="how"
        className="relative py-16 md:py-24"
        padding="none"
        borderTop
      >
        <div
          className="absolute top-0 left-0 right-0 h-px"
          style={{
            background: `linear-gradient(90deg, transparent, rgba(196,112,63,0.3), transparent)`,
          }}
        />
        <Container>
          <ScrollReveal>
            <span
              className="font-display text-xs uppercase tracking-[4px] block mb-6"
              style={{ color: colors.clay }}
            >
              Built for the Diamond
            </span>
            <h2
              className="font-display uppercase text-3xl md:text-4xl lg:text-5xl leading-tight max-w-xl mb-10"
              style={{ color: colors.chalk }}
            >
              Every Feature Exists Because a Player Asked for It
            </h2>
          </ScrollReveal>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <ScrollReveal key={feature.title} delay={i * 100}>
                <Card
                  variant="hover"
                  className="h-full transition-all duration-300 hover:-translate-y-1"
                >
                  <CardContent className="p-6 md:p-8">
                    <div
                      className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl mb-5"
                      style={{
                        background: 'rgba(196,112,63,0.1)',
                        border: '1px solid rgba(196,112,63,0.15)',
                      }}
                    >
                      {feature.icon}
                    </div>
                    <h3 className="font-semibold text-white mb-3">{feature.title}</h3>
                    <p className="text-sm leading-relaxed" style={{ color: 'rgba(245,240,232,0.5)' }}>
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              </ScrollReveal>
            ))}
          </div>
        </Container>
      </Section>

      {/* ═══ CATEGORIES ═══ */}
      <Section className="py-16 md:py-24" padding="none" background="midnight">
        <Container>
          <ScrollReveal>
            <span
              className="font-display text-xs uppercase tracking-[4px] block mb-6"
              style={{ color: colors.clay }}
            >
              Browse Gear
            </span>
            <h2
              className="font-display uppercase text-3xl md:text-4xl lg:text-5xl leading-tight mb-3"
              style={{ color: colors.chalk }}
            >
              Everything Between the Lines
            </h2>
            <p className="text-base mb-10 max-w-lg" style={{ color: colors.chalkDim }}>
              From game-ready bats to broken-in gloves, every category is built around how
              softball players actually search.
            </p>
          </ScrollReveal>

          <ScrollReveal delay={200}>
            <div
              className="flex gap-4 overflow-x-auto pb-4"
              style={{
                scrollbarWidth: 'thin',
                scrollbarColor: `${colors.clay} transparent`,
              }}
            >
              {categories.map((cat) => (
                <div
                  key={cat.name}
                  className="flex-shrink-0 px-6 py-5 rounded transition-all duration-200"
                  style={{
                    border: '1px solid rgba(245,240,232,0.08)',
                    background: 'rgba(245,240,232,0.03)',
                  }}
                >
                  <div
                    className="font-display uppercase tracking-wider font-semibold text-sm"
                    style={{ color: colors.chalk }}
                  >
                    {cat.name}
                  </div>
                  <div
                    className="text-xs mt-1"
                    style={{ color: 'rgba(245,240,232,0.35)' }}
                  >
                    {cat.subtitle}
                  </div>
                </div>
              ))}
            </div>
          </ScrollReveal>
        </Container>
      </Section>

      {/* ═══ TRUST / SOCIAL PROOF ═══ */}
      <Section className="relative py-16 md:py-20 text-center" padding="none">
        <div
          className="absolute top-0 left-0 right-0 h-px"
          style={{
            background: 'linear-gradient(90deg, transparent, rgba(245,240,232,0.08), transparent)',
          }}
        />
        <Container>
          <ScrollReveal>
            <div className="flex flex-wrap justify-center gap-10 md:gap-16 mb-10">
              {stats.map((stat) => (
                <div key={stat.label} className="text-center">
                  <div
                    className="font-display leading-none"
                    style={{ fontSize: 'clamp(2.5rem, 6vw, 3.5rem)', color: colors.clay }}
                  >
                    {stat.value}
                  </div>
                  <div
                    className="text-xs uppercase tracking-wider mt-2"
                    style={{ color: 'rgba(245,240,232,0.4)' }}
                  >
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </ScrollReveal>

          <ScrollReveal delay={200}>
            <blockquote
              className="text-lg md:text-xl italic max-w-lg mx-auto leading-relaxed"
              style={{ color: colors.chalkDim }}
            >
              &ldquo;I&apos;ve spent more time searching Facebook for a 27oz Monsta than I have at
              batting practice. We need this.&rdquo;
              <cite
                className="block not-italic text-sm mt-4 uppercase tracking-wider"
                style={{ color: 'rgba(245,240,232,0.35)' }}
              >
                — D-League rec player, Dallas TX
              </cite>
            </blockquote>
          </ScrollReveal>
        </Container>
      </Section>

      {/* ═══ FINAL CTA — WAITLIST ═══ */}
      <Section
        id="waitlist"
        className="relative py-20 md:py-32 text-center overflow-hidden"
        padding="none"
      >
        <div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(ellipse 60% 50% at 50% 50%, rgba(196,112,63,0.08) 0%, transparent 70%), ${colors.midnight}`,
          }}
        />
        <Container className="relative z-10">
          <ScrollReveal>
            <h2
              className="font-display uppercase leading-[0.95] mb-5"
              style={{
                fontSize: 'clamp(2.5rem, 7vw, 5rem)',
                color: colors.chalk,
              }}
            >
              Get First Access
            </h2>
            <p
              className="text-lg max-w-md mx-auto mb-8 leading-relaxed"
              style={{ color: colors.chalkDim }}
            >
              We&apos;re launching soon. Waitlist members get early access, zero listing fees for
              the first 90 days, and a say in what we build next.
            </p>

            {submitted ? (
              <div
                className="inline-flex items-center gap-2 px-8 py-4 rounded text-lg font-semibold"
                style={{ background: colors.field, color: colors.chalk }}
              >
                You&apos;re In ✓
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="flex flex-col sm:flex-row gap-0 max-w-md mx-auto rounded overflow-hidden"
                style={{ border: '1px solid rgba(245,240,232,0.1)' }}
              >
                <input
                  type="email"
                  placeholder="your@email.com"
                  required
                  aria-label="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 px-5 py-4 bg-white/[0.04] border-none text-base outline-none focus:bg-white/[0.07] transition-colors"
                  style={{
                    color: colors.chalk,
                    fontFamily: 'inherit',
                  }}
                />
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-4 font-display uppercase text-sm tracking-wider font-semibold border-none cursor-pointer transition-colors hover:opacity-90"
                  style={{
                    background: colors.clay,
                    color: colors.midnight,
                    opacity: isSubmitting ? 0.7 : 1,
                  }}
                >
                  {isSubmitting ? 'Submitting...' : 'Count Me In'}
                </button>
              </form>
            )}

            {submitError && (
              <p className="text-xs mt-3" style={{ color: colors.hotCoral }}>
                {submitError}
              </p>
            )}

            <p
              className="text-xs mt-4"
              style={{ color: 'rgba(245,240,232,0.25)' }}
            >
              No spam. Just a heads-up when the gates open.
            </p>
          </ScrollReveal>
        </Container>
      </Section>

      <Footer />
    </main>
  );
}
