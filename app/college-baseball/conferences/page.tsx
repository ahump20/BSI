'use client';

// React hooks available if needed for future interactivity
import { useState as _useState, useEffect as _useEffect } from 'react';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ScrollReveal } from '@/components/cinematic';
import { Footer } from '@/components/layout-ds/Footer';
import { Trophy, Users, TrendingUp, MapPin } from 'lucide-react';

const conferences = [
  {
    id: 'sec',
    name: 'SEC',
    fullName: 'Southeastern Conference',
    description:
      'The deepest conference in college baseball—where Texas and Texas A&M now call home alongside perennial powers like LSU, Tennessee, and Vanderbilt.',
    rankedTeams: 4,
    topTeam: 'Texas',
    topRank: 1,
    region: 'South',
    teams: 16,
    highlight: 'Texas enters at #1 in D1Baseball preseason poll',
  },
  {
    id: 'acc',
    name: 'ACC',
    fullName: 'Atlantic Coast Conference',
    description:
      'Massive expansion in 2024 brought Stanford, Cal, and SMU—joining established powers like Florida State, North Carolina, and Wake Forest.',
    rankedTeams: 15,
    topTeam: 'Stanford',
    topRank: 3,
    region: 'East Coast',
    teams: 18,
    highlight: 'Most ranked teams of any conference (15)',
  },
  {
    id: 'big-12',
    name: 'Big 12',
    fullName: 'Big 12 Conference',
    description:
      'Oklahoma State leads a competitive Big 12 that added UCF, Houston, BYU, and others in realignment. Deep pitching across the board.',
    rankedTeams: 6,
    topTeam: 'Oklahoma State',
    topRank: 12,
    region: 'Central',
    teams: 16,
    highlight: 'Six ranked teams in preseason Top 25',
  },
  {
    id: 'big-ten',
    name: 'Big Ten',
    fullName: 'Big Ten Conference',
    description:
      'Growing power in the Midwest. USC and UCLA join in 2024, bringing West Coast talent to the conference.',
    rankedTeams: 0,
    topTeam: null,
    topRank: null,
    region: 'Midwest',
    teams: 18,
    highlight: 'USC, UCLA additions bring new talent',
  },
  {
    id: 'pac-12',
    name: 'Pac-12',
    fullName: 'Pacific-12 Conference',
    description:
      'The Pac-12 is rebuilding after losing major programs. Oregon State and Washington remain as anchors.',
    rankedTeams: 0,
    topTeam: null,
    topRank: null,
    region: 'West',
    teams: 4,
    highlight: 'Conference in transition',
  },
];

export default function ConferencesHubPage() {
  return (
    <>
      <main id="main-content">
        <Section padding="lg" className="pt-24">
          <Container>
            <ScrollReveal direction="up">
              <div className="flex items-center gap-3 mb-2">
                <Link
                  href="/college-baseball"
                  className="text-text-tertiary hover:text-burnt-orange transition-colors"
                >
                  College Baseball
                </Link>
                <span className="text-text-tertiary">/</span>
                <span className="text-white">Conferences</span>
              </div>

              <div className="mb-8">
                <h1 className="font-display text-3xl md:text-4xl font-bold uppercase tracking-display">
                  Conference <span className="text-gradient-blaze">Previews</span>
                </h1>
                <p className="text-text-secondary mt-2 max-w-2xl">
                  2026 preseason conference breakdowns—featuring the reshuffled landscape after
                  historic realignment. Texas and Texas A&M in the SEC. Stanford and Cal in the ACC.
                  A whole new era begins.
                </p>
              </div>
            </ScrollReveal>

            {/* Conference Breakdown Summary */}
            <ScrollReveal direction="up" delay={100}>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
                <Card padding="md" className="text-center">
                  <Trophy className="w-6 h-6 text-burnt-orange mx-auto mb-2" />
                  <div className="font-display text-2xl font-bold text-white">25</div>
                  <div className="text-text-tertiary text-sm">Ranked Teams</div>
                </Card>
                <Card padding="md" className="text-center">
                  <Users className="w-6 h-6 text-burnt-orange mx-auto mb-2" />
                  <div className="font-display text-2xl font-bold text-white">5</div>
                  <div className="text-text-tertiary text-sm">Power Conferences</div>
                </Card>
                <Card padding="md" className="text-center">
                  <TrendingUp className="w-6 h-6 text-burnt-orange mx-auto mb-2" />
                  <div className="font-display text-2xl font-bold text-white">SEC</div>
                  <div className="text-text-tertiary text-sm">#1 Team (Texas)</div>
                </Card>
                <Card padding="md" className="text-center">
                  <MapPin className="w-6 h-6 text-burnt-orange mx-auto mb-2" />
                  <div className="font-display text-2xl font-bold text-white">ACC</div>
                  <div className="text-text-tertiary text-sm">Most Ranked (15)</div>
                </Card>
              </div>
            </ScrollReveal>

            {/* Conference Cards */}
            <div className="grid gap-6">
              {conferences.map((conf, index) => (
                <ScrollReveal key={conf.id} direction="up" delay={150 + index * 50}>
                  <Link href={`/college-baseball/conferences/${conf.id}`}>
                    <Card
                      padding="lg"
                      className="hover:border-burnt-orange/50 transition-all cursor-pointer group"
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h2 className="font-display text-2xl font-bold text-white group-hover:text-burnt-orange transition-colors">
                              {conf.fullName}
                            </h2>
                            {conf.rankedTeams > 0 && (
                              <Badge variant="primary">{conf.rankedTeams} Ranked</Badge>
                            )}
                          </div>
                          <p className="text-text-secondary mb-3">{conf.description}</p>
                          <div className="flex flex-wrap gap-3 text-sm">
                            {conf.topTeam && (
                              <span className="text-burnt-orange">
                                Top: {conf.topTeam} (#{conf.topRank})
                              </span>
                            )}
                            <span className="text-text-tertiary">{conf.teams} Teams</span>
                            <span className="text-text-tertiary">{conf.region}</span>
                          </div>
                        </div>
                        <div className="md:text-right">
                          <div className="text-sm text-text-tertiary mb-1">Preseason Highlight</div>
                          <div className="text-white font-medium">{conf.highlight}</div>
                        </div>
                      </div>
                    </Card>
                  </Link>
                </ScrollReveal>
              ))}
            </div>

            {/* Data Attribution */}
            <div className="mt-10 text-center text-xs text-text-tertiary">
              <p>
                Rankings data sourced from D1Baseball preseason poll. Conference membership reflects
                2024-25 realignment.
              </p>
              <p className="mt-1">
                Last updated: {new Date().toLocaleString('en-US', { timeZone: 'America/Chicago' })}{' '}
                CT
              </p>
            </div>
          </Container>
        </Section>
      </main>

      <Footer />
    </>
  );
}
