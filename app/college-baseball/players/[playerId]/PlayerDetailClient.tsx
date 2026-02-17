'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { DataAttribution } from '@/components/ui/DataAttribution';
import { Footer } from '@/components/layout-ds/Footer';

interface PlayerData {
  player: {
    id: number;
    name: string;
    firstName?: string;
    lastName?: string;
    position?: string;
    jerseyNumber?: string;
    height?: string;
    weight?: number;
    dateOfBirth?: string;
    team?: { id: number; name: string; shortName?: string; conference?: { name: string } };
  } | null;
  statistics: {
    batting?: {
      games: number; atBats: number; runs: number; hits: number; doubles: number;
      triples: number; homeRuns: number; rbi: number; walks: number; strikeouts: number;
      stolenBases: number; battingAverage: number; onBasePercentage: number;
      sluggingPercentage: number; ops: number;
    };
    pitching?: {
      games: number; gamesStarted: number; wins: number; losses: number; saves: number;
      inningsPitched: number; hits: number; earnedRuns: number; walks: number;
      strikeouts: number; era: number; whip: number;
    };
  } | null;
}

export default function PlayerDetailClient() {
  const params = useParams();
  const playerId = params.playerId as string;
  const [data, setData] = useState<PlayerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/college-baseball/players/${playerId}`);
        const json = await res.json();
        setData(json as PlayerData);
        setLastUpdated(res.headers.get('X-Last-Updated') || new Date().toISOString());
      } catch {
        setData(null);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [playerId]);

  if (loading) {
    return (
      <main id="main-content" className="pt-24">
        <Section padding="lg">
          <Container>
            <div className="flex items-center justify-center py-20">
              <div className="w-10 h-10 border-4 border-burnt-orange/30 border-t-burnt-orange rounded-full animate-spin" />
            </div>
          </Container>
        </Section>
      </main>
    );
  }

  const player = data?.player;
  const stats = data?.statistics;

  if (!player) {
    return (
      <main id="main-content" className="pt-24">
        <Section padding="lg">
          <Container>
            <Card padding="lg" className="text-center">
              <h2 className="text-xl font-bold text-white mb-2">Player not found</h2>
              <Link href="/college-baseball/players" className="text-burnt-orange hover:text-ember">
                Back to Players
              </Link>
            </Card>
          </Container>
        </Section>
      </main>
    );
  }

  return (
    <>
      <main id="main-content" className="pt-24">
        <Section padding="lg">
          <Container>
            <div className="flex items-center gap-3 mb-2">
              <Link href="/college-baseball" className="text-white/40 hover:text-burnt-orange transition-colors">
                College Baseball
              </Link>
              <span className="text-white/40">/</span>
              <Link href="/college-baseball/players" className="text-white/40 hover:text-burnt-orange transition-colors">
                Players
              </Link>
              <span className="text-white/40">/</span>
              <span className="text-white">{player.name}</span>
            </div>

            <div className="mb-8">
              <h1 className="font-display text-3xl md:text-4xl font-bold uppercase tracking-display text-white">
                {player.name}
              </h1>
              <div className="flex flex-wrap items-center gap-3 mt-2">
                {player.position && <Badge variant="primary">{player.position}</Badge>}
                {player.jerseyNumber && <Badge variant="secondary">#{player.jerseyNumber}</Badge>}
                {player.team && (
                  <Link href={`/college-baseball/teams/${player.team.id}`} className="text-white/60 hover:text-burnt-orange transition-colors text-sm">
                    {player.team.name}
                  </Link>
                )}
              </div>
            </div>

            {/* Bio */}
            <Card padding="lg" className="mb-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {player.height && <div><span className="text-xs text-white/40 block">Height</span><span className="text-white font-medium">{player.height}</span></div>}
                {player.weight && <div><span className="text-xs text-white/40 block">Weight</span><span className="text-white font-medium">{player.weight} lbs</span></div>}
                {player.dateOfBirth && <div><span className="text-xs text-white/40 block">DOB</span><span className="text-white font-medium">{player.dateOfBirth}</span></div>}
                {player.team?.conference?.name && <div><span className="text-xs text-white/40 block">Conference</span><span className="text-white font-medium">{player.team.conference.name}</span></div>}
              </div>
            </Card>

            {/* Batting Stats */}
            {stats?.batting && (
              <Card padding="none" className="mb-6 overflow-hidden">
                <div className="px-4 py-3 bg-charcoal border-b border-white/15">
                  <h2 className="font-display text-lg font-bold text-white">Batting Statistics</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/15">
                        {['G', 'AB', 'R', 'H', '2B', '3B', 'HR', 'RBI', 'BB', 'SO', 'SB', 'AVG', 'OBP', 'SLG', 'OPS'].map((h) => (
                          <th key={h} className="py-3 px-3 text-xs font-semibold text-white/40 uppercase text-center">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-white/10">
                        <td className="py-3 px-3 text-center text-white">{stats.batting.games}</td>
                        <td className="py-3 px-3 text-center text-white">{stats.batting.atBats}</td>
                        <td className="py-3 px-3 text-center text-white">{stats.batting.runs}</td>
                        <td className="py-3 px-3 text-center text-white">{stats.batting.hits}</td>
                        <td className="py-3 px-3 text-center text-white">{stats.batting.doubles}</td>
                        <td className="py-3 px-3 text-center text-white">{stats.batting.triples}</td>
                        <td className="py-3 px-3 text-center text-burnt-orange font-bold">{stats.batting.homeRuns}</td>
                        <td className="py-3 px-3 text-center text-white">{stats.batting.rbi}</td>
                        <td className="py-3 px-3 text-center text-white">{stats.batting.walks}</td>
                        <td className="py-3 px-3 text-center text-white">{stats.batting.strikeouts}</td>
                        <td className="py-3 px-3 text-center text-white">{stats.batting.stolenBases}</td>
                        <td className="py-3 px-3 text-center text-white font-mono">{stats.batting.battingAverage.toFixed(3)}</td>
                        <td className="py-3 px-3 text-center text-white font-mono">{stats.batting.onBasePercentage.toFixed(3)}</td>
                        <td className="py-3 px-3 text-center text-white font-mono">{stats.batting.sluggingPercentage.toFixed(3)}</td>
                        <td className="py-3 px-3 text-center text-burnt-orange font-bold font-mono">{stats.batting.ops.toFixed(3)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </Card>
            )}

            {/* Pitching Stats */}
            {stats?.pitching && (
              <Card padding="none" className="mb-6 overflow-hidden">
                <div className="px-4 py-3 bg-charcoal border-b border-white/15">
                  <h2 className="font-display text-lg font-bold text-white">Pitching Statistics</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/15">
                        {['G', 'GS', 'W', 'L', 'SV', 'IP', 'H', 'ER', 'BB', 'SO', 'ERA', 'WHIP'].map((h) => (
                          <th key={h} className="py-3 px-3 text-xs font-semibold text-white/40 uppercase text-center">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-white/10">
                        <td className="py-3 px-3 text-center text-white">{stats.pitching.games}</td>
                        <td className="py-3 px-3 text-center text-white">{stats.pitching.gamesStarted}</td>
                        <td className="py-3 px-3 text-center text-[#2E7D32] font-bold">{stats.pitching.wins}</td>
                        <td className="py-3 px-3 text-center text-[#C62828] font-bold">{stats.pitching.losses}</td>
                        <td className="py-3 px-3 text-center text-white">{stats.pitching.saves}</td>
                        <td className="py-3 px-3 text-center text-white">{stats.pitching.inningsPitched.toFixed(1)}</td>
                        <td className="py-3 px-3 text-center text-white">{stats.pitching.hits}</td>
                        <td className="py-3 px-3 text-center text-white">{stats.pitching.earnedRuns}</td>
                        <td className="py-3 px-3 text-center text-white">{stats.pitching.walks}</td>
                        <td className="py-3 px-3 text-center text-white">{stats.pitching.strikeouts}</td>
                        <td className="py-3 px-3 text-center text-burnt-orange font-bold font-mono">{stats.pitching.era.toFixed(2)}</td>
                        <td className="py-3 px-3 text-center text-white font-mono">{stats.pitching.whip.toFixed(2)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </Card>
            )}

            {lastUpdated && <DataAttribution lastUpdated={lastUpdated} className="mt-6" />}
          </Container>
        </Section>
      </main>
      <Footer />
    </>
  );
}
