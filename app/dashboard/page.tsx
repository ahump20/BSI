'use client';

/**
 * BSI Command Center Dashboard
 *
 * Central hub for real-time scores, standings, and analytics across all sports.
 * Features live data integration, visualization charts, and cross-sport comparison.
 *
 * Performance: Charts are lazy-loaded to keep recharts (~200KB) out of initial bundle.
 *
 * Last Updated: 2025-01-07
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { SportTabs, SportTabsCompact, type Sport } from '@/components/sports/SportTabs';
import { useAuth } from '@/lib/hooks';
import { SportIcon, type SportIconType } from '@/components/ui/SportIcon';

// Lazy-load chart components to split recharts from main bundle
const StandingsBarChart = dynamic(
  () => import('@/components/dashboard/DashboardCharts').then((mod) => mod.StandingsBarChart),
  {
    ssr: false,
    loading: () => <ChartLoadingPlaceholder />,
  }
);

const SportCoveragePieChart = dynamic(
  () => import('@/components/dashboard/DashboardCharts').then((mod) => mod.SportCoveragePieChart),
  {
    ssr: false,
    loading: () => <ChartLoadingPlaceholder />,
  }
);

// Loading placeholder for charts
function ChartLoadingPlaceholder() {
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
import { DataSourcePanel, DataDisclaimer, type DataSource } from '@/components/sports';
import { LiveBadge } from '@/components/ui/Badge';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { ScrollReveal } from '@/components/cinematic';
import { Footer } from '@/components/layout-ds/Footer';
import { useUserSettings } from '@/lib/hooks';

// ============================================================================
// Types
// ============================================================================

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
  divisionRank?: number;
}

interface LeaderPlayer {
  name: string;
  team: string;
  value: number;
  position?: string;
}

// ============================================================================
// Data Source Helper
// ============================================================================

function getDashboardSources(sport: Sport, lastUpdated: string): DataSource[] {
  const sources: Record<Sport, DataSource[]> = {
    mlb: [
      {
        name: 'MLB Stats API',
        url: 'https://statsapi.mlb.com',
        fetchedAt: lastUpdated,
        description: 'Official MLB scores, standings, and player statistics',
      },
      {
        name: 'Baseball-Reference',
        url: 'https://www.baseball-reference.com',
        fetchedAt: lastUpdated,
        description: 'Historical stats and advanced metrics',
      },
    ],
    nfl: [
      {
        name: 'ESPN API',
        url: 'https://www.espn.com/nfl',
        fetchedAt: lastUpdated,
        description: 'NFL scores, schedules, and team data',
      },
      {
        name: 'Pro-Football-Reference',
        url: 'https://www.pro-football-reference.com',
        fetchedAt: lastUpdated,
        description: 'NFL statistics and historical records',
      },
    ],
    nba: [
      {
        name: 'NBA.com',
        url: 'https://www.nba.com',
        fetchedAt: lastUpdated,
        description: 'Official NBA scores and standings',
      },
    ],
    ncaa: [
      {
        name: 'D1Baseball',
        url: 'https://d1baseball.com',
        fetchedAt: lastUpdated,
        description: 'NCAA Division I baseball rankings and coverage',
      },
      {
        name: 'NCAA Stats',
        url: 'https://stats.ncaa.org',
        fetchedAt: lastUpdated,
        description: 'Official NCAA statistics',
      },
      {
        name: 'ESPN College',
        url: 'https://www.espn.com/college-sports',
        fetchedAt: lastUpdated,
        description: 'College football and basketball coverage',
      },
    ],
  };

  return sources[sport] || sources.mlb;
}

// ============================================================================
// Dashboard Page Component
// ============================================================================

export default function DashboardPage() {
  // Authentication - redirects to login if not authenticated
  const {
    user: _user,
    isLoading: authLoading,
    isAuthenticated,
  } = useAuth({
    required: true,
    redirectReason: 'Please sign in to access your dashboard',
  });

  const [activeSport, setActiveSport] = useState<Sport>('mlb');
  const [stats, setStats] = useState<DashboardStats>({
    liveGames: 0,
    todaysGames: 0,
    totalTeams: 30,
    lastUpdated: new Date().toISOString(),
  });
  const [standings, setStandings] = useState<StandingsTeam[]>([]);
  const [leaders, setLeaders] = useState<LeaderPlayer[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const { formatDateTime, isLoaded: timezoneLoaded } = useUserSettings();

  // ========================================================================
  // Fetch Dashboard Data (must be before early returns per React hooks rules)
  // ========================================================================

  useEffect(() => {
    // Skip fetch if not authenticated yet
    if (authLoading || !isAuthenticated) return;

    async function fetchDashboardData() {
      setIsLoading(true);

      try {
        // Fetch based on active sport
        const apiBase =
          activeSport === 'mlb'
            ? '/api/mlb'
            : activeSport === 'nfl'
              ? '/api/nfl'
              : `/api/${activeSport}`;

        // Fetch standings
        const standingsRes = await fetch(`${apiBase}/standings`);
        if (standingsRes.ok) {
          const standingsData = (await standingsRes.json()) as {
            standings?: unknown[];
            teams?: unknown[];
            meta?: { lastUpdated?: string };
          };
          const teamList = (standingsData.standings ||
            standingsData.teams ||
            []) as StandingsTeam[];
          setStandings(teamList.slice(0, 10));

          // Calculate stats
          setStats((prev) => ({
            ...prev,
            totalTeams: teamList.length || 30,
            lastUpdated: standingsData.meta?.lastUpdated || new Date().toISOString(),
          }));
        }

        // Fetch scores to count live/today's games
        const scoresRes = await fetch(`${apiBase}/scores`);
        if (scoresRes.ok) {
          const scoresData = (await scoresRes.json()) as {
            games?: Array<{
              status?: { type?: { state?: string }; toLowerCase?: () => string } | string;
            }>;
            scoreboard?: {
              games?: Array<{
                status?: { type?: { state?: string }; toLowerCase?: () => string } | string;
              }>;
            };
          };
          const games = scoresData.games || scoresData.scoreboard?.games || [];

          const liveGames = games.filter((g) => {
            const status = g.status;
            if (typeof status === 'object' && status?.type?.state === 'in') return true;
            if (typeof status === 'string') {
              return status === 'In Progress' || status.toLowerCase().includes('in progress');
            }
            return false;
          }).length;

          const todaysGames = games.length;

          setStats((prev) => ({
            ...prev,
            liveGames,
            todaysGames,
          }));
        }

        // Fetch leaders for MLB
        if (activeSport === 'mlb') {
          const leadersRes = await fetch('/api/mlb/leaderboards/batting?limit=5');
          if (leadersRes.ok) {
            const leadersData = (await leadersRes.json()) as {
              leaders?: Array<{
                name?: string;
                Name?: string;
                team?: string;
                Team?: string;
                war?: number;
                WAR?: number;
                position?: string;
              }>;
            };
            if (leadersData.leaders) {
              setLeaders(
                leadersData.leaders.map((p) => ({
                  name: p.name || p.Name || '',
                  team: p.team || p.Team || '',
                  value: p.war || p.WAR || 0,
                  position: p.position,
                }))
              );
            }
          }
        }
      } catch (error) {
        console.error('Dashboard data fetch error:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchDashboardData();

    // Refresh every 60 seconds
    const interval = setInterval(fetchDashboardData, 60000);
    return () => clearInterval(interval);
  }, [activeSport, authLoading, isAuthenticated]);

  // Show loading state while checking auth
  if (authLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-midnight">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-burnt-orange/30 border-t-burnt-orange rounded-full animate-spin" />
          <p className="text-text-tertiary text-sm">Loading...</p>
        </div>
      </main>
    );
  }

  // If not authenticated after loading, useAuth will redirect (but just in case)
  if (!isAuthenticated) {
    return null;
  }

  // Format timestamp
  const _displayTimestamp = (isoString?: string): string => {
    const date = isoString ? new Date(isoString) : new Date();
    if (timezoneLoaded) {
      return formatDateTime(date);
    }
    return (
      date.toLocaleString('en-US', {
        timeZone: 'America/Chicago',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      }) + ' CT'
    );
  };

  // ========================================================================
  // Chart Data Preparation
  // ========================================================================

  // Standings bar chart data
  const standingsChartData = standings.slice(0, 8).map((team, index) => ({
    name: team.teamName?.split(' ').pop() || `Team ${index + 1}`,
    wins: team.wins || 0,
    losses: team.losses || 0,
    winPct: team.winPct || team.wins / (team.wins + team.losses) || 0,
  }));

  // Sport distribution data (mock for visualization)
  const sportDistributionData = [
    { name: 'MLB', value: activeSport === 'mlb' ? 35 : 25, color: '#C41E3A' },
    { name: 'NFL', value: activeSport === 'nfl' ? 35 : 25, color: '#013369' },
    { name: 'NBA', value: activeSport === 'nba' ? 35 : 20, color: '#1D428A' },
    { name: 'NCAA', value: 20, color: '#BF5700' },
  ];

  // ========================================================================
  // Render
  // ========================================================================

  return (
    <main id="main-content" className="min-h-screen pt-16 md:pt-20">
      {/* Dashboard Content */}
      <Section padding="lg" className="pt-8">
        <Container size="wide">
          {/* Hero Section */}
          <ScrollReveal direction="up">
            <div className="mb-8 flex items-center justify-between flex-wrap gap-4">
              <div>
                <h1 className="text-3xl md:text-4xl font-display text-white mb-2">
                  COMMAND CENTER
                </h1>
                <p className="text-white/60">
                  Real-time scores, standings, and analytics across all leagues
                </p>
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

          {/* Sport Tabs - Desktop */}
          <ScrollReveal direction="up" delay={100}>
            <div className="hidden md:block mb-8">
              <SportTabs defaultSport={activeSport} onSportChange={setActiveSport} />
            </div>
          </ScrollReveal>

          {/* Sport Tabs - Mobile */}
          <div className="md:hidden mb-6">
            <SportTabsCompact defaultSport={activeSport} onSportChange={setActiveSport} />
          </div>

          {/* Quick Stats Row */}
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
                subtitle={`${activeSport.toUpperCase()}`}
                icon={<CalendarIcon />}
              />
              <StatCard
                label="Teams"
                value={stats.totalTeams}
                subtitle="in standings"
                icon={<TeamIcon />}
              />
              <StatCard label="Refresh" value="60s" subtitle="auto-update" icon={<RefreshIcon />} />
            </div>
          </ScrollReveal>

          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            {/* Scores Section - 2 columns */}
            <ScrollReveal direction="left" delay={200} className="lg:col-span-2">
              <LiveScoresPanel sport={activeSport} />
            </ScrollReveal>

            {/* Standings Section - 1 column */}
            <ScrollReveal direction="right" delay={300}>
              <StandingsTable sport={activeSport} limit={5} />
            </ScrollReveal>
          </div>

          {/* Visualization Section - Charts lazy-loaded for performance */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Standings Bar Chart */}
            <ScrollReveal direction="up" delay={350}>
              <Card padding="lg" className="h-full">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">Win Distribution</h3>
                  <span className="text-xs text-text-tertiary uppercase tracking-wider">
                    Top 8 Teams
                  </span>
                </div>
                <StandingsBarChart data={standingsChartData} isLoading={isLoading} />
              </Card>
            </ScrollReveal>

            {/* Sport Coverage Pie Chart */}
            <ScrollReveal direction="up" delay={400}>
              <Card padding="lg" className="h-full">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">Coverage Overview</h3>
                  <span className="text-xs text-text-tertiary uppercase tracking-wider">
                    All Sports
                  </span>
                </div>
                <SportCoveragePieChart data={sportDistributionData} />
              </Card>
            </ScrollReveal>
          </div>

          {/* Leaders Section (MLB Only) */}
          {activeSport === 'mlb' && leaders.length > 0 && (
            <ScrollReveal direction="up" delay={450}>
              <Card padding="lg" className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">WAR Leaders</h3>
                  <Link
                    href="/mlb/players"
                    className="text-sm text-burnt-orange hover:text-burnt-orange-light transition-colors"
                  >
                    View All Players →
                  </Link>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
                  {leaders.map((player, index) => (
                    <div
                      key={player.name}
                      className="p-4 bg-graphite rounded-lg hover:bg-white/5 transition-colors"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className="w-6 h-6 flex items-center justify-center bg-burnt-orange/20 text-burnt-orange rounded-full text-xs font-bold">
                          {index + 1}
                        </span>
                        <span className="text-xs text-text-tertiary">{player.team}</span>
                      </div>
                      <p className="font-semibold text-white truncate">{player.name}</p>
                      <p className="text-2xl font-bold text-burnt-orange">
                        {player.value.toFixed(1)}
                      </p>
                      <p className="text-xs text-text-tertiary">WAR</p>
                    </div>
                  ))}
                </div>
              </Card>
            </ScrollReveal>
          )}

          {/* Quick Links */}
          <ScrollReveal direction="up" delay={500}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <QuickLinkCard href="/mlb" icon="mlb" title="MLB" subtitle="Scores & Standings" />
              <QuickLinkCard href="/nfl" icon="nfl" title="NFL" subtitle="Games & Stats" />
              <QuickLinkCard
                href="/college-baseball"
                icon="ncaa"
                title="NCAA Baseball"
                subtitle="Rankings & Scores"
              />
              <QuickLinkCard href="/nba" icon="nba" title="NBA" subtitle="Scores & Standings" />
            </div>
          </ScrollReveal>

          {/* Data Attribution Panel */}
          <DataSourcePanel
            sources={getDashboardSources(activeSport, stats.lastUpdated)}
            lastUpdated={stats.lastUpdated}
            refreshInterval={60}
            className="mb-6"
          />
          <DataDisclaimer />
        </Container>
      </Section>

      {/* Footer */}
      <Footer />
    </main>
  );
}

// ============================================================================
// Sub-Components
// ============================================================================

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
          <p className="text-xs text-text-tertiary uppercase tracking-wider mb-1">{label}</p>
          <p
            className={`text-2xl font-bold ${
              trend === 'live'
                ? 'text-green-400'
                : trend === 'up'
                  ? 'text-success'
                  : trend === 'down'
                    ? 'text-error'
                    : 'text-white'
            }`}
          >
            {value}
          </p>
          {subtitle && <p className="text-xs text-text-tertiary mt-0.5">{subtitle}</p>}
        </div>
        {icon && <div className="text-text-tertiary opacity-50">{icon}</div>}
      </div>
    </Card>
  );
}

interface QuickLinkCardProps {
  href: string;
  icon: SportIconType;
  title: string;
  subtitle: string;
  badge?: string;
}

function QuickLinkCard({ href, icon, title, subtitle, badge }: QuickLinkCardProps) {
  return (
    <Link
      href={href}
      className="block p-4 bg-graphite rounded-lg hover:bg-white/5 hover:border-burnt-orange border border-transparent transition-all group relative"
    >
      {badge && (
        <span className="absolute top-2 right-2 px-1.5 py-0.5 text-[10px] font-bold rounded bg-burnt-orange text-white">
          {badge}
        </span>
      )}
      <div className="mb-2 text-burnt-orange">
        <SportIcon icon={icon} size="lg" />
      </div>
      <p className="font-semibold text-white group-hover:text-burnt-orange transition-colors">
        {title}
      </p>
      <p className="text-xs text-text-tertiary">{subtitle}</p>
    </Link>
  );
}

// ============================================================================
// Icons
// ============================================================================

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
