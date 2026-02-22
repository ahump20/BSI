'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useSportData } from '@/lib/hooks/useSportData';
import { LiveScoreCard } from '@/components/college-baseball/LiveScoreCard';
import { SkeletonScoreCard } from '@/components/ui/Skeleton';
import { ScrollReveal } from '@/components/cinematic';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Badge } from '@/components/ui/Badge';
import { getDateOffset } from '@/lib/utils/timezone';
import type { LiveGame, LiveGameTeam } from '@/lib/hooks/useLiveScores';

// ---------------------------------------------------------------------------
// Types matching the /api/college-baseball/scores response
// ---------------------------------------------------------------------------

/** ESPN scoreboard event shape (returned by handleCollegeBaseballScores) */
interface ESPNEvent {
  id?: string;
  date?: string;
  status?: {
    type?: { state?: string; shortDetail?: string; detail?: string };
    period?: number;
  };
  competitions?: Array<{
    competitors?: Array<{
      homeAway?: string;
      score?: string | number | { value?: number; displayValue?: string };
      team?: {
        id?: string;
        displayName?: string;
        abbreviation?: string;
        name?: string;
        shortDisplayName?: string;
      };
      records?: Array<{ summary?: string }>;
      curatedRank?: { current?: number };
    }>;
    venue?: { fullName?: string };
  }>;
}

/** Shape from the schedule handler (already transformed) */
interface TransformedGame {
  id: string;
  date: string;
  time: string;
  status: string;
  inning?: number;
  homeTeam: {
    id: string;
    name: string;
    shortName: string;
    conference: string;
    score: number | null;
    record: { wins: number; losses: number };
  };
  awayTeam: {
    id: string;
    name: string;
    shortName: string;
    conference: string;
    score: number | null;
    record: { wins: number; losses: number };
  };
  venue: string;
}

type ScoresResponse = {
  data?: ESPNEvent[] | TransformedGame[];
  games?: TransformedGame[];
  totalCount?: number;
  success?: boolean;
  live?: boolean;
  meta?: { dataSource?: string; lastUpdated?: string };
  timestamp?: string;
};

// ---------------------------------------------------------------------------
// Transform ESPN events → LiveGame (reusable)
// ---------------------------------------------------------------------------

function isTransformedGame(item: unknown): item is TransformedGame {
  return typeof item === 'object' && item !== null && 'homeTeam' in item && 'awayTeam' in item && 'status' in item && typeof (item as TransformedGame).status === 'string';
}

function transformESPNEventToLiveGame(event: ESPNEvent): LiveGame | null {
  const comp = event.competitions?.[0];
  if (!comp?.competitors) return null;

  const homeSide = comp.competitors.find((c) => c.homeAway === 'home');
  const awaySide = comp.competitors.find((c) => c.homeAway === 'away');
  if (!homeSide?.team || !awaySide?.team) return null;

  const state = event.status?.type?.state || 'pre';

  const parseScore = (raw: string | number | { value?: number; displayValue?: string } | undefined): number => {
    if (raw === undefined || raw === null) return 0;
    if (typeof raw === 'number') return raw;
    if (typeof raw === 'string') return parseInt(raw, 10) || 0;
    return Number(raw.value ?? raw.displayValue ?? 0);
  };

  const makeTeam = (side: NonNullable<typeof homeSide>): LiveGameTeam => ({
    id: parseInt(side.team?.id || '0', 10),
    name: side.team?.displayName || side.team?.name || '',
    shortName: side.team?.abbreviation || side.team?.shortDisplayName || '',
    score: parseScore(side.score),
    record: side.records?.[0]?.summary || undefined,
    conference: '',
    ranking: side.curatedRank?.current && side.curatedRank.current <= 25 ? side.curatedRank.current : undefined,
  });

  return {
    id: String(event.id || ''),
    status: state === 'in' ? 'in' : state === 'post' ? 'post' : 'pre',
    detailedState: event.status?.type?.shortDetail || event.status?.type?.detail || '',
    inning: state === 'in' ? event.status?.period : undefined,
    inningHalf: undefined,
    outs: undefined,
    awayTeam: makeTeam(awaySide),
    homeTeam: makeTeam(homeSide),
    startTime: event.date || '',
    venue: comp.venue?.fullName || '',
  };
}

function transformTransformedGameToLiveGame(game: TransformedGame): LiveGame {
  const statusMap: Record<string, LiveGame['status']> = {
    live: 'in',
    final: 'post',
    scheduled: 'pre',
    postponed: 'postponed',
    canceled: 'cancelled',
  };

  return {
    id: game.id,
    status: statusMap[game.status] || 'pre',
    detailedState: game.status,
    inning: game.inning,
    inningHalf: undefined,
    outs: undefined,
    awayTeam: {
      id: parseInt(game.awayTeam.id, 10) || 0,
      name: game.awayTeam.name,
      shortName: game.awayTeam.shortName,
      score: game.awayTeam.score ?? 0,
      record: game.awayTeam.record ? `${game.awayTeam.record.wins}-${game.awayTeam.record.losses}` : undefined,
      conference: game.awayTeam.conference,
      ranking: undefined,
    },
    homeTeam: {
      id: parseInt(game.homeTeam.id, 10) || 0,
      name: game.homeTeam.name,
      shortName: game.homeTeam.shortName,
      score: game.homeTeam.score ?? 0,
      record: game.homeTeam.record ? `${game.homeTeam.record.wins}-${game.homeTeam.record.losses}` : undefined,
      conference: game.homeTeam.conference,
      ranking: undefined,
    },
    startTime: game.date,
    venue: game.venue,
  };
}

// ---------------------------------------------------------------------------
// LiveScoreStrip
// ---------------------------------------------------------------------------

export function LiveScoreStrip() {
  const today = getDateOffset(0);

  const { data, loading, error } = useSportData<ScoresResponse>(
    `/api/college-baseball/scores?date=${today}`,
    { refreshInterval: 30000, refreshWhen: true },
  );

  const games = useMemo<LiveGame[]>(() => {
    const raw = data?.data || data?.games || [];
    if (!raw.length) return [];

    // Detect whether the response contains already-transformed games or raw ESPN events
    if (isTransformedGame(raw[0])) {
      return (raw as TransformedGame[]).map(transformTransformedGameToLiveGame);
    }
    return (raw as ESPNEvent[])
      .map(transformESPNEventToLiveGame)
      .filter((g): g is LiveGame => g !== null);
  }, [data]);

  const liveGames = useMemo(() => games.filter((g) => g.status === 'in'), [games]);
  const liveCount = liveGames.length;
  const hasGames = games.length > 0;

  // Sort: live first, then scheduled, then final
  const sortedGames = useMemo(() => {
    const order: Record<string, number> = { in: 0, pre: 1, post: 2, postponed: 3, cancelled: 4 };
    return [...games].sort((a, b) => (order[a.status] ?? 5) - (order[b.status] ?? 5));
  }, [games]);

  // Don't render anything during initial load if no data yet
  if (!loading && !hasGames && !error) {
    return (
      <Section padding="sm" className="py-4">
        <Container>
          <div className="text-center py-6 bg-white/5 border border-white/10 rounded-xl">
            <p className="text-white/50 text-sm">No games today</p>
            <Link href="/college-baseball/scores" className="text-burnt-orange text-sm hover:text-ember transition-colors mt-1 inline-block">
              View full schedule →
            </Link>
          </div>
        </Container>
      </Section>
    );
  }

  return (
    <Section padding="sm" className="py-4">
      <Container>
        <ScrollReveal>
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <h2 className="font-display text-lg font-bold text-white uppercase tracking-wide">
                Today&apos;s Games
              </h2>
              {liveCount > 0 && (
                <Badge variant="success" className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                  {liveCount} Live
                </Badge>
              )}
            </div>
            <Link
              href="/college-baseball/scores"
              className="text-sm text-burnt-orange hover:text-ember transition-colors"
            >
              Full Scoreboard →
            </Link>
          </div>

          {/* Score Cards */}
          {loading ? (
            <div className="flex gap-4 overflow-x-auto pb-2 -mx-1 px-1">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex-shrink-0 w-72">
                  <SkeletonScoreCard />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex gap-4 overflow-x-auto pb-2 -mx-1 px-1 snap-x snap-mandatory">
              {sortedGames.slice(0, 12).map((game) => (
                <div key={game.id} className="flex-shrink-0 w-72 snap-start">
                  <LiveScoreCard game={game} animate={false} />
                </div>
              ))}
            </div>
          )}
        </ScrollReveal>
      </Container>
    </Section>
  );
}
