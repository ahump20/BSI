'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge, DataSourceBadge, LiveBadge } from '@/components/ui/Badge';
import { ScrollReveal } from '@/components/cinematic/ScrollReveal';
import { Navbar } from '@/components/layout-ds/Navbar';
import { Footer } from '@/components/layout-ds/Footer';
import { Skeleton } from '@/components/ui/Skeleton';

const navItems = [
  { label: 'Home', href: '/' },
  { label: 'College Baseball', href: '/college-baseball' },
  { label: 'MLB', href: '/mlb' },
  { label: 'NFL', href: '/nfl' },
  { label: 'Dashboard', href: '/dashboard' },
];

interface BattingLine {
  player: { id: string; name: string; position: string };
  ab: number;
  r: number;
  h: number;
  rbi: number;
  bb: number;
  so: number;
  avg: string;
}

interface PitchingLine {
  player: { id: string; name: string };
  decision?: 'W' | 'L' | 'S' | 'H' | 'BS';
  ip: string;
  h: number;
  r: number;
  er: number;
  bb: number;
  so: number;
  pitches?: number;
  strikes?: number;
  era: string;
}

interface Play {
  id: string;
  inning: number;
  halfInning: 'top' | 'bottom';
  description: string;
  result: string;
  isScoring: boolean;
  runsScored: number;
  scoreAfter: { away: number; home: number };
}

interface GameData {
  id: number;
  date: string;
  status: {
    state: string;
    detailedState: string;
    inning?: number;
    inningState?: string;
    isLive: boolean;
    isFinal: boolean;
  };
  teams: {
    away: {
      name: string;
      abbreviation: string;
      score: number;
      isWinner: boolean;
      record?: string;
    };
    home: {
      name: string;
      abbreviation: string;
      score: number;
      isWinner: boolean;
      record?: string;
    };
  };
  venue: { name: string };
  linescore?: {
    innings: Array<{ away: number; home: number }>;
    totals: {
      away: { runs: number; hits: number; errors: number };
      home: { runs: number; hits: number; errors: number };
    };
  };
  boxscore?: {
    away: { batting: BattingLine[]; pitching: PitchingLine[] };
    home: { batting: BattingLine[]; pitching: PitchingLine[] };
  };
  plays?: Play[];
}

interface DataMeta {
  dataSource: string;
  lastUpdated: string;
  timezone: string;
}

type TabType = 'boxscore' | 'playbyplay' | 'teamstats';

function formatTimestamp(isoString?: string): string {
  const date = isoString ? new Date(isoString) : new Date();
  return (
    date.toLocaleString('en-US', {
      timeZone: 'America/Chicago',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }) + ' CT'
  );
}

interface GameDetailClientProps {
  gameId: string;
}

export default function GameDetailClient({ gameId }: GameDetailClientProps) {
  const [game, setGame] = useState<GameData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState<DataMeta | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('boxscore');

  const fetchGame = useCallback(async () => {
    if (!gameId) return;

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/mlb/game/${gameId}`);
      if (!res.ok) throw new Error('Failed to fetch game data');
      const data = await res.json();

      if (data.game) {
        setGame(data.game);
      }
      if (data.meta) {
        setMeta(data.meta);
      }
      setLoading(false);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      setLoading(false);
    }
  }, [gameId]);

  useEffect(() => {
    fetchGame();
  }, [fetchGame]);

  useEffect(() => {
    if (game?.status.isLive) {
      const interval = setInterval(fetchGame, 30000);
      return () => clearInterval(interval);
    }
  }, [game?.status.isLive, fetchGame]);

  const tabs: { id: TabType; label: string }[] = [
    { id: 'boxscore', label: 'Box Score' },
    { id: 'playbyplay', label: 'Play-by-Play' },
    { id: 'teamstats', label: 'Team Stats' },
  ];

  const LineScore = () => {
    if (!game?.linescore) return null;
    const innings = game.linescore.innings;
    const maxInnings = Math.max(innings.length, 9);

    return (
      <div className="overflow-x-auto">
        <table className="w-full min-w-[600px] text-sm">
          <thead>
            <tr className="border-b border-border-subtle">
              <th className="text-left p-2 text-text-tertiary font-medium w-32">Team</th>
              {Array.from({ length: maxInnings }, (_, i) => (
                <th key={i} className="text-center p-2 text-text-tertiary font-medium w-8">
                  {i + 1}
                </th>
              ))}
              <th className="text-center p-2 text-burnt-orange font-bold w-10 border-l border-border-subtle">
                R
              </th>
              <th className="text-center p-2 text-text-tertiary font-medium w-10">H</th>
              <th className="text-center p-2 text-text-tertiary font-medium w-10">E</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-border-subtle">
              <td className="p-2 font-semibold text-white">{game.teams.away.abbreviation}</td>
              {Array.from({ length: maxInnings }, (_, i) => (
                <td key={i} className="text-center p-2 text-text-secondary font-mono">
                  {innings[i]?.away ?? '-'}
                </td>
              ))}
              <td className="text-center p-2 text-white font-bold font-mono border-l border-border-subtle">
                {game.linescore.totals.away.runs}
              </td>
              <td className="text-center p-2 text-text-secondary font-mono">
                {game.linescore.totals.away.hits}
              </td>
              <td className="text-center p-2 text-text-secondary font-mono">
                {game.linescore.totals.away.errors}
              </td>
            </tr>
            <tr>
              <td className="p-2 font-semibold text-white">{game.teams.home.abbreviation}</td>
              {Array.from({ length: maxInnings }, (_, i) => (
                <td key={i} className="text-center p-2 text-text-secondary font-mono">
                  {innings[i]?.home ?? '-'}
                </td>
              ))}
              <td className="text-center p-2 text-white font-bold font-mono border-l border-border-subtle">
                {game.linescore.totals.home.runs}
              </td>
              <td className="text-center p-2 text-text-secondary font-mono">
                {game.linescore.totals.home.hits}
              </td>
              <td className="text-center p-2 text-text-secondary font-mono">
                {game.linescore.totals.home.errors}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  };

  const BoxScoreContent = () => {
    if (!game?.boxscore) {
      return (
        <div className="text-center py-8 text-text-secondary">Box score data not available yet</div>
      );
    }

    const BattingTable = ({
      team,
      data,
      teamName,
    }: {
      team: 'away' | 'home';
      data: BattingLine[];
      teamName: string;
    }) => (
      <Card variant="default" padding="md" className="mb-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <span className="w-8 h-8 bg-charcoal rounded-full flex items-center justify-center text-xs font-bold text-burnt-orange">
            {game?.teams[team].abbreviation}
          </span>
          {teamName} Batting
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] text-sm">
            <thead>
              <tr className="border-b-2 border-burnt-orange">
                <th className="text-left p-2 text-copper font-semibold">Batter</th>
                <th className="text-center p-2 text-copper font-semibold">AB</th>
                <th className="text-center p-2 text-copper font-semibold">R</th>
                <th className="text-center p-2 text-copper font-semibold">H</th>
                <th className="text-center p-2 text-copper font-semibold">RBI</th>
                <th className="text-center p-2 text-copper font-semibold">BB</th>
                <th className="text-center p-2 text-copper font-semibold">SO</th>
                <th className="text-center p-2 text-copper font-semibold">AVG</th>
              </tr>
            </thead>
            <tbody>
              {data.map((line, idx) => (
                <tr
                  key={idx}
                  className={`border-b border-border-subtle ${line.h >= 2 ? 'bg-success/5' : ''}`}
                >
                  <td className="p-2 text-white">
                    <span className="font-medium">{line.player.name}</span>
                    <span className="text-text-tertiary text-xs ml-2">{line.player.position}</span>
                  </td>
                  <td className="text-center p-2 text-text-secondary font-mono">{line.ab}</td>
                  <td className="text-center p-2 text-text-secondary font-mono">{line.r}</td>
                  <td
                    className={`text-center p-2 font-mono ${line.h >= 2 ? 'text-success font-bold' : 'text-text-secondary'}`}
                  >
                    {line.h}
                  </td>
                  <td className="text-center p-2 text-text-secondary font-mono">{line.rbi}</td>
                  <td className="text-center p-2 text-text-secondary font-mono">{line.bb}</td>
                  <td className="text-center p-2 text-text-secondary font-mono">{line.so}</td>
                  <td className="text-center p-2 text-text-secondary font-mono">{line.avg}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    );

    const PitchingTable = ({
      team,
      data,
      teamName,
    }: {
      team: 'away' | 'home';
      data: PitchingLine[];
      teamName: string;
    }) => (
      <Card variant="default" padding="md" className="mb-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <span className="w-8 h-8 bg-charcoal rounded-full flex items-center justify-center text-xs font-bold text-burnt-orange">
            {game?.teams[team].abbreviation}
          </span>
          {teamName} Pitching
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] text-sm">
            <thead>
              <tr className="border-b-2 border-burnt-orange">
                <th className="text-left p-2 text-copper font-semibold">Pitcher</th>
                <th className="text-center p-2 text-copper font-semibold">IP</th>
                <th className="text-center p-2 text-copper font-semibold">H</th>
                <th className="text-center p-2 text-copper font-semibold">R</th>
                <th className="text-center p-2 text-copper font-semibold">ER</th>
                <th className="text-center p-2 text-copper font-semibold">BB</th>
                <th className="text-center p-2 text-copper font-semibold">SO</th>
                <th className="text-center p-2 text-copper font-semibold">PC-S</th>
                <th className="text-center p-2 text-copper font-semibold">ERA</th>
              </tr>
            </thead>
            <tbody>
              {data.map((line, idx) => (
                <tr key={idx} className="border-b border-border-subtle">
                  <td className="p-2 text-white">
                    <span className="font-medium">{line.player.name}</span>
                    {line.decision && (
                      <span
                        className={`ml-2 text-xs font-bold ${
                          line.decision === 'W'
                            ? 'text-success'
                            : line.decision === 'L'
                              ? 'text-error'
                              : line.decision === 'S'
                                ? 'text-burnt-orange'
                                : 'text-text-tertiary'
                        }`}
                      >
                        ({line.decision})
                      </span>
                    )}
                  </td>
                  <td className="text-center p-2 text-text-secondary font-mono">{line.ip}</td>
                  <td className="text-center p-2 text-text-secondary font-mono">{line.h}</td>
                  <td className="text-center p-2 text-text-secondary font-mono">{line.r}</td>
                  <td className="text-center p-2 text-text-secondary font-mono">{line.er}</td>
                  <td className="text-center p-2 text-text-secondary font-mono">{line.bb}</td>
                  <td className="text-center p-2 text-text-secondary font-mono">{line.so}</td>
                  <td className="text-center p-2 text-text-secondary font-mono">
                    {line.pitches && line.strikes ? `${line.pitches}-${line.strikes}` : '-'}
                  </td>
                  <td className="text-center p-2 text-text-secondary font-mono">{line.era}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    );

    return (
      <div>
        <BattingTable
          team="away"
          data={game.boxscore.away.batting}
          teamName={game.teams.away.name}
        />
        <PitchingTable
          team="away"
          data={game.boxscore.away.pitching}
          teamName={game.teams.away.name}
        />
        <BattingTable
          team="home"
          data={game.boxscore.home.batting}
          teamName={game.teams.home.name}
        />
        <PitchingTable
          team="home"
          data={game.boxscore.home.pitching}
          teamName={game.teams.home.name}
        />
      </div>
    );
  };

  const PlayByPlayContent = () => {
    if (!game?.plays || game.plays.length === 0) {
      return (
        <div className="text-center py-8 text-text-secondary">
          Play-by-play data not available yet
        </div>
      );
    }

    const playsByInning: Record<string, Play[]> = {};
    game.plays.forEach((play) => {
      const key = `${play.halfInning === 'top' ? 'Top' : 'Bot'} ${play.inning}`;
      if (!playsByInning[key]) playsByInning[key] = [];
      playsByInning[key].push(play);
    });

    return (
      <div className="space-y-6">
        {Object.entries(playsByInning).map(([inning, plays]) => (
          <Card key={inning} variant="default" padding="md">
            <h3 className="text-sm font-semibold text-burnt-orange mb-4 uppercase tracking-wide">
              {inning}
            </h3>
            <div className="space-y-3">
              {plays.map((play) => (
                <div
                  key={play.id}
                  className={`p-3 rounded-lg ${play.isScoring ? 'bg-burnt-orange/10 border-l-4 border-burnt-orange' : 'bg-graphite'}`}
                >
                  <p className="text-text-secondary text-sm">{play.description}</p>
                  {play.isScoring && (
                    <div className="mt-2 flex items-center gap-2">
                      <Badge variant="primary" className="text-xs">
                        +{play.runsScored} Run{play.runsScored > 1 ? 's' : ''}
                      </Badge>
                      <span className="text-xs text-text-tertiary">
                        Score: {game?.teams.away.abbreviation} {play.scoreAfter.away} -{' '}
                        {game?.teams.home.abbreviation} {play.scoreAfter.home}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
    );
  };

  const TeamStatsContent = () => (
    <div className="grid gap-6 md:grid-cols-2">
      <Card variant="default" padding="md">
        <h3 className="text-lg font-semibold text-white mb-4">Team Comparison</h3>
        <div className="text-center py-8 text-text-tertiary">Advanced team stats coming soon</div>
      </Card>
      <Card variant="default" padding="md">
        <div className="text-center py-8 text-text-tertiary">Game insights coming soon</div>
      </Card>
    </div>
  );

  return (
    <>
      <Navbar items={navItems} />

      <main id="main-content">
        <Section padding="sm" className="border-b border-border-subtle">
          <Container>
            <nav className="flex items-center gap-2 text-sm">
              <Link
                href="/mlb"
                className="text-text-tertiary hover:text-burnt-orange transition-colors"
              >
                MLB
              </Link>
              <span className="text-text-tertiary">/</span>
              <Link
                href="/mlb/scores"
                className="text-text-tertiary hover:text-burnt-orange transition-colors"
              >
                Scores
              </Link>
              <span className="text-text-tertiary">/</span>
              <span className="text-white font-medium">Game {gameId}</span>
            </nav>
          </Container>
        </Section>

        {loading ? (
          <Section padding="lg" background="charcoal">
            <Container>
              <div className="space-y-6">
                <Skeleton variant="text" width={300} height={40} />
                <Skeleton variant="rect" width="100%" height={100} />
                <Skeleton variant="rect" width="100%" height={400} />
              </div>
            </Container>
          </Section>
        ) : error ? (
          <Section padding="lg" background="charcoal">
            <Container>
              <Card variant="default" padding="lg" className="bg-error/10 border-error/30">
                <p className="text-error font-semibold">Unable to Load Game</p>
                <p className="text-text-secondary text-sm mt-1">{error}</p>
                <button
                  onClick={fetchGame}
                  className="mt-4 px-4 py-2 bg-burnt-orange text-white rounded-lg hover:bg-burnt-orange/80 transition-colors"
                >
                  Retry
                </button>
              </Card>
            </Container>
          </Section>
        ) : game ? (
          <>
            <Section padding="md" className="relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-radial from-burnt-orange/10 via-transparent to-transparent pointer-events-none" />
              <Container>
                <ScrollReveal>
                  <div className="flex items-center gap-3 mb-4">
                    <Badge variant="secondary">
                      {new Date(game.date).toLocaleDateString('en-US', {
                        weekday: 'long',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </Badge>
                    {game.status.isLive && <LiveBadge />}
                  </div>

                  <div className="flex items-center justify-center gap-8 md:gap-16 py-6">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-charcoal rounded-full flex items-center justify-center text-xl font-bold text-burnt-orange mx-auto mb-2">
                        {game.teams.away.abbreviation}
                      </div>
                      <p className="font-semibold text-white">{game.teams.away.name}</p>
                      <p className="text-xs text-text-tertiary">{game.teams.away.record || ''}</p>
                      <p
                        className={`text-4xl font-bold font-mono mt-2 ${game.status.isFinal && game.teams.away.isWinner ? 'text-white' : 'text-text-secondary'}`}
                      >
                        {game.teams.away.score}
                      </p>
                    </div>

                    <div className="text-center">
                      {game.status.isLive ? (
                        <span className="flex items-center justify-center gap-1.5 text-success font-semibold">
                          <span className="w-2 h-2 bg-success rounded-full animate-pulse" />
                          {game.status.inningState} {game.status.inning}
                        </span>
                      ) : game.status.isFinal ? (
                        <span className="text-text-tertiary font-semibold">FINAL</span>
                      ) : (
                        <span className="text-burnt-orange font-semibold">
                          {game.status.detailedState}
                        </span>
                      )}
                      <p className="text-xs text-text-tertiary mt-1">{game.venue?.name}</p>
                    </div>

                    <div className="text-center">
                      <div className="w-16 h-16 bg-charcoal rounded-full flex items-center justify-center text-xl font-bold text-burnt-orange mx-auto mb-2">
                        {game.teams.home.abbreviation}
                      </div>
                      <p className="font-semibold text-white">{game.teams.home.name}</p>
                      <p className="text-xs text-text-tertiary">{game.teams.home.record || ''}</p>
                      <p
                        className={`text-4xl font-bold font-mono mt-2 ${game.status.isFinal && game.teams.home.isWinner ? 'text-white' : 'text-text-secondary'}`}
                      >
                        {game.teams.home.score}
                      </p>
                    </div>
                  </div>

                  {game.linescore && (
                    <Card variant="default" padding="sm" className="mt-4">
                      <LineScore />
                    </Card>
                  )}
                </ScrollReveal>
              </Container>
            </Section>

            <Section padding="lg" background="charcoal" borderTop>
              <Container>
                <div className="flex gap-2 mb-8 border-b border-border-subtle overflow-x-auto pb-px">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`px-6 py-3 text-sm font-semibold whitespace-nowrap transition-colors border-b-2 -mb-px ${activeTab === tab.id ? 'text-burnt-orange border-burnt-orange' : 'text-text-tertiary border-transparent hover:text-white'}`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <ScrollReveal key={activeTab}>
                  {activeTab === 'boxscore' && <BoxScoreContent />}
                  {activeTab === 'playbyplay' && <PlayByPlayContent />}
                  {activeTab === 'teamstats' && <TeamStatsContent />}
                </ScrollReveal>

                <div className="mt-8 pt-4 border-t border-border-subtle flex items-center justify-between flex-wrap gap-4">
                  <DataSourceBadge
                    source={meta?.dataSource || 'MLB Stats API'}
                    timestamp={formatTimestamp(meta?.lastUpdated)}
                  />
                  {game.status.isLive && (
                    <span className="text-xs text-text-tertiary">
                      Auto-refreshing every 30 seconds
                    </span>
                  )}
                </div>
              </Container>
            </Section>
          </>
        ) : null}
      </main>

      <Footer />
    </>
  );
}
