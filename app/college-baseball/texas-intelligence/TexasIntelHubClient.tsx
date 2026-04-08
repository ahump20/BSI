'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge, DataSourceBadge } from '@/components/ui/Badge';
import { AnimatedCounter } from '@/components/ui/AnimatedCounter';
import { ScrollReveal } from '@/components/cinematic';
import { SabermetricsPanel } from '@/components/college-baseball/SabermetricsPanel';
import { ConferencePositionCard } from '@/components/college-baseball/ConferencePositionCard';
import { TeamVideoPanel } from '@/components/college-baseball/TeamVideoPanel';
import { SocialIntelTeamPanel } from '@/components/college-baseball/SocialIntelTeamPanel';
import { useSportData } from '@/lib/hooks/useSportData';
import { teamMetadata, getLogoUrl } from '@/lib/data/team-metadata';
import { FEATURE_ARTICLES } from '@/app/college-baseball/editorial/page';

// ─── Constants ──────────────────────────────────────────────────────────────

const TEAM_ID = 'texas';
const ESPN_ID = '126';
const ACCENT = 'var(--bsi-primary)';
const STICKY_NAV_OFFSET = 400;
const COUNTDOWN_INTERVAL_MS = 60000;
const SWIPE_THRESHOLD = 50;
const LIVE_POLL_INTERVAL_MS = 30000;

// ─── Types ──────────────────────────────────────────────────────────────────

interface TeamResponse {
  team?: {
    stats?: {
      wins?: number;
      losses?: number;
      confWins?: number;
      confLosses?: number;
    };
    ranking?: number;
    standingSummary?: string;
    nextGame?: { opponent?: string; date?: string; location?: string };
  };
  meta?: { source?: string; fetched_at?: string };
}

interface GameAnalysis {
  gameId: string;
  date: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  isTexasHome: boolean;
  analysis: { title: string; paragraphs: string[] } | null;
}

interface GameAnalysesResponse {
  games: GameAnalysis[];
  meta?: { source?: string; fetched_at?: string };
}

interface TrendsResponse {
  players: unknown[];
  teamMomentum: {
    last5RunDifferential: number;
    hotPlayers: number;
    coldPlayers: number;
  };
  recentResults?: Array<{ result: 'W' | 'L'; date: string }>;
  meta?: { source?: string; fetched_at?: string };
}

interface LiveScoreTeam {
  id: number;
  name: string;
  shortName: string;
  score: number;
}

interface LiveScoreGame {
  id: string;
  status: 'pre' | 'in' | 'post' | 'postponed' | 'cancelled';
  detailedState: string;
  inning?: number;
  inningHalf?: 'top' | 'bottom';
  awayTeam: LiveScoreTeam;
  homeTeam: LiveScoreTeam;
}

interface LiveScoresResponse {
  games: LiveScoreGame[];
}

const SHORTCUT_MAP: Record<string, { path: string; label: string }> = {
  r: { path: '/college-baseball/texas-intelligence/roster', label: 'Roster' },
  p: { path: '/college-baseball/texas-intelligence/pitching', label: 'Pitching Staff' },
  s: { path: '/college-baseball/texas-intelligence/schedule', label: 'Schedule' },
  d: { path: '/college-baseball/texas-intelligence/draft', label: 'Draft Board' },
  t: { path: '/college-baseball/texas-intelligence/trends', label: 'Trends' },
} as const;

const INTEL_NAV = [
  { label: 'Roster', href: '/college-baseball/texas-intelligence/roster', desc: 'Advanced metrics for every player' },
  { label: 'Pitching Staff', href: '/college-baseball/texas-intelligence/pitching', desc: 'Rotation, bullpen, workload tracking' },
  { label: 'Schedule', href: '/college-baseball/texas-intelligence/schedule', desc: 'Difficulty-rated heat map' },
  { label: 'Draft Board', href: '/college-baseball/texas-intelligence/draft', desc: 'HAV-F rankings & pro pipeline' },
  { label: 'Transfer Portal', href: '/college-baseball/texas-intelligence/portal', desc: 'Incoming targets & departures' },
  { label: 'Performance Trends', href: '/college-baseball/texas-intelligence/trends', desc: 'Hot/cold tracker & momentum' },
  { label: 'NIL Intelligence', href: '/college-baseball/texas-intelligence/nil', desc: 'Valuations and draft leverage' },
  { label: 'Media Archive', href: '/college-baseball/texas-intelligence/media', desc: 'Film room, news, social content' },
  { label: 'Press Conference', href: '/college-baseball/texas-intelligence/scouting/press-conference', desc: 'AI transcript analysis' },
  { label: 'Program History', href: '/college-baseball/texas-history', desc: 'The through-line from 1885' },
] as const;

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Parse a stat string and render numbers with AnimatedCounter. */
function AnimatedStatValue({ value, accent }: { value: string; accent?: boolean }) {
  const color = accent ? ACCENT : undefined;

  // Pattern: "#7" → prefix "#" + number
  const rankMatch = value.match(/^#(\d+)$/);
  if (rankMatch) {
    return (
      <span className="font-mono text-2xl font-bold" style={{ color }}>
        #<AnimatedCounter end={parseInt(rankMatch[1], 10)} />
      </span>
    );
  }

  // Pattern: "23-5" → number-number (record)
  const recordMatch = value.match(/^(\d+)-(\d+)$/);
  if (recordMatch) {
    return (
      <span className="font-mono text-2xl font-bold" style={{ color }}>
        <AnimatedCounter end={parseInt(recordMatch[1], 10)} />
        -
        <AnimatedCounter end={parseInt(recordMatch[2], 10)} />
      </span>
    );
  }

  // Fallback: render as-is
  return (
    <span className="font-mono text-2xl font-bold" style={{ color }}>
      {value}
    </span>
  );
}

function FreshnessIndicator({ timestamp }: { timestamp?: string }) {
  if (!timestamp) return null;
  const ageMs = Date.now() - new Date(timestamp).getTime();
  const ageMin = ageMs / 60000;
  const color = ageMin < 5 ? 'var(--bsi-success)' : ageMin < 30 ? 'var(--bsi-warning)' : 'var(--bsi-error)';
  const label = ageMin < 1 ? 'Just now' : ageMin < 60 ? `${Math.round(ageMin)}m ago` : `${Math.round(ageMin / 60)}h ago`;
  return (
    <div className="flex items-center gap-1.5 text-[10px] text-text-muted" suppressHydrationWarning>
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: color }} />
        <span className="relative inline-flex rounded-full h-2 w-2" style={{ backgroundColor: color }} />
      </span>
      <span suppressHydrationWarning>{label}</span>
    </div>
  );
}

function SeasonPulse({ results }: { results: Array<{ result: 'W' | 'L'; date: string }> }) {
  if (!results.length) return null;
  const last10 = results.slice(-10);
  return (
    <div className="flex items-center justify-center gap-1.5 mt-1" aria-label="Last 10 game results">
      {last10.map((g, i) => {
        const isLast = i === last10.length - 1;
        const size = isLast ? 'w-2 h-2' : 'w-1.5 h-1.5';
        const bg = g.result === 'W' ? 'var(--bsi-success)' : 'var(--bsi-error)';
        return (
          <span
            key={`${g.date}-${i}`}
            className={`${size} rounded-full inline-block`}
            style={{ backgroundColor: bg }}
            title={`${g.result} — ${g.date}`}
          />
        );
      })}
    </div>
  );
}

function useCountdown(targetDate?: string): string {
  const [label, setLabel] = useState('');

  useEffect(() => {
    if (!targetDate) return;

    const compute = () => {
      const now = Date.now();
      const target = new Date(targetDate).getTime();
      const diff = target - now;

      if (diff <= 0) {
        setLabel('Today');
        return;
      }

      const days = Math.floor(diff / 86400000);
      const hours = Math.floor((diff % 86400000) / 3600000);

      if (days > 0) {
        setLabel(`${days}d ${hours}h`);
      } else {
        setLabel(`${hours}h`);
      }
    };

    compute();
    const interval = setInterval(compute, COUNTDOWN_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [targetDate]);

  return label;
}

function resolveOpponentLogo(opponentName?: string): string | null {
  if (!opponentName) return null;
  const lower = opponentName.toLowerCase();
  for (const [, meta] of Object.entries(teamMetadata)) {
    if (meta.name && lower.includes(meta.name.toLowerCase())) {
      return getLogoUrl(meta.espnId, meta.logoId);
    }
  }
  return null;
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function TexasIntelHubClient() {
  const meta = teamMetadata[TEAM_ID];
  const logoUrl = getLogoUrl(meta?.espnId || ESPN_ID, meta?.logoId);

  const { data: teamData, loading: teamLoading } = useSportData<TeamResponse>(
    `/api/college-baseball/teams/${meta?.espnId || ESPN_ID}`,
    { timeout: 10000 },
  );

  const { data: analysesData } = useSportData<GameAnalysesResponse>(
    '/api/college-baseball/texas-intelligence/game-analyses',
    { timeout: 10000 },
  );

  const { data: trendsData } = useSportData<TrendsResponse>(
    '/api/college-baseball/texas-intelligence/trends',
    { timeout: 10000 },
  );

  const [analysisIdx, setAnalysisIdx] = useState(0);
  const recentAnalyses = analysesData?.games?.filter((g) => g.analysis) ?? [];

  // Item 30: Touch swipe state for carousel
  const [touchStart, setTouchStart] = useState<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => setTouchStart(e.touches[0].clientX);
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    const diff = touchStart - e.changedTouches[0].clientX;
    if (Math.abs(diff) > SWIPE_THRESHOLD) {
      if (diff > 0) setAnalysisIdx((i) => Math.min(recentAnalyses.length - 1, i + 1));
      else setAnalysisIdx((i) => Math.max(0, i - 1));
    }
    setTouchStart(null);
  };

  const texasArticles = useMemo(
    () => FEATURE_ARTICLES.filter((a) => a.teams?.includes(TEAM_ID)).slice(0, 4),
    [],
  );

  const stats = teamData?.team?.stats;
  const record = stats ? { wins: stats.wins, losses: stats.losses } : undefined;
  const ranking = teamData?.team?.ranking;
  const standingSummary = teamData?.team?.standingSummary;
  const confRecord = stats?.confWins != null && stats.confWins > 0
    ? { wins: stats.confWins, losses: stats.confLosses }
    : undefined;
  const nextGame = teamData?.team?.nextGame;

  // Item 5: Sticky nav visibility
  const [showStickyNav, setShowStickyNav] = useState(false);
  useEffect(() => {
    const onScroll = () => setShowStickyNav(window.scrollY > STICKY_NAV_OFFSET);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Item 4: Countdown timer
  const countdown = useCountdown(nextGame?.date);
  const opponentLogo = resolveOpponentLogo(nextGame?.opponent);

  // Item 3: Recent results from trends
  const recentResults = trendsData?.recentResults ?? [];

  // Item 26: Live game polling
  const [liveGame, setLiveGame] = useState<LiveScoreGame | null>(null);
  useEffect(() => {
    let cancelled = false;
    const fetchLive = () => {
      fetch('/api/college-baseball/scores')
        .then((r) => (r.ok ? (r.json() as Promise<LiveScoresResponse>) : Promise.reject(r.status)))
        .then((d) => {
          if (cancelled) return;
          const texasGame = d.games?.find(
            (g) =>
              g.status === 'in' &&
              (g.homeTeam.id === 251 || g.awayTeam.id === 251 ||
               g.homeTeam.shortName?.toLowerCase() === 'texas' ||
               g.awayTeam.shortName?.toLowerCase() === 'texas')
          ) ?? null;
          setLiveGame(texasGame);
        })
        .catch(() => { if (!cancelled) setLiveGame(null); });
    };
    fetchLive();
    const interval = setInterval(fetchLive, LIVE_POLL_INTERVAL_MS);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  // Item 29: Keyboard shortcuts
  const router = useRouter();
  const [showShortcuts, setShowShortcuts] = useState(false);
  const toggleShortcuts = useCallback(() => setShowShortcuts((v) => !v), []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT' || target.isContentEditable) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      if (e.key === '?') {
        e.preventDefault();
        toggleShortcuts();
        return;
      }
      if (e.key === 'Escape' && showShortcuts) {
        setShowShortcuts(false);
        return;
      }
      const shortcut = SHORTCUT_MAP[e.key.toLowerCase()];
      if (shortcut) {
        e.preventDefault();
        router.push(shortcut.path);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [router, showShortcuts, toggleShortcuts]);

  return (
    <>
      <main id="main-content">
        {/* ── Breadcrumb ──────────────────────────────────────────── */}
        <Section padding="sm" className="border-b border-border">
          <Container>
            <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm">
              <Link href="/college-baseball" className="text-text-muted hover:text-burnt-orange transition-colors">
                College Baseball
              </Link>
              <span className="text-text-muted">/</span>
              <Link href="/college-baseball/teams/texas" className="text-text-muted hover:text-burnt-orange transition-colors">
                Texas
              </Link>
              <span className="text-text-muted">/</span>
              <span className="text-text-primary">Intelligence Hub</span>
            </nav>
          </Container>
        </Section>

        {/* ── 1. Cinematic Hero ────────────────────────────────────── */}
        <Section padding="xl" className="relative overflow-hidden bg-[var(--surface-scoreboard)] grain-overlay">
          {/* Item 1: Parallax gradient mesh */}
          <div className="absolute inset-0 pointer-events-none" style={{
            background: `
              radial-gradient(ellipse at 20% 50%, rgba(191,87,0,0.08) 0%, transparent 50%),
              radial-gradient(ellipse at 80% 20%, rgba(191,87,0,0.05) 0%, transparent 40%),
              radial-gradient(ellipse at 50% 80%, rgba(191,87,0,0.04) 0%, transparent 60%)
            `,
          }} />
          <div className="absolute top-0 left-0 right-0 h-1" style={{ backgroundColor: ACCENT }} />
          <Container>
            {/* Item 8: Corner marks */}
            <div className="corner-marks">
              <ScrollReveal direction="up">
                <div className="flex flex-col md:flex-row items-start gap-6">
                  <div className="w-20 h-20 flex-shrink-0 rounded-sm bg-surface-light/50 flex items-center justify-center overflow-hidden">
                    <img src={logoUrl} alt="Texas Longhorns" className="w-14 h-14 object-contain" loading="eager" />
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      <span className="heritage-stamp text-[10px]">Intelligence Hub</span>
                      {ranking && (
                        <Badge variant="accent" size="sm">#{ranking} National</Badge>
                      )}
                      {/* Item 7: Dynamic season badge */}
                      {teamData?.meta?.fetched_at && (
                        <Badge variant="secondary" size="sm">
                          {new Date(teamData.meta.fetched_at).getFullYear()} Season
                        </Badge>
                      )}
                    </div>
                    <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold uppercase tracking-wide text-text-primary" style={{ fontFamily: "'Bebas Neue', var(--font-display)" }}>
                      Texas Longhorns Baseball
                    </h1>
                    <p className="text-text-secondary text-lg mt-3 max-w-2xl leading-relaxed">
                      6 CWS titles. 38 CWS appearances. The winningest program in college baseball history.
                    </p>
                    {/* Item 1: Pulsing horizontal rule */}
                    <hr className="w-16 border-t-2 border-burnt-orange mt-6 transition-all duration-300 hover:w-24" />
                    <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-text-muted">
                      <span>UFCU Disch-Falk Field</span>
                      <span className="text-border-subtle">|</span>
                      <span>Austin, TX</span>
                      <span className="text-border-subtle">|</span>
                      <span>SEC</span>
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            </div>
          </Container>
        </Section>

        {/* ── 2. Live Dashboard Strip ────────────────────────────── */}
        <Section padding="md" className="bg-[var(--surface-dugout)] border-y border-border">
          <Container>
            <div className="flex items-center justify-between mb-3">
              {/* Item 9: Data freshness indicator */}
              <FreshnessIndicator timestamp={teamData?.meta?.fetched_at} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <DashboardStat
                label="Record"
                value={record ? `${record.wins}-${record.losses}` : null}
                loading={teamLoading}
              />
              <DashboardStat
                label="SEC"
                value={confRecord ? `${confRecord.wins}-${confRecord.losses}` : standingSummary || null}
                loading={teamLoading}
              />
              <DashboardStat
                label="Conference"
                value={ranking ? `#${ranking}` : standingSummary || null}
                loading={teamLoading}
                accent
              />
              {/* Item 4 + 26: Next game tile / Live game score */}
              <div className="text-center py-2">
                {liveGame ? (
                  <div className="flex flex-col items-center gap-1">
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm bg-[var(--bsi-danger)]/15 mb-1">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--bsi-danger)] opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--bsi-danger)]" />
                      </span>
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--bsi-danger)]">Live</span>
                    </span>
                    <div className="flex items-center gap-2 font-mono text-sm font-bold">
                      <span className="text-text-primary truncate max-w-[60px]">{liveGame.awayTeam.shortName}</span>
                      <span className="text-text-primary">{liveGame.awayTeam.score}</span>
                      <span className="text-text-muted text-xs">-</span>
                      <span className="text-text-primary">{liveGame.homeTeam.score}</span>
                      <span className="text-text-primary truncate max-w-[60px]">{liveGame.homeTeam.shortName}</span>
                    </div>
                    {liveGame.inning != null && (
                      <span className="text-text-muted text-[10px] font-mono">
                        {liveGame.inningHalf === 'top' ? 'Top' : 'Bot'} {liveGame.inning}
                      </span>
                    )}
                  </div>
                ) : teamLoading ? (
                  <div className="h-8 w-16 mx-auto bg-surface-light rounded-sm animate-pulse" />
                ) : nextGame?.opponent ? (
                  <div className="flex flex-col items-center gap-1">
                    <div className="flex items-center gap-2">
                      {opponentLogo && (
                        <img src={opponentLogo} alt="" className="w-5 h-5 object-contain" loading="lazy" />
                      )}
                      <span className="font-mono text-lg font-bold text-text-primary truncate max-w-[120px]">
                        {nextGame.opponent}
                      </span>
                    </div>
                    {countdown && (
                      <span className="text-burnt-orange text-xs font-mono font-semibold" suppressHydrationWarning>
                        {countdown}
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="font-mono text-2xl font-bold text-text-primary">&mdash;</div>
                )}
                <div className="text-text-muted text-xs mt-1 uppercase tracking-wider">
                  {liveGame ? 'Live Game' : 'Next Game'}
                </div>
                {!liveGame && nextGame?.date && !teamLoading && (
                  <div className="text-text-muted text-[10px] mt-0.5">{nextGame.date}</div>
                )}
              </div>
              {/* Item 3: Season pulse mini-chart */}
              <div className="text-center py-2">
                {recentResults.length > 0 ? (
                  <>
                    <div className="font-mono text-2xl font-bold text-text-primary">
                      {recentResults.slice(-10).filter((r) => r.result === 'W').length}-
                      {recentResults.slice(-10).filter((r) => r.result === 'L').length}
                    </div>
                    <SeasonPulse results={recentResults} />
                  </>
                ) : (
                  <div className="h-8 w-16 mx-auto bg-surface-light rounded-sm animate-pulse" />
                )}
                <div className="text-text-muted text-xs mt-1 uppercase tracking-wider">Last 10</div>
              </div>
            </div>
          </Container>
        </Section>

        {/* ── Item 5: Sticky Secondary Nav ────────────────────────── */}
        <div className={`sticky top-0 z-30 transition-all duration-300 ${showStickyNav ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'} bg-[var(--surface-scoreboard)]/95 backdrop-blur-sm border-b border-border`}>
          <Container>
            <nav className="flex items-center gap-1 overflow-x-auto py-2 scrollbar-hide" aria-label="Intelligence sections">
              {INTEL_NAV.map((item) => (
                <Link key={item.href} href={item.href} className="whitespace-nowrap px-3 py-1.5 text-xs font-mono uppercase tracking-wider text-text-muted hover:text-burnt-orange transition-colors">
                  {item.label}
                </Link>
              ))}
            </nav>
          </Container>
        </div>

        {/* ── Intelligence Navigation ──────────────────────────── */}
        <Section padding="lg" borderTop>
          <Container>
            <ScrollReveal direction="up">
              <h2 className="font-display text-2xl md:text-3xl font-bold uppercase tracking-wide mb-6 text-text-primary">
                Intelligence Sections
              </h2>
            </ScrollReveal>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {INTEL_NAV.map((item) => (
                <ScrollReveal key={item.href} direction="up">
                  {/* Item 10: Mobile touch targets — min-h-[44px] + p-4 */}
                  <Link href={item.href} className="block min-h-[44px]">
                    <Card variant="default" padding="md" className="h-full p-4 hover:border-burnt-orange/30 transition-colors cursor-pointer group">
                      <CardContent>
                        <h3 className="font-display font-bold text-sm uppercase tracking-wide text-text-primary group-hover:text-burnt-orange transition-colors">
                          {item.label}
                        </h3>
                        <p className="text-text-muted text-xs mt-1">{item.desc}</p>
                      </CardContent>
                    </Card>
                  </Link>
                </ScrollReveal>
              ))}
            </div>
          </Container>
        </Section>

        {/* ── 3. Roster Sabermetrics ─────────────────────────────── */}
        <Section padding="lg" borderTop>
          <Container>
            <ScrollReveal direction="up">
              <h2 className="font-display text-2xl md:text-3xl font-bold uppercase tracking-wide mb-6 text-text-primary">
                Roster Advanced Metrics
              </h2>
            </ScrollReveal>
            <SabermetricsPanel
              teamId={TEAM_ID}
              espnId={meta?.espnId || ESPN_ID}
              accent={ACCENT}
            />
          </Container>
        </Section>

        {/* ── 4. SEC Conference Position ──────────────────────────── */}
        <Section padding="lg" background="charcoal" borderTop>
          <Container>
            <ScrollReveal direction="up">
              <ConferencePositionCard
                teamId={TEAM_ID}
                espnId={meta?.espnId || ESPN_ID}
                conference="SEC"
                accent={ACCENT}
              />
            </ScrollReveal>
          </Container>
        </Section>

        {/* ── 5. Film Room ───────────────────────────────────────── */}
        <Section padding="lg" borderTop>
          <Container>
            <ScrollReveal direction="up">
              <h2 className="font-display text-2xl md:text-3xl font-bold uppercase tracking-wide mb-6 text-text-primary">
                Film Room
              </h2>
            </ScrollReveal>
            <TeamVideoPanel teamId={TEAM_ID} />
          </Container>
        </Section>

        {/* ── 6. Social Intelligence ─────────────────────────────── */}
        <Section padding="lg" background="charcoal" borderTop>
          <Container>
            <ScrollReveal direction="up">
              <h2 className="font-display text-2xl md:text-3xl font-bold uppercase tracking-wide mb-6 text-text-primary">
                Social Intelligence
              </h2>
            </ScrollReveal>
            <SocialIntelTeamPanel teamId={TEAM_ID} />
          </Container>
        </Section>

        {/* ── Game Analyses Carousel ─────────────────────────────── */}
        {recentAnalyses.length > 0 && (
          <Section padding="lg" borderTop>
            <Container>
              <ScrollReveal direction="up">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-display text-2xl md:text-3xl font-bold uppercase tracking-wide text-text-primary">
                    Post-Game Intel
                  </h2>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setAnalysisIdx((i) => Math.max(0, i - 1))}
                      disabled={analysisIdx === 0}
                      className="w-8 h-8 rounded-sm border border-border flex items-center justify-center text-text-muted hover:text-text-primary disabled:opacity-30 transition-colors"
                      aria-label="Previous game"
                    >
                      &larr;
                    </button>
                    <button
                      onClick={() => setAnalysisIdx((i) => Math.min(recentAnalyses.length - 1, i + 1))}
                      disabled={analysisIdx >= recentAnalyses.length - 1}
                      className="w-8 h-8 rounded-sm border border-border flex items-center justify-center text-text-muted hover:text-text-primary disabled:opacity-30 transition-colors"
                      aria-label="Next game"
                    >
                      &rarr;
                    </button>
                  </div>
                </div>
              </ScrollReveal>
              {(() => {
                const game = recentAnalyses[analysisIdx];
                if (!game?.analysis) return null;
                const texasWon = game.isTexasHome
                  ? game.homeScore > game.awayScore
                  : game.awayScore > game.homeScore;
                const opponent = game.isTexasHome ? game.awayTeam : game.homeTeam;
                return (
                  <Card
                    variant="default"
                    padding="lg"
                    className="relative overflow-hidden"
                    onTouchStart={handleTouchStart}
                    onTouchEnd={handleTouchEnd}
                  >
                    <div
                      className="absolute top-0 left-0 right-0 h-0.5"
                      style={{ backgroundColor: texasWon ? ACCENT : 'var(--text-muted)' }}
                    />
                    <CardHeader>
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <CardTitle className="text-base">
                          Texas {game.isTexasHome ? 'vs' : '@'} {opponent}
                        </CardTitle>
                        <div className="flex items-center gap-3">
                          <Badge variant={texasWon ? 'accent' : 'secondary'} size="sm">
                            {texasWon ? 'W' : 'L'} {game.isTexasHome
                              ? `${game.homeScore}-${game.awayScore}`
                              : `${game.awayScore}-${game.homeScore}`}
                          </Badge>
                          <span className="text-text-muted text-xs">{game.date}</span>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {game.analysis.paragraphs.map((p, i) => (
                        <p key={i} className="text-text-secondary text-sm leading-relaxed mb-3 last:mb-0">
                          {p}
                        </p>
                      ))}
                    </CardContent>
                  </Card>
                );
              })()}
              <div className="flex justify-center gap-1.5 mt-4">
                {recentAnalyses.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setAnalysisIdx(i)}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      i === analysisIdx ? 'bg-burnt-orange' : 'bg-surface-light'
                    }`}
                    aria-label={`Game ${i + 1}`}
                  />
                ))}
              </div>
            </Container>
          </Section>
        )}

        {/* ── 7. Program History Excerpt ──────────────────────────── */}
        <Section padding="lg" borderTop>
          <Container>
            <ScrollReveal direction="up">
              <Card variant="default" padding="lg" className="relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-burnt-orange" />
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <span>Program History</span>
                    <Badge variant="secondary" size="sm">Est. 1895</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-text-secondary text-sm leading-relaxed mb-4">
                    The Texas Longhorns baseball program is the winningest in NCAA history.
                    Six national championships, 38 College World Series appearances, and a
                    pipeline that has produced over 100 MLB draft picks. From Augie Garrido&apos;s
                    dynasty years to the Schlossnagle era, the program carries one of the deepest
                    legacies in American sport.
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <HistoryStat label="National Titles" value="6" />
                    <HistoryStat label="CWS Appearances" value="38" />
                    <HistoryStat label="Conference Titles" value="33" />
                    <HistoryStat label="MLB Draft Picks" value="100+" />
                  </div>
                  <Link
                    href="/college-baseball/texas-history"
                    className="inline-flex items-center gap-2 text-sm text-burnt-orange hover:text-ember transition-colors font-medium"
                  >
                    Explore Full History &rarr;
                  </Link>
                </CardContent>
              </Card>
            </ScrollReveal>
          </Container>
        </Section>

        {/* ── 8. Editorial Cross-Links ───────────────────────────── */}
        {texasArticles.length > 0 && (
          <Section padding="lg" background="charcoal" borderTop>
            <Container>
              <ScrollReveal direction="up">
                <h2 className="font-display text-2xl md:text-3xl font-bold uppercase tracking-wide mb-6 text-text-primary">
                  Recent Coverage
                </h2>
              </ScrollReveal>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {texasArticles.map((article) => (
                  <ScrollReveal key={article.slug} direction="up">
                    <Link href={`/college-baseball/editorial/${article.slug}`}>
                      <Card variant="default" padding="md" className="h-full hover:border-burnt-orange/30 transition-colors cursor-pointer">
                        <CardContent>
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="secondary" size="sm">{article.badge}</Badge>
                            <span className="text-text-muted text-xs">{article.date}</span>
                          </div>
                          <h3 className="font-display font-bold text-sm uppercase tracking-wide text-text-primary mb-2 line-clamp-2">
                            {article.title}
                          </h3>
                          <p className="text-text-muted text-xs leading-relaxed line-clamp-2">
                            {article.description}
                          </p>
                        </CardContent>
                      </Card>
                    </Link>
                  </ScrollReveal>
                ))}
              </div>
            </Container>
          </Section>
        )}

        {/* ── 9. Footer Navigation ───────────────────────────────── */}
        <Section padding="md" borderTop>
          <Container>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <DataSourceBadge
                source="BSI Intelligence"
                timestamp={
                  teamData?.meta?.fetched_at
                    ? new Date(teamData.meta.fetched_at).toLocaleString('en-US', {
                        timeZone: 'America/Chicago',
                        month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
                      }) + ' CT'
                    : 'Live'
                }
              />
              <div className="flex flex-wrap gap-4">
                <Link
                  href="/college-baseball/texas-intelligence/pitching"
                  className="text-sm text-burnt-orange hover:text-ember transition-colors"
                >
                  Pitching Staff &rarr;
                </Link>
                <Link
                  href="/college-baseball/texas-intelligence/schedule"
                  className="text-sm text-burnt-orange hover:text-ember transition-colors"
                >
                  Schedule Heat Map &rarr;
                </Link>
                <Link
                  href="/college-baseball/texas-intelligence/roster"
                  className="text-sm text-text-muted hover:text-text-primary transition-colors"
                >
                  Full Roster &rarr;
                </Link>
                <Link
                  href="/college-baseball/texas-intelligence/nil"
                  className="text-sm text-text-muted hover:text-text-primary transition-colors"
                >
                  NIL Intelligence &rarr;
                </Link>
                <Link
                  href="/college-baseball/teams/texas"
                  className="text-sm text-text-muted hover:text-text-primary transition-colors"
                >
                  Team Detail &rarr;
                </Link>
                <Link
                  href="/college-baseball/texas-history"
                  className="text-sm text-text-muted hover:text-text-primary transition-colors"
                >
                  Program History &rarr;
                </Link>
                <Link
                  href="/college-baseball/savant"
                  className="text-sm text-text-muted hover:text-text-primary transition-colors"
                >
                  BSI Savant &rarr;
                </Link>
              </div>
            </div>
          </Container>
        </Section>
      </main>

      {/* Item 29: Keyboard shortcuts overlay */}
      {showShortcuts && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setShowShortcuts(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Keyboard shortcuts"
        >
          <div
            className="bg-[var(--surface-dugout)] border border-[var(--border-vintage)] rounded-sm p-6 max-w-sm w-full mx-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <span className="heritage-stamp text-[10px]">Keyboard Shortcuts</span>
              <button
                onClick={() => setShowShortcuts(false)}
                className="text-text-muted hover:text-text-primary text-lg leading-none transition-colors"
                aria-label="Close shortcuts"
              >
                &times;
              </button>
            </div>
            <div className="space-y-2">
              {Object.entries(SHORTCUT_MAP).map(([key, { label }]) => (
                <div key={key} className="flex items-center justify-between py-1.5 border-b border-border-subtle last:border-0">
                  <span className="text-text-secondary text-sm">{label}</span>
                  <kbd className="font-mono text-xs bg-[var(--surface-press-box)] border border-border-subtle rounded-sm px-2 py-0.5 text-text-primary">
                    {key.toUpperCase()}
                  </kbd>
                </div>
              ))}
              <div className="flex items-center justify-between py-1.5">
                <span className="text-text-secondary text-sm">Toggle this panel</span>
                <kbd className="font-mono text-xs bg-[var(--surface-press-box)] border border-border-subtle rounded-sm px-2 py-0.5 text-text-primary">
                  ?
                </kbd>
              </div>
            </div>
          </div>
        </div>
      )}

    </>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────

function DashboardStat({
  label,
  value,
  sub,
  loading,
  accent,
}: {
  label: string;
  value: string | null;
  sub?: string;
  loading: boolean;
  accent?: boolean;
}) {
  return (
    <div className="text-center py-2">
      {loading ? (
        <div className="h-8 w-16 mx-auto bg-surface-light rounded-sm animate-pulse" />
      ) : value ? (
        <AnimatedStatValue value={value} accent={accent} />
      ) : (
        <span className="font-mono text-2xl font-bold">&mdash;</span>
      )}
      <div className="text-text-muted text-xs mt-1 uppercase tracking-wider">{label}</div>
      {sub && <div className="text-text-muted text-[10px] mt-0.5">{sub}</div>}
    </div>
  );
}

function HistoryStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <div className="font-mono text-xl font-bold text-burnt-orange">{value}</div>
      <div className="text-text-muted text-xs mt-1">{label}</div>
    </div>
  );
}
