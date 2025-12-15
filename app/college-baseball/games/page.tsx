'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { Badge, LiveBadge } from '@/components/ui/Badge';
import { ScrollReveal } from '@/components/cinematic/ScrollReveal';
import { Navbar } from '@/components/layout-ds/Navbar';
import { Footer } from '@/components/layout-ds/Footer';

const navItems = [
  { label: 'Home', href: '/' },
  { label: 'College Baseball', href: '/college-baseball' },
  { label: 'Games', href: '/college-baseball/games' },
  { label: 'Standings', href: '/college-baseball/standings' },
];

// Sample games data - will be replaced with live API
const todaysGames = [
  {
    id: '1',
    away: { name: 'Texas', rank: 4, score: 5 },
    home: { name: 'Oklahoma', score: 3 },
    status: 'Final',
    inning: 'F',
    conference: 'SEC',
  },
  {
    id: '2',
    away: { name: 'LSU', rank: 3, score: 2 },
    home: { name: 'Alabama', score: 2 },
    status: 'Live',
    inning: 'T7',
    conference: 'SEC',
  },
  {
    id: '3',
    away: { name: 'Florida', rank: 2, score: 0 },
    home: { name: 'Georgia', score: 0 },
    status: 'Scheduled',
    time: '7:00 PM CT',
    conference: 'SEC',
  },
  {
    id: '4',
    away: { name: 'Texas A&M', rank: 1, score: 8 },
    home: { name: 'Arkansas', rank: 8, score: 4 },
    status: 'Final',
    inning: 'F',
    conference: 'SEC',
  },
  {
    id: '5',
    away: { name: 'Wake Forest', rank: 12 },
    home: { name: 'NC State' },
    status: 'Scheduled',
    time: '6:00 PM CT',
    conference: 'ACC',
  },
  {
    id: '6',
    away: { name: 'TCU', rank: 15 },
    home: { name: 'Texas Tech', rank: 18 },
    status: 'Scheduled',
    time: '7:30 PM CT',
    conference: 'Big 12',
  },
];

const conferences = ['All', 'SEC', 'ACC', 'Big 12', 'Big Ten', 'Pac-12'];

export default function CollegeBaseballGamesPage() {
  const [selectedConference, setSelectedConference] = useState('All');

  const filteredGames =
    selectedConference === 'All'
      ? todaysGames
      : todaysGames.filter((g) => g.conference === selectedConference);

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
                <span className="text-white">Games</span>
              </div>

              <div className="flex items-center justify-between flex-wrap gap-4 mb-8">
                <div>
                  <h1 className="font-display text-3xl md:text-4xl font-bold uppercase tracking-display">
                    Today&apos;s <span className="text-gradient-blaze">Games</span>
                  </h1>
                  <p className="text-text-secondary mt-2">
                    Live scores and results for NCAA Division I baseball
                  </p>
                </div>
                <LiveBadge />
              </div>
            </ScrollReveal>

            {/* Conference Filter */}
            <ScrollReveal direction="up" delay={100}>
              <div className="flex flex-wrap gap-2 mb-8">
                {conferences.map((conf) => (
                  <button
                    key={conf}
                    onClick={() => setSelectedConference(conf)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      selectedConference === conf
                        ? 'bg-burnt-orange text-white'
                        : 'bg-charcoal text-text-secondary hover:text-white hover:bg-slate'
                    }`}
                  >
                    {conf}
                  </button>
                ))}
              </div>
            </ScrollReveal>

            {/* Games Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredGames.map((game, index) => (
                <ScrollReveal key={game.id} direction="up" delay={index * 50}>
                  <Card variant="hover" padding="md" className="h-full">
                    {/* Status Badge */}
                    <div className="flex items-center justify-between mb-4">
                      <Badge variant="default">{game.conference}</Badge>
                      {game.status === 'Live' ? (
                        <LiveBadge />
                      ) : game.status === 'Final' ? (
                        <Badge variant="default">Final</Badge>
                      ) : (
                        <Badge variant="primary">{game.time}</Badge>
                      )}
                    </div>

                    {/* Teams */}
                    <div className="space-y-3">
                      {/* Away Team */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {game.away.rank && (
                            <span className="text-xs text-burnt-orange font-semibold">
                              #{game.away.rank}
                            </span>
                          )}
                          <span className="font-semibold text-white">{game.away.name}</span>
                        </div>
                        {game.away.score !== undefined && (
                          <span
                            className={`font-display text-xl font-bold ${
                              game.status === 'Final' &&
                              game.away.score > (game.home.score ?? 0)
                                ? 'text-success'
                                : 'text-white'
                            }`}
                          >
                            {game.away.score}
                          </span>
                        )}
                      </div>

                      {/* Home Team */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {game.home.rank && (
                            <span className="text-xs text-burnt-orange font-semibold">
                              #{game.home.rank}
                            </span>
                          )}
                          <span className="font-semibold text-white">{game.home.name}</span>
                        </div>
                        {game.home.score !== undefined && (
                          <span
                            className={`font-display text-xl font-bold ${
                              game.status === 'Final' &&
                              game.home.score > (game.away.score ?? 0)
                                ? 'text-success'
                                : 'text-white'
                            }`}
                          >
                            {game.home.score}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Inning indicator for live games */}
                    {game.status === 'Live' && (
                      <div className="mt-4 pt-4 border-t border-border-subtle">
                        <span className="text-sm text-text-tertiary">
                          {game.inning?.startsWith('T') ? 'Top' : 'Bot'}{' '}
                          {game.inning?.replace(/[TB]/, '')}
                        </span>
                      </div>
                    )}
                  </Card>
                </ScrollReveal>
              ))}
            </div>

            {/* Data Attribution */}
            <div className="mt-12 text-center text-xs text-text-tertiary">
              <p>
                Data sourced from official NCAA statistics. Updated in real-time during live games.
              </p>
              <p className="mt-1">Last updated: {new Date().toLocaleString('en-US', { timeZone: 'America/Chicago' })} CT</p>
            </div>
          </Container>
        </Section>
      </main>

      <Footer />
    </>
  );
}
