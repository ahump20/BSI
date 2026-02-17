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
  return (
    <div className="h-64 flex items-center justify-center">
      <div className="w-full max-w-sm space-y-3 px-4" aria-hidden>
        <div className="h-4 rounded bg-white/10 animate-pulse" />
        <div className="h-4 rounded bg-white/10 animate-pulse" />
        <div className="h-4 rounded bg-white/10 animate-pulse" />
        <div className="h-4 rounded bg-white/10 animate-pulse" />
      </div>
      <span className="sr-only">Refreshing chart data</span>
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
import { useLiveScoresMeta, useUserSettings } from '@/lib/hooks';

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

type RawStandingsRow = Record<string, unknown>;

type DashboardApiMeta = {
  source?: string;
  dataSource?: string;
  fetched_at?: string;
  lastUpdated?: string;
  timezone?: string;
  note?: string;
};

function getDashboardSources(
  sport: Sport,
  lastUpdated: string,
  liveScoresMeta: DashboardApiMeta | null,
  standingsMeta: DashboardApiMeta | null,
): DataSource[] {
  const sourceLabel =
    standingsMeta?.dataSource ||
    standingsMeta?.source ||
    liveScoresMeta?.dataSource ||
    liveScoresMeta?.source ||
    'SportsDataIO';
  const sourceTimestamp =
    standingsMeta?.lastUpdated ||
    standingsMeta?.fetched_at ||
    liveScoresMeta?.fetched_at ||
    lastUpdated;

  const sources: Record<Sport, DataSource[]> = {
    mlb: [
      {
        name: sourceLabel,
        fetchedAt: sourceTimestamp,
        description: 'Primary MLB standings and live score feed for the command center.',
      },
      {
        name: 'Baseball-Reference',
        url: 'https://www.baseball-reference.com',
        fetchedAt: sourceTimestamp,
        description: 'Historical context and advanced MLB stat references.',
      },
    ],
    nfl: [
      {
        name: sourceLabel,
        fetchedAt: sourceTimestamp,
        description: 'Primary NFL standings and score feed for dashboard updates.',
      },
      {
        name: 'Pro-Football-Reference',
        url: 'https://www.pro-football-reference.com',
        fetchedAt: sourceTimestamp,
        description: 'NFL historical records and advanced context.',
      },
    ],
    nba: [
      {
        name: sourceLabel,
        fetchedAt: sourceTimestamp,
        description: 'Primary NBA scores and standings feed.',
      },
    ],
    ncaa: [
      {
        name: sourceLabel,
        fetchedAt: sourceTimestamp,
        description: 'Primary college baseball feed with ESPN/D1 fallback coverage.',
      },
      {
        name: 'D1Baseball',
        url: 'https://d1baseball.com',
        fetchedAt: sourceTimestamp,
        description: 'College baseball rankings and editorial context.',
      },
    ],
  };
  return sources[sport] || sources.mlb;
}

const SPORT_TEAM_COUNTS: Record<Sport, number> = {
  mlb: 30,
  nfl: 32,
  nba: 30,
  ncaa: 300,
};

const DASHBOARD_STANDINGS_FALLBACK: Record<Sport, StandingsTeam[]> = {
  mlb: [
    { teamName: 'Los Angeles Dodgers', wins: 98, losses: 64, winPct: 0.605 },
    { teamName: 'Philadelphia Phillies', wins: 95, losses: 67, winPct: 0.586 },
    { teamName: 'New York Yankees', wins: 94, losses: 68, winPct: 0.58 },
    { teamName: 'Baltimore Orioles', wins: 91, losses: 71, winPct: 0.562 },
    { teamName: 'Atlanta Braves', wins: 89, losses: 73, winPct: 0.549 },
  ],
  nfl: [
    { teamName: 'Kansas City Chiefs', wins: 12, losses: 5, winPct: 0.706 },
    { teamName: 'Baltimore Ravens', wins: 11, losses: 6, winPct: 0.647 },
    { teamName: 'Miami Dolphins', wins: 11, losses: 6, winPct: 0.647 },
    { teamName: 'Buffalo Bills', wins: 10, losses: 7, winPct: 0.588 },
    { teamName: 'Dallas Cowboys', wins: 10, losses: 7, winPct: 0.588 },
  ],
  nba: [
    { teamName: 'Boston Celtics', wins: 64, losses: 18, winPct: 0.78 },
    { teamName: 'Oklahoma City Thunder', wins: 57, losses: 25, winPct: 0.695 },
    { teamName: 'Denver Nuggets', wins: 54, losses: 28, winPct: 0.659 },
    { teamName: 'Minnesota Timberwolves', wins: 56, losses: 26, winPct: 0.683 },
    { teamName: 'Milwaukee Bucks', wins: 49, losses: 33, winPct: 0.598 },
  ],
  ncaa: [
    { teamName: 'Tennessee Volunteers', wins: 53, losses: 13, winPct: 0.803 },
    { teamName: 'Texas A&M Aggies', wins: 50, losses: 15, winPct: 0.769 },
    { teamName: 'Kentucky Wildcats', wins: 46, losses: 16, winPct: 0.742 },
    { teamName: 'Arkansas Razorbacks', wins: 44, losses: 17, winPct: 0.721 },
    { teamName: 'LSU Tigers', wins: 43, losses: 18, winPct: 0.705 },
  ],
};

function toNumber(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return 0;
}

function normalizeStandingsTeam(row: RawStandingsRow): StandingsTeam | null {
  const teamName =
    (row.teamName as string | undefined) ||
    (row.name as string | undefined) ||
    (row.Team as string | undefined);

  if (!teamName) return null;

  const wins = toNumber(row.wins ?? row.Wins);
  const losses = toNumber(row.losses ?? row.Losses);
  const explicitPct = toNumber(row.winPct ?? row.winPercentage ?? row.Percentage);
  const totalGames = wins + losses;
  const winPct = explicitPct > 0 ? explicitPct : totalGames > 0 ? wins / totalGames : 0;

  return {
    teamName,
    wins,
    losses,
    winPct,
  };
}

function parseStandingsPayload(payload: {
  standings?: unknown;
  teams?: unknown;
  groups?: unknown;
}): StandingsTeam[] {
  const candidates: unknown[] = [];
  if (Array.isArray(payload.standings)) candidates.push(payload.standings);
  if (Array.isArray(payload.teams)) candidates.push(payload.teams);
  if (Array.isArray(payload.groups)) candidates.push(payload.groups);

  for (const candidate of candidates) {
    const rows = candidate as unknown[];
    if (!rows.length) continue;

    if (typeof rows[0] === 'object' && rows[0] && Array.isArray((rows[0] as Record<string, unknown>).teams)) {
      const groupedTeams = rows.flatMap((group) => {
        const groupValue = group as Record<string, unknown>;
        const groupTeams = Array.isArray(groupValue.teams) ? groupValue.teams : [];
        return groupTeams
          .map((team) => normalizeStandingsTeam(team as RawStandingsRow))
          .filter((team): team is StandingsTeam => team !== null);
      });
      if (groupedTeams.length > 0) return groupedTeams;
      continue;
    }

    const normalized = rows
      .map((row) => normalizeStandingsTeam(row as RawStandingsRow))
      .filter((team): team is StandingsTeam => team !== null);
    if (normalized.length > 0) return normalized;
  }

  return [];
}

export default function DashboardPage() {
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
  const [coverageCounts, setCoverageCounts] = useState<Record<string, number>>({});
  const [standingsMeta, setStandingsMeta] = useState<DashboardApiMeta | null>(null);
  const { meta: liveScoresMeta } = useLiveScoresMeta(30000);

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
        const fallbackTeams = DASHBOARD_STANDINGS_FALLBACK[activeSport];

        if (standingsRes.ok) {
          const standingsData = await standingsRes.json() as {
            standings?: unknown;
            teams?: unknown;
            groups?: unknown;
            meta?: DashboardApiMeta;
          };

          const normalizedTeams = parseStandingsPayload(standingsData);
          const teamsToDisplay = normalizedTeams.length > 0 ? normalizedTeams : fallbackTeams;
          const resolvedLastUpdated =
            standingsData.meta?.lastUpdated ||
            standingsData.meta?.fetched_at ||
            new Date().toISOString();

          setStandings(teamsToDisplay.slice(0, 10));
          setStandingsMeta({
            source: standingsData.meta?.source,
            dataSource: standingsData.meta?.dataSource,
            fetched_at: standingsData.meta?.fetched_at,
            lastUpdated: resolvedLastUpdated,
            timezone: standingsData.meta?.timezone || 'America/Chicago',
            note: standingsData.meta?.note,
          });
          setStats((prev) => ({
            ...prev,
            totalTeams: teamsToDisplay.length || SPORT_TEAM_COUNTS[activeSport],
            lastUpdated: resolvedLastUpdated,
          }));
        } else {
          setStandings(fallbackTeams.slice(0, 10));
          setStandingsMeta({
            source: 'Blaze Sports Intel fallback snapshot',
            dataSource: 'Blaze Sports Intel fallback snapshot',
            fetched_at: new Date().toISOString(),
            lastUpdated: new Date().toISOString(),
            timezone: 'America/Chicago',
            note: 'Primary standings feed is delayed. Showing last known snapshot.',
          });
          setStats((prev) => ({
            ...prev,
            totalTeams: fallbackTeams.length || SPORT_TEAM_COUNTS[activeSport],
            lastUpdated: new Date().toISOString(),
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
        // Fetch coverage counts from live-scores for pie chart
        try {
          const liveRes = await fetch('/api/live-scores');
          if (liveRes.ok) {
            const liveData = await liveRes.json() as Record<string, unknown>;
            const counts: Record<string, number> = {};
            for (const [key, val] of Object.entries(liveData)) {
              if (key === 'meta') continue;
              if (Array.isArray(val)) counts[key] = val.length;
              else if (typeof val === 'object' && val && 'games' in (val as Record<string, unknown>)) {
                counts[key] = ((val as Record<string, unknown>).games as unknown[])?.length ?? 0;
              }
            }
            setCoverageCounts(counts);
          }
        } catch {
          // Non-critical, keep hardcoded fallback
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

  const sportDistributionData = [
    { name: 'MLB', value: coverageCounts.mlb ?? coverageCounts.baseball ?? 25, color: '#C41E3A' },
    { name: 'NFL', value: coverageCounts.nfl ?? coverageCounts.football ?? 25, color: '#013369' },
    { name: 'NBA', value: coverageCounts.nba ?? coverageCounts.basketball ?? 20, color: '#1D428A' },
    { name: 'NCAA', value: coverageCounts.ncaa ?? coverageCounts['college-baseball'] ?? 20, color: '#BF5700' },
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
                <LiveBadge />
                {stats.liveGames > 0 && (
                  <span className="px-3 py-1 bg-green-600/20 text-green-400 rounded-full text-sm font-medium animate-pulse">
                    {stats.liveGames} Live Now
                  </span>
                )}
              </div>
            </div>
          </ScrollReveal>

          {/* BSI Arcade Card */}
          <ScrollReveal direction="up" delay={50}>
            <a
              href="/arcade"
              className="glass-elevated mb-8 p-5 flex items-center justify-between gap-4 group hover:border-[var(--bsi-gold)] transition-all block"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-[var(--bsi-gold)]/20 flex items-center justify-center text-2xl">
                  &#x1F3AE;
                </div>
                <div>
                  <h3 className="text-white font-display text-lg uppercase tracking-wide">
                    BSI Arcade
                  </h3>
                  <p className="text-white/50 text-sm">
                    Play sports mini-games and compete on the leaderboard
                  </p>
                </div>
              </div>
              <span className="text-white/40 group-hover:text-white group-hover:translate-x-1 transition-all text-xl">
                &rarr;
              </span>
            </a>
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
                subtitle={`refresh in ${countdown}s`}
                icon={<RefreshIcon />}
              />
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

          {/* Leaders Section -- all sports */}
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
                <StandingsBarChart data={standingsChartData} isLoading={isLoading} />
              </Card>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={450}>
              <Card padding="lg" className="h-full">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">Coverage Overview</h3>
                  <span className="text-xs text-white/30 uppercase tracking-wider">All Sports</span>
                </div>
                <SportCoveragePieChart data={sportDistributionData} />
              </Card>
            </ScrollReveal>
          </div>

          {/* Quick Links with SVG icons */}
          <ScrollReveal direction="up" delay={500}>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
              <QuickLinkCard href="/mlb" icon="/icons/baseball.svg" title="MLB" subtitle="Scores & Standings" />
              <QuickLinkCard href="/nfl" icon="/icons/football.svg" title="NFL" subtitle="Games & Stats" />
              <QuickLinkCard href="/nba" icon="/icons/basketball.svg" title="NBA" subtitle="Scores & Stats" />
              <QuickLinkCard href="/college-baseball" icon="/icons/baseball.svg" title="NCAA Baseball" subtitle="Rankings & Scores" />
              <QuickLinkCard href="/cfb" icon="/icons/football.svg" title="CFB" subtitle="Rankings & Standings" />
            </div>
          </ScrollReveal>

          {/* Data Attribution */}
          {(liveScoresMeta?.note || standingsMeta?.note) && (
            <p className="mb-2 text-xs text-white/55">
              {liveScoresMeta?.note || standingsMeta?.note}
            </p>
          )}
          <DataSourcePanel
            sources={getDashboardSources(activeSport, stats.lastUpdated, liveScoresMeta, standingsMeta)}
            lastUpdated={stats.lastUpdated}
            refreshInterval={60}
            className="mb-6"
          />
          <DataDisclaimer />
        </Container>
      </Section>

      <Footer />
    </main>
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
