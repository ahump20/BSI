'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useSportData } from '@/lib/hooks/useSportData';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { DataSourceBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ScrollReveal } from '@/components/cinematic';
import { Footer } from '@/components/layout-ds/Footer';
import { SkeletonTableRow, SkeletonScoreCard } from '@/components/ui/Skeleton';
import { preseason2026 } from '@/lib/data/preseason-2026';
import { formatTimestamp, formatScheduleDate, getDateOffset } from '@/lib/utils/timezone';
import { teamMetadata, getLogoUrl } from '@/lib/data/team-metadata';
import { HubHero } from '@/components/college-baseball/HubHero';
import { LiveScoreStrip } from '@/components/college-baseball/LiveScoreStrip';
import { EditorialFeed } from '@/components/college-baseball/EditorialFeed';
import { EnrichedRankingsTable } from '@/components/college-baseball/EnrichedRankingsTable';
import { LeagueLeaders } from '@/components/college-baseball/LeagueLeaders';
import { IntelSignup } from '@/components/home/IntelSignup';
import { TabBar, TabPanel } from '@/components/ui/TabBar';
import { EmptyState } from '@/components/ui/EmptyState';
import { ScheduleGameCard } from '@/components/college-baseball/ScheduleGameCard';
import type { ScheduleGame } from '@/components/college-baseball/ScheduleGameCard';
import { PlayersTabContent } from '@/components/college-baseball/PlayersTabContent';

interface RankedTeam {
  rank: number;
  team: string;
  conference: string;
  record?: string;
  slug?: string;
}

/** Reverse-lookup: team display name → route slug, indexed by both full name and shortName. */
const teamNameToSlug: Record<string, string> = {};
for (const [slug, meta] of Object.entries(teamMetadata)) {
  teamNameToSlug[meta.name.toLowerCase()] = slug;
  teamNameToSlug[meta.shortName.toLowerCase()] = slug;
}

interface StandingsTeam {
  teamName: string;
  wins: number;
  losses: number;
  conferenceWins?: number;
  conferenceLosses?: number;
  conference?: string;
}

// ScheduleGame type imported from @/components/college-baseball/ScheduleGameCard

interface TeamListItem {
  id: string;
  name: string;
  shortName?: string;
  conference?: string;
  record?: { wins: number; losses: number };
  logo?: string;
}

// PlayerResult type moved to @/components/college-baseball/PlayersTabContent

type TabType = 'rankings' | 'standings' | 'schedule' | 'teams' | 'players';

/** ESPN poll entry — nested under rankings[0].ranks */
interface ESPNRankEntry {
  current: number;
  team: { name: string; location?: string; nickname?: string };
  recordSummary?: string;
}

interface ESPNPoll {
  name: string;
  ranks: ESPNRankEntry[];
}

/** Normalize ESPN poll format OR flat RankedTeam[] into a consistent shape. */
function normalizeRankings(raw: { rankings?: ESPNPoll[] | RankedTeam[]; meta?: { lastUpdated?: string; dataSource?: string } }): {
  teams: RankedTeam[];
  pollName: string;
} {
  const rankings = raw?.rankings;
  if (!rankings?.length) return { teams: [], pollName: '' };

  // ESPN wraps polls in { rankings: [{ name, ranks: [...] }] }
  const first = rankings[0] as unknown as Record<string, unknown>;
  if ('ranks' in first && Array.isArray(first.ranks)) {
    const poll = first as unknown as ESPNPoll;
    return {
      pollName: poll.name || '',
      teams: poll.ranks.map((e) => {
        const teamName = e.team?.location ? `${e.team.location} ${e.team.name}` : e.team?.nickname || e.team?.name || 'Unknown';
        return {
          rank: e.current,
          team: teamName,
          conference: '',
          record: e.recordSummary || '',
          slug: teamNameToSlug[teamName.toLowerCase()],
        };
      }),
    };
  }

  // Already flat RankedTeam[] (Highlightly or normalized worker response)
  return {
    teams: (rankings as RankedTeam[]).map(t => ({
      ...t,
      slug: t.slug || teamNameToSlug[t.team.toLowerCase()],
    })),
    pollName: '',
  };
}

/** Preseason fallback — derived from preseason-2026.ts, never hardcoded. Top 25 only. */
const preseasonRankings: RankedTeam[] = Object.entries(preseason2026)
  .sort(([, a], [, b]) => a.rank - b.rank)
  .slice(0, 25)
  .map(([slug, data]) => ({
    rank: data.rank,
    team: teamMetadata[slug]?.shortName || slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
    conference: data.conference,
    record: data.record2025,
    slug,
  }));

// Dynamic conferenceList — derived from teamMetadata + all D1 conferences
const conferenceList = (() => {
  const confMap = new Map<string, number>();
  for (const team of Object.values(teamMetadata)) {
    confMap.set(team.conference, (confMap.get(team.conference) || 0) + 1);
  }
  const allD1Conferences = [
    'SEC', 'ACC', 'Big 12', 'Big Ten', 'Pac-12',
    'Sun Belt', 'AAC', 'Mountain West', 'Conference USA', 'MAC',
    'Big East', 'Big West', 'Big South', 'Missouri Valley',
    'Southern', 'Southland', 'WAC', 'America East',
    'Atlantic 10', 'CAA', 'Horizon', 'MAAC', 'Patriot League',
    'WCC', 'ASUN', 'Ohio Valley', 'Northeast', 'Summit League',
    'Ivy League', 'MEAC', 'SWAC', 'Independent',
  ];
  for (const name of allD1Conferences) {
    if (!confMap.has(name)) confMap.set(name, 0);
  }
  const POWER_4 = new Set(['SEC', 'ACC', 'Big 12', 'Big Ten']);
  const toSlug = (name: string) => name.toLowerCase().replace(/[\s-]+/g, '').replace(/[^a-z0-9]/g, '');
  const entries = Array.from(confMap.entries())
    .sort(([a], [b]) => {
      const ap = POWER_4.has(a) ? 0 : 1;
      const bp = POWER_4.has(b) ? 0 : 1;
      return ap !== bp ? ap - bp : a.localeCompare(b);
    })
    .map(([name, teams]) => ({
      name,
      teams,
      href: `/college-baseball/standings?conference=${toSlug(name)}`,
    }));
  entries.push({ name: 'All Conferences', teams: entries.length, href: '/college-baseball/standings' });
  return entries;
})();

const INITIAL_CONFERENCES_SHOWN = 9;
const scheduleConferences = ['All', ...conferenceList.filter(c => c.name !== 'All Conferences').map(c => c.name)];

export default function CollegeBaseballPage() {
  const [activeTab, setActiveTab] = useState<TabType>('rankings');
  const [selectedDate, setSelectedDate] = useState<string>("");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (!selectedDate) setSelectedDate(getDateOffset(0)); }, []);
  const [selectedConference, setSelectedConference] = useState('All');
  const [liveGamesDetected, setLiveGamesDetected] = useState(false);
  const hasAutoAdvanced = useRef(false);

  // Team search state
  const [teamSearch, setTeamSearch] = useState('');
  const [teamConfFilter, setTeamConfFilter] = useState('All');

  // Expandable conference filter
  const [showAllConferences, setShowAllConferences] = useState(false);

  // Hub search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [apiSearchResults, setApiSearchResults] = useState<Array<{ name: string; href: string; category?: string }>>([]);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const localSearchResults = useMemo(() => {
    if (!searchQuery || searchQuery.length < 2) return [];
    const q = searchQuery.toLowerCase();
    return Object.entries(teamMetadata)
      .filter(([slug, meta]) => meta.shortName.toLowerCase().includes(q) || meta.conference?.toLowerCase().includes(q) || slug.includes(q))
      .slice(0, 8)
      .map(([slug, meta]) => ({ name: meta.shortName, href: `/college-baseball/teams/${slug}`, category: 'Teams' }));
  }, [searchQuery]);

  const debouncedApiSearch = useCallback((query: string) => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    if (!query || query.length < 2) { setApiSearchResults([]); return; }
    searchTimerRef.current = setTimeout(async () => {
      try {
        const resp = await fetch(`/api/search?q=${encodeURIComponent(query)}&sport=college-baseball`);
        if (!resp.ok) return;
        const data = await resp.json() as { results?: Array<{ name?: string; title?: string; url?: string; href?: string; type?: string }> };
        setApiSearchResults((data.results || []).map((r) => ({
          name: r.name || r.title || '',
          href: r.url || r.href || '#',
          category: r.type ? r.type.charAt(0).toUpperCase() + r.type.slice(1) : 'Results',
        })));
      } catch { setApiSearchResults([]); }
    }, 300);
  }, []);

  const allSearchResults = useMemo(() => {
    const seen = new Set<string>();
    const combined: Array<{ name: string; href: string; category?: string }> = [];
    for (const r of [...localSearchResults, ...apiSearchResults]) {
      if (!seen.has(r.href)) { seen.add(r.href); combined.push(r); }
    }
    return combined;
  }, [localSearchResults, apiSearchResults]);

  const groupedSearchResults = useMemo(() => {
    const groups = new Map<string, Array<{ name: string; href: string }>>();
    for (const r of allSearchResults) {
      const cat = r.category || 'Results';
      if (!groups.has(cat)) groups.set(cat, []);
      groups.get(cat)!.push(r);
    }
    return groups;
  }, [allSearchResults]);

  useEffect(() => { debouncedApiSearch(searchQuery); }, [searchQuery, debouncedApiSearch]);

  // Rankings — fetched when rankings tab is active
  const rankingsUrl = activeTab === 'rankings' ? '/api/college-baseball/rankings' : null;
  const { data: rankingsRaw, loading: rankingsLoading, error: rankingsError, retry: retryRankings } =
    useSportData<{ rankings?: ESPNPoll[] | RankedTeam[]; previousRankings?: Record<string, unknown> | null; meta?: { lastUpdated?: string; dataSource?: string } }>(rankingsUrl);
  const normalized = useMemo(() => normalizeRankings(rankingsRaw ?? {}), [rankingsRaw]);
  const rankings = normalized.teams.length ? normalized.teams : preseasonRankings;
  const isLiveRankings = normalized.teams.length > 0;

  // Normalize previous rankings (same ESPN poll format) into flat { rank, team }[]
  const previousRankings = useMemo(() => {
    const prev = rankingsRaw?.previousRankings;
    if (!prev) return undefined;
    const normed = normalizeRankings(prev as { rankings?: ESPNPoll[] | RankedTeam[] });
    return normed.teams.length ? normed.teams.map(t => ({ rank: t.rank, team: t.team })) : undefined;
  }, [rankingsRaw?.previousRankings]);

  // Standings — fetched when standings tab is active
  const standingsUrl = activeTab === 'standings' ? '/api/college-baseball/standings' : null;
  const { data: standingsRaw, loading: standingsLoading, error: standingsError, retry: retryStandings } =
    useSportData<{ standings?: StandingsTeam[]; teams?: StandingsTeam[]; meta?: { lastUpdated?: string; dataSource?: string } }>(standingsUrl);
  const standings = (standingsRaw?.standings || standingsRaw?.teams || []) as StandingsTeam[];

  // Schedule — fetched when schedule tab is active, auto-refreshes when live
  const scheduleUrl = activeTab === 'schedule' ? `/api/college-baseball/schedule?date=${selectedDate}` : null;
  const { data: scheduleRaw, loading: scheduleLoading, error: scheduleError, retry: retrySchedule } =
    useSportData<{
      success?: boolean;
      data?: ScheduleGame[];
      games?: ScheduleGame[];
      live?: boolean;
      meta?: { dataSource?: string; lastUpdated?: string };
      timestamp?: string;
      message?: string;
    }>(scheduleUrl, {
      refreshInterval: 30000,
      refreshWhen: liveGamesDetected,
    });

  const scheduleGames = useMemo(() => scheduleRaw?.data || scheduleRaw?.games || [], [scheduleRaw]);
  const hasLiveGames = useMemo(() => scheduleGames.some((g) => g.status === 'live'), [scheduleGames]);
  useEffect(() => { setLiveGamesDetected(hasLiveGames); }, [hasLiveGames]);

  // Teams — fetched when teams tab is active
  const teamsUrl = activeTab === 'teams' ? '/api/college-baseball/teams' : null;
  const { data: teamsRaw, loading: teamsLoading } =
    useSportData<{ teams?: TeamListItem[] }>(teamsUrl);
  const allTeams = useMemo(() => teamsRaw?.teams || [], [teamsRaw]);

  // Per-tab derived state — no shared loading/error
  const dataSource = rankingsRaw?.meta?.dataSource || standingsRaw?.meta?.dataSource || scheduleRaw?.meta?.dataSource || 'ESPN';
  const lastUpdated = rankingsRaw?.meta?.lastUpdated || standingsRaw?.meta?.lastUpdated || scheduleRaw?.timestamp || scheduleRaw?.meta?.lastUpdated || '';

  // Team filtering
  const filteredTeams = useMemo(() => {
    let list = allTeams;
    if (teamConfFilter !== 'All') {
      list = list.filter(t => t.conference === teamConfFilter);
    }
    if (teamSearch.trim()) {
      const q = teamSearch.toLowerCase();
      list = list.filter(t => t.name.toLowerCase().includes(q) || (t.shortName || '').toLowerCase().includes(q));
    }
    return list;
  }, [allTeams, teamConfFilter, teamSearch]);

  // Smart date initialization: auto-advance to next game day if today has no games
  useEffect(() => {
    if (activeTab !== 'schedule' || hasAutoAdvanced.current) return;
    hasAutoAdvanced.current = true;

    async function findNextGameDay() {
      for (let i = 0; i <= 7; i++) {
        const date = getDateOffset(i);
        try {
          const res = await fetch(`/api/college-baseball/schedule?date=${date}`);
          const data = await res.json() as { data?: unknown[]; games?: unknown[] };
          const games = data.data || data.games || [];
          if (games.length > 0) {
            setSelectedDate(date);
            return;
          }
        } catch {
          continue;
        }
      }
    }
    findNextGameDay();
  }, [activeTab]);

  // Client-side conference filter for schedule
  const filteredGames = selectedConference === 'All'
    ? scheduleGames
    : scheduleGames.filter(
        (g) =>
          g.homeTeam.conference === selectedConference ||
          g.awayTeam.conference === selectedConference
      );

  // Expandable conference filter
  const visibleScheduleConferences = showAllConferences
    ? scheduleConferences
    : scheduleConferences.slice(0, INITIAL_CONFERENCES_SHOWN);
  const hiddenCount = scheduleConferences.length - INITIAL_CONFERENCES_SHOWN;

  const dateOptions = [
    { offset: -2, label: formatScheduleDate(getDateOffset(-2)) },
    { offset: -1, label: 'Yesterday' },
    { offset: 0, label: 'Today' },
    { offset: 1, label: 'Tomorrow' },
    { offset: 2, label: formatScheduleDate(getDateOffset(2)) },
  ];

  const tabs: { id: TabType; label: string }[] = [
    { id: 'rankings', label: 'Rankings' },
    { id: 'standings', label: 'Standings' },
    { id: 'schedule', label: 'Schedule' },
    { id: 'teams', label: 'Teams' },
    { id: 'players', label: 'Players' },
  ];

  return (
    <div className="bsi-theme-baseball">
      <>
        <main id="main-content">
        {/* Hero */}
        <HubHero
          searchQuery={searchQuery}
          onSearchChange={(q) => { setSearchQuery(q); setSearchOpen(true); }}
          searchOpen={searchOpen}
          onSearchOpen={setSearchOpen}
          groupedSearchResults={groupedSearchResults}
          hasResults={allSearchResults.length > 0}
          lastUpdated={lastUpdated}
          dataSource={dataSource}
        />

        {/* Live Score Strip — today's games at a glance */}
        <LiveScoreStrip />

        {/* Editorial Feed — dynamic from D1 */}
        <EditorialFeed />

        {/* Intel Signup — email capture for roster-market intelligence */}
        <Section padding="md">
          <Container>
            <div className="max-w-xl mx-auto">
              <IntelSignup />
            </div>
          </Container>
        </Section>

        {/* Tabs */}
        <Section padding="lg" background="charcoal" borderTop>
          <Container>
            <TabBar tabs={tabs} active={activeTab} onChange={(id) => setActiveTab(id as TabType)} size="sm" />
            {/* Secondary nav */}
            <div className="flex gap-3 mb-8 overflow-x-auto pb-1">
              {[
                { label: 'Savant', href: '/college-baseball/savant' },
                { label: 'Portal', href: '/college-baseball/transfer-portal' },
                { label: 'Editorial', href: '/college-baseball/editorial' },
                { label: 'News', href: '/college-baseball/news' },
                { label: 'Compare', href: '/college-baseball/compare' },
                { label: 'Conferences', href: '/college-baseball/conferences' },
                { label: 'Scores', href: '/college-baseball/scores' },
              ].map((link) => (
                <Link key={link.href} href={link.href}
                  className="px-3 py-1.5 text-xs font-medium text-white/40 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-all whitespace-nowrap">
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Rankings Tab */}
            <TabPanel id="rankings" activeTab={activeTab}>
              <EnrichedRankingsTable
                rankings={rankings}
                loading={rankingsLoading}
                error={rankingsError}
                onRetry={retryRankings}
                isLive={isLiveRankings}
                pollName={normalized.pollName}
                dataSource={rankingsRaw?.meta?.dataSource || 'espn'}
                lastUpdated={lastUpdated}
                preseasonFallback={preseasonRankings}
                previousRankings={previousRankings}
              />
            </TabPanel>

            {/* Standings Tab */}
            <TabPanel id="standings" activeTab={activeTab}>
                {standingsLoading ? (
                  <Card variant="default" padding="lg">
                    <CardContent><table className="w-full"><tbody>{Array.from({ length: 10 }).map((_, i) => <SkeletonTableRow key={i} columns={6} />)}</tbody></table></CardContent>
                  </Card>
                ) : standingsError ? (
                  <Card variant="default" padding="lg">
                    <EmptyState type="error" onRetry={retryStandings} />
                  </Card>
                ) : standings.length === 0 ? (
                  <div>
                    <Card variant="default" padding="lg" className="mb-6">
                      <div className="text-center py-8">
                        <p className="text-white/60">Season hasn&apos;t started yet. Browse conferences below.</p>
                      </div>
                    </Card>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                      {conferenceList.map((conf) => (
                        <Link key={conf.name} href={conf.href}>
                          <Card variant="hover" padding="md" className="text-center h-full">
                            <div className="font-semibold text-white">{conf.name}</div>
                            <div className="text-xs text-white/40 mt-1">{conf.teams} Teams</div>
                          </Card>
                        </Link>
                      ))}
                    </div>
                  </div>
                ) : (
                  <ScrollReveal>
                    <Card variant="default" padding="lg">
                      <CardHeader><CardTitle>Conference Standings</CardTitle></CardHeader>
                      <CardContent>
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr className="border-b-2 border-burnt-orange">
                                {['#', 'Team', 'Conf', 'W', 'L', 'Conf W-L'].map((h) => (
                                  <th key={h} className="text-left p-3 text-white/40 font-semibold text-xs">{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {standings.map((team, idx) => (
                                <tr key={team.teamName} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                  <td className="p-3 text-burnt-orange font-bold">{idx + 1}</td>
                                  <td className="p-3 font-semibold text-white">{team.teamName}</td>
                                  <td className="p-3 text-white/60">{team.conference || '-'}</td>
                                  <td className="p-3 text-white/60">{team.wins}</td>
                                  <td className="p-3 text-white/60">{team.losses}</td>
                                  <td className="p-3 text-white/60">{team.conferenceWins != null ? `${team.conferenceWins}-${team.conferenceLosses}` : '-'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        <div className="mt-4 pt-4 border-t border-white/10">
                          <DataSourceBadge source="NCAA / D1Baseball" timestamp={formatTimestamp(lastUpdated)} />
                        </div>
                      </CardContent>
                    </Card>
                  </ScrollReveal>
                )}
            </TabPanel>

            {/* Schedule Tab */}
            <TabPanel id="schedule" activeTab={activeTab}>
                {/* Date Navigation */}
                <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
                  <button
                    onClick={() => setSelectedDate(getDateOffset(
                      Math.round((new Date(selectedDate).getTime() - new Date().getTime()) / 86400000) - 3
                    ))}
                    className="p-2 text-white/40 hover:text-white transition-colors flex-shrink-0"
                    aria-label="Previous days"
                  >
                    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M15 18l-6-6 6-6" />
                    </svg>
                  </button>

                  {dateOptions.map((option) => {
                    const dateValue = getDateOffset(option.offset);
                    const isSelected = selectedDate === dateValue;
                    return (
                      <button
                        key={option.offset}
                        onClick={() => setSelectedDate(dateValue)}
                        className={`px-4 py-2 rounded-lg font-semibold text-sm whitespace-nowrap transition-all flex-shrink-0 ${
                          isSelected
                            ? 'bg-burnt-orange text-white'
                            : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        {option.label}
                      </button>
                    );
                  })}

                  <button
                    onClick={() => setSelectedDate(getDateOffset(
                      Math.round((new Date(selectedDate).getTime() - new Date().getTime()) / 86400000) + 3
                    ))}
                    className="p-2 text-white/40 hover:text-white transition-colors flex-shrink-0"
                    aria-label="Next days"
                  >
                    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </button>
                </div>

                {/* Expandable Conference Filter */}
                <div className="flex flex-wrap gap-2 mb-6">
                  {visibleScheduleConferences.map((conf) => (
                    <button
                      key={conf}
                      onClick={() => setSelectedConference(conf)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        selectedConference === conf
                          ? 'bg-burnt-orange text-white'
                          : 'bg-white/5 text-white/50 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      {conf}
                    </button>
                  ))}
                  {!showAllConferences && hiddenCount > 0 && (
                    <button
                      onClick={() => setShowAllConferences(true)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white/5 text-burnt-orange hover:bg-white/10 transition-all"
                    >
                      +{hiddenCount} More
                    </button>
                  )}
                </div>

                {scheduleLoading ? (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3, 4, 5, 6].map((i) => <SkeletonScoreCard key={i} />)}
                  </div>
                ) : scheduleError ? (
                  <Card variant="default" padding="lg">
                    <EmptyState type="error" onRetry={retrySchedule} />
                  </Card>
                ) : filteredGames.length === 0 ? (
                  <Card variant="default" padding="lg">
                    <div className="text-center py-8">
                      <svg viewBox="0 0 24 24" className="w-16 h-16 text-white/20 mx-auto mb-4" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                      </svg>
                      <p className="text-white/60">No games scheduled for {formatScheduleDate(selectedDate)}</p>
                      <p className="text-white/30 text-sm mt-2">
                        D1 baseball season runs February through June. Try navigating to a game day.
                      </p>
                    </div>
                  </Card>
                ) : (
                  <>
                    {filteredGames.some((g) => g.status === 'live') && (
                      <div className="mb-6">
                        <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                          Live Games
                        </h3>
                        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                          {filteredGames.filter((g) => g.status === 'live').map((game) => (
                            <ScheduleGameCard key={game.id} game={game} />
                          ))}
                        </div>
                      </div>
                    )}
                    {filteredGames.some((g) => g.status === 'scheduled') && (
                      <div className="mb-6">
                        <h3 className="text-sm font-semibold text-white mb-3">Upcoming</h3>
                        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                          {filteredGames.filter((g) => g.status === 'scheduled').map((game) => (
                            <ScheduleGameCard key={game.id} game={game} />
                          ))}
                        </div>
                      </div>
                    )}
                    {filteredGames.some((g) => g.status === 'final') && (
                      <div className="mb-6">
                        <h3 className="text-sm font-semibold text-white/60 mb-3">Final</h3>
                        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                          {filteredGames.filter((g) => g.status === 'final').map((game) => (
                            <ScheduleGameCard key={game.id} game={game} />
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between flex-wrap gap-4">
                      <DataSourceBadge
                        source={dataSource || 'ESPN College Baseball API'}
                        timestamp={formatTimestamp(lastUpdated)}
                      />
                      <Link href="/college-baseball/scores" className="text-sm text-burnt-orange hover:text-ember transition-colors">
                        View Full Scoreboard →
                      </Link>
                    </div>
                  </>
                )}
            </TabPanel>

            {/* Teams Tab */}
            <TabPanel id="teams" activeTab={activeTab}>
              <div>
                <div className="flex flex-col sm:flex-row gap-3 mb-6">
                  <input
                    type="text"
                    value={teamSearch}
                    onChange={(e) => setTeamSearch(e.target.value)}
                    placeholder="Search teams..."
                    className="flex-1 px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 text-sm focus:outline-none focus:border-burnt-orange/50 transition-all"
                  />
                  <select
                    value={teamConfFilter}
                    onChange={(e) => setTeamConfFilter(e.target.value)}
                    className="px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-burnt-orange/50 transition-all"
                  >
                    <option value="All">All Conferences</option>
                    {conferenceList.filter(c => c.name !== 'All Conferences').map(c => (
                      <option key={c.name} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>

                {teamsLoading ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {Array.from({ length: 12 }).map((_, i) => (
                      <div key={i} className="bg-white/5 rounded-lg p-4 animate-pulse">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-white/10 rounded-full" />
                          <div>
                            <div className="h-4 bg-white/10 rounded w-24 mb-1" />
                            <div className="h-3 bg-white/5 rounded w-16" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : filteredTeams.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {filteredTeams.map((team) => {
                      const meta = Object.entries(teamMetadata).find(([, m]) => m.shortName.toLowerCase() === (team.shortName || team.name).toLowerCase())?.[1];
                      return (
                        <Link key={team.id} href={`/college-baseball/teams/${team.id}`}>
                          <Card variant="hover" padding="md" className="h-full">
                            <div className="flex items-center gap-3">
                              {meta ? (
                                <img src={getLogoUrl(meta.espnId, meta.logoId)} alt="" className="w-8 h-8 object-contain" />
                              ) : (
                                <div className="w-8 h-8 bg-burnt-orange/15 rounded-full flex items-center justify-center text-[10px] font-bold text-burnt-orange">
                                  {(team.shortName || team.name).slice(0, 3).toUpperCase()}
                                </div>
                              )}
                              <div className="min-w-0">
                                <div className="font-semibold text-white text-sm truncate">{team.name}</div>
                                <div className="text-xs text-white/40">{team.conference || ''}</div>
                              </div>
                            </div>
                          </Card>
                        </Link>
                      );
                    })}
                  </div>
                ) : allTeams.length === 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {conferenceList.map((conf) => (
                      <Link key={conf.name} href={conf.href}>
                        <Card variant="hover" padding="md" className="text-center h-full">
                          <div className="font-semibold text-white">{conf.name}</div>
                          <div className="text-xs text-white/40 mt-1">
                            {conf.name === 'All Conferences' ? `View All ${conf.teams}` : `${conf.teams} Teams`}
                          </div>
                        </Card>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-white/40">No teams match &quot;{teamSearch}&quot;</p>
                  </div>
                )}

                <div className="text-center mt-6">
                  <Link href="/college-baseball/teams"><Button variant="primary">Browse All Teams</Button></Link>
                </div>
              </div>
            </TabPanel>

            {/* Players Tab */}
            <TabPanel id="players" activeTab={activeTab}>
              <PlayersTabContent />
            </TabPanel>
          </Container>
        </Section>

        {/* League Leaders — live from ESPN */}
        <LeagueLeaders />

        {/* Tracking & Vision AI Section */}
        <Section padding="lg" background="midnight" borderTop>
          <Container>
            <ScrollReveal>
              <Card variant="default" padding="lg">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-burnt-orange/15 flex items-center justify-center">
                    <svg viewBox="0 0 24 24" className="w-5 h-5 stroke-burnt-orange fill-none stroke-[1.5]">
                      <circle cx="12" cy="12" r="10" />
                      <circle cx="12" cy="12" r="3" />
                      <line x1="12" y1="2" x2="12" y2="6" />
                      <line x1="12" y1="18" x2="12" y2="22" />
                      <line x1="2" y1="12" x2="6" y2="12" />
                      <line x1="18" y1="12" x2="22" y2="12" />
                    </svg>
                  </div>
                  <div>
                    <CardTitle size="md">Tracking &amp; Vision AI</CardTitle>
                    <p className="text-text-tertiary text-xs mt-0.5">How college baseball uses tracking data</p>
                  </div>
                </div>
                <ul className="space-y-3 text-sm text-text-secondary">
                  <li className="flex gap-2">
                    <span className="text-burnt-orange mt-1 shrink-0">&bull;</span>
                    <span><strong className="text-white">TrackMan:</strong> pitch velocity, spin rate, extension — D1 standard since 2018, installed at 300+ programs</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-burnt-orange mt-1 shrink-0">&bull;</span>
                    <span><strong className="text-white">Yakkertech:</strong> batted-ball data — exit velo, launch angle, spray charts at programs using optical tracking</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-burnt-orange mt-1 shrink-0">&bull;</span>
                    <span><strong className="text-white">BSI HAV-F &amp; MMI:</strong> proprietary analytics layered on tracking data — hit quality, at-bat grading, velocity trends, fielding value, and in-game momentum shifts</span>
                  </li>
                </ul>
                <div className="mt-5 pt-4 border-t border-white/5">
                  <Link href="/vision-ai">
                    <Button variant="ghost" size="sm">Full Vision AI Landscape &rarr;</Button>
                  </Link>
                </div>
              </Card>
            </ScrollReveal>
          </Container>
        </Section>

      </main>
        <Footer />
      </>
    </div>
  );
}
