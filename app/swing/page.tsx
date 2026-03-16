'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Button } from '@/components/ui/Button';
import { Footer } from '@/components/layout-ds/Footer';
import { ScrollReveal } from '@/components/cinematic';

const FEATURES = [
  {
    title: '12-Dimension Analysis',
    desc: 'From weight distribution through follow-through balance — every phase of your swing measured and scored.',
    icon: 'M18 20V10M12 20V4M6 20v-6',
  },
  {
    title: 'AI Skeleton Overlay',
    desc: 'MediaPipe pose estimation maps 33 body landmarks across every frame. See your mechanics in motion.',
    icon: 'M12 2a3 3 0 100 6 3 3 0 000-6zM12 8v4M8 16l4-4 4 4M6 20h12',
  },
  {
    title: 'Conversational AI Coach',
    desc: 'Ask follow-up questions about YOUR swing. AI references specific frames and measurements — not generic advice.',
    icon: 'M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z',
  },
  {
    title: 'All Three Sports',
    desc: 'Baseball, fast-pitch softball, and slow-pitch softball — each with sport-specific models and ideal ranges.',
    icon: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z',
  },
  {
    title: 'Prescribed Drills',
    desc: 'Targeted drills based on your weakest metrics. Not a drill library — drills chosen for YOUR swing.',
    icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
  },
  {
    title: 'Progress Tracking',
    desc: 'Compare swings over time. See which metrics improved, which regressed, and what to work on next.',
    icon: 'M2 14l4-6 3 3 5-8',
    href: '/swing/history',
  },
];

const SPORTS = [
  {
    name: 'Baseball',
    emphasis: 'Rotational mechanics, bat speed, launch angle 10-25°',
  },
  {
    name: 'Fast-Pitch Softball',
    emphasis: 'Compact swing path, level plane, 0.35s reaction window',
  },
  {
    name: 'Slow-Pitch Softball',
    emphasis: 'Uppercut plane, USSSA/ASA 6-12ft arc timing, distance optimization',
  },
];

export default function SwingLandingPage() {
  return (
    <div className="bsi-theme-baseball">
      {/* Hero */}
      <Section padding="xl" background="midnight">
        <div className="grain-overlay" />
        <Container>
          <div className="max-w-3xl mx-auto text-center corner-marks relative">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <span className="heritage-stamp text-xs mb-4 block">Swing Intelligence</span>
              <h1
                className="font-display font-bold uppercase tracking-wide text-bsi-bone mb-4"
                style={{ fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', lineHeight: 1.05 }}
              >
                See Your Swing.<br />
                <span className="text-burnt-orange">Understand It.</span>
              </h1>
              <p className="text-bsi-dust text-base sm:text-lg leading-relaxed max-w-xl mx-auto mb-8">
                Record your swing from any phone camera. Get AI-powered biomechanical analysis across 12 dimensions — then ask follow-up questions about what you see.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/swing/analyze">
                  <Button variant="primary" size="lg">
                    Analyze Your Swing
                  </Button>
                </Link>
                <a href="#how-it-works">
                  <Button variant="ghost" size="lg">
                    How It Works
                  </Button>
                </a>
              </div>
            </motion.div>
          </div>
        </Container>
      </Section>

      {/* Sports Strip */}
      <div className="border-y-2 border-burnt-orange/20 bg-surface-press-box">
        <Container>
          <div className="flex items-center justify-center gap-4 sm:gap-8 py-4 overflow-x-auto">
            {SPORTS.map((sport) => (
              <div key={sport.name} className="text-center whitespace-nowrap">
                <div className="text-xs font-bold text-bsi-bone font-display uppercase tracking-wider">
                  {sport.name}
                </div>
                <div className="text-[10px] text-text-muted mt-0.5">{sport.emphasis}</div>
              </div>
            ))}
          </div>
        </Container>
      </div>

      {/* How It Works */}
      <Section id="how-it-works" padding="lg" background="charcoal" borderTop>
        <Container>
          <ScrollReveal>
            <div className="text-center mb-12">
              <span className="heritage-stamp text-xs mb-3 block">The Process</span>
              <h2 className="font-display text-2xl sm:text-3xl font-bold uppercase tracking-wide text-bsi-bone">
                From Phone Camera to AI Coach
              </h2>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { step: '01', title: 'Record', desc: 'Film your swing from the side angle. Any phone camera works — no special equipment.' },
              { step: '02', title: 'Upload', desc: 'Drop the video into BSI. Our AI processes it in under 60 seconds.' },
              { step: '03', title: 'Analyze', desc: '33 body landmarks tracked across every frame. 12 swing dimensions scored.' },
              { step: '04', title: 'Ask', desc: 'Chat with your AI coach about what the numbers mean and how to improve.' },
            ].map((item, i) => (
              <ScrollReveal key={item.step} delay={i * 0.1}>
                <div className="rounded-sm bg-surface-dugout border border-border-subtle p-6 text-center h-full">
                  <div className="w-10 h-10 rounded-sm bg-burnt-orange/15 flex items-center justify-center mx-auto mb-4">
                    <span className="text-burnt-orange font-mono font-bold text-sm">{item.step}</span>
                  </div>
                  <h3 className="font-display text-lg font-bold uppercase tracking-wide text-bsi-bone mb-2">
                    {item.title}
                  </h3>
                  <p className="text-xs text-bsi-dust leading-relaxed">{item.desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </Container>
      </Section>

      {/* Features Grid */}
      <Section padding="lg" borderTop>
        <Container>
          <ScrollReveal>
            <div className="text-center mb-12">
              <span className="heritage-stamp text-xs mb-3 block">Capabilities</span>
              <h2 className="font-display text-2xl sm:text-3xl font-bold uppercase tracking-wide text-bsi-bone">
                What You Get
              </h2>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((feature, i) => {
              const card = (
                <div className={`rounded-sm bg-surface-dugout border border-border-subtle p-5 h-full transition-colors ${feature.href ? 'hover:border-burnt-orange/40 group cursor-pointer' : 'hover:border-burnt-orange/20'}`}>
                  <div className="w-10 h-10 rounded-sm bg-burnt-orange/10 flex items-center justify-center mb-4">
                    <svg
                      viewBox="0 0 24 24"
                      className="w-5 h-5 text-burnt-orange"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d={feature.icon} />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-bsi-bone text-sm mb-2">
                    {feature.title}
                    {feature.href && (
                      <span className="inline-block ml-1.5 text-burnt-orange opacity-0 group-hover:opacity-100 transition-opacity">&rarr;</span>
                    )}
                  </h3>
                  <p className="text-xs text-bsi-dust leading-relaxed">{feature.desc}</p>
                </div>
              );

              return (
                <ScrollReveal key={feature.title} delay={i * 0.08}>
                  {feature.href ? <Link href={feature.href}>{card}</Link> : card}
                </ScrollReveal>
              );
            })}
          </div>
        </Container>
      </Section>

      {/* Cross-Property: Labs Biomechanics */}
      <Section padding="lg" borderTop>
        <Container>
          <ScrollReveal>
            <div className="max-w-2xl mx-auto">
              <div className="rounded-sm bg-surface-dugout border border-burnt-orange/20 p-6 sm:p-8 corner-marks relative">
                <span className="heritage-stamp text-xs mb-4 block">BSI Labs</span>
                <h2 className="font-display text-xl sm:text-2xl font-bold uppercase tracking-wide text-bsi-bone mb-3">
                  Go Deeper in the Lab
                </h2>
                <p className="text-sm text-bsi-dust leading-relaxed mb-6">
                  Explore 3D biomechanics models comparing swing mechanics across baseball and softball. Interactive body position tracking, joint angle measurements, and phase-by-phase breakdowns — built for players and coaches who want to see the science behind the swing.
                </p>
                <a
                  href="https://labs.blazesportsintel.com/athletic-analysis"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-heritage-fill inline-flex items-center gap-2 text-sm"
                >
                  Open Biomechanics Lab
                  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" />
                  </svg>
                </a>
              </div>
            </div>
          </ScrollReveal>
        </Container>
      </Section>

      {/* Pricing Preview */}
      <Section padding="lg" background="midnight" borderTop>
        <Container>
          <ScrollReveal>
            <div className="max-w-2xl mx-auto">
              <div className="text-center mb-8">
                <span className="heritage-stamp text-xs mb-3 block">Pricing</span>
                <h2 className="font-display text-2xl font-bold uppercase tracking-wide text-bsi-bone">
                  Start Free, Go Pro
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-sm bg-surface-dugout border border-border-subtle p-6 corner-marks relative">
                  <h3 className="font-display text-lg font-bold uppercase text-bsi-bone mb-4">Free</h3>
                  <ul className="space-y-2 text-xs text-bsi-dust">
                    <li className="flex gap-2"><span className="text-[var(--bsi-success)]">✓</span> 3 swing analyses per month</li>
                    <li className="flex gap-2"><span className="text-[var(--bsi-success)]">✓</span> Full 12-metric report</li>
                    <li className="flex gap-2"><span className="text-[var(--bsi-success)]">✓</span> Video + skeleton overlay</li>
                    <li className="flex gap-2"><span className="text-[var(--bsi-success)]">✓</span> AI narrated analysis</li>
                    <li className="flex gap-2"><span className="text-text-muted">–</span> 2 follow-up questions per swing</li>
                    <li className="flex gap-2"><span className="text-text-muted">–</span> Last 3 swings history</li>
                  </ul>
                </div>

                <div className="rounded-sm bg-surface-dugout border-2 border-burnt-orange p-6 relative">
                  <div className="absolute -top-3 left-4 bg-burnt-orange text-white text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-sm">
                    Pro
                  </div>
                  <h3 className="font-display text-lg font-bold uppercase text-bsi-bone mb-4">BSI Pro</h3>
                  <ul className="space-y-2 text-xs text-bsi-dust">
                    <li className="flex gap-2"><span className="text-burnt-orange">✓</span> Unlimited swing analyses</li>
                    <li className="flex gap-2"><span className="text-burnt-orange">✓</span> Full 12-metric report</li>
                    <li className="flex gap-2"><span className="text-burnt-orange">✓</span> Video + skeleton overlay</li>
                    <li className="flex gap-2"><span className="text-burnt-orange">✓</span> AI narrated analysis</li>
                    <li className="flex gap-2"><span className="text-burnt-orange">✓</span> Unlimited follow-up questions</li>
                    <li className="flex gap-2"><span className="text-burnt-orange">✓</span> Full history + progress charts</li>
                    <li className="flex gap-2"><span className="text-burnt-orange">✓</span> Personalized drill prescriptions</li>
                  </ul>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </Container>
      </Section>

      {/* CTA */}
      <Section padding="lg" borderTop>
        <Container>
          <div className="text-center">
            <h2 className="font-display text-2xl font-bold uppercase tracking-wide text-bsi-bone mb-4">
              Ready to See Your Swing?
            </h2>
            <Link href="/swing/analyze">
              <Button variant="primary" size="lg">
                Start Free Analysis
              </Button>
            </Link>
          </div>
        </Container>
      </Section>

      <Footer />
    </div>
  );
}
