'use client';

import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ScrollReveal } from '@/components/cinematic';
import { Footer } from '@/components/layout-ds/Footer';

const editorialStories = [
  {
    title: 'Opening Weekend Preview: Week 1 Power Moves',
    subtitle: 'Matchups, breakout stars, upset radar, and the Texas dossier for launch weekend.',
    href: '/college-baseball/editorial/week-1-preview',
    tag: 'Week 1',
  },
  {
    title: 'Preseason Power 25 Deep Dive',
    subtitle: 'Tiered national board and conference pressure points entering 2026.',
    href: '/college-baseball/preseason/power-25',
    tag: 'Rankings',
  },
  {
    title: 'The Lone Star Rivalry Enters the SEC',
    subtitle: 'Texas and Texas A&M move from state obsession to conference chaos.',
    href: '/college-baseball/preseason/lone-star-rivalry',
    tag: 'Feature',
  },
  {
    title: '2026 SEC Baseball Preview',
    subtitle: 'What the deepest conference in college baseball looks like after realignment.',
    href: '/college-baseball/preseason/sec-preview',
    tag: 'Conference',
  },
];

export default function CollegeBaseballEditorialHubPage() {
  return (
    <>
      <main id="main-content">
        <Section padding="lg" className="pt-24 pb-12">
          <Container>
            <ScrollReveal direction="up">
              <div className="flex items-center gap-3 mb-4">
                <Link
                  href="/college-baseball"
                  className="text-text-tertiary hover:text-burnt-orange transition-colors"
                >
                  College Baseball
                </Link>
                <span className="text-text-tertiary">/</span>
                <span className="text-white">Editorial</span>
              </div>

              <Badge variant="primary" className="mb-4">
                Weekly Intel
              </Badge>
              <h1 className="font-display text-4xl md:text-5xl font-bold uppercase tracking-display mb-4">
                College Baseball <span className="text-gradient-blaze">Editorial Desk</span>
              </h1>
              <p className="text-text-secondary text-lg max-w-3xl">
                Weekly coverage built for Opening Day and beyond: matchup context, power movement,
                roster impact, and program-level data notes with clear attribution.
              </p>
            </ScrollReveal>
          </Container>
        </Section>

        <Section padding="md" className="pb-16">
          <Container>
            <div className="grid md:grid-cols-2 gap-6">
              {editorialStories.map((story, idx) => (
                <ScrollReveal key={story.href} direction="up" delay={idx * 60}>
                  <Link href={story.href}>
                    <Card
                      padding="lg"
                      className="h-full hover:border-burnt-orange/50 transition-all cursor-pointer"
                    >
                      <Badge variant="secondary" className="mb-3">
                        {story.tag}
                      </Badge>
                      <h2 className="font-display text-2xl font-bold uppercase tracking-display text-white mb-2">
                        {story.title}
                      </h2>
                      <p className="text-text-secondary">{story.subtitle}</p>
                      <p className="text-burnt-orange mt-5 font-medium">Read story →</p>
                    </Card>
                  </Link>
                </ScrollReveal>
              ))}
            </div>
          </Container>
        </Section>
      </main>

      <Footer />
    </>
  );
}
