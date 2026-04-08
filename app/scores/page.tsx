'use client';

import { Suspense, useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { streamAnalysis } from '@/lib/bsi-stream-client';
import type { Sport } from '@/lib/bsi-stream-client';
import { useScoresOverview } from '@/lib/hooks/useScoresOverview';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Badge } from '@/components/ui/Badge';
import { ScrollReveal } from '@/components/cinematic';

import { DataFreshnessIndicator } from '@/components/ui/DataFreshnessIndicator';
import { DataErrorBoundary } from '@/components/ui/DataErrorBoundary';
import { SkeletonScoreCard } from '@/components/ui/Skeleton';


// ── SVG Sport Icons ──

const BaseballSvg = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="currentColor" strokeWidth={1.5}>
    <circle cx="12" cy="12" r="10" />
    <path d="M5 12C5 12 8 9 12 9C16 9 19 12 19 12" />
    <path d="M5 12C5 12 8 15 12 15C16 15 19 12 19 12" />
  </svg>
);

const FootballSvg = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="currentColor" strokeWidth={1.5}>
    <ellipse cx="12" cy="12" rx="10" ry="6" transform="rotate(45 12 12)" />
    <path d="M12 7L12 17M9 10L15 14M15 10L9 14" />
  </svg>
);

const BasketballSvg = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="currentColor" strokeWidth={1.5}>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 2V22M2 12H22" />
    <path d="M4.5 4.5C8 8 8 16 4.5 19.5M19.5 4.5C16 8 16 16 19.5 19.5" />
  </svg>
);

const SPORT_ICONS: Record<string, React.FC> = {
  'college-baseball': BaseballSvg,
  mlb: BaseballSvg,
  nfl: FootballSvg,
  cfb: FootballSvg,
  nba: BasketballSvg,
};

/** Map page sport ids to the intelligence-stream Sport type. NBA excluded (no intel yet). */
const INTEL_SPORT_MAP: Record<string, Sport> = {
  'college-baseball': 'college-baseball',
  mlb: 'mlb',
  nfl: 'nfl',
  cfb: 'ncaa-football',
};

// ── Helpers ──

/** Filter out games that are not from today (prevents future-dated games inflating counts). */
function isGameToday(game: Record<string, unknown>): boolean {
  const dateStr = game.date as string | undefined;
  if (!dateStr) return false; // no date = can't confirm it's today
  const gameDate = new Date(dateStr);
  if (Number.isNaN(gameDate.getTime())) return false;
  const now = new Date();
  // Same calendar date (UTC)
  return gameDate.getUTCFullYear() === now.getUTCFullYear()
    && gameDate.getUTCMonth() === now.getUTCMonth()
    && gameDate.getUTCDate() === now.getUTCDate();
}

/** Count only games from today (or in-progress regardless of date). */
function countTodayGames(games: Array<Record<string, unknown>>): number {
  return games.filter(g => {
    // Always count live/in-progress games
    const status = g.status as Record<string, unknown> | undefined;
    const state = status?.type as Record<string, unknown> | undefined;
    if (state?.state === 'in' || status?.state === 'in') return true;
    // For pre/post games, only count if date is today
    return isGameToday(g);
  }).length;
}

// ── Game Types ──

interface GameTeam {
  name: string;
  abbreviation: string;
  logo?: string;
  score?: string | number;
}

interface FeaturedGame {
  id: string;
  away: GameTeam;
  home: GameTeam;
  state: 'live' | 'final' | 'upcoming';
  detail: string;
  href: string;
}

interface SportSection {
  id: string;
  name: string;
  href: string;
  description: string;
  liveCount: number;
  todayCount: number;
  season: string;
  isActive: boolean;
  loaded: boolean;
  fetchError?: boolean;
  featured: FeaturedGame[];
}

const SPORT_SECTIONS: SportSection[] = [
  {
    id: 'college-baseball', name: 'College Baseball', href: '/college-baseball/scores',
    description: 'Every D1 program — live scores, box scores, and recaps',
    liveCount: 0, todayCount: 0, season: 'Feb - Jun', isActive: false, loaded: false, featured: [],
  },
  // Other sports hidden until their data surfaces are functional
];

function createSportSections(): SportSection[] {
  return SPORT_SECTIONS.map((sport) => ({ ...sport, featured: [...sport.featured] }));
}

function countLiveMlbGames(payload: Record<string, unknown>): number {
  const games = (payload.games as Array<Record<string, unknown>>) || [];
  return games.filter((game) => {
    const status = (game.status as Record<string, unknown>) || {};
    const type = (status.type as Record<string, unknown>) || {};
    const state = String(type.state || '').toLowerCase();
    return state === 'in';
  }).length;
}

function countLiveEspnGames(payload: Record<string, unknown>): number {
  const games = (payload.games as Array<Record<string, unknown>>) || [];
  return games.filter((game) => {
    const status = (game.status as Record<string, unknown>) || {};
    const type = (status.type as Record<string, unknown>) || {};
    return !type.completed && Number(status.period || 0) > 0;
  }).length;
}

function countLiveCfbGames(payload: Record<string, unknown>): number {
  const games = (payload.games as Array<Record<string, unknown>>) || [];
  return games.filter((game) => {
    const status = (game.status as Record<string, Record<string, unknown>>) || {};
    return String(status.type?.state) === 'in';
  }).length;
}

// ── Game State Badge ──

function GameStateBadge({ state, detail }: { state: string; detail: string }) {
  if (state === 'live') {
    return (
      <span className="flex items-center gap-1 text-success text-xs font-semibold">
        <span className="w-1.5 h-1.5 bg-success rounded-full animate-pulse" />
        LIVE
      </span>
    );
  }
  if (state === 'final') {
    return <span className="text-bsi-dust/60 text-xs font-semibold">FINAL</span>;
  }
  return <span className="text-burnt-orange text-xs">{detail || 'Upcoming'}</span>;
}

// ── Mini Score Card ──

function MiniScoreCard({ game, sport }: { game: FeaturedGame; sport?: string }) {
  const [intelOpen, setIntelOpen] = useState(false);
  const [intelText, setIntelText] = useState('');
  const [intelLoading, setIntelLoading] = useState(false);
  const [intelCached, setIntelCached] = useState(false);
  const [intelError, setIntelError] = useState('');
  const abortRef = useRef<(() => void) | null>(null);

  const intelSport = sport ? INTEL_SPORT_MAP[sport] : undefined;
  const canShowIntel = game.state === 'upcoming' && !!intelSport;

  function handleIntelToggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    if (intelOpen) {
      // Close — abort any in-flight stream
      abortRef.current?.();
      abortRef.current = null;
      setIntelOpen(false);
      setIntelText('');
      setIntelLoading(false);
      setIntelCached(false);
      setIntelError('');
      return;
    }

    // Open and start streaming
    setIntelOpen(true);
    setIntelText('');
    setIntelLoading(true);
    setIntelCached(false);
    setIntelError('');

    const abort = streamAnalysis({
      question: `Pregame breakdown: ${game.away.name || game.away.abbreviation} at ${game.home.name || game.home.abbreviation}`,
      context: {
        sport: intelSport!,
        homeTeam: game.home.name || game.home.abbreviation,
        awayTeam: game.away.name || game.away.abbreviation,
      },
      analysisType: 'pregame',
      onToken: (text) => {
        setIntelLoading(false);
        setIntelText(prev => prev + text);
      },
      onDone: (meta) => {
        setIntelLoading(false);
        setIntelCached(meta.cached);
      },
      onError: (err) => {
        setIntelLoading(false);
        setIntelError(err.message || 'Failed to load intel');
      },
    });

    abortRef.current = abort;
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => { abortRef.current?.(); };
  }, []);

  const cardContent = (
    <div className={`rounded-sm border p-3.5 transition-all ${
      game.state === 'live'
        ? 'border-success/30 bg-[linear-gradient(180deg,rgba(16,185,129,0.09)_0%,rgba(14,15,18,0.96)_100%)]'
        : 'border-border-vintage bg-[linear-gradient(180deg,rgba(191,87,0,0.08)_0%,rgba(20,20,20,0.94)_100%)] hover:border-burnt-orange/50'
    }`}>
      <div className="mb-3 flex items-start justify-between gap-3">
        <GameStateBadge state={game.state} detail={game.detail} />
        <span className="max-w-[120px] text-right text-[10px] uppercase tracking-[0.12em] text-bsi-dust/60">
          {game.detail || 'Matchup'}
        </span>
      </div>
      <div className="space-y-2.5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-2.5">
            {game.away.logo ? (
              <img src={game.away.logo} alt={`${game.away.name || game.away.abbreviation} logo`} className="w-4 h-4 object-contain" loading="lazy" />
            ) : (
              <span className="mt-0.5 inline-flex min-w-[2rem] justify-center rounded-sm border border-border-vintage px-1.5 py-1 text-[10px] font-bold text-bsi-dust">
                {game.away.abbreviation}
              </span>
            )}
            <div className="min-w-0">
              <span className="block text-sm font-medium leading-tight text-bsi-bone line-clamp-2">
                {game.away.name || game.away.abbreviation}
              </span>
              <span className="mt-1 block text-[10px] uppercase tracking-[0.12em] text-bsi-dust/60">
                Away club
              </span>
            </div>
          </div>
          <span className={`font-mono text-sm font-bold ${
            game.state === 'final' && Number(game.away.score) > Number(game.home.score) ? 'text-bsi-bone' : 'text-bsi-dust'
          }`}>
            {game.away.score ?? '-'}
          </span>
        </div>
        <div className="flex items-start justify-between gap-3 border-t border-border-vintage/60 pt-2.5">
          <div className="flex min-w-0 items-start gap-2.5">
            {game.home.logo ? (
              <img src={game.home.logo} alt={`${game.home.name || game.home.abbreviation} logo`} className="w-4 h-4 object-contain" loading="lazy" />
            ) : (
              <span className="mt-0.5 inline-flex min-w-[2rem] justify-center rounded-sm border border-border-vintage px-1.5 py-1 text-[10px] font-bold text-bsi-dust">
                {game.home.abbreviation}
              </span>
            )}
            <div className="min-w-0">
              <span className="block text-sm font-medium leading-tight text-bsi-bone line-clamp-2">
                {game.home.name || game.home.abbreviation}
              </span>
              <span className="mt-1 block text-[10px] uppercase tracking-[0.12em] text-bsi-dust/60">
                Home club
              </span>
            </div>
          </div>
          <span className={`font-mono text-sm font-bold ${
            game.state === 'final' && Number(game.home.score) > Number(game.away.score) ? 'text-bsi-bone' : 'text-bsi-dust'
          }`}>
            {game.home.score ?? '-'}
          </span>
        </div>
      </div>

      {/* Pregame Intel button */}
      {canShowIntel && (
        <div className="mt-2 pt-2 border-t border-border-vintage">
          <button
            onClick={handleIntelToggle}
            className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-burnt-orange hover:text-ember transition-colors"
          >
            <svg viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3">
              <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm-.75 3.5a.75.75 0 011.5 0v4a.75.75 0 01-1.5 0v-4zM8 11a.75.75 0 100 1.5.75.75 0 000-1.5z" />
            </svg>
            {intelOpen ? 'Close' : 'Intel'}
          </button>

          {/* Expanded intel panel */}
          {intelOpen && (
            <div className="mt-2 max-h-48 overflow-y-auto rounded-sm bg-midnight/50 p-2">
              {intelLoading && (
                <div className="flex items-center gap-2 text-bsi-dust/60 text-xs">
                  <span className="w-1.5 h-1.5 bg-burnt-orange rounded-full animate-pulse" />
                  Loading pregame intel...
                </div>
              )}
              {intelError && (
                <p className="text-xs text-error">{intelError}</p>
              )}
              {intelText && (
                <p className="text-xs text-bsi-dust leading-relaxed whitespace-pre-wrap">{intelText}</p>
              )}
              {intelCached && !intelLoading && (
                <span className="inline-block mt-1.5 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider bg-burnt-orange/20 text-burnt-orange rounded-sm">
                  Cached
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );

  // When intel is open, don't wrap in a Link (clicks inside the expanded panel
  // shouldn't navigate away). Otherwise keep the existing Link wrapper.
  if (intelOpen) {
    return <div className="block">{cardContent}</div>;
  }

  return (
    <Link href={game.href} className="block">
      {cardContent}
    </Link>
  );
}

// ── Helpers to extract featured games ──

function extractMLBGames(data: Record<string, unknown>): FeaturedGame[] {
  const games = (data?.games as Array<Record<string, unknown>>) || [];
  return games.slice(0, 4).map(g => {
    // MLB scores API returns teams as an ESPN-format array with homeAway field,
    // OR as a pre-normalized {away, home} object. Handle both.
    let awayData: Record<string, unknown> = {};
    let homeData: Record<string, unknown> = {};
    let awayTeamName = '';
    let homeTeamName = '';
    let awayAbbr = 'AWY';
    let homeAbbr = 'HME';
    let awayLogo = '';
    let homeLogo = '';
    let awayScore = '';
    let homeScore = '';

    if (Array.isArray(g.teams)) {
      const competitors = g.teams as Array<Record<string, unknown>>;
      const awayEntry = competitors.find(t => t.homeAway === 'away') || competitors[0] || {};
      const homeEntry = competitors.find(t => t.homeAway === 'home') || competitors[1] || {};
      const awayTeam = (awayEntry.team || {}) as Record<string, string>;
      const homeTeam = (homeEntry.team || {}) as Record<string, string>;
      awayTeamName = String(awayTeam.displayName || awayTeam.shortDisplayName || '');
      homeTeamName = String(homeTeam.displayName || homeTeam.shortDisplayName || '');
      awayAbbr = String(awayTeam.abbreviation || 'AWY');
      homeAbbr = String(homeTeam.abbreviation || 'HME');
      awayLogo = String(awayTeam.logo || '');
      homeLogo = String(homeTeam.logo || '');
      awayScore = String(awayEntry.score ?? '');
      homeScore = String(homeEntry.score ?? '');
    } else if (g.teams && typeof g.teams === 'object') {
      awayData = ((g.teams as Record<string, unknown>)?.away as Record<string, unknown>) || {};
      homeData = ((g.teams as Record<string, unknown>)?.home as Record<string, unknown>) || {};
      awayTeamName = String(awayData.name || '');
      homeTeamName = String(homeData.name || '');
      awayAbbr = String(awayData.abbreviation || 'AWY');
      homeAbbr = String(homeData.abbreviation || 'HME');
      awayLogo = String(awayData.logo || '');
      homeLogo = String(homeData.logo || '');
      awayScore = String(awayData.score ?? '');
      homeScore = String(homeData.score ?? '');
    }

    const status = (g.status || {}) as Record<string, unknown>;
    const statusType = (status.type || {}) as Record<string, unknown>;
    const stateStr = String(statusType.state || '').toLowerCase();
    const isLive = stateStr === 'in';
    const isFinal = stateStr === 'post' || Boolean(statusType.completed);

    return {
      id: String(g.gamePk || g.id || ''),
      away: { name: awayTeamName, abbreviation: awayAbbr, logo: awayLogo, score: awayScore },
      home: { name: homeTeamName, abbreviation: homeAbbr, logo: homeLogo, score: homeScore },
      state: isLive ? 'live' : isFinal ? 'final' : 'upcoming',
      detail: String(statusType.detail || statusType.description || ''),
      href: `/mlb/game/${g.gamePk || g.id}`,
    } satisfies FeaturedGame;
  });
}

function extractESPNGames(data: Record<string, unknown>, sport: string): FeaturedGame[] {
  const games = (data?.games as Array<Record<string, unknown>>) || [];
  return games.slice(0, 4).map(g => {
    const teams = (g.teams || g.competitors) as Array<Record<string, unknown>> || [];
    const away = teams.find(t => t.homeAway === 'away') || teams[0] || {};
    const home = teams.find(t => t.homeAway === 'home') || teams[1] || {};
    const status = g.status as Record<string, Record<string, unknown>> || {};
    const state = String(status?.type?.state || 'pre');
    const completed = Boolean(status?.type?.completed);

    const awayTeam = (away.team || {}) as Record<string, string>;
    const homeTeam = (home.team || {}) as Record<string, string>;
    const awayLogos = (awayTeam.logos || []) as Array<Record<string, string>>;
    const homeLogos = (homeTeam.logos || []) as Array<Record<string, string>>;

    return {
      id: String(g.id || ''),
      away: {
        name: String(awayTeam.displayName || ''),
        abbreviation: String(awayTeam.abbreviation || 'AWY'),
        logo: String(awayTeam.logo || awayLogos[0]?.href || ''),
        score: String((away as Record<string, string>).score ?? ''),
      },
      home: {
        name: String(homeTeam.displayName || ''),
        abbreviation: String(homeTeam.abbreviation || 'HME'),
        logo: String(homeTeam.logo || homeLogos[0]?.href || ''),
        score: String((home as Record<string, string>).score ?? ''),
      },
      state: state === 'in' ? 'live' : completed ? 'final' : 'upcoming',
      detail: String(status?.type?.detail || status?.type?.shortDetail || ''),
      href: `/${sport}/game/${g.id}`,
    } satisfies FeaturedGame;
  });
}

function extractCBBGames(data: Record<string, unknown>): FeaturedGame[] {
  const games = ((data?.data || data?.games) as Array<Record<string, unknown>>) || [];
  const teamName = (t: unknown): string => {
    if (typeof t === 'string') return t;
    if (t && typeof t === 'object' && 'name' in t) return String((t as Record<string, unknown>).name || '');
    if (t && typeof t === 'object' && 'displayName' in t) return String((t as Record<string, unknown>).displayName || '');
    return '';
  };
  return games.slice(0, 4).map(g => {
    const awayTeam = (g.awayTeam as Record<string, unknown>) || {};
    const homeTeam = (g.homeTeam as Record<string, unknown>) || {};
    const awayName = teamName(g.awayTeam);
    const homeName = teamName(g.homeTeam);
    return {
    id: String(g.id || ''),
    away: {
      name: awayName,
      abbreviation: String(g.awayAbbreviation || awayTeam.shortName || awayTeam.abbreviation || (awayName ? awayName.substring(0, 3).toUpperCase() : 'AWY')),
      logo: String(g.awayLogo || awayTeam.logo || ''),
      score: String(g.awayScore ?? awayTeam.score ?? ''),
    },
    home: {
      name: homeName,
      abbreviation: String(g.homeAbbreviation || homeTeam.shortName || homeTeam.abbreviation || (homeName ? homeName.substring(0, 3).toUpperCase() : 'HME')),
      logo: String(g.homeLogo || homeTeam.logo || ''),
      score: String(g.homeScore ?? homeTeam.score ?? ''),
    },
    state: g.status === 'live' ? 'live' : g.status === 'final' ? 'final' : 'upcoming',
    detail: String(g.statusDetail || g.situation || g.time || ''),
    href: `/college-baseball/game/${g.id}`,
  };});
}

// ── Loading Fallback ──

function ScoresLoading() {
  return (
    <div className="p-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <SkeletonScoreCard key={i} />
        ))}
      </div>
    </div>
  );
}

// ── Main Component ──

function ScoresHubContent() {
  const {
    data: overview,
    error: overviewError,
    lastUpdated: overviewLastUpdated,
    loading: overviewLoading,
    meta: overviewMeta,
  } = useScoresOverview();
  const [sports, setSports] = useState<SportSection[]>(() => createSportSections());
  const [totalLive, setTotalLive] = useState(0);
  const searchParams = useSearchParams();
  const router = useRouter();
  const sportParam = searchParams.get('sport');
  const [activeSport, setActiveSport] = useState<string | null>(sportParam);

  useEffect(() => {
    if (overviewLoading) return;

    if (overviewError) {
      setSports(
        createSportSections().map((sport) => ({
          ...sport,
          fetchError: true,
          isActive: false,
          loaded: true,
        })),
      );
      setTotalLive(0);
      return;
    }

    if (!overview) return;

    let live = 0;
    const nextSports = createSportSections().map((sport) => {
      const sportError = Boolean(overview.errors[sport.id]);
      const payload = overview.data[sport.id];

      if (!payload || typeof payload !== 'object') {
        return {
          ...sport,
          fetchError: sportError,
          loaded: true,
        };
      }

      if (sport.id === 'college-baseball') {
        const games = ((payload.data || payload.games) as Array<Record<string, unknown>>) || [];
        const liveCount = games.filter((game) => game.status === 'live').length;
        live += liveCount;
        return {
          ...sport,
          featured: extractCBBGames(payload),
          fetchError: sportError,
          isActive: games.length > 0,
          liveCount,
          loaded: true,
          todayCount: games.length,
        };
      }

      if (sport.id === 'mlb') {
        const games = (payload.games as Array<Record<string, unknown>>) || [];
        const liveCount = countLiveMlbGames(payload);
        live += liveCount;
        return {
          ...sport,
          featured: extractMLBGames(payload),
          fetchError: sportError,
          isActive: games.length > 0,
          liveCount,
          loaded: true,
          todayCount: games.length,
        };
      }

      if (sport.id === 'nfl') {
        const games = (payload.games as Array<Record<string, unknown>>) || [];
        const liveCount = countLiveEspnGames(payload);
        const todayGames = countTodayGames(games);
        live += liveCount;
        return {
          ...sport,
          featured: extractESPNGames(payload, 'nfl'),
          fetchError: sportError,
          isActive: todayGames > 0,
          liveCount,
          loaded: true,
          todayCount: todayGames,
        };
      }

      if (sport.id === 'nba') {
        const games = (payload.games as Array<Record<string, unknown>>) || [];
        const liveCount = countLiveEspnGames(payload);
        const todayGames = countTodayGames(games);
        live += liveCount;
        return {
          ...sport,
          featured: extractESPNGames(payload, 'nba'),
          fetchError: sportError,
          isActive: todayGames > 0,
          liveCount,
          loaded: true,
          todayCount: todayGames,
        };
      }

      const games = (payload.games as Array<Record<string, unknown>>) || [];
      const liveCount = countLiveCfbGames(payload);
      const todayGames = countTodayGames(games);
      live += liveCount;
      return {
        ...sport,
        featured: extractESPNGames(payload, 'cfb'),
        fetchError: sportError,
        isActive: todayGames > 0,
        liveCount,
        loaded: true,
        todayCount: todayGames,
      };
    });

    setSports(nextSports);
    setTotalLive(live);
  }, [overview, overviewError, overviewLoading]);

  const hasAnyLive = totalLive > 0;
  const fetchedAt = overviewMeta?.lastUpdated ?? overviewLastUpdated?.toISOString() ?? '';
  const totalGamesToday = sports.reduce((sum, sport) => sum + sport.todayCount, 0);
  const sportsInAction = sports.filter((sport) => sport.todayCount > 0).length;
  const mostActiveSport = sports.reduce<SportSection | null>((best, sport) => {
    if (!best) return sport;
    return sport.todayCount > best.todayCount ? sport : best;
  }, null);
  const overviewSource = overview?.meta?.source || overviewMeta?.source || 'BSI Multi-Source';

  // Sync activeSport to URL search params
  const handleSetActiveSport = useCallback((id: string | null) => {
    setActiveSport(id);
    const params = new URLSearchParams(searchParams.toString());
    if (id && id !== 'all') {
      params.set('sport', id);
    } else {
      params.delete('sport');
    }
    const qs = params.toString();
    router.replace(qs ? `?${qs}` : '/scores/', { scroll: false });
  }, [searchParams, router]);

  // Auto-select the sport with the most games (only if no URL param was set)
  useEffect(() => {
    if (activeSport) return;
    const loaded = sports.filter(s => s.loaded && s.todayCount > 0);
    if (loaded.length > 0) {
      const best = loaded.sort((a, b) => b.liveCount - a.liveCount || b.todayCount - a.todayCount)[0];
      setActiveSport(best.id);
    }
  }, [sports, activeSport]);

  const activeSportData = activeSport === 'all' ? null : sports.find(s => s.id === activeSport);

  return (
    <>
      <div className="grain-overlay bg-surface-scoreboard text-bsi-bone">
        {/* Header */}
        <section
          className="relative overflow-hidden"
          style={{
            background: 'var(--surface-scoreboard)',
            padding: 'clamp(2rem, 4vw, 3.5rem) 0 clamp(1.5rem, 3vw, 2rem)',
          }}
        >
          {/* R2 stadium atmosphere */}
          <img
            src="/api/assets/images/blaze-full-banner.png"
            alt=""
            aria-hidden="true"
            loading="eager"
            decoding="async"
            className="absolute inset-0 w-full h-full object-cover pointer-events-none"
            style={{ opacity: 0.12 }}
          />
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'linear-gradient(to bottom, rgba(10,10,10,0.5) 0%, rgba(10,10,10,0.35) 40%, var(--surface-scoreboard) 100%)',
            }}
          />
          <div className="absolute inset-0 pointer-events-none grain-overlay" style={{ opacity: 0.25 }} />
          <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[rgba(191,87,0,0.15)] to-transparent" />
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 mb-4 text-xs text-bsi-dust font-mono">
              <Link href="/" className="transition-colors hover:text-bsi-bone">Home</Link>
              <span>/</span>
              <span className="text-bsi-primary">Scores</span>
            </div>

            <ScrollReveal direction="up">
              <div className="flex items-center gap-3 mb-3">
                <span className="heritage-stamp">All Sports</span>
                {hasAnyLive && (
                  <span className="heritage-stamp" style={{ padding: '1px 8px', fontSize: '9px', color: 'var(--bsi-success)', borderColor: 'rgba(16, 185, 129, 0.3)' }}>
                    <span className="inline-flex items-center gap-1.5">
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-bsi-primary opacity-75" />
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-bsi-primary" />
                      </span>
                      LIVE
                    </span>
                  </span>
                )}
              </div>
            </ScrollReveal>
            <ScrollReveal direction="up" delay={100}>
              <h1
                className="font-bold uppercase tracking-tight leading-none mb-3"
                style={{
                  fontFamily: 'var(--bsi-font-display-hero)',
                  fontSize: 'clamp(2.5rem, 6vw, 4rem)',
                  color: 'var(--bsi-bone)',
                  textShadow: '2px 2px 0px rgba(0,0,0,0.5)',
                }}
              >
                Live Scores
              </h1>
            </ScrollReveal>
            <ScrollReveal direction="up" delay={150}>
              <p className="mt-2 text-base max-w-2xl font-serif text-bsi-dust">
                Live college baseball scores for every D1 program — updated in real time.
              </p>
            </ScrollReveal>
            {hasAnyLive && (
              <ScrollReveal direction="up" delay={200}>
                <div className="mt-4 inline-flex items-center gap-2 px-4 py-2" style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
                  <span className="w-2 h-2 bg-bsi-primary rounded-full animate-pulse" />
                  <span className="font-semibold text-sm" style={{ color: 'var(--bsi-success)' }}>
                    {totalLive} game{totalLive !== 1 ? 's' : ''} live now
                  </span>
                </div>
              </ScrollReveal>
            )}
            <ScrollReveal direction="up" delay={240}>
              <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {[
                  {
                    label: 'Live Right Now',
                    value: `${totalLive}`,
                    note: hasAnyLive ? 'Games already underway' : 'Pre-game board',
                  },
                  {
                    label: 'Today’s Slate',
                    value: `${totalGamesToday}`,
                    note: 'Tracked across the full board',
                  },
                  {
                    label: 'Sports Active',
                    value: `${sportsInAction}`,
                    note: mostActiveSport ? `${mostActiveSport.name} leads the slate` : 'Waiting on first pitch',
                  },
                  {
                    label: 'Refresh Rhythm',
                    value: '60s',
                    note: 'Auto-refreshes every minute · Central Time',
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="heritage-card p-4"
                    style={{
                      background:
                        'linear-gradient(180deg, rgba(191, 87, 0, 0.08) 0%, rgba(16, 16, 16, 0.94) 100%)',
                    }}
                  >
                    <p className="text-[10px] uppercase tracking-[0.18em] text-bsi-dust/70">
                      {item.label}
                    </p>
                    <div className="mt-3 flex items-end justify-between gap-4">
                      <span
                        className="font-bold uppercase leading-none"
                        style={{
                          fontFamily: 'var(--bsi-font-display-hero)',
                          fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
                          color: 'var(--bsi-bone)',
                        }}
                      >
                        {item.value}
                      </span>
                      <span className="max-w-[10rem] text-right text-[11px] leading-snug text-bsi-dust">
                        {item.note}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollReveal>
            {!overviewLoading && totalLive === 0 && (
              <ScrollReveal direction="up" delay={280}>
                <p
                  className="mt-6 italic"
                  style={{
                    fontFamily: 'var(--bsi-font-body)',
                    color: 'var(--bsi-dust)',
                    fontSize: '0.95rem',
                  }}
                >
                  No live games right now. Check back during game time.
                </p>
              </ScrollReveal>
            )}
          </div>
        </section>

        {/* Sport Tabs — sticky */}
        <nav
          className="sticky top-0 z-20"
          style={{
            background: 'var(--surface-press-box)',
            borderTop: '1px solid var(--border-vintage)',
            borderBottom: '1px solid var(--border-vintage)',
          }}
        >
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex gap-1 overflow-x-auto py-2">
              <button
                onClick={() => handleSetActiveSport('all')}
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold uppercase tracking-wider whitespace-nowrap transition-all"
                style={{
                  fontFamily: 'var(--bsi-font-display)',
                  background: activeSport === 'all' ? 'rgba(191, 87, 0, 0.2)' : 'transparent',
                  border: activeSport === 'all' ? '1px solid var(--bsi-primary)' : '1px solid transparent',
                  color: activeSport === 'all' ? 'var(--bsi-bone)' : 'var(--bsi-dust)',
                }}
              >
                All
              </button>
              {sports.map(sport => {
                const Icon = SPORT_ICONS[sport.id];
                const isActive = activeSport === sport.id;
                return (
                  <button
                    key={sport.id}
                    onClick={() => handleSetActiveSport(sport.id)}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-semibold uppercase tracking-wider whitespace-nowrap transition-all"
                    style={{
                      fontFamily: 'var(--bsi-font-display)',
                      background: isActive ? 'rgba(191, 87, 0, 0.2)' : 'transparent',
                      border: isActive ? '1px solid var(--bsi-primary)' : '1px solid transparent',
                      color: isActive ? 'var(--bsi-bone)' : 'var(--bsi-dust)',
                    }}
                  >
                    {Icon && <span style={{ color: isActive ? 'var(--bsi-bone)' : 'var(--bsi-dust)' }}><Icon /></span>}
                    {sport.name}
                    {sport.liveCount > 0 && (
                      <span className="flex items-center gap-1 ml-1">
                        <span className="w-1.5 h-1.5 bg-bsi-primary rounded-full animate-pulse" />
                        <span style={{ color: 'var(--bsi-success)' }}>{sport.liveCount}</span>
                      </span>
                    )}
                    {sport.liveCount === 0 && sport.todayCount > 0 && (
                      <span className="ml-1 text-xs" style={{ color: 'var(--bsi-dust)', opacity: 0.6 }}>
                        {sport.todayCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </nav>

        {/* Featured Games for Active Sport */}
        <Section padding="lg" background="charcoal">
          <Container>
            <DataErrorBoundary name="Scores">
              {activeSport === 'all' ? (
                /* All Sports view: show each sport section */
                <div className="space-y-8">
                  {sports.map(sport => (
                    <div key={sport.id}>
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="font-display text-xl font-bold uppercase text-bsi-bone">
                          {sport.name}
                        </h2>
                        <Link
                          href={sport.href}
                          className="text-burnt-orange text-sm font-semibold hover:text-ember transition-colors"
                        >
                          View All
                        </Link>
                      </div>
                      {!sport.loaded ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                          {Array.from({ length: 4 }).map((_, i) => (
                            <SkeletonScoreCard key={i} />
                          ))}
                        </div>
                      ) : sport.featured.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                          {sport.featured.map(game => (
                            <MiniScoreCard key={game.id} game={game} sport={sport.id} />
                          ))}
                        </div>
                      ) : (
                        <div className="heritage-card p-4 text-center">
                          <p className="text-bsi-dust text-sm">No {sport.name} games today</p>
                          <p className="text-bsi-dust/60 text-xs mt-1">
                            {sport.isActive ? 'Check back later' : `Season: ${sport.season}`}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : activeSportData && activeSportData.featured.length > 0 ? (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-display text-xl font-bold uppercase text-bsi-bone">
                      {activeSportData.name} Scores
                    </h2>
                    <Link
                      href={activeSportData.href}
                      className="text-burnt-orange text-sm font-semibold hover:text-ember transition-colors"
                    >
                      View All {activeSportData.todayCount} {activeSportData.todayCount === 1 ? 'Game' : 'Games'}
                    </Link>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {activeSportData.featured.map(game => (
                      <MiniScoreCard key={game.id} game={game} sport={activeSportData.id} />
                    ))}
                  </div>
                </div>
              ) : activeSportData && activeSportData.loaded ? (
                <div className="heritage-card p-6 text-center">
                  <p className="text-bsi-dust">No {activeSportData.name} games today</p>
                  <p className="text-bsi-dust/60 text-sm mt-1">
                    {activeSportData.isActive ? 'Check back later' : `Season: ${activeSportData.season}`}
                  </p>
                  <Link
                    href={activeSportData.href}
                    className="text-burnt-orange text-sm mt-3 inline-block hover:text-ember transition-colors"
                  >
                    View {activeSportData.name} Hub
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <SkeletonScoreCard key={i} />
                  ))}
                </div>
              )}

              {/* All Sports Overview */}
              <div className="mt-10">
                <h2 className="font-display text-lg font-bold uppercase text-bsi-bone mb-4">
                  All Sports
                </h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {sports.map((sport, index) => (
                    <ScrollReveal key={sport.id} direction="up" delay={index * 60}>
                      <Link href={sport.href} className="block h-full">
                        <div
                          className={`heritage-card h-full p-5 transition-all ${
                            sport.liveCount > 0 ? 'border-success/50 bg-success/5' : ''
                          }`}
                          style={{
                            borderLeft: `2px solid ${
                              sport.liveCount > 0 ? 'var(--bsi-success)' : 'var(--bsi-primary)'
                            }`,
                          }}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-2.5">
                              <span className="text-bsi-dust">
                                {(() => { const Icon = SPORT_ICONS[sport.id]; return Icon ? <Icon /> : null; })()}
                              </span>
                              <div>
                                <h3 className="text-base font-display font-bold text-bsi-bone">
                                  {sport.name}
                                </h3>
                                <p className="text-[11px] text-bsi-dust/60">Season: {sport.season}</p>
                              </div>
                            </div>
                            {sport.liveCount > 0 ? (
                              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-success/20 rounded-sm">
                                <span className="w-1.5 h-1.5 bg-success rounded-full animate-pulse" />
                                <span className="text-success text-xs font-semibold">{sport.liveCount} Live</span>
                              </div>
                            ) : sport.todayCount > 0 ? (
                              <Badge variant="primary">{sport.todayCount} Today</Badge>
                            ) : !sport.loaded ? (
                              <span className="text-xs text-bsi-dust/60">Loading...</span>
                            ) : (
                              <Badge variant={sport.fetchError ? 'error' : 'default'}>{sport.fetchError ? 'Unavailable' : sport.isActive ? 'No games' : 'Off-season'}</Badge>
                            )}
                          </div>
                          <p className="text-bsi-dust text-xs leading-relaxed">{sport.description}</p>
                          <div className="mt-4 flex items-center justify-between border-t border-border-vintage/60 pt-3 text-[11px] uppercase tracking-[0.12em]">
                            <span className="text-bsi-dust/70">
                              {sport.todayCount > 0 ? `${sport.todayCount} ${sport.todayCount === 1 ? 'game' : 'games'} on deck` : sport.season}
                            </span>
                            <span className="text-burnt-orange">Open hub →</span>
                          </div>
                        </div>
                      </Link>
                    </ScrollReveal>
                  ))}
                </div>
              </div>

              {/* Quick Links */}
              <ScrollReveal direction="up" delay={300}>
                <div className="mt-10 p-5 bg-surface-press-box rounded-sm border border-border-vintage">
                  <h3 className="text-sm font-semibold text-bsi-bone mb-3">Quick Access</h3>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { href: '/college-baseball/scores', label: 'College Baseball Scores' },
                      { href: '/college-baseball/standings', label: 'Standings' },
                      { href: '/college-baseball/rankings', label: 'Rankings' },
                      { href: '/college-baseball/savant', label: 'BSI Savant' },
                      { href: '/college-baseball/editorial', label: 'Editorial' },
                    ].map(link => (
                      <Link
                        key={link.href}
                        href={link.href}
                        className="px-3 py-1.5 bg-surface-dugout hover:bg-burnt-orange/20 text-bsi-dust hover:text-burnt-orange rounded-sm text-xs font-medium transition-colors"
                      >
                        {link.label}
                      </Link>
                    ))}
                  </div>
                </div>
              </ScrollReveal>

              {/* Savant Cross-Link */}
              <div className="mt-8 pt-6 border-t" style={{ borderColor: 'var(--border-vintage, rgba(140,98,57,0.3))' }}>
                <Link
                  href="/college-baseball/savant"
                  className="block p-4 transition-colors group bg-surface-dugout border border-border-vintage"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="heritage-stamp text-[10px]" style={{ color: 'var(--bsi-primary, #BF5700)' }}>BSI SAVANT</span>
                      <p className="font-oswald uppercase text-sm tracking-wider mt-1" style={{ color: 'var(--bsi-bone, #F5F2EB)' }}>
                        Go deeper with advanced analytics
                      </p>
                      <p className="font-cormorant text-xs mt-1" style={{ color: 'var(--bsi-dust, #C4B8A5)' }}>
                        Park-adjusted wOBA, wRC+, FIP, and conference strength for every D1 program
                      </p>
                    </div>
                    <svg viewBox="0 0 24 24" className="w-5 h-5 opacity-40 group-hover:opacity-70 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--bsi-primary, #BF5700)' }}>
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>
              </div>

              {/* Data Freshness */}
              <div className="mt-8 pt-4 border-t border-border-vintage">
                <DataFreshnessIndicator
                  lastUpdated={fetchedAt ? new Date(fetchedAt) : undefined}
                  source="BSI Multi-Source"
                  refreshInterval={60}
                />
              </div>
            </DataErrorBoundary>
          </Container>
        </Section>
      </div>
    </>
  );
}

// ── Page Export (with Suspense boundary for useSearchParams) ──

export default function ScoresHubPage() {
  return (
    <Suspense fallback={<ScoresLoading />}>
      <ScoresHubContent />
    </Suspense>
  );
}
