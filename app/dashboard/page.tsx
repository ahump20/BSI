'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { SportTabs, SportTabsCompact, type Sport } from '@/components/sports/SportTabs';

const StandingsBarChart = dynamic(
  () => import('@/components/dashboard/DashboardCharts').then((mod) => mod.StandingsBarChart),
  { ssr: false, loading: () => <ChartLoadingPlaceholder /> }
);

const SportCoveragePieChart = dynamic(
  () => import('@/components/dashboard/DashboardCharts').then((mod) => mod.SportCoveragePieChart),
  { ssr: false, loading: () => <ChartLoadingPlaceholder /> }
);

function ChartLoadingPlaceholder() {
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setTimedOut(true), 5000);
    return () => clearTimeout(timer);
  }, []);

  if (timedOut) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="text-center">
          <svg viewBox="0 0 24 24" className="w-10 h-10 mx-auto text-white/15 mb-3" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v6l4 2" />
          </svg>
          <p className="text-text-tertiary text-sm">No chart data available</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 text-xs text-burnt-orange hover:text-burnt-orange/80 underline transition-colors"
          >
            Reload page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-64 flex items-center justify-center">
      <div className="flex flex-col items-center gap-2">
        <div className="w-8 h-8 border-2 border-burnt-orange/30 border-t-burnt-orange rounded-full animate-spin" />
        <span className="text-xs text-text-tertiary">Loading chart...</span>
      </div>
    </div>
  );
}

import { LiveScoresPanel } from '@/components/sports/LiveScoresPanel';
import { StandingsTable } from '@/components/sports/StandingsTable';
import { SportLeaders } from '@/components/sports/SportLeaders';
import { DataSourcePanel, DataDisclaimer, type DataSource } from '@/components/sports';
import { LiveBadge } from '@/components/ui/Badge';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { ScrollReveal } from '@/components/cinematic';
import { Footer } from '@/components/layout-ds/Footer';
import { useUserSettings } from '@/lib/hooks';

interface DashboardStats {
  liveGames: number;
  todaysGames: number;
  totalTeams: number;
  lastUpdated: string;
}

interface StandingsTeam {
  teamName: string;
  wins: number;
  losses: number;
  winPct?: number;
}

function getDashboardSources(sport: Sport, lastUpdated: string): DataSource[] {
  const sportsDataIO: DataSource = {
    name: 'SportsDataIO',
    url: 'https://sportsdata.io',
    fetchedAt: lastUpdated,
    description: 'Scores, standings, rosters, and player statistics',
  };
  const highlightlyPro: DataSource = {
    name: 'Highlightly Pro',
    url: 'https://highlightly.net',
    fetchedAt: lastUpdated,
    description: 'Primary data pipeline for baseball and football',
  };
  const espnCollegeBaseball: DataSource = {
    name: 'ESPN',
    url: 'https://site.api.espn.com',
    fetchedAt: lastUpdated,
    description: 'NCAA Division I baseball scores, rankings, and schedules',
  };

  const sources: Record<Sport, DataSource[]> = {
    mlb: [sportsDataIO, highlightlyPro],
    nfl: [sportsDataIO],
    nba: [sportsDataIO],
    ncaa: [espnCollegeBaseball, highlightlyPro],
  };
  return sources[sport] || sources.mlb;
}

const SPORT_TEAM_COUNTS: Record<Sport, number> = {
  mlb: 30,
  nfl: 32,
  nba: 30,
  ncaa: 300,
};

type AuthStatus = 'checking' | 'authenticated' | 'unauthenticated';

export default function DashboardPage() {
  const [authStatus, setAuthStatus] = useState<AuthStatus>('checking');
  const [authTier, setAuthTier] = useState<string | null>(null);

  useEffect(() => {
    const key = typeof window !== 'undefined' ? localStorage.getItem('bsi-api-key') : null;
    if (!key) {
      setAuthStatus('unauthenticated');
      return;
    }

    fetch('/api/auth/validate', { headers: { 'X-BSI-Key': key } })
      .then((res) => res.json() as Promise<{ valid?: boolean; tier?: string }>)
      .then((data) => {
        if (data.valid) {
          setAuthTier(data.tier ?? null);
          setAuthStatus('authenticated');
        } else {
          localStorage.removeItem('bsi-api-key');
          setAuthStatus('unauthenticated');
        }
      })
      .catch(() => {
        localStorage.removeItem('bsi-api-key');
        setAuthStatus('unauthenticated');
      });
  }, []);

  if (authStatus === 'checking') {
    return (
      <main id="main-content" className="min-h-screen pt-24 md:pt-28 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-burnt-orange/30 border-t-burnt-orange rounded-full animate-spin mx-auto mb-4" />
          <p className="text-text-secondary text-sm">Verifying access...</p>
        </div>
      </main>
    );
  }

  if (authStatus === 'unauthenticated') {
    if (typeof window !== 'undefined') {
      window.location.href = '/auth/login';
    }
    return null;
  }

  return <DashboardContent tier={authTier} />;
}

function DashboardContent({ tier }: { tier: string | null }) {
  const [activeSport, setActiveSport] = useState<Sport>('mlb');
  const [stats, setStats] = useState<DashboardStats>({
    liveGames: 0,
    todaysGames: 0,
    totalTeams: 30,
    lastUpdated: '',
  });
  const [standings, setStandings] = useState<StandingsTeam[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(60);

  const handleSignOut = () => {
    localStorage.removeItem('bsi-api-key');
    window.location.href = '/';
  };

  const { formatDateTime, isLoaded: timezoneLoaded } = useUserSettings();
  const lastUpdatedLabel = stats.lastUpdated && timezoneLoaded
    ? formatDateTime(new Date(stats.lastUpdated)).split(',')[1]?.trim() || 'Now'
    : 'Now';

  // Countdown timer for auto-refresh
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => (prev <= 1 ? 60 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    async function fetchDashboardData() {
      setIsLoading(true);
      setFetchError(null);

      try {
        const apiBase =
          activeSport === 'mlb' ? '/api/mlb'
            : activeSport === 'nfl' ? '/api/nfl'
            : activeSport === 'nba' ? '/api/nba'
            : '/api/college-baseball';

        const standingsRes = await fetch(`${apiBase}/standings`);
        if (standingsRes.ok) {
          const standingsData = await standingsRes.json() as {
            standings?: StandingsTeam[];
            teams?: StandingsTeam[];
            meta?: { lastUpdated?: string };
          };
          const teamList = standingsData.standings || standingsData.teams || [];
          setStandings(teamList.slice(0, 10));
          setStats((prev) => ({
            ...prev,
            totalTeams: teamList.length || SPORT_TEAM_COUNTS[activeSport],
            lastUpdated: standingsData.meta?.lastUpdated || '',
          }));
        }

        const scoresEndpoint = activeSport === 'nba' ? `${apiBase}/scoreboard` : `${apiBase}/scores`;
        const scoresRes = await fetch(scoresEndpoint);
        if (scoresRes.ok) {
          const scoresData = await scoresRes.json() as {
            games?: Array<{ status?: { type?: { state?: string }; isLive?: boolean } | string }>;
            scoreboard?: { games?: Array<{ status?: { type?: { state?: string }; isLive?: boolean } | string }> };
          };
          const games = scoresData.games || scoresData.scoreboard?.games || [];

          const liveGames = games.filter((g) => {
            const status = g.status;
            if (typeof status === 'object' && (status?.type?.state === 'in' || status?.isLive)) return true;
            if (typeof status === 'string') return status.toLowerCase().includes('in progress');
            return false;
          }).length;

          setStats((prev) => ({
            ...prev,
            liveGames,
            todaysGames: games.length,
          }));
        }
      } catch (err) {
        setFetchError(err instanceof Error ? err.message : 'Failed to load dashboard data');
      } finally {
        setIsLoading(false);
      }
    }

    fetchDashboardData();
    const interval = setInterval(() => {
      fetchDashboardData();
      setCountdown(60);
    }, 60000);
    return () => clearInterval(interval);
  }, [activeSport]);

  const standingsChartData = standings.slice(0, 8).map((team, index) => ({
    name: team.teamName?.split(' ').pop() || `Team ${index + 1}`,
    wins: team.wins || 0,
    losses: team.losses || 0,
    winPct: team.winPct || team.wins / (team.wins + team.losses) || 0,
  }));

  // Coverage pie chart — show real data only when available
  const hasCoverageData = false; // No live-scores endpoint wired yet; show empty state
  const sportDistributionData = [
    { name: 'MLB', value: 25, color: '#C41E3A' },
    { name: 'NFL', value: 25, color: '#013369' },
    { name: 'NBA', value: 25, color: '#1D428A' },
    { name: 'NCAA', value: 25, color: '#BF5700' },
  ];

  return (
    <main id="main-content" className="min-h-screen pt-24 md:pt-28">
      <Section padding="lg" className="pt-8">
        <Container size="wide">
          {/* Header with Logo */}
          <ScrollReveal direction="up">
            <div className="mb-8 flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <Image
                  src="/images/brand/logo-full.webp"
                  alt="Blaze Sports Intel"
                  width={48}
                  height={48}
                  className="rounded-lg"
                />
                <div>
                  <h1 className="text-3xl md:text-4xl font-display text-white mb-1">
                    COMMAND CENTER
                  </h1>
                  <p className="text-white/60 text-sm">
                    Real-time scores, standings, and analytics across all leagues
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {tier && (
                  <span className="px-3 py-1 bg-burnt-orange/20 text-burnt-orange rounded-full text-xs font-semibold uppercase tracking-wider">
                    {tier}
                  </span>
                )}
                <LiveBadge />
                {stats.liveGames > 0 && (
                  <span className="px-3 py-1 bg-green-600/20 text-green-400 rounded-full text-sm font-medium animate-pulse">
                    {stats.liveGames} Live Now
                  </span>
                )}
                <button
                  onClick={handleSignOut}
                  className="px-3 py-1.5 text-xs text-white/40 hover:text-white/70 border border-white/10 hover:border-white/20 rounded-lg transition-colors"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </ScrollReveal>

          {/* Sport Tabs */}
          <ScrollReveal direction="up" delay={100}>
            <div className="hidden md:block mb-8">
              <SportTabs defaultSport={activeSport} onSportChange={setActiveSport} />
            </div>
          </ScrollReveal>
          <div className="md:hidden mb-6">
            <SportTabsCompact defaultSport={activeSport} onSportChange={setActiveSport} />
          </div>

          {/* Error Banner */}
          {fetchError && (
            <div className="mb-6 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center justify-between">
              <span className="text-red-400 text-sm">{fetchError}</span>
              <button
                onClick={() => { setFetchError(null); setIsLoading(true); }}
                className="text-xs text-red-400 hover:text-red-300 underline"
              >
                Retry
              </button>
            </div>
          )}

          {/* KPI Stats Row */}
          <ScrollReveal direction="up" delay={150}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {isLoading ? (
                <>
                  <StatCardSkeleton />
                  <StatCardSkeleton />
                  <StatCardSkeleton />
                  <StatCardSkeleton />
                </>
              ) : (
                <>
                  <StatCard
                    label="Live Games"
                    value={stats.liveGames}
                    trend={stats.liveGames > 0 ? 'live' : undefined}
                    icon={<LiveIcon />}
                  />
                  <StatCard
                    label="Today's Games"
                    value={stats.todaysGames}
                    subtitle={activeSport.toUpperCase()}
                    icon={<CalendarIcon />}
                  />
                  <StatCard
                    label="Teams"
                    value={stats.totalTeams}
                    subtitle="in standings"
                    icon={<TeamIcon />}
                  />
                  <StatCard
                    label="Last Updated"
                    value={lastUpdatedLabel}
                    subtitle={`${countdown}s`}
                    icon={<CountdownRing seconds={countdown} total={60} />}
                  />
                </>
              )}
            </div>
          </ScrollReveal>

          {/* Main Grid: Scores + Standings */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            <ScrollReveal direction="left" delay={200} className="lg:col-span-2">
              <LiveScoresPanel sport={activeSport} />
            </ScrollReveal>
            <ScrollReveal direction="right" delay={300}>
              <StandingsTable
                sport={activeSport}
                limit={5}
                groupBy={activeSport === 'nba' ? 'conference' : activeSport === 'nfl' ? 'conference' : 'none'}
                showLogos={activeSport === 'nba'}
              />
            </ScrollReveal>
          </div>

          {/* Leaders Section */}
          <ScrollReveal direction="up" delay={350}>
            <SportLeaders sport={activeSport} className="mb-8" />
          </ScrollReveal>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <ScrollReveal direction="up" delay={400}>
              <Card padding="lg" className="h-full">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">Win Distribution</h3>
                  <span className="text-xs text-white/30 uppercase tracking-wider">Top 8 Teams</span>
                </div>
                {fetchError || (!isLoading && standingsChartData.length === 0) ? (
                  <div className="h-64 flex items-center justify-center">
                    <div className="text-center">
                      <svg viewBox="0 0 24 24" className="w-10 h-10 mx-auto text-white/15 mb-3" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <rect x="3" y="3" width="18" height="18" rx="2" />
                        <path d="M3 9h18M9 21V9" />
                      </svg>
                      <p className="text-text-tertiary text-sm">
                        {fetchError ? 'Standings data unavailable' : `No standings data for ${activeSport.toUpperCase()}`}
                      </p>
                    </div>
                  </div>
                ) : (
                  <StandingsBarChart data={standingsChartData} isLoading={isLoading} />
                )}
              </Card>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={450}>
              <Card padding="lg" className="h-full">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">Coverage Overview</h3>
                  <span className="text-xs text-white/30 uppercase tracking-wider">All Sports</span>
                </div>
                {hasCoverageData ? (
                  <SportCoveragePieChart data={sportDistributionData} />
                ) : (
                  <div className="h-64 flex items-center justify-center">
                    <div className="text-center">
                      <svg viewBox="0 0 24 24" className="w-10 h-10 mx-auto text-white/15 mb-3" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M12 6v6l4 2" />
                      </svg>
                      <p className="text-text-tertiary text-sm">Coverage data unavailable</p>
                      <p className="text-text-tertiary/60 text-xs mt-1">Live scores integration pending</p>
                    </div>
                  </div>
                )}
              </Card>
            </ScrollReveal>
          </div>

          {/* Quick Links — 4-column grid with Arcade included */}
          <ScrollReveal direction="up" delay={500}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <QuickLinkCard href="/mlb" icon="/icons/baseball.svg" title="MLB" subtitle="Scores & Standings" />
              <QuickLinkCard href="/nfl" icon="/icons/football.svg" title="NFL" subtitle="Games & Stats" />
              <QuickLinkCard href="/nba" icon="/icons/basketball.svg" title="NBA" subtitle="Scores & Stats" />
              <QuickLinkCard href="/college-baseball" icon="/icons/baseball.svg" title="NCAA Baseball" subtitle="Rankings & Scores" />
              <QuickLinkCard href="/cfb" icon="/icons/football.svg" title="CFB" subtitle="Rankings & Standings" />
              <ArcadeQuickLinkCard />
            </div>
          </ScrollReveal>

          {/* Provider Health */}
          <ProviderHealthPanel />

          {/* Data Attribution */}
          <DataSourcePanel
            sources={getDashboardSources(activeSport, stats.lastUpdated)}
            lastUpdated={stats.lastUpdated}
            refreshInterval={60}
            className="mb-6"
          />
          <DataDisclaimer />
          <div className="mt-4 text-center">
            <Link
              href="/data-sources"
              className="text-xs text-white/30 hover:text-white/50 transition-colors underline underline-offset-2"
            >
              View all data sources and refresh cadences →
            </Link>
          </div>
        </Container>
      </Section>

      <Footer />
    </main>
  );
}

// ── Provider Health Panel ────────────────────────────────────────────────────

interface ProviderStatus {
  status: 'ok' | 'degraded' | 'down';
  lastSuccessAt?: string;
  lastCheckAt: string;
}

interface HealthData {
  providers: Record<string, ProviderStatus>;
  checkedAt: string | null;
  activeSports: string[];
}

const SPORT_DISPLAY: Record<string, string> = {
  mlb: 'MLB', nfl: 'NFL', nba: 'NBA', ncaa: 'NCAA', rankings: 'Rankings',
};

const STATUS_COLORS: Record<string, { dot: string; text: string }> = {
  ok: { dot: 'bg-green-500', text: 'text-green-400' },
  degraded: { dot: 'bg-yellow-500', text: 'text-yellow-400' },
  down: { dot: 'bg-red-500', text: 'text-red-400' },
};

function ProviderHealthPanel() {
  const [health, setHealth] = useState<HealthData | null>(null);

  useEffect(() => {
    fetch('/api/health/providers')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => { if (data) setHealth(data as HealthData); })
      .catch(() => {}); // Non-critical — panel hides gracefully
  }, []);

  if (!health || !health.checkedAt || Object.keys(health.providers).length === 0) return null;

  return (
    <div className="mb-6 bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-white/30 uppercase tracking-wider font-medium">Data Pipeline</span>
        <span className="text-[10px] text-white/20">
          Checked {new Date(health.checkedAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'America/Chicago' })}
        </span>
      </div>
      <div className="flex flex-wrap gap-3">
        {Object.entries(health.providers).map(([key, provider]) => {
          const colors = STATUS_COLORS[provider.status] || STATUS_COLORS.down;
          return (
            <div key={key} className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${colors.dot}`} />
              <span className="text-sm text-white/60">{SPORT_DISPLAY[key] || key}</span>
              <span className={`text-[10px] ${colors.text}`}>{provider.status}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Sub-Components ──────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  trend?: 'up' | 'down' | 'live';
  icon?: React.ReactNode;
}

function StatCard({ label, value, subtitle, trend, icon }: StatCardProps) {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-white/40 uppercase tracking-wider mb-1">{label}</p>
          <p className={`text-2xl font-bold ${
            trend === 'live' ? 'text-green-400' : trend === 'up' ? 'text-green-500' : trend === 'down' ? 'text-red-400' : 'text-white'
          }`}>
            {value}
          </p>
          {subtitle && <p className="text-xs text-white/30 mt-0.5">{subtitle}</p>}
        </div>
        {icon && <div className="text-white/20">{icon}</div>}
      </div>
    </Card>
  );
}

function StatCardSkeleton() {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="h-3 w-16 bg-white/10 rounded animate-pulse mb-2" />
          <div className="h-7 w-12 bg-white/10 rounded animate-pulse mb-1" />
          <div className="h-3 w-20 bg-white/5 rounded animate-pulse" />
        </div>
        <div className="w-6 h-6 bg-white/5 rounded animate-pulse" />
      </div>
    </Card>
  );
}

interface QuickLinkCardProps {
  href: string;
  icon: string;
  title: string;
  subtitle: string;
}

function QuickLinkCard({ href, icon, title, subtitle }: QuickLinkCardProps) {
  return (
    <Link
      href={href}
      className="block p-4 bg-white/5 rounded-lg hover:bg-white/8 hover:border-[#BF5700] border border-transparent transition-all group"
    >
      <Image src={icon} alt="" width={28} height={28} className="mb-2 opacity-60 group-hover:opacity-100 transition-opacity" />
      <p className="font-semibold text-white group-hover:text-[#BF5700] transition-colors text-sm">
        {title}
      </p>
      <p className="text-xs text-white/40">{subtitle}</p>
    </Link>
  );
}

function ArcadeQuickLinkCard() {
  return (
    <Link
      href="/arcade"
      className="block p-4 bg-white/5 rounded-lg hover:bg-white/8 hover:border-[#BF5700] border border-transparent transition-all group"
    >
      <svg viewBox="0 0 24 24" className="w-7 h-7 mb-2 opacity-60 group-hover:opacity-100 transition-opacity text-[var(--bsi-gold,#D4A843)]" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="2" y="6" width="20" height="12" rx="2" />
        <circle cx="9" cy="12" r="2" />
        <path d="M15 10v4M13 12h4" />
      </svg>
      <p className="font-semibold text-white group-hover:text-[#BF5700] transition-colors text-sm">
        Arcade
      </p>
      <p className="text-xs text-white/40">Mini-games</p>
    </Link>
  );
}

// ── Icons ───────────────────────────────────────────────────────────────────

function LiveIcon() {
  return (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="4" />
      <path d="M16.24 7.76a6 6 0 0 1 0 8.49m-8.48-.01a6 6 0 0 1 0-8.49m11.31-2.82a10 10 0 0 1 0 14.14m-14.14 0a10 10 0 0 1 0-14.14" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function TeamIcon() {
  return (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M23 4v6h-6" />
      <path d="M1 20v-6h6" />
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </svg>
  );
}

/** Circular countdown ring — fills clockwise as the timer ticks down */
function CountdownRing({ seconds, total }: { seconds: number; total: number }) {
  const radius = 10;
  const circumference = 2 * Math.PI * radius;
  const progress = seconds / total;
  const dashOffset = circumference * (1 - progress);

  return (
    <svg className="w-7 h-7" viewBox="0 0 24 24">
      {/* Background track */}
      <circle cx="12" cy="12" r={radius} fill="none" stroke="currentColor" strokeWidth="2" opacity="0.1" />
      {/* Progress arc */}
      <circle
        cx="12" cy="12" r={radius}
        fill="none"
        stroke="#BF5700"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={dashOffset}
        className="transition-[stroke-dashoffset] duration-1000 ease-linear"
        style={{ transform: 'rotate(-90deg)', transformOrigin: 'center' }}
      />
      {/* Center text */}
      <text x="12" y="12" textAnchor="middle" dominantBaseline="central" fill="currentColor" fontSize="7" fontFamily="monospace">
        {seconds}
      </text>
    </svg>
  );
}
