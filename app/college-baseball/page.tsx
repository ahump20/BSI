'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSportData } from '@/lib/hooks/useSportData';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge, DataSourceBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ScrollReveal } from '@/components/cinematic';
import { Footer } from '@/components/layout-ds/Footer';
import { SkeletonTableRow, SkeletonScoreCard } from '@/components/ui/Skeleton';
import { DataFreshnessIndicator } from '@/components/ui/DataFreshnessIndicator';
import { preseason2026 } from '@/lib/data/preseason-2026';
import { formatTimestamp, formatScheduleDate, getDateOffset } from '@/lib/utils/timezone';
import { teamMetadata, getLogoUrl } from '@/lib/data/team-metadata';

interface RankedTeam {
  rank: number;
  team: string;
  conference: string;
  record?: string;
}

interface StandingsTeam {
  teamName: string;
  wins: number;
  losses: number;
  conferenceWins?: number;
  conferenceLosses?: number;
  conference?: string;
}

interface ScheduleGame {
  id: string;
  date: string;
  time: string;
  status: 'scheduled' | 'live' | 'final' | 'postponed' | 'canceled';
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
  tv?: string;
}

interface TeamListItem {
  id: string;
  name: string;
  shortName?: string;
  conference?: string;
  record?: { wins: number; losses: number };
  logo?: string;
}

interface PlayerResult {
  id: string;
  name: string;
  team: string;
  jersey?: string;
  position: string;
  classYear?: string;
  conference?: string;
}

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
      teams: poll.ranks.map((e) => ({
        rank: e.current,
        team: e.team?.location ? `${e.team.location} ${e.team.name}` : e.team?.nickname || e.team?.name || 'Unknown',
        conference: '',
        record: e.recordSummary || '',
      })),
    };
  }

  // Already flat RankedTeam[] (Highlightly or normalized worker response)
  return { teams: rankings as RankedTeam[], pollName: '' };
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
    useSportData<{ rankings?: ESPNPoll[] | RankedTeam[]; meta?: { lastUpdated?: string; dataSource?: string } }>(rankingsUrl);
  const normalized = useMemo(() => normalizeRankings(rankingsRaw ?? {}), [rankingsRaw]);
  const rankings = normalized.teams.length ? normalized.teams : preseasonRankings;
  const isLiveRankings = normalized.teams.length > 0;

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
        <Section padding="lg" className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-radial from-burnt-orange/15 via-transparent to-transparent pointer-events-none" />
          <Container center>
            <ScrollReveal direction="up">
              <Badge variant="success" className="mb-4">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse mr-2" />
                NCAA Division I Baseball
              </Badge>
            </ScrollReveal>
            <ScrollReveal direction="up" delay={100}>
              <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-center uppercase tracking-wide mb-4">
                NCAA Division I <span className="text-gradient-blaze">Baseball</span>
              </h1>
            </ScrollReveal>
            <ScrollReveal direction="up" delay={120}>
              <DataFreshnessIndicator
                lastUpdated={lastUpdated ? new Date(lastUpdated) : undefined}
                source={dataSource}
                refreshInterval={30}
              />
            </ScrollReveal>
            <ScrollReveal direction="up" delay={150}>
              <p className="text-[#C9A227] font-semibold text-lg tracking-wide text-center mb-4">
                Coverage this sport has always deserved.
              </p>
            </ScrollReveal>
            <ScrollReveal direction="up" delay={200}>
              <p className="text-white/60 text-center max-w-2xl mx-auto mb-8">
                Complete box scores with batting lines, pitching stats, and play-by-play for every D1 game.
                SEC, Big 12, ACC -- all 300+ programs, covered like they matter. Because they do.
              </p>
            </ScrollReveal>
            <ScrollReveal direction="up" delay={250}>
              <div className="flex flex-wrap gap-4 justify-center">
                <Link href="/college-baseball/games"><Button variant="primary" size="lg">View Live Games</Button></Link>
                <Link href="/college-baseball/standings"><Button variant="secondary" size="lg">Conference Standings</Button></Link>
              </div>
            </ScrollReveal>
            {/* Hub Search */}
            <ScrollReveal direction="up" delay={275}>
              <div className="relative max-w-lg mx-auto mt-6">
                <div className="relative">
                  <svg viewBox="0 0 24 24" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => { setSearchQuery(e.target.value); setSearchOpen(true); }}
                    onFocus={() => setSearchOpen(true)}
                    onBlur={() => setTimeout(() => setSearchOpen(false), 200)}
                    placeholder="Search teams, players, articles..."
                    className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-burnt-orange/50 focus:bg-white/8 transition-colors"
                  />
                </div>
                {searchOpen && allSearchResults.length > 0 && (
                  <div className="absolute z-50 mt-1 w-full bg-charcoal border border-white/10 rounded-xl shadow-xl overflow-hidden max-h-80 overflow-y-auto">
                    {Array.from(groupedSearchResults.entries()).map(([category, items]) => (
                      <div key={category}>
                        <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-white/30 bg-white/5">{category}</div>
                        {items.map((item) => (
                          <Link key={item.href} href={item.href} className="block px-3 py-2 text-sm text-white/80 hover:bg-burnt-orange/15 hover:text-white transition-colors">
                            {item.name}
                          </Link>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </ScrollReveal>
            <ScrollReveal direction="up" delay={300}>
              <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-4 p-6 bg-white/5 border border-white/10 rounded-2xl">
                <div className="text-center p-4">
                  <div className="font-display text-3xl font-bold text-burnt-orange">300+</div>
                  <div className="text-xs uppercase tracking-wider text-white/40 mt-1">Division I Teams</div>
                </div>
                <div className="text-center p-4">
                  <div className="font-display text-3xl font-bold text-burnt-orange">32</div>
                  <div className="text-xs uppercase tracking-wider text-white/40 mt-1">Conferences</div>
                </div>
                <div className="text-center p-4">
                  <div className="font-display text-3xl font-bold text-burnt-orange">Live</div>
                  <div className="text-xs uppercase tracking-wider text-white/40 mt-1">Real-Time Scores</div>
                </div>
                <div className="text-center p-4">
                  <div className="font-display text-3xl font-bold text-burnt-orange">RPI</div>
                  <div className="text-xs uppercase tracking-wider text-white/40 mt-1">Advanced Data</div>
                </div>
              </div>
            </ScrollReveal>
          </Container>
        </Section>

        {/* Editorial CTA */}
        <Section padding="sm" className="py-4">
          <Container>
            <div className="space-y-3">
              <Link href="/college-baseball/editorial/texas-week-1-recap">
                <div className="bg-gradient-to-r from-burnt-orange/20 to-[#500000]/20 border border-burnt-orange/30 rounded-xl p-4 md:p-6 hover:border-burnt-orange/60 transition-all group cursor-pointer">
                  <div className="flex items-center justify-between">
                    <div>
                      <Badge variant="primary" className="mb-2">Texas Weekly</Badge>
                      <h3 className="font-display text-lg md:text-xl font-bold text-white uppercase tracking-wide group-hover:text-burnt-orange transition-colors">
                        Texas Week 1: 27 Runs. One Hit Allowed by Volantis.
                      </h3>
                      <p className="text-white/50 text-sm mt-1">
                        UC Davis swept 27–7. Volantis earns SEC honors. Michigan State — fresh off upsetting No. 8 Louisville — arrives for Weekend 2.
                      </p>
                    </div>
                    <svg viewBox="0 0 24 24" className="w-6 h-6 text-burnt-orange flex-shrink-0 ml-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </div>
                </div>
              </Link>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Link href="/college-baseball/editorial/texas-2026">
                  <div className="bg-white/5 border border-white/10 rounded-xl p-3 md:p-4 hover:border-burnt-orange/40 transition-all group cursor-pointer h-full">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-display text-sm font-bold text-white uppercase tracking-wide group-hover:text-burnt-orange transition-colors">
                          Texas 2026 Season Preview
                        </h4>
                        <p className="text-white/40 text-xs mt-0.5">3,818 wins. 130 years. The definitive deep dive.</p>
                      </div>
                      <svg viewBox="0 0 24 24" className="w-4 h-4 text-white/20 flex-shrink-0 ml-3" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9 18l6-6-6-6" />
                      </svg>
                    </div>
                  </div>
                </Link>
                <Link href="/college-baseball/editorial/week-1-recap">
                  <div className="bg-white/5 border border-white/10 rounded-xl p-3 md:p-4 hover:border-burnt-orange/40 transition-all group cursor-pointer h-full">
                    <div className="flex items-center justify-between">
                      <div>
                        <Badge variant="secondary" className="mb-1">New</Badge>
                        <h4 className="font-display text-sm font-bold text-white uppercase tracking-wide group-hover:text-burnt-orange transition-colors">
                          Week 1 National Recap
                        </h4>
                        <p className="text-white/40 text-xs mt-0.5">Three grand slams. One record book.</p>
                      </div>
                      <svg viewBox="0 0 24 24" className="w-4 h-4 text-white/20 flex-shrink-0 ml-3" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9 18l6-6-6-6" />
                      </svg>
                    </div>
                  </div>
                </Link>
                <Link href="/college-baseball/editorial/sec-opening-weekend">
                  <div className="bg-white/5 border border-white/10 rounded-xl p-3 md:p-4 hover:border-burnt-orange/40 transition-all group cursor-pointer h-full">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-display text-sm font-bold text-white uppercase tracking-wide group-hover:text-burnt-orange transition-colors">
                          SEC Conference Preview
                        </h4>
                        <p className="text-white/40 text-xs mt-0.5">13 ranked teams. The deepest conference.</p>
                      </div>
                      <svg viewBox="0 0 24 24" className="w-4 h-4 text-white/20 flex-shrink-0 ml-3" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9 18l6-6-6-6" />
                      </svg>
                    </div>
                  </div>
                </Link>
              </div>
            </div>
          </Container>
        </Section>

        {/* Tabs */}
        <Section padding="lg" background="charcoal" borderTop>
          <Container>
            <div className="flex gap-2 mb-2 border-b border-white/10 overflow-x-auto pb-px">
              {tabs.map((tab) => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`px-6 py-3 text-sm font-semibold whitespace-nowrap transition-colors border-b-2 -mb-px ${
                    activeTab === tab.id ? 'text-burnt-orange border-burnt-orange' : 'text-white/40 border-transparent hover:text-white'
                  }`}>
                  {tab.label}
                </button>
              ))}
            </div>
            {/* Secondary nav */}
            <div className="flex gap-3 mb-8 overflow-x-auto pb-1">
              {[
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

            {/* Rankings Tab — per-tab loading */}
            {activeTab === 'rankings' && (
              <ScrollReveal>
                <Card variant="default" padding="lg">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Image src="/icons/baseball.svg" alt="" width={20} height={20} className="opacity-60" />
                        {isLiveRankings
                          ? (normalized.pollName || '2026 Top 25')
                          : '2026 Preseason Top 25'}
                      </div>
                      <Badge variant="primary">
                        {rankingsRaw?.meta?.dataSource === 'espn' ? 'ESPN' : 'D1Baseball'}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {rankingsLoading ? (
                      <table className="w-full"><tbody>{Array.from({ length: 25 }).map((_, i) => <SkeletonTableRow key={i} columns={4} />)}</tbody></table>
                    ) : rankingsError ? (
                      <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-6">
                        <p className="text-red-400 font-semibold">Rankings Unavailable</p>
                        <p className="text-white/60 text-sm mt-1">{rankingsError}</p>
                        <button onClick={retryRankings} className="mt-4 px-4 py-2 bg-burnt-orange text-white rounded-lg text-sm font-medium hover:bg-ember transition-colors">
                          Retry
                        </button>
                        {preseasonRankings.length > 0 && (
                          <p className="text-white/30 text-xs mt-3">Showing preseason rankings as fallback below.</p>
                        )}
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b-2 border-burnt-orange">
                              {['Rank', 'Team', 'Conference', 'Record'].map((h) => (
                                <th key={h} className="text-left p-3 text-white/40 font-semibold text-xs">{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {rankings.map((team) => (
                              <tr key={team.rank} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                <td className="p-3 text-burnt-orange font-bold text-lg">{team.rank}</td>
                                <td className="p-3 font-semibold text-white">{team.team}</td>
                                <td className="p-3 text-white/60">{team.conference}</td>
                                <td className="p-3 text-white/60">{team.record || '-'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                    <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <DataSourceBadge source="D1Baseball / NCAA" timestamp={formatTimestamp(lastUpdated)} />
                        {!isLiveRankings && !rankingsLoading && !rankingsError && (
                          <span className="text-xs text-yellow-400/60 bg-yellow-400/10 px-2 py-0.5 rounded">Using preseason data</span>
                        )}
                      </div>
                      <Link href="/college-baseball/rankings" className="text-sm text-burnt-orange hover:text-ember transition-colors">
                        Full Rankings →
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </ScrollReveal>
            )}

            {/* Standings Tab — per-tab loading */}
            {activeTab === 'standings' && (
              <>
                {standingsLoading ? (
                  <Card variant="default" padding="lg">
                    <CardContent><table className="w-full"><tbody>{Array.from({ length: 10 }).map((_, i) => <SkeletonTableRow key={i} columns={6} />)}</tbody></table></CardContent>
                  </Card>
                ) : standingsError ? (
                  <Card variant="default" padding="lg" className="bg-red-500/10 border-red-500/30">
                    <p className="text-red-400 font-semibold">Data Unavailable</p>
                    <p className="text-white/60 text-sm mt-1">{standingsError}</p>
                    <button onClick={retryStandings} className="mt-4 px-4 py-2 bg-burnt-orange text-white rounded-lg">Retry</button>
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
              </>
            )}

            {/* Schedule Tab */}
            {activeTab === 'schedule' && (
              <>
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
                  <Card variant="default" padding="lg" className="bg-red-500/10 border-red-500/30">
                    <p className="text-red-400 font-semibold">Data Unavailable</p>
                    <p className="text-white/60 text-sm mt-1">{scheduleError}</p>
                    <button onClick={retrySchedule} className="mt-4 px-4 py-2 bg-burnt-orange text-white rounded-lg">Retry</button>
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
              </>
            )}

            {/* Teams Tab — inline search */}
            {activeTab === 'teams' && (
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
                                <img src={getLogoUrl(meta.espnId)} alt="" className="w-8 h-8 object-contain" />
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
            )}

            {/* Players Tab — inline search */}
            {activeTab === 'players' && <PlayersTabContent />}
          </Container>
        </Section>

        {/* League Leaders */}
        <Section padding="lg" background="charcoal" borderTop>
          <Container>
            <ScrollReveal>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-burnt-orange/15 flex items-center justify-center">
                  <svg viewBox="0 0 24 24" className="w-5 h-5 stroke-burnt-orange fill-none stroke-[1.5]">
                    <path d="M18 20V10M12 20V4M6 20V14" />
                  </svg>
                </div>
                <div>
                  <h2 className="font-display text-xl font-bold text-white uppercase tracking-wide">League Leaders</h2>
                  <p className="text-white/40 text-xs mt-0.5">Top performers across D1 baseball</p>
                </div>
              </div>
            </ScrollReveal>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { cat: 'Batting Average', label: 'AVG' },
                { cat: 'Home Runs', label: 'HR' },
                { cat: 'RBI', label: 'RBI' },
                { cat: 'ERA', label: 'ERA' },
                { cat: 'Strikeouts', label: 'K' },
                { cat: 'Stolen Bases', label: 'SB' },
              ].map((stat) => (
                <Card key={stat.label} variant="default" padding="md">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-burnt-orange font-semibold text-sm">{stat.cat}</span>
                    <Badge variant="secondary">{stat.label}</Badge>
                  </div>
                  <p className="text-white/30 text-xs">Stats available once season games are final.</p>
                </Card>
              ))}
            </div>
            <div className="mt-6 text-center">
              <Link href="/college-baseball/players">
                <Button variant="secondary" size="sm">Full Player Statistics →</Button>
              </Link>
            </div>
          </Container>
        </Section>

        {/* Scouting Technology Section */}
        <Section padding="lg" background="midnight" borderTop>
          <Container>
            <ScrollReveal>
              <Card variant="default" padding="lg">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-burnt-orange/15 flex items-center justify-center">
                    <svg viewBox="0 0 24 24" className="w-5 h-5 stroke-burnt-orange fill-none stroke-[1.5]">
                      <circle cx="11" cy="11" r="8" />
                      <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                  </div>
                  <div>
                    <CardTitle size="md">Scouting Technology</CardTitle>
                    <p className="text-text-tertiary text-xs mt-0.5">The tracking gap in college baseball</p>
                  </div>
                </div>
                <ul className="space-y-3 text-sm text-text-secondary">
                  <li className="flex gap-2">
                    <span className="text-burnt-orange mt-1 shrink-0">&bull;</span>
                    <span><strong className="text-white">No league-wide tracking</strong> — unlike MLB&apos;s Statcast, college baseball has no standardized optical tracking infrastructure</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-burnt-orange mt-1 shrink-0">&bull;</span>
                    <span><strong className="text-white">KinaTrax at 7 NCAA programs</strong> (~$500K per install) — markerless 3D motion capture for pitching biomechanics</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-burnt-orange mt-1 shrink-0">&bull;</span>
                    <span><strong className="text-white">Rapsodo units at mid-tier programs</strong> ($3K-$5K vs TrackMan at $20K+) — pitch tracking becoming accessible</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-burnt-orange mt-1 shrink-0">&bull;</span>
                    <span><strong className="text-white">Synergy Sports covers ~90% of D1 baseball</strong> — comprehensive play-type tagging from game film</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-burnt-orange mt-1 shrink-0">&bull;</span>
                    <span><strong className="text-white">SkillCorner + broadcast-derived tracking</strong> emerging — could bring positional data to any streamed game</span>
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

// ── Players Tab Content ──────────────────────────────────────────────────────

function PlayersTabContent() {
  const [search, setSearch] = useState('');
  const [posFilter, setPosFilter] = useState('All');
  const [classFilter, setClassFilter] = useState('All');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(debounceRef.current);
  }, [search]);

  const searchParam = debouncedSearch.length >= 2 ? `?search=${encodeURIComponent(debouncedSearch)}` : '';
  const { data, loading } = useSportData<{ players?: PlayerResult[] }>(
    searchParam ? `/api/college-baseball/players${searchParam}` : null
  );
  const players = data?.players || [];

  const filtered = useMemo(() => {
    let list = players;
    if (posFilter !== 'All') list = list.filter(p => p.position === posFilter);
    if (classFilter !== 'All') list = list.filter(p => p.classYear === classFilter);
    return list;
  }, [players, posFilter, classFilter]);

  return (
    <Card variant="default" padding="lg">
      <CardHeader><CardTitle>Player Search</CardTitle></CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name (min 2 chars)..."
            className="flex-1 px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 text-sm focus:outline-none focus:border-burnt-orange/50 transition-all"
          />
          <select
            value={posFilter}
            onChange={(e) => setPosFilter(e.target.value)}
            className="px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-burnt-orange/50 transition-all"
          >
            <option value="All">All Positions</option>
            {['P', 'C', '1B', '2B', '3B', 'SS', 'OF', 'DH', 'UTL'].map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
          <select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            className="px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-burnt-orange/50 transition-all"
          >
            <option value="All">All Classes</option>
            {['Fr', 'So', 'Jr', 'Sr', 'Gr'].map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {!searchParam && (
          <div className="text-center py-8">
            <p className="text-white/60 mb-4">Enter at least 2 characters to search D1 baseball players.</p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link href="/college-baseball/players"><Button variant="primary">Browse Players</Button></Link>
              <Link href="/college-baseball/transfer-portal"><Button variant="secondary">Transfer Portal</Button></Link>
            </div>
          </div>
        )}

        {searchParam && loading && (
          <table className="w-full"><tbody>{Array.from({ length: 5 }).map((_, i) => <SkeletonTableRow key={i} columns={5} />)}</tbody></table>
        )}

        {searchParam && !loading && filtered.length === 0 && (
          <div className="text-center py-8">
            <p className="text-white/40">No players found for &quot;{debouncedSearch}&quot;</p>
          </div>
        )}

        {searchParam && !loading && filtered.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-burnt-orange">
                  {['Name', 'Team', 'Pos', 'Class', ''].map((h) => (
                    <th key={h} className="text-left p-3 text-white/40 font-semibold text-xs">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.slice(0, 25).map((player) => (
                  <tr key={player.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="p-3 font-semibold text-white">{player.name}</td>
                    <td className="p-3 text-white/60">{player.team}</td>
                    <td className="p-3 text-white/60">{player.position}</td>
                    <td className="p-3 text-white/60">{player.classYear || '-'}</td>
                    <td className="p-3">
                      <Link href={`/college-baseball/players/${player.id}`} className="text-burnt-orange text-xs hover:text-ember transition-colors">
                        Profile →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Schedule Game Card ───────────────────────────────────────────────────────

function ScheduleGameCard({ game }: { game: ScheduleGame }) {
  const isLive = game.status === 'live';
  const isFinal = game.status === 'final';
  const isScheduled = game.status === 'scheduled';
  const awayWon = isFinal && (game.awayTeam.score ?? 0) > (game.homeTeam.score ?? 0);
  const homeWon = isFinal && (game.homeTeam.score ?? 0) > (game.awayTeam.score ?? 0);

  return (
    <Link href={`/college-baseball/game/${game.id}`} className="block">
      <div className={`bg-white/5 rounded-lg border transition-all hover:border-burnt-orange hover:bg-white/[0.07] ${
        isLive ? 'border-green-500/30' : 'border-white/10'
      }`}>
        <div className={`px-3 py-1.5 rounded-t-lg flex items-center justify-between ${
          isLive ? 'bg-green-500/10' : isFinal ? 'bg-white/5' : 'bg-burnt-orange/10'
        }`}>
          <span className={`text-xs font-semibold uppercase ${
            isLive ? 'text-green-400' : isFinal ? 'text-white/30' : 'text-burnt-orange'
          }`}>
            {isLive ? (
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                {game.inning ? `Inn ${game.inning}` : 'Live'}
              </span>
            ) : isFinal ? 'Final' : game.time}
          </span>
          <span className="text-[10px] text-white/30 font-medium">
            {game.homeTeam.conference || game.awayTeam.conference || 'NCAA'}
          </span>
        </div>
        <div className="p-3 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-6 h-6 bg-white/5 rounded-full flex items-center justify-center text-[10px] font-bold text-burnt-orange flex-shrink-0">
                {game.awayTeam.shortName?.slice(0, 3).toUpperCase() || 'AWY'}
              </div>
              <span className={`font-semibold text-sm truncate ${awayWon ? 'text-white' : 'text-white/70'}`}>
                {game.awayTeam.name}
              </span>
            </div>
            <span className={`text-lg font-bold font-mono ml-2 ${
              isScheduled ? 'text-white/20' : awayWon ? 'text-white' : 'text-white/50'
            }`}>
              {game.awayTeam.score !== null ? game.awayTeam.score : '-'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-6 h-6 bg-white/5 rounded-full flex items-center justify-center text-[10px] font-bold text-burnt-orange flex-shrink-0">
                {game.homeTeam.shortName?.slice(0, 3).toUpperCase() || 'HME'}
              </div>
              <span className={`font-semibold text-sm truncate ${homeWon ? 'text-white' : 'text-white/70'}`}>
                {game.homeTeam.name}
              </span>
            </div>
            <span className={`text-lg font-bold font-mono ml-2 ${
              isScheduled ? 'text-white/20' : homeWon ? 'text-white' : 'text-white/50'
            }`}>
              {game.homeTeam.score !== null ? game.homeTeam.score : '-'}
            </span>
          </div>
        </div>
        {game.venue && game.venue !== 'TBD' && (
          <div className="px-3 pb-2 text-[10px] text-white/25 truncate">
            {game.venue}
          </div>
        )}
      </div>
    </Link>
  );
}
