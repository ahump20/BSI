'use client';

import { useState } from 'react';
import { Section } from '@/components/ui/Section';
import { Container } from '@/components/ui/Container';
import { ScrollReveal } from '@/components/cinematic';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Footer } from '@/components/layout-ds/Footer';

const colors = {
  dirt: '#3E2C1C',
  clay: '#C4703F',
  chalk: '#F5F0E8',
  chalkDim: '#E8E0D2',
  field: '#2D5A27',
  midnight: '#111111',
  gold: '#D4A843',
  hotCoral: '#FF4D4D',
};

const painPoints = [
  {
    title: 'No Certification Filters',
    description:
      'Parents and players waste hours sorting through posts with no way to quickly find trusted bat certifications or exact model specs.',
  },
  {
    title: 'Zero Seller Accountability',
    description:
      'Anonymous profiles and disappearing listings leave buyers with no confidence in who they are dealing with or whether gear will arrive as described.',
  },
  {
    title: 'Buried Listings',
    description:
      'Great gear gets buried in endless comment threads and repost loops, forcing users to refresh constantly and hope they do not miss a deal.',
  },
];

const features = [
  {
    icon: '🎯',
    title: 'Filter by What Matters',
    description:
      'Sort by size, certification, price, condition, and position so the right gear shows up first.',
  },
  {
    icon: '✅',
    title: 'Verified Seller Profiles',
    description:
      'Trust signals, seller history, and rating transparency make every purchase decision safer.',
  },
  {
    icon: '🔔',
    title: 'Instant Drop Alerts',
    description:
      'Get notified the second a saved search matches your criteria before someone else buys it.',
  },
  {
    icon: '🤝',
    title: 'Offer & Negotiate',
    description:
      'Built-in offer tools let buyers and sellers agree quickly without leaving the platform.',
  },
  {
    icon: '📦',
    title: 'Integrated Shipping',
    description:
      'Generate labels and track every order from checkout to delivery in one workflow.',
  },
  {
    icon: '🛡️',
    title: 'Buyer Protection',
    description:
      'Secure payments and dispute support protect both sides when something goes wrong.',
  },
];

const categories = [
  { name: 'Bats', subtitle: 'USSSA, BBCOR, Fastpitch' },
  { name: 'Gloves', subtitle: 'Infield, Outfield, Catcher' },
  { name: 'Uniforms', subtitle: 'Jerseys, Pants, Team Sets' },
  { name: 'Equipment', subtitle: 'Bags, Nets, Training Aids' },
  { name: 'Cleats', subtitle: 'Metal, Molded, Turf' },
  { name: 'Protection', subtitle: 'Helmets, Guards, Masks' },
  { name: 'Packages', subtitle: 'Bundle Deals, Team Lots' },
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
  const [submitError, setSubmitError] = useState('');

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) return;

    setIsSubmitting(true);
    setSubmitError('');

    try {
      const response = await fetch('/api/lead', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'YardSale Waitlist Signup',
          email: normalizedEmail,
          sport: 'softball',
          source: 'YardSale Waitlist',
          message: 'Submitted from /yardsale waitlist form',
        }),
      });

      if (!response.ok) {
        throw new Error(`Lead capture failed with status ${response.status}`);
      }

      setSubmitted(true);
    } catch (_error) {
      setSubmitError('Something went wrong while saving your signup. Please try again.');
    } finally {
      setIsSubmitting(false);
    }

    setEmail('');
  };

  return (
    <main className="min-h-screen bg-midnight text-white">
      <Section className="relative min-h-screen flex items-center pt-28 pb-20 bg-gradient-to-b from-charcoal to-midnight overflow-hidden">
        <Container>
          <ScrollReveal>
            <div className="max-w-4xl mx-auto text-center">
              <Badge variant="secondary" className="mb-6 uppercase tracking-[0.18em]">
                The Softball Marketplace
              </Badge>
              <h1 className="font-display text-5xl sm:text-6xl md:text-7xl lg:text-8xl uppercase tracking-wide mb-6">
                Yard{' '}
                <span
                  className="bg-clip-text text-transparent"
                  style={{ backgroundImage: `linear-gradient(135deg, ${colors.clay}, ${colors.gold})` }}
                >
                  Sale
                </span>
              </h1>
              <p className="text-lg sm:text-xl text-gray-300 max-w-3xl mx-auto mb-10">
                Buy and sell softball gear in a marketplace built for players, parents, and coaches —
                with trusted sellers, smart filters, and a checkout flow designed for the diamond.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Button href="#waitlist" size="lg" className="px-8">
                  Join the Waitlist
                </Button>
                <Button href="#how" variant="outline" size="lg" className="px-8">
                  How It Works
                </Button>
              </div>
            </div>
          </ScrollReveal>
        </Container>
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-xs uppercase tracking-[0.2em] text-white/50">
          Scroll
        </div>
      </Section>

      <Section className="py-20 bg-charcoal">
        <Container>
          <ScrollReveal>
            <div className="max-w-3xl mb-12">
              <p className="text-xs tracking-[0.2em] text-white/60 mb-4">THE PROBLEM</p>
              <h2 className="font-display text-3xl md:text-5xl uppercase mb-6">
                Buying Softball Gear Shouldn&apos;t Feel Like Digging Through a Garage
              </h2>
              <p className="text-gray-300 text-lg">
                Today&apos;s gear marketplace lives inside messy social feeds. Listings are hard to find,
                trust is inconsistent, and families are forced to take unnecessary risk with every
                purchase.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid md:grid-cols-3 gap-6">
            {painPoints.map((item, index) => (
              <ScrollReveal key={item.title} delay={index * 120}>
                <Card
                  className="h-full border-l-4"
                  style={{ borderLeftColor: colors.hotCoral, backgroundColor: `${colors.midnight}88` }}
                >
                  <CardContent className="p-6">
                    <h3 className="font-display text-2xl uppercase mb-3">{item.title}</h3>
                    <p className="text-gray-300 text-sm leading-relaxed">{item.description}</p>
                  </CardContent>
                </Card>
              </ScrollReveal>
            ))}
          </div>
        </Container>
      </Section>

      <Section id="how" className="py-20">
        <Container>
          <ScrollReveal>
            <div className="text-center max-w-3xl mx-auto mb-12">
              <p className="text-xs tracking-[0.2em] text-white/60 mb-4">BUILT FOR THE DIAMOND</p>
              <h2 className="font-display text-3xl md:text-5xl uppercase mb-6">
                Every Feature Exists Because a Player Asked for It
              </h2>
              <p className="text-gray-300 text-lg">
                YardSale removes friction from discovery to delivery with workflows tuned for real
                softball buyers and sellers.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <ScrollReveal key={feature.title} delay={index * 80}>
                <Card className="h-full">
                  <CardContent className="p-6">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-4"
                      style={{ backgroundColor: `${colors.clay}33` }}
                    >
                      {feature.icon}
                    </div>
                    <h3 className="font-display text-2xl uppercase mb-3">{feature.title}</h3>
                    <p className="text-gray-300 text-sm leading-relaxed">{feature.description}</p>
                  </CardContent>
                </Card>
              </ScrollReveal>
            ))}
          </div>
        </Container>
      </Section>

      <Section className="py-14 bg-charcoal">
        <Container>
          <ScrollReveal>
            <div className="-mx-2 overflow-x-auto pb-2">
              <div className="min-w-max flex gap-3 px-2">
                {categories.map((category) => (
                  <div
                    key={category.name}
                    className="rounded-full border border-white/15 bg-white/5 px-5 py-3 whitespace-nowrap"
                  >
                    <p className="font-display text-lg uppercase leading-none">{category.name}</p>
                    <p className="text-xs text-gray-400 mt-1">{category.subtitle}</p>
                  </div>
                ))}
              </div>
            </div>
          </ScrollReveal>
        </Container>
      </Section>

      <Section className="py-20">
        <Container>
          <div className="grid md:grid-cols-3 gap-6 mb-10">
            {stats.map((stat, index) => (
              <ScrollReveal key={stat.label} delay={index * 120}>
                <Card className="h-full text-center">
                  <CardContent className="p-8">
                    <p className="font-display text-4xl md:text-5xl mb-3" style={{ color: colors.gold }}>
                      {stat.value}
                    </p>
                    <p className="text-gray-300 uppercase tracking-[0.12em] text-xs">{stat.label}</p>
                  </CardContent>
                </Card>
              </ScrollReveal>
            ))}
          </div>

          <ScrollReveal delay={250}>
            <Card className="max-w-4xl mx-auto">
              <CardContent className="p-8 md:p-10">
                <blockquote className="text-xl md:text-2xl text-center leading-relaxed text-gray-100">
                  “I found the exact bat my daughter wanted in less than ten minutes — with a
                  verified seller and shipping already included. This is what softball families have
                  needed for years.”
                </blockquote>
                <p className="text-center text-sm uppercase tracking-[0.14em] text-gray-400 mt-6">
                  Travel Ball Parent · Houston, TX
                </p>
              </CardContent>
            </Card>
          </ScrollReveal>
        </Container>
      </Section>

      <Section id="waitlist" className="py-20 bg-charcoal border-t border-white/10">
        <Container size="narrow">
          <ScrollReveal>
            <div className="text-center mb-8">
              <h2 className="font-display text-4xl md:text-5xl uppercase mb-4">Get First Access</h2>
              <p className="text-gray-300 text-lg">
                Join early and be first to buy, sell, and discover premium softball gear on
                YardSale.
              </p>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={120}>
            <form onSubmit={handleSubmit} className="max-w-xl mx-auto">
              <label htmlFor="yardsale-email" className="sr-only">
                Email address
              </label>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  id="yardsale-email"
                  type="email"
                  required
                  disabled={isSubmitting}
                  placeholder="Enter your email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="flex-1 h-12 rounded-lg bg-midnight border border-white/20 px-4 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2"
                  style={{
                    '--tw-ring-color': colors.clay,
                  } as React.CSSProperties}
                />
                <Button type="submit" size="lg" className="h-12 px-8" disabled={isSubmitting}>
                  {isSubmitting ? 'Joining…' : 'Join Waitlist'}
                </Button>
              </div>
              <p className="text-xs text-gray-400 text-center mt-4">
                No spam. Just launch updates, early access, and occasional product drops.
              </p>
              {submitError ? (
                <p className="text-sm text-center mt-4" style={{ color: colors.hotCoral }}>
                  {submitError}
                </p>
              ) : null}
              {submitted ? (
                <p className="text-sm text-center mt-4" style={{ color: colors.chalk }}>
                  Thanks — you&apos;re on the list.
                </p>
              ) : null}
            </form>
          </ScrollReveal>
        </Container>
      </Section>

      <Footer />
    </main>
  );
}
