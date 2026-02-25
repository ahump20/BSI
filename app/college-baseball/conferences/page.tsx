'use client';

import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ScrollReveal } from '@/components/cinematic';
import { Footer } from '@/components/layout-ds/Footer';
import { Trophy, Users, TrendingUp, MapPin } from 'lucide-react';
import { preseason2026 } from '@/lib/data/preseason-2026';
import { teamMetadata } from '@/lib/data/team-metadata';

/** Static conference metadata — membership counts are structural facts. */
const conferenceInfo: Record<string, { fullName: string; description: string; region: string; teams: number }> = {
  SEC: {
    fullName: 'Southeastern Conference',
    description: 'The deepest conference in college baseball — Texas and Texas A&M now call home alongside perennial powers like LSU, Tennessee, and Vanderbilt.',
    region: 'South',
    teams: 16,
  },
  ACC: {
    fullName: 'Atlantic Coast Conference',
    description: 'Massive expansion in 2024 brought Stanford, Cal, and SMU — joining established powers like Florida State, North Carolina, and Wake Forest.',
    region: 'East Coast',
    teams: 18,
  },
  'Big 12': {
    fullName: 'Big 12 Conference',
    description: 'TCU leads a competitive Big 12 that added UCF, Houston, BYU, and others in realignment. Deep pitching across the board.',
    region: 'Central',
    teams: 16,
  },
  'Big Ten': {
    fullName: 'Big Ten Conference',
    description: 'Growing power in the Midwest. USC and UCLA joined in 2024, bringing West Coast talent to the conference.',
    region: 'Midwest',
    teams: 18,
  },
};

/** Derive ranked team counts and top teams from preseason data (Top 25 only). */
function buildConferenceStats() {
  const confMap: Record<string, { ranked: number; topTeam: string | null; topRank: number | null }> = {};
  for (const [slug, data] of Object.entries(preseason2026)) {
    const conf = data.conference;
    if (!confMap[conf]) confMap[conf] = { ranked: 0, topTeam: null, topRank: null };
    if (data.rank <= 25) confMap[conf].ranked++;
    if (confMap[conf].topRank === null || data.rank < confMap[conf].topRank!) {
      confMap[conf].topRank = data.rank;
      confMap[conf].topTeam = teamMetadata[slug]?.shortName || slug;
    }
  }
  return confMap;
}

const confStats = buildConferenceStats();
const conferenceOrder = ['SEC', 'ACC', 'Big 12', 'Big Ten'];
const conferences = conferenceOrder
  .filter((name) => conferenceInfo[name])
  .map((name) => {
    const info = conferenceInfo[name];
    const stats = confStats[name] || { ranked: 0, topTeam: null, topRank: null };
    return {
      id: name.toLowerCase().replace(/\s+/g, '-'),
      name,
      fullName: info.fullName,
      description: info.description,
      rankedTeams: stats.ranked,
      topTeam: stats.topTeam,
      topRank: stats.topRank,
      region: info.region,
      teams: info.teams,
    };
  });

/** Find conference with the most ranked teams. */
const mostRankedConf = conferences.reduce((best, c) =>
  c.rankedTeams > best.rankedTeams ? c : best, conferences[0]);
const topConf = conferences.find((c) => c.topRank === 1) || conferences[0];
const totalRanked = conferences.reduce((sum, c) => sum + c.rankedTeams, 0);

/** Conference name → slug mapping for all non-Power-5 conferences. */
const confNameToSlug: Record<string, string> = {
  'Big East': 'big-east', AAC: 'aac', 'Sun Belt': 'sun-belt', 'Mountain West': 'mountain-west',
  CUSA: 'c-usa', 'A-10': 'a-10', CAA: 'colonial', 'Missouri Valley': 'missouri-valley',
  WCC: 'wcc', 'Big West': 'big-west', Southland: 'southland',
  ASUN: 'asun', 'America East': 'america-east', 'Big South': 'big-south', Horizon: 'horizon',
  'Patriot League': 'patriot-league', Southern: 'southern', Summit: 'summit', WAC: 'wac',
  Independent: 'independent',
};

/** Derive mid-major/D1 conference data from teamMetadata. */
const powerConfs = new Set(['SEC', 'ACC', 'Big 12', 'Big Ten']);
const midMajorConfs = (() => {
  const confTeams: Record<string, number> = {};
  for (const meta of Object.values(teamMetadata)) {
    if (powerConfs.has(meta.conference)) continue;
    confTeams[meta.conference] = (confTeams[meta.conference] || 0) + 1;
  }
  return Object.entries(confTeams)
    .filter(([name]) => confNameToSlug[name])
    .map(([name, count]) => ({
      id: confNameToSlug[name],
      name,
      teamCount: count,
      ranked: confStats[name]?.ranked || 0,
    }))
    .sort((a, b) => b.teamCount - a.teamCount || a.name.localeCompare(b.name));
})();

export default function ConferencesHubPage() {
  return (
    <>
      <main id="main-content">
        <Section padding="lg" className="pt-24">
          <Container>
            <ScrollReveal direction="up">
              <div className="flex items-center gap-3 mb-2">
                <Link
                  href="/college-baseball"
                  className="text-text-tertiary hover:text-burnt-orange transition-colors"
                >
                  College Baseball
                </Link>
                <span className="text-text-tertiary">/</span>
                <span className="text-white">Conferences</span>
              </div>

              <div className="mb-8">
                <h1 className="font-display text-3xl md:text-4xl font-bold uppercase tracking-display">
                  Conference <span className="text-gradient-blaze">Previews</span>
                </h1>
                <p className="text-text-secondary mt-2 max-w-2xl">
                  2026 preseason conference breakdowns—featuring the reshuffled landscape after
                  historic realignment. Texas and Texas A&M in the SEC. Stanford and Cal in the ACC.
                  A whole new era begins.
                </p>
              </div>
            </ScrollReveal>

            {/* Conference Breakdown Summary */}
            <ScrollReveal direction="up" delay={100}>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
                <Card padding="md" className="text-center">
                  <Trophy className="w-6 h-6 text-burnt-orange mx-auto mb-2" />
                  <div className="font-display text-2xl font-bold text-white">{totalRanked}</div>
                  <div className="text-text-tertiary text-sm">Ranked Teams</div>
                </Card>
                <Card padding="md" className="text-center">
                  <Users className="w-6 h-6 text-burnt-orange mx-auto mb-2" />
                  <div className="font-display text-2xl font-bold text-white">4</div>
                  <div className="text-text-tertiary text-sm">Power Conferences</div>
                </Card>
                <Card padding="md" className="text-center">
                  <TrendingUp className="w-6 h-6 text-burnt-orange mx-auto mb-2" />
                  <div className="font-display text-2xl font-bold text-white">{topConf.name}</div>
                  <div className="text-text-tertiary text-sm">#1 Team ({topConf.topTeam})</div>
                </Card>
                <Card padding="md" className="text-center">
                  <MapPin className="w-6 h-6 text-burnt-orange mx-auto mb-2" />
                  <div className="font-display text-2xl font-bold text-white">{mostRankedConf.name}</div>
                  <div className="text-text-tertiary text-sm">Most Ranked ({mostRankedConf.rankedTeams})</div>
                </Card>
              </div>
            </ScrollReveal>

            {/* Conference Cards */}
            <div className="grid gap-6">
              {conferences.map((conf, index) => (
                <ScrollReveal key={conf.id} direction="up" delay={150 + index * 50}>
                  <Link href={`/college-baseball/conferences/${conf.id}`}>
                    <Card
                      padding="lg"
                      className="hover:border-burnt-orange/50 transition-all cursor-pointer group"
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h2 className="font-display text-2xl font-bold text-white group-hover:text-burnt-orange transition-colors">
                              {conf.fullName}
                            </h2>
                            {conf.rankedTeams > 0 && (
                              <Badge variant="primary">{conf.rankedTeams} Ranked</Badge>
                            )}
                          </div>
                          <p className="text-text-secondary mb-3">{conf.description}</p>
                          <div className="flex flex-wrap gap-3 text-sm">
                            {conf.topTeam && (
                              <span className="text-burnt-orange">
                                Top: {conf.topTeam} (#{conf.topRank})
                              </span>
                            )}
                            <span className="text-text-tertiary">{conf.teams} Teams</span>
                            <span className="text-text-tertiary">{conf.region}</span>
                          </div>
                        </div>
                        <div className="md:text-right">
                          {conf.topTeam && (
                            <>
                              <div className="text-sm text-text-tertiary mb-1">Preseason Leader</div>
                              <div className="text-white font-medium">#{conf.topRank} {conf.topTeam}</div>
                            </>
                          )}
                        </div>
                      </div>
                    </Card>
                  </Link>
                </ScrollReveal>
              ))}
            </div>

            {/* Mid-Major & D1 Conferences */}
            {midMajorConfs.length > 0 && (
              <ScrollReveal direction="up" delay={400}>
                <h2 className="font-display text-2xl font-bold text-white mt-12 mb-6">
                  Mid-Major &amp; D1 Conferences
                </h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {midMajorConfs.map((conf) => (
                    <Link key={conf.id} href={`/college-baseball/conferences/${conf.id}`}>
                      <Card
                        padding="md"
                        className="hover:border-burnt-orange/50 transition-all cursor-pointer group h-full"
                      >
                        <div className="flex items-center justify-between">
                          <h3 className="font-display text-lg font-bold text-white group-hover:text-burnt-orange transition-colors">
                            {conf.name}
                          </h3>
                          {conf.ranked > 0 && (
                            <Badge variant="primary">{conf.ranked} Ranked</Badge>
                          )}
                        </div>
                        <div className="text-text-tertiary text-sm mt-2">
                          {conf.teamCount} {conf.teamCount === 1 ? 'team' : 'teams'}
                        </div>
                      </Card>
                    </Link>
                  ))}
                </div>
              </ScrollReveal>
            )}

            {/* Data Attribution */}
            <div className="mt-10 text-center text-xs text-text-tertiary">
              <p>
                Rankings data sourced from D1Baseball preseason poll. Conference membership reflects
                2024-25 realignment.
              </p>
              <p className="mt-1" suppressHydrationWarning>
                Last updated: {new Date().toLocaleString('en-US', { timeZone: 'America/Chicago' })}{' '}
                CT
              </p>
            </div>
          </Container>
        </Section>
      </main>

      <Footer />
    </>
  );
}
