'use client';

import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ScrollReveal } from '@/components/cinematic';
import { Navbar } from '@/components/layout-ds/Navbar';
import { Footer } from '@/components/layout-ds/Footer';
import { Star, TrendingUp, Calendar, Users, ChevronRight } from 'lucide-react';

const navItems = [
  { label: 'Home', href: '/' },
  { label: 'College Baseball', href: '/college-baseball' },
  { label: 'Preseason', href: '/college-baseball/preseason' },
];

const featuredStories = [
  {
    id: 'lone-star-rivalry',
    title: 'The Lone Star Rivalry Enters the SEC',
    subtitle: "Texas and Texas A&M: #1 vs #2 in Baseball's Biggest Stage",
    description:
      'For the first time in history, Texas and Texas A&M enter conference play together as the top two teams in the nation. The Longhorns and Aggies bring their storied rivalry to the SEC—and college baseball will never be the same.',
    category: 'Feature',
    readTime: '8 min read',
    featured: true,
    teams: ['Texas', 'Texas A&M'],
    imageGradient: 'from-[#BF5700] to-[#500000]',
  },
  {
    id: 'sec-preview',
    title: '2026 SEC Baseball Preview',
    subtitle: 'The Deepest Conference Just Got Deeper',
    description:
      "Texas, Texas A&M, LSU, Tennessee, Vanderbilt—the SEC has become college baseball's superconference. We break down every team's path to Omaha.",
    category: 'Conference Preview',
    readTime: '12 min read',
    featured: false,
    teams: ['SEC'],
    imageGradient: 'from-[#500000] to-[#1A1A1A]',
  },
  {
    id: 'power-25',
    title: 'Preseason Power 25 Deep Dive',
    subtitle: 'Breaking Down Every Ranked Team',
    description:
      'Our comprehensive analysis of the D1Baseball preseason poll—what the rankings tell us, what they miss, and which teams are primed for a run.',
    category: 'Rankings',
    readTime: '15 min read',
    featured: false,
    teams: ['All'],
    imageGradient: 'from-[#FF6B35] to-[#1A1A1A]',
  },
];

const quickStats = [
  { label: 'Days Until Opening Day', value: '42', icon: Calendar },
  { label: 'Ranked Texas Teams', value: '4', icon: Star },
  { label: 'SEC Teams in Top 25', value: '4', icon: TrendingUp },
  { label: 'Conference Realignment Teams', value: '8', icon: Users },
];

export default function PreseasonHubPage() {
  return (
    <>
      <Navbar items={navItems} />

      <main id="main-content">
        {/* Hero Section */}
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
                <span className="text-white">Preseason 2026</span>
              </div>

              <div className="max-w-3xl">
                <h1 className="font-display text-4xl md:text-5xl font-bold uppercase tracking-display mb-4">
                  2026 <span className="text-gradient-blaze">Preseason</span>
                </h1>
                <p className="text-text-secondary text-lg md:text-xl leading-relaxed">
                  The most anticipated college baseball season in a generation. Realignment has
                  reshuffled the deck. Texas and A&M enter the SEC at #1 and #2. Stanford and Cal
                  join the ACC. A new era begins—and we&apos;re breaking down every angle.
                </p>
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* Quick Stats */}
        <Section padding="sm" className="py-6">
          <Container>
            <ScrollReveal direction="up" delay={100}>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {quickStats.map((stat) => (
                  <Card key={stat.label} padding="md" className="text-center">
                    <stat.icon className="w-5 h-5 text-burnt-orange mx-auto mb-2" />
                    <div className="font-display text-2xl md:text-3xl font-bold text-white">
                      {stat.value}
                    </div>
                    <div className="text-text-tertiary text-xs md:text-sm">{stat.label}</div>
                  </Card>
                ))}
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* Featured Story */}
        <Section padding="md">
          <Container>
            <ScrollReveal direction="up" delay={150}>
              {featuredStories
                .filter((story) => story.featured)
                .map((story) => (
                  <Link key={story.id} href={`/college-baseball/preseason/${story.id}`}>
                    <Card
                      padding="none"
                      className="overflow-hidden hover:border-burnt-orange/50 transition-all cursor-pointer group"
                    >
                      <div
                        className={`bg-gradient-to-br ${story.imageGradient} p-8 md:p-12 relative`}
                      >
                        <div className="absolute inset-0 bg-black/30" />
                        <div className="relative z-10">
                          <div className="flex items-center gap-3 mb-4">
                            <Badge variant="primary">{story.category}</Badge>
                            <span className="text-white/70 text-sm">{story.readTime}</span>
                          </div>
                          <h2 className="font-display text-2xl md:text-4xl font-bold text-white uppercase tracking-display mb-3 group-hover:text-burnt-orange transition-colors">
                            {story.title}
                          </h2>
                          <p className="text-white/90 text-lg md:text-xl font-medium mb-4">
                            {story.subtitle}
                          </p>
                          <p className="text-white/70 max-w-2xl mb-6">{story.description}</p>
                          <div className="flex items-center text-burnt-orange font-medium">
                            Read the full story
                            <ChevronRight className="w-5 h-5 ml-1 group-hover:translate-x-1 transition-transform" />
                          </div>
                        </div>
                      </div>
                    </Card>
                  </Link>
                ))}
            </ScrollReveal>
          </Container>
        </Section>

        {/* More Stories */}
        <Section padding="md">
          <Container>
            <ScrollReveal direction="up" delay={200}>
              <h2 className="font-display text-xl font-bold uppercase tracking-display mb-6 text-white">
                More Preseason Coverage
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                {featuredStories
                  .filter((story) => !story.featured)
                  .map((story, index) => (
                    <Link key={story.id} href={`/college-baseball/preseason/${story.id}`}>
                      <Card
                        padding="lg"
                        className="h-full hover:border-burnt-orange/50 transition-all cursor-pointer group"
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <Badge variant="secondary">{story.category}</Badge>
                          <span className="text-text-tertiary text-sm">{story.readTime}</span>
                        </div>
                        <h3 className="font-display text-xl font-bold text-white uppercase tracking-display mb-2 group-hover:text-burnt-orange transition-colors">
                          {story.title}
                        </h3>
                        <p className="text-text-secondary text-sm mb-2">{story.subtitle}</p>
                        <p className="text-text-tertiary text-sm">{story.description}</p>
                      </Card>
                    </Link>
                  ))}
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* Quick Links */}
        <Section padding="md" className="pb-16">
          <Container>
            <ScrollReveal direction="up" delay={250}>
              <div className="flex flex-wrap gap-4 justify-center">
                <Link href="/college-baseball/rankings">
                  <Card
                    padding="md"
                    className="hover:border-burnt-orange/50 transition-all cursor-pointer"
                  >
                    <span className="text-white font-medium">View Full Rankings →</span>
                  </Card>
                </Link>
                <Link href="/college-baseball/conferences">
                  <Card
                    padding="md"
                    className="hover:border-burnt-orange/50 transition-all cursor-pointer"
                  >
                    <span className="text-white font-medium">Conference Previews →</span>
                  </Card>
                </Link>
                <Link href="/college-baseball/teams/texas">
                  <Card
                    padding="md"
                    className="hover:border-burnt-orange/50 transition-all cursor-pointer"
                  >
                    <span className="text-white font-medium">Texas Longhorns →</span>
                  </Card>
                </Link>
              </div>
            </ScrollReveal>
          </Container>
        </Section>
      </main>

      <Footer />
    </>
  );
}
