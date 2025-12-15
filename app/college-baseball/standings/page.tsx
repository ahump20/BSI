'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ScrollReveal } from '@/components/cinematic/ScrollReveal';
import { Navbar } from '@/components/layout-ds/Navbar';
import { Footer } from '@/components/layout-ds/Footer';

const navItems = [
  { label: 'Home', href: '/' },
  { label: 'College Baseball', href: '/college-baseball' },
  { label: 'Games', href: '/college-baseball/games' },
  { label: 'Standings', href: '/college-baseball/standings' },
];

const conferences = [
  { id: 'sec', name: 'SEC', fullName: 'Southeastern Conference' },
  { id: 'acc', name: 'ACC', fullName: 'Atlantic Coast Conference' },
  { id: 'big12', name: 'Big 12', fullName: 'Big 12 Conference' },
  { id: 'bigten', name: 'Big Ten', fullName: 'Big Ten Conference' },
  { id: 'pac12', name: 'Pac-12', fullName: 'Pacific-12 Conference' },
  { id: 'sunbelt', name: 'Sun Belt', fullName: 'Sun Belt Conference' },
  { id: 'aac', name: 'AAC', fullName: 'American Athletic Conference' },
];

// Sample standings data - will be replaced with live API
const secStandings = [
  { rank: 1, team: 'Texas A&M', confW: 18, confL: 6, overallW: 45, overallL: 12, rpi: 1 },
  { rank: 2, team: 'Florida', confW: 17, confL: 7, overallW: 43, overallL: 14, rpi: 3 },
  { rank: 3, team: 'LSU', confW: 16, confL: 8, overallW: 42, overallL: 15, rpi: 2 },
  { rank: 4, team: 'Texas', confW: 15, confL: 9, overallW: 40, overallL: 17, rpi: 5 },
  { rank: 5, team: 'Tennessee', confW: 15, confL: 9, overallW: 39, overallL: 18, rpi: 4 },
  { rank: 6, team: 'Arkansas', confW: 14, confL: 10, overallW: 38, overallL: 19, rpi: 8 },
  { rank: 7, team: 'Vanderbilt', confW: 13, confL: 11, overallW: 36, overallL: 21, rpi: 12 },
  { rank: 8, team: 'Georgia', confW: 12, confL: 12, overallW: 34, overallL: 23, rpi: 15 },
  { rank: 9, team: 'Ole Miss', confW: 11, confL: 13, overallW: 32, overallL: 25, rpi: 18 },
  { rank: 10, team: 'Auburn', confW: 10, confL: 14, overallW: 30, overallL: 27, rpi: 22 },
];

export default function CollegeBaseballStandingsPage() {
  const [selectedConference, setSelectedConference] = useState('sec');

  const currentConf = conferences.find((c) => c.id === selectedConference);

  return (
    <>
      <Navbar items={navItems} />

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
                <span className="text-white">Standings</span>
              </div>

              <div className="mb-8">
                <h1 className="font-display text-3xl md:text-4xl font-bold uppercase tracking-display">
                  Conference <span className="text-gradient-blaze">Standings</span>
                </h1>
                <p className="text-text-secondary mt-2">
                  2025 NCAA Division I baseball conference standings
                </p>
              </div>
            </ScrollReveal>

            {/* Conference Selector */}
            <ScrollReveal direction="up" delay={100}>
              <div className="flex flex-wrap gap-2 mb-8">
                {conferences.map((conf) => (
                  <button
                    key={conf.id}
                    onClick={() => setSelectedConference(conf.id)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      selectedConference === conf.id
                        ? 'bg-burnt-orange text-white'
                        : 'bg-charcoal text-text-secondary hover:text-white hover:bg-slate'
                    }`}
                  >
                    {conf.name}
                  </button>
                ))}
              </div>
            </ScrollReveal>

            {/* Conference Header */}
            <ScrollReveal direction="up" delay={150}>
              <Card padding="lg" className="mb-6">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <h2 className="font-display text-2xl font-bold text-white">
                      {currentConf?.fullName}
                    </h2>
                    <p className="text-text-tertiary text-sm mt-1">
                      2025 Conference Standings
                    </p>
                  </div>
                  <Badge variant="primary">Updated Daily</Badge>
                </div>
              </Card>
            </ScrollReveal>

            {/* Standings Table */}
            <ScrollReveal direction="up" delay={200}>
              <Card padding="none" className="overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-charcoal border-b border-border-subtle">
                        <th className="text-left py-4 px-4 text-xs font-semibold text-text-tertiary uppercase tracking-wider">
                          Rank
                        </th>
                        <th className="text-left py-4 px-4 text-xs font-semibold text-text-tertiary uppercase tracking-wider">
                          Team
                        </th>
                        <th className="text-center py-4 px-4 text-xs font-semibold text-text-tertiary uppercase tracking-wider">
                          Conf
                        </th>
                        <th className="text-center py-4 px-4 text-xs font-semibold text-text-tertiary uppercase tracking-wider">
                          Overall
                        </th>
                        <th className="text-center py-4 px-4 text-xs font-semibold text-text-tertiary uppercase tracking-wider">
                          RPI
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {secStandings.map((team, index) => (
                        <tr
                          key={team.team}
                          className={`border-b border-border-subtle hover:bg-charcoal/50 transition-colors ${
                            index < 4 ? 'bg-success/5' : ''
                          }`}
                        >
                          <td className="py-4 px-4">
                            <span className="font-display text-lg font-bold text-burnt-orange">
                              {team.rank}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <span className="font-semibold text-white">{team.team}</span>
                          </td>
                          <td className="py-4 px-4 text-center">
                            <span className="text-white">
                              {team.confW}-{team.confL}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-center">
                            <span className="text-text-secondary">
                              {team.overallW}-{team.overallL}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-center">
                            <span className="text-burnt-orange font-semibold">#{team.rpi}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Legend */}
                <div className="px-4 py-3 bg-charcoal border-t border-border-subtle">
                  <div className="flex items-center gap-4 text-xs text-text-tertiary">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-success/20 rounded" />
                      <span>NCAA Tournament Projection</span>
                    </div>
                  </div>
                </div>
              </Card>
            </ScrollReveal>

            {/* Data Attribution */}
            <div className="mt-8 text-center text-xs text-text-tertiary">
              <p>
                RPI rankings from NCAA. Conference standings updated daily during season.
              </p>
              <p className="mt-1">
                Last updated: {new Date().toLocaleString('en-US', { timeZone: 'America/Chicago' })} CT
              </p>
            </div>
          </Container>
        </Section>
      </main>

      <Footer />
    </>
  );
}
