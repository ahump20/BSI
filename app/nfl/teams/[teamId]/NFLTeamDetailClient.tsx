'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge, DataSourceBadge } from '@/components/ui/Badge';
import { ScrollReveal } from '@/components/cinematic';

import { Skeleton } from '@/components/ui/Skeleton';
import { formatTimestamp } from '@/lib/utils/timezone';
import { useResolvedParam } from '@/lib/hooks/useResolvedParam';
import { normalizeWeight, normalizeHeight } from '@/lib/utils/format';

// All 32 NFL teams with full data + ESPN numeric IDs for roster fetch
export const NFL_TEAMS: Record<
  string,
  {
    city: string;
    name: string;
    abbreviation: string;
    espnId: string;
    conference: string;
    division: string;
    primaryColor: string;
    secondaryColor: string;
  }
> = {
  cardinals: { city: 'Arizona', name: 'Cardinals', abbreviation: 'ARI', espnId: '22', conference: 'NFC', division: 'West', primaryColor: '#97233F', secondaryColor: '#000000' },
  falcons: { city: 'Atlanta', name: 'Falcons', abbreviation: 'ATL', espnId: '1', conference: 'NFC', division: 'South', primaryColor: '#A71930', secondaryColor: '#000000' },
  ravens: { city: 'Baltimore', name: 'Ravens', abbreviation: 'BAL', espnId: '33', conference: 'AFC', division: 'North', primaryColor: '#241773', secondaryColor: '#000000' },
  bills: { city: 'Buffalo', name: 'Bills', abbreviation: 'BUF', espnId: '2', conference: 'AFC', division: 'East', primaryColor: '#00338D', secondaryColor: '#C60C30' },
  panthers: { city: 'Carolina', name: 'Panthers', abbreviation: 'CAR', espnId: '29', conference: 'NFC', division: 'South', primaryColor: '#0085CA', secondaryColor: '#101820' },
  bears: { city: 'Chicago', name: 'Bears', abbreviation: 'CHI', espnId: '3', conference: 'NFC', division: 'North', primaryColor: '#0B162A', secondaryColor: '#C83803' },
  bengals: { city: 'Cincinnati', name: 'Bengals', abbreviation: 'CIN', espnId: '4', conference: 'AFC', division: 'North', primaryColor: '#FB4F14', secondaryColor: '#000000' },
  browns: { city: 'Cleveland', name: 'Browns', abbreviation: 'CLE', espnId: '5', conference: 'AFC', division: 'North', primaryColor: '#311D00', secondaryColor: '#FF3C00' },
  cowboys: { city: 'Dallas', name: 'Cowboys', abbreviation: 'DAL', espnId: '6', conference: 'NFC', division: 'East', primaryColor: '#003594', secondaryColor: '#869397' },
  broncos: { city: 'Denver', name: 'Broncos', abbreviation: 'DEN', espnId: '7', conference: 'AFC', division: 'West', primaryColor: '#FB4F14', secondaryColor: '#002244' },
  lions: { city: 'Detroit', name: 'Lions', abbreviation: 'DET', espnId: '8', conference: 'NFC', division: 'North', primaryColor: '#0076B6', secondaryColor: '#B0B7BC' },
  packers: { city: 'Green Bay', name: 'Packers', abbreviation: 'GB', espnId: '9', conference: 'NFC', division: 'North', primaryColor: '#203731', secondaryColor: '#FFB612' },
  texans: { city: 'Houston', name: 'Texans', abbreviation: 'HOU', espnId: '34', conference: 'AFC', division: 'South', primaryColor: '#03202F', secondaryColor: '#A71930' },
  colts: { city: 'Indianapolis', name: 'Colts', abbreviation: 'IND', espnId: '11', conference: 'AFC', division: 'South', primaryColor: '#002C5F', secondaryColor: '#A2AAAD' },
  jaguars: { city: 'Jacksonville', name: 'Jaguars', abbreviation: 'JAX', espnId: '30', conference: 'AFC', division: 'South', primaryColor: '#006778', secondaryColor: '#9F792C' },
  chiefs: { city: 'Kansas City', name: 'Chiefs', abbreviation: 'KC', espnId: '12', conference: 'AFC', division: 'West', primaryColor: '#E31837', secondaryColor: '#FFB81C' },
  raiders: { city: 'Las Vegas', name: 'Raiders', abbreviation: 'LV', espnId: '13', conference: 'AFC', division: 'West', primaryColor: '#000000', secondaryColor: '#A5ACAF' },
  chargers: { city: 'Los Angeles', name: 'Chargers', abbreviation: 'LAC', espnId: '24', conference: 'AFC', division: 'West', primaryColor: '#0080C6', secondaryColor: '#FFC20E' },
  rams: { city: 'Los Angeles', name: 'Rams', abbreviation: 'LAR', espnId: '14', conference: 'NFC', division: 'West', primaryColor: '#003594', secondaryColor: '#FFA300' },
  dolphins: { city: 'Miami', name: 'Dolphins', abbreviation: 'MIA', espnId: '15', conference: 'AFC', division: 'East', primaryColor: '#008E97', secondaryColor: '#FC4C02' },
  vikings: { city: 'Minnesota', name: 'Vikings', abbreviation: 'MIN', espnId: '16', conference: 'NFC', division: 'North', primaryColor: '#4F2683', secondaryColor: '#FFC62F' },
  patriots: { city: 'New England', name: 'Patriots', abbreviation: 'NE', espnId: '17', conference: 'AFC', division: 'East', primaryColor: '#002244', secondaryColor: '#C60C30' },
  saints: { city: 'New Orleans', name: 'Saints', abbreviation: 'NO', espnId: '18', conference: 'NFC', division: 'South', primaryColor: '#D3BC8D', secondaryColor: '#101820' },
  giants: { city: 'New York', name: 'Giants', abbreviation: 'NYG', espnId: '19', conference: 'NFC', division: 'East', primaryColor: '#0B2265', secondaryColor: '#A71930' },
  jets: { city: 'New York', name: 'Jets', abbreviation: 'NYJ', espnId: '20', conference: 'AFC', division: 'East', primaryColor: '#125740', secondaryColor: '#000000' },
  eagles: { city: 'Philadelphia', name: 'Eagles', abbreviation: 'PHI', espnId: '21', conference: 'NFC', division: 'East', primaryColor: '#004C54', secondaryColor: '#A5ACAF' },
  steelers: { city: 'Pittsburgh', name: 'Steelers', abbreviation: 'PIT', espnId: '23', conference: 'AFC', division: 'North', primaryColor: '#FFB612', secondaryColor: '#101820' },
  '49ers': { city: 'San Francisco', name: '49ers', abbreviation: 'SF', espnId: '25', conference: 'NFC', division: 'West', primaryColor: '#AA0000', secondaryColor: '#B3995D' },
  seahawks: { city: 'Seattle', name: 'Seahawks', abbreviation: 'SEA', espnId: '26', conference: 'NFC', division: 'West', primaryColor: '#002244', secondaryColor: '#69BE28' },
  buccaneers: { city: 'Tampa Bay', name: 'Buccaneers', abbreviation: 'TB', espnId: '27', conference: 'NFC', division: 'South', primaryColor: '#D50A0A', secondaryColor: '#FF7900' },
  titans: { city: 'Tennessee', name: 'Titans', abbreviation: 'TEN', espnId: '10', conference: 'AFC', division: 'South', primaryColor: '#0C2340', secondaryColor: '#4B92DB' },
  commanders: { city: 'Washington', name: 'Commanders', abbreviation: 'WAS', espnId: '28', conference: 'NFC', division: 'East', primaryColor: '#5A1414', secondaryColor: '#FFB612' },
};

interface RosterPlayer {
  id: string;
  name: string;
  jersey: string;
  position: string;
  height: string;
  weight: string;
  headshot?: string;
  age?: number;
}

interface TeamStats {
  wins: number;
  losses: number;
  ties: number;
  pointsFor: number;
  pointsAgainst: number;
  streak: number;
}

/** Normalize a player object from ESPN data — handles both flat and nested formats */
function normalizePlayer(raw: Record<string, unknown>): RosterPlayer {
  const athlete = (raw.athlete || raw) as Record<string, unknown>;
  const pos = athlete.position as Record<string, unknown> | undefined;
  const headshot = athlete.headshot as Record<string, unknown> | undefined;
  return {
    id: String(athlete.id || raw.id || ''),
    name: String(athlete.displayName || athlete.fullName || raw.name || raw.displayName || ''),
    jersey: String(athlete.jersey || raw.jersey || ''),
    position: String(pos?.abbreviation || athlete.position || raw.position || ''),
    height: String(athlete.displayHeight || raw.height || ''),
    weight: String(athlete.displayWeight || raw.weight || ''),
    headshot: String(headshot?.href || raw.headshot || ''),
    age: (athlete.age || raw.age) as number | undefined,
  };
}

type TabType = 'overview' | 'roster';

interface NFLTeamDetailClientProps {
  teamId: string;
}

const POSITION_GROUPS = [
  { id: 'all', label: 'All' },
  { id: 'offense', label: 'Offense' },
  { id: 'defense', label: 'Defense' },
  { id: 'special', label: 'Special Teams' },
];

const OFFENSE_POSITIONS = ['QB', 'RB', 'FB', 'WR', 'TE', 'OL', 'OT', 'OG', 'C', 'G', 'T'];
const DEFENSE_POSITIONS = ['DL', 'DE', 'DT', 'NT', 'LB', 'ILB', 'OLB', 'MLB', 'CB', 'S', 'SS', 'FS', 'DB'];
const SPECIAL_POSITIONS = ['K', 'P', 'LS', 'KR', 'PR'];

export default function NFLTeamDetailClient({ teamId: rawId }: NFLTeamDetailClientProps) {
  const teamId = useResolvedParam(rawId, 'teams');
  const [stats, setStats] = useState<TeamStats | null>(null);
  const [roster, setRoster] = useState<RosterPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [rosterLoading, setRosterLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [positionFilter, setPositionFilter] = useState('all');

  const team = NFL_TEAMS[teamId?.toLowerCase()];

  // Fetch standings for team record
  const fetchStandings = useCallback(async () => {
    if (!team) return;
    try {
      const response = await fetch('/api/nfl/standings');
      if (response.ok) {
        const data = (await response.json()) as {
          standings?: Array<{
            name: string;
            divisions?: Array<{
              name: string;
              teams: Array<{
                abbreviation: string;
                wins: number;
                losses: number;
                ties: number;
                pf: number;
                pa: number;
                streak: string;
              }>;
            }>;
          }>;
        };
        if (data.standings) {
          for (const conf of data.standings) {
            for (const div of conf.divisions || []) {
              const match = div.teams.find(
                (t) => t.abbreviation?.toUpperCase() === team.abbreviation.toUpperCase()
              );
              if (match) {
                const streakNum = typeof match.streak === 'string'
                  ? (match.streak.startsWith('W') ? parseInt(match.streak.slice(1), 10) || 0
                    : match.streak.startsWith('L') ? -(parseInt(match.streak.slice(1), 10) || 0)
                    : 0)
                  : 0;
                setStats({
                  wins: match.wins || 0,
                  losses: match.losses || 0,
                  ties: match.ties || 0,
                  pointsFor: match.pf || 0,
                  pointsAgainst: match.pa || 0,
                  streak: streakNum,
                });
                return;
              }
            }
          }
        }
      }
    } catch {
      // Standings are supplemental — don't fail the whole page
    }
  }, [team]);

  // Fetch team detail + roster
  const fetchRoster = useCallback(async () => {
    if (!team) return;
    setRosterLoading(true);
    try {
      const res = await fetch(`/api/nfl/teams/${team.espnId}`);
      if (res.ok) {
        const data = await res.json() as {
          team?: Record<string, unknown>;
          roster?: Record<string, unknown>[];
        };
        const rawRoster = (data.roster || []) as Record<string, unknown>[];
        setRoster(rawRoster.map(normalizePlayer));
      }
    } catch {
      // Roster fetch failure is non-fatal — show empty state
    } finally {
      setRosterLoading(false);
    }
  }, [team]);

  const fetchTeamData = useCallback(async () => {
    if (!team) {
      setError('Team not found');
      setLoading(false);
      return;
    }
    setLoading(true);
    await Promise.all([fetchStandings(), fetchRoster()]);
    setLoading(false);
  }, [team, fetchStandings, fetchRoster]);

  useEffect(() => {
    fetchTeamData();
  }, [fetchTeamData]);

  // Filter roster by position group
  const filteredRoster = useMemo(() => {
    if (positionFilter === 'all') return roster;
    if (positionFilter === 'offense') return roster.filter((p) => OFFENSE_POSITIONS.includes(p.position));
    if (positionFilter === 'defense') return roster.filter((p) => DEFENSE_POSITIONS.includes(p.position));
    if (positionFilter === 'special') return roster.filter((p) => SPECIAL_POSITIONS.includes(p.position));
    return roster;
  }, [roster, positionFilter]);

  if (!team) {
    return (
      <>
        <div>
          <Section padding="lg" background="charcoal">
            <Container>
              <Card variant="default" padding="lg" className="text-center">
                <h1 className="text-2xl font-bold text-text-primary mb-4">Team Not Found</h1>
                <p className="text-text-secondary mb-6">
                  The team you&apos;re looking for doesn&apos;t exist.
                </p>
                <Link href="/nfl/teams" className="text-burnt-orange hover:underline">
                  &larr; Back to All Teams
                </Link>
              </Card>
            </Container>
          </Section>
        </div>
      </>
    );
  }

  const fullName = `${team.city} ${team.name}`;
  const diffDisplay = stats
    ? stats.pointsFor - stats.pointsAgainst > 0
      ? '+' + (stats.pointsFor - stats.pointsAgainst)
      : String(stats.pointsFor - stats.pointsAgainst)
    : '-';
  const streakDisplay = stats
    ? stats.streak > 0
      ? 'W' + stats.streak
      : stats.streak < 0
        ? 'L' + Math.abs(stats.streak)
        : '-'
    : '-';

  return (
    <>
      <div>
        {/* Breadcrumb */}
        <Section padding="sm" className="border-b border-border-subtle">
          <Container>
            <nav className="flex items-center gap-2 text-sm">
              <Link
                href="/nfl"
                className="text-text-tertiary hover:text-burnt-orange transition-colors"
              >
                NFL
              </Link>
              <span className="text-text-tertiary">/</span>
              <Link
                href="/nfl/teams"
                className="text-text-tertiary hover:text-burnt-orange transition-colors"
              >
                Teams
              </Link>
              <span className="text-text-tertiary">/</span>
              <span className="text-text-primary font-medium">{fullName}</span>
            </nav>
          </Container>
        </Section>

        {/* Header */}
        <Section padding="md" className="relative overflow-hidden">
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `linear-gradient(135deg, ${team.primaryColor}30 0%, transparent 50%)`,
            }}
          />
          <Container>
            <ScrollReveal direction="up">
              <div className="flex items-center gap-3 mb-4">
                <Badge variant="primary">{team.conference}</Badge>
                <Badge variant="secondary">
                  {team.conference} {team.division}
                </Badge>
              </div>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={100}>
              <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold uppercase tracking-display mb-4">
                <span style={{ color: team.primaryColor }}>{team.city}</span>{' '}
                <span className="text-text-primary">{team.name}</span>
              </h1>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={150}>
              <p className="text-text-secondary">
                {(() => { const now = new Date(); const y = now.getFullYear(); return now.getMonth() < 2 ? y - 1 : y; })()} Season &middot; {team.conference} {team.division}
              </p>
            </ScrollReveal>
          </Container>
        </Section>

        {/* Tab Navigation */}
        <Section padding="sm" className="border-b border-border-subtle">
          <Container>
            <div className="flex gap-2 overflow-x-auto pb-px">
              {(['overview', 'roster'] as TabType[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-6 py-3 text-sm font-semibold whitespace-nowrap transition-colors border-b-2 -mb-px capitalize ${
                    activeTab === tab
                      ? 'text-burnt-orange border-burnt-orange'
                      : 'text-text-tertiary border-transparent hover:text-text-primary'
                  }`}
                >
                  {tab === 'roster' ? `Roster (${roster.length})` : 'Overview'}
                </button>
              ))}
            </div>
          </Container>
        </Section>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <Section padding="lg" background="charcoal" borderTop>
            <Container>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {/* Record Card */}
                <ScrollReveal>
                  <Card variant="default" padding="lg">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-3">
                        <svg viewBox="0 0 24 24" className="w-6 h-6 text-burnt-orange" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8zM22 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
                        </svg>
                        Season Record
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {loading ? (
                        <Skeleton variant="text" width="100%" height={60} />
                      ) : stats ? (
                        <div className="text-center">
                          <div className="text-4xl font-bold text-text-primary mb-2">
                            {stats.wins}-{stats.losses}
                            {stats.ties > 0 ? `-${stats.ties}` : ''}
                          </div>
                          <div className="text-text-secondary">
                            Win Pct:{' '}
                            {(stats.wins / (stats.wins + stats.losses + stats.ties) || 0)
                              .toFixed(3)
                              .replace('0.', '.')}
                          </div>
                        </div>
                      ) : (
                        <div className="text-center text-text-secondary">Season data unavailable</div>
                      )}
                    </CardContent>
                  </Card>
                </ScrollReveal>

                {/* Points Card */}
                <ScrollReveal delay={100}>
                  <Card variant="default" padding="lg">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-3">
                        <svg viewBox="0 0 24 24" className="w-6 h-6 text-burnt-orange" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <ellipse cx="12" cy="12" rx="9" ry="5" />
                          <path d="M12 7v10M7 12h10" />
                        </svg>
                        Points
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {loading ? (
                        <Skeleton variant="text" width="100%" height={60} />
                      ) : stats ? (
                        <div className="grid grid-cols-3 gap-4 text-center">
                          <div>
                            <div className="text-2xl font-bold text-success">{stats.pointsFor}</div>
                            <div className="text-text-tertiary text-sm">PF</div>
                          </div>
                          <div>
                            <div className="text-2xl font-bold text-error">{stats.pointsAgainst}</div>
                            <div className="text-text-tertiary text-sm">PA</div>
                          </div>
                          <div>
                            <div className={`text-2xl font-bold ${stats.pointsFor - stats.pointsAgainst > 0 ? 'text-success' : stats.pointsFor - stats.pointsAgainst < 0 ? 'text-error' : 'text-text-secondary'}`}>
                              {diffDisplay}
                            </div>
                            <div className="text-text-tertiary text-sm">DIFF</div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center text-text-secondary">Points data unavailable</div>
                      )}
                    </CardContent>
                  </Card>
                </ScrollReveal>

                {/* Streak Card */}
                <ScrollReveal delay={200}>
                  <Card variant="default" padding="lg">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-3">
                        <svg viewBox="0 0 24 24" className="w-6 h-6 text-burnt-orange" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        Current Streak
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {loading ? (
                        <Skeleton variant="text" width="100%" height={60} />
                      ) : stats ? (
                        <div className="text-center">
                          <div className={`text-4xl font-bold ${stats.streak > 0 ? 'text-success' : stats.streak < 0 ? 'text-error' : 'text-text-secondary'}`}>
                            {streakDisplay}
                          </div>
                          <div className="text-text-secondary mt-2">
                            {stats.streak > 0 ? 'Winning Streak' : stats.streak < 0 ? 'Losing Streak' : 'No Streak'}
                          </div>
                        </div>
                      ) : (
                        <div className="text-center text-text-secondary">Streak data unavailable</div>
                      )}
                    </CardContent>
                  </Card>
                </ScrollReveal>
              </div>

              {/* Quick Links */}
              <ScrollReveal delay={300}>
                <Card variant="default" padding="lg" className="mt-6">
                  <CardHeader>
                    <CardTitle>Quick Links</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-4">
                      <Link href="/nfl" className="px-4 py-2 bg-burnt-orange/20 text-burnt-orange rounded-sm hover:bg-burnt-orange/30 transition-colors">
                        Live Scores
                      </Link>
                      <Link href="/nfl/standings" className="px-4 py-2 bg-burnt-orange/20 text-burnt-orange rounded-sm hover:bg-burnt-orange/30 transition-colors">
                        Full Standings
                      </Link>
                      <Link href="/nfl/teams" className="px-4 py-2 bg-burnt-orange/20 text-burnt-orange rounded-sm hover:bg-burnt-orange/30 transition-colors">
                        All Teams
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </ScrollReveal>
            </Container>
          </Section>
        )}

        {/* Roster Tab */}
        {activeTab === 'roster' && (
          <Section padding="lg" background="charcoal" borderTop>
            <Container>
              {rosterLoading ? (
                <Card variant="default" padding="lg">
                  <div className="space-y-4">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <div key={i} className="flex items-center gap-4 p-4 bg-background-tertiary rounded-sm">
                        <Skeleton variant="rectangular" width={56} height={56} className="rounded-sm" />
                        <div className="flex-1">
                          <Skeleton variant="text" width={150} height={18} />
                          <Skeleton variant="text" width={100} height={14} className="mt-2" />
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              ) : roster.length === 0 ? (
                <Card variant="default" padding="lg">
                  <div className="text-center py-8">
                    <p className="text-text-secondary">Roster data not yet available.</p>
                    <p className="text-text-tertiary text-sm mt-2">
                      The roster will populate once it&apos;s finalized. Check back closer to the season.
                    </p>
                  </div>
                </Card>
              ) : (
                <>
                  {/* Position group filter */}
                  <div className="flex flex-wrap gap-2 mb-6">
                    {POSITION_GROUPS.map((group) => (
                      <button
                        key={group.id}
                        onClick={() => setPositionFilter(group.id)}
                        className={`px-4 py-2 rounded-sm text-sm transition-all ${
                          positionFilter === group.id
                            ? 'bg-burnt-orange text-white font-semibold'
                            : 'bg-background-tertiary text-text-secondary hover:bg-surface-light hover:text-text-primary'
                        }`}
                      >
                        {group.label}
                      </button>
                    ))}
                  </div>

                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredRoster.map((player) => (
                      <Link key={player.id} href={`/nfl/players/${player.id}`}>
                        <Card
                          variant="hover"
                          padding="md"
                          className="h-full transition-all duration-300 hover:scale-[1.02] group"
                          style={{ borderColor: team.primaryColor, borderLeftWidth: '3px' }}
                        >
                          <div className="flex items-center gap-4">
                            <div
                              className="w-14 h-14 rounded-sm flex items-center justify-center text-xl font-bold text-white flex-shrink-0"
                              style={{ backgroundColor: team.primaryColor }}
                            >
                              {player.jersey || '-'}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-display font-bold text-text-primary truncate group-hover:text-burnt-orange transition-colors">
                                {player.name}
                              </h4>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="secondary" className="text-xs">
                                  {player.position}
                                </Badge>
                                {player.age && (
                                  <span className="text-xs text-text-tertiary">Age {player.age}</span>
                                )}
                              </div>
                            </div>
                            <div className="text-right hidden sm:block">
                              <p className="text-text-secondary text-sm">{normalizeHeight(player.height)}</p>
                              {normalizeWeight(player.weight) && (
                                <p className="text-text-tertiary text-xs">{normalizeWeight(player.weight)} lbs</p>
                              )}
                            </div>
                          </div>
                        </Card>
                      </Link>
                    ))}
                  </div>
                </>
              )}
            </Container>
          </Section>
        )}

        {/* Data Source */}
        {!loading && !error && (
          <Section padding="sm" background="charcoal" borderTop>
            <Container>
              <DataSourceBadge source="ESPN / SportsDataIO" timestamp={formatTimestamp()} />
            </Container>
          </Section>
        )}
      </div>

    </>
  );
}
