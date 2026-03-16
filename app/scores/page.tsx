'use client';

import { Suspense, useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { streamAnalysis } from '@/lib/bsi-stream-client';
import type { Sport } from '@/lib/bsi-stream-client';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Badge } from '@/components/ui/Badge';
import { ScrollReveal } from '@/components/cinematic';
import { Footer } from '@/components/layout-ds/Footer';
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
    <div className={`p-3 rounded-sm border transition-all hover:border-burnt-orange/50 ${
      game.state === 'live' ? 'border-success/30 bg-success/5' : 'border-border-vintage bg-surface-dugout'
    }`}>
      <div className="flex items-center justify-between mb-1">
        <GameStateBadge state={game.state} detail={game.detail} />
      </div>
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {game.away.logo ? (
              <img src={game.away.logo} alt="" className="w-4 h-4 object-contain" loading="lazy" />
            ) : (
              <span className="text-[10px] font-bold text-bsi-dust w-4">{game.away.abbreviation}</span>
            )}
            <span className="text-sm text-bsi-bone font-medium truncate max-w-[120px]">
              {game.away.name || game.away.abbreviation}
            </span>
          </div>
          <span className={`font-mono text-sm font-bold ${
            game.state === 'final' && Number(game.away.score) > Number(game.home.score) ? 'text-bsi-bone' : 'text-bsi-dust'
          }`}>
            {game.away.score ?? '-'}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {game.home.logo ? (
              <img src={game.home.logo} alt="" className="w-4 h-4 object-contain" loading="lazy" />
            ) : (
              <span className="text-[10px] font-bold text-bsi-dust w-4">{game.home.abbreviation}</span>
            )}
            <span className="text-sm text-bsi-bone font-medium truncate max-w-[120px]">
              {game.home.name || game.home.abbreviation}
            </span>
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
                <p className="text-xs text-[var(--bsi-danger)]">{intelError}</p>
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
    const away = (g.teams as Record<string, unknown>)?.away as Record<string, unknown> || {};
    const home = (g.teams as Record<string, unknown>)?.home as Record<string, unknown> || {};
    const status = g.status as Record<string, unknown> || {};
    const isLive = Boolean((status as Record<string, boolean>)?.isLive);
    const isFinal = Boolean((status as Record<string, unknown>)?.type && ((status as Record<string, Record<string, boolean>>).type?.completed));
    return {
      id: String(g.gamePk || g.id || ''),
      away: { name: String(away.name || ''), abbreviation: String(away.abbreviation || 'AWY'), logo: String(away.logo || ''), score: String(away.score ?? '') },
      home: { name: String(home.name || ''), abbreviation: String(home.abbreviation || 'HME'), logo: String(home.logo || ''), score: String(home.score ?? '') },
      state: isLive ? 'live' : isFinal ? 'final' : 'upcoming',
      detail: String((status as Record<string, string>)?.detailedState || ''),
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
    const awayName = teamName(g.awayTeam);
    const homeName = teamName(g.homeTeam);
    return {
    id: String(g.id || ''),
    away: {
      name: awayName,
      abbreviation: String(g.awayAbbreviation || (awayName ? awayName.substring(0, 3).toUpperCase() : 'AWY')),
      logo: String(g.awayLogo || ''),
      score: String(g.awayScore ?? ''),
    },
    home: {
      name: homeName,
      abbreviation: String(g.homeAbbreviation || (homeName ? homeName.substring(0, 3).toUpperCase() : 'HME')),
      logo: String(g.homeLogo || ''),
      score: String(g.homeScore ?? ''),
    },
    state: g.status === 'live' ? 'live' : g.status === 'final' ? 'final' : 'upcoming',
    detail: String(g.statusDetail || ''),
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
  const [sports, setSports] = useState<SportSection[]>([
    {
      id: 'college-baseball', name: 'College Baseball', href: '/college-baseball/scores',
      description: 'All 300+ D1 programs — live scores, box scores, and recaps',
      liveCount: 0, todayCount: 0, season: 'Feb - Jun', isActive: false, loaded: false, featured: [],
    },
    {
      id: 'mlb', name: 'MLB', href: '/mlb/scores',
      description: 'Real-time MLB scores from the official Stats API',
      liveCount: 0, todayCount: 0, season: 'Mar - Oct', isActive: true, loaded: false, featured: [],
    },
    {
      id: 'nfl', name: 'NFL', href: '/nfl/games',
      description: 'NFL scores, standings, and game analysis',
      liveCount: 0, todayCount: 0, season: 'Sep - Feb', isActive: false, loaded: false, featured: [],
    },
    {
      id: 'nba', name: 'NBA', href: '/nba/games',
      description: 'NBA scores and standings',
      liveCount: 0, todayCount: 0, season: 'Oct - Jun', isActive: false, loaded: false, featured: [],
    },
    {
      id: 'cfb', name: 'College Football', href: '/cfb/scores',
      description: 'FBS conference scores and matchups',
      liveCount: 0, todayCount: 0, season: 'Aug - Jan', isActive: false, loaded: false, featured: [],
    },
  ]);

  const [totalLive, setTotalLive] = useState(0);
  const [fetchedAt, setFetchedAt] = useState('');
  const searchParams = useSearchParams();
  const router = useRouter();
  const sportParam = searchParams.get('sport');
  const [activeSport, setActiveSport] = useState<string | null>(sportParam);

  const fetchLiveCounts = useCallback(async (signal?: AbortSignal) => {
    try {
      const [mlbResult, cbResult, nflResult, nbaResult, cfbResult] = await Promise.allSettled([
        fetch('/api/mlb/scores', { signal }).then(r => r.ok ? r.json() as Promise<Record<string, unknown>> : null),
        fetch(`/api/college-baseball/schedule?date=${new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Chicago' }).format(new Date())}`, { signal }).then(r => r.ok ? r.json() as Promise<Record<string, unknown>> : null),
        fetch('/api/nfl/scores', { signal }).then(r => r.ok ? r.json() as Promise<Record<string, unknown>> : null),
        fetch('/api/nba/scoreboard', { signal }).then(r => r.ok ? r.json() as Promise<Record<string, unknown>> : null),
        fetch('/api/cfb/scores', { signal }).then(r => r.ok ? r.json() as Promise<Record<string, unknown>> : null),
      ]);

      let live = 0;

      setSports(prev => prev.map(s => {
        if (s.id === 'mlb' && mlbResult.status === 'fulfilled' && mlbResult.value) {
          const d = mlbResult.value;
          const games = (d.games as Array<Record<string, unknown>>) || [];
          const mlbLive = games.filter(g => (g.status as Record<string, boolean>)?.isLive).length;
          live += mlbLive;
          return { ...s, liveCount: mlbLive, todayCount: games.length, isActive: games.length > 0, loaded: true, featured: extractMLBGames(d) };
        }
        if (s.id === 'college-baseball' && cbResult.status === 'fulfilled' && cbResult.value) {
          const d = cbResult.value;
          const games = ((d.data || d.games) as Array<Record<string, unknown>>) || [];
          const cbLive = games.filter(g => g.status === 'live').length;
          live += cbLive;
          return { ...s, liveCount: cbLive, todayCount: games.length, isActive: games.length > 0, loaded: true, featured: extractCBBGames(d) };
        }
        if (s.id === 'nfl' && nflResult.status === 'fulfilled' && nflResult.value) {
          const d = nflResult.value;
          const games = (d.games as Array<Record<string, unknown>>) || [];
          const nflLive = games.filter(g => {
            const st = (g.status as Record<string, unknown>) || {};
            const stType = (st as Record<string, Record<string, unknown>>).type || {};
            return !stType.completed && Number((st as Record<string, unknown>).period || 0) > 0;
          }).length;
          live += nflLive;
          return { ...s, liveCount: nflLive, todayCount: games.length, isActive: games.length > 0, loaded: true, featured: extractESPNGames(d, 'nfl') };
        }
        if (s.id === 'nba' && nbaResult.status === 'fulfilled' && nbaResult.value) {
          const d = nbaResult.value;
          const games = (d.games as Array<Record<string, unknown>>) || [];
          const nbaLive = games.filter(g => {
            const st = (g.status as Record<string, unknown>) || {};
            const stType = (st as Record<string, Record<string, unknown>>).type || {};
            return !stType.completed && Number((st as Record<string, unknown>).period || 0) > 0;
          }).length;
          live += nbaLive;
          return { ...s, liveCount: nbaLive, todayCount: games.length, isActive: games.length > 0, loaded: true, featured: extractESPNGames(d, 'nba') };
        }
        if (s.id === 'cfb' && cfbResult.status === 'fulfilled' && cfbResult.value) {
          const d = cfbResult.value;
          const games = (d.games as Array<Record<string, unknown>>) || [];
          const cfbLive = games.filter(g => {
            const st = (g.status as Record<string, Record<string, unknown>>) || {};
            return String(st.type?.state) === 'in';
          }).length;
          live += cfbLive;
          return { ...s, liveCount: cfbLive, todayCount: games.length, isActive: games.length > 0, loaded: true, featured: extractESPNGames(d, 'cfb') };
        }
        return { ...s, loaded: true };
      }));

      setTotalLive(live);
      setFetchedAt(new Date().toISOString());
    } catch {
      setSports(prev => prev.map(s => ({ ...s, loaded: true, fetchError: true })));
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    fetchLiveCounts(controller.signal).finally(() => clearTimeout(timeout));
    const interval = setInterval(() => fetchLiveCounts(), 60000);
    return () => { controller.abort(); clearTimeout(timeout); clearInterval(interval); };
  }, [fetchLiveCounts]);

  const hasAnyLive = totalLive > 0;

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
      <div className="grain-overlay" style={{ background: 'var(--surface-scoreboard)', color: 'var(--bsi-bone)' }}>
        {/* Header */}
        <section
          className="relative overflow-hidden"
          style={{
            background: 'radial-gradient(ellipse at 50% 20%, rgba(191, 87, 0, 0.06) 0%, transparent 60%), var(--surface-scoreboard)',
            padding: 'clamp(2rem, 4vw, 3.5rem) 0 clamp(1.5rem, 3vw, 2rem)',
          }}
        >
          <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[rgba(191,87,0,0.15)] to-transparent" />
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 mb-4 text-xs" style={{ color: 'var(--bsi-dust)', fontFamily: 'var(--bsi-font-data)' }}>
              <Link href="/" className="transition-colors hover:text-[var(--bsi-bone)]">Home</Link>
              <span>/</span>
              <span style={{ color: 'var(--bsi-primary)' }}>Scores</span>
            </div>

            <ScrollReveal direction="up">
              <div className="flex items-center gap-3 mb-3">
                <span className="heritage-stamp">All Sports</span>
                {hasAnyLive && (
                  <span className="heritage-stamp" style={{ padding: '1px 8px', fontSize: '9px', color: 'var(--bsi-success)', borderColor: 'rgba(16, 185, 129, 0.3)' }}>
                    <span className="inline-flex items-center gap-1.5">
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--bsi-primary)] opacity-75" />
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[var(--bsi-primary)]" />
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
              <p className="mt-2 text-base max-w-2xl font-serif" style={{ color: 'var(--bsi-dust)' }}>
                Real-time scores across MLB, NFL, NBA, college football, and 300+ college baseball programs.
              </p>
            </ScrollReveal>
            {hasAnyLive && (
              <ScrollReveal direction="up" delay={200}>
                <div className="mt-4 inline-flex items-center gap-2 px-4 py-2" style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
                  <span className="w-2 h-2 bg-[var(--bsi-primary)] rounded-full animate-pulse" />
                  <span className="font-semibold text-sm" style={{ color: 'var(--bsi-success)' }}>
                    {totalLive} game{totalLive !== 1 ? 's' : ''} live now
                  </span>
                </div>
              </ScrollReveal>
            )}
          </div>
        </section>

        {/* Sport Tabs — sticky */}
        <nav
          className="sticky top-0 z-20"
          style={{
            background: 'color-mix(in srgb, var(--surface-press-box) 96%, transparent)',
            backdropFilter: 'blur(12px)',
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
                        <span className="w-1.5 h-1.5 bg-[var(--bsi-primary)] rounded-full animate-pulse" />
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
                      View All {activeSportData.todayCount} Games
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
                          className={`heritage-card p-4 h-full transition-all ${
                            sport.liveCount > 0 ? 'border-success/50 bg-success/5' : ''
                          }`}
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
                          <p className="text-bsi-dust text-xs">{sport.description}</p>
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
                      { href: '/mlb/scores', label: 'MLB Scores' },
                      { href: '/nfl/games', label: 'NFL Scores' },
                      { href: '/nba/games', label: 'NBA Scores' },
                      { href: '/college-baseball/standings', label: 'CBB Standings' },
                      { href: '/mlb/standings', label: 'MLB Standings' },
                      { href: '/nfl/standings', label: 'NFL Standings' },
                      { href: '/nba/standings', label: 'NBA Standings' },
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
                  className="block p-4 transition-colors group"
                  style={{ background: 'var(--surface-dugout, #161616)', border: '1px solid var(--border-vintage, rgba(140,98,57,0.3))' }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="heritage-stamp text-[10px]" style={{ color: 'var(--bsi-primary, #BF5700)' }}>BSI SAVANT</span>
                      <p className="font-oswald uppercase text-sm tracking-wider mt-1" style={{ color: 'var(--bsi-bone, #F5F2EB)' }}>
                        Go deeper with advanced analytics
                      </p>
                      <p className="font-cormorant text-xs mt-1" style={{ color: 'var(--bsi-dust, #C4B8A5)' }}>
                        Park-adjusted wOBA, wRC+, FIP, and conference strength for 300+ D1 programs
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
      <Footer />
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
