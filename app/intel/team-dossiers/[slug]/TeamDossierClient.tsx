'use client';

import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { TeamDossier, type TeamDossierData } from '@/components/intel/TeamDossier';
import { CiteWidget } from '@/components/ui/CiteWidget';
import { JsonLd } from '@/components/JsonLd';
import { Footer } from '@/components/layout-ds/Footer';
import { useSportData } from '@/lib/hooks/useSportData';

// ---------------------------------------------------------------------------
// Seed data — full dossiers for known teams
// ---------------------------------------------------------------------------

const SEED_DOSSIERS: Record<string, TeamDossierData> = {
  'texas-2026': {
    slug: 'texas-2026',
    name: 'Texas',
    mascot: 'Longhorns',
    conference: 'SEC',
    record: '44-14',
    tier: 'Omaha Favorite',
    sport: 'College Baseball',
    date: 'February 2026',
    readTime: '8 min',
    runEnvironment: 'Above-average offense (6.8 R/G in 2025). UFCU Disch-Falk plays neutral to slight hitter-friendly.',
    pitchingProfile: 'Front-end depth with Volantis, Harrison, and a deep bullpen. Staff ERA 3.42 in 2025. Strikeout rate above conference average.',
    handednessSplit: '60% RHP starts, balanced lineup L/R. Lineup performs better against RHP (.291 vs .267).',
    howTheyWin: [
      'Dominant Friday starter sets the tone for weekend series',
      'Early-count aggression puts pressure on opposing starters in the first three innings',
      'Bullpen depth allows Pierce to shorten games from the 6th inning on',
      'Defensive middle (SS/2B/C) controls the running game and turns double plays at a top-10 national rate',
    ],
    howTheyLose: [
      'Mid-week pitching depth thins against quality Tuesday opponents',
      'Over-reliance on the long ball — when power goes cold, the offense lacks manufacturing ability',
      'Road series against elite SEC pitching (LSU, A&M, Vandy) historically challenging',
      'Bullpen usage in tournament format can leave the staff short for elimination games',
    ],
    keyPlayers: [
      { name: 'Lucas Volantis', position: 'RHP', year: 'Jr.', statLine: '9-2, 2.87 ERA, 112 K in 94 IP (2025)' },
      { name: 'Jace LaViolette', position: 'OF/1B', year: 'Jr.', statLine: '.312/.401/.578, 18 HR, 62 RBI (2025)' },
      { name: 'Kimble Jensen', position: 'C', year: 'Sr.', statLine: '.289/.388/.445, 38 SB caught, 1.92 pop time' },
    ],
    scheduleDifficulty: 'SEC slate includes series at LSU (Apr 3-5), vs. Texas A&M (Apr 17-19), at Vanderbilt (May 1-3). Non-conference features Michigan State (Feb 20-22) and a mid-week at Dallas Baptist. The back half is loaded — four of the last six weekends are against teams projected in the top 25.',
    outlook: 'Texas has the rotation depth, offensive firepower, and defensive polish to reach Omaha. The question is whether the mid-week staff can hold against a conference that offers no off-nights. If Volantis stays healthy and the bullpen avoids April fatigue, this is a national seed contender.',
  },
  'tcu-2026': {
    slug: 'tcu-2026',
    name: 'TCU',
    mascot: 'Horned Frogs',
    conference: 'Big 12',
    record: '44-20',
    tier: 'Contender',
    sport: 'College Baseball',
    date: 'February 2026',
    readTime: '7 min',
    runEnvironment: 'Moderate offense (5.9 R/G). Lupton Stadium plays slightly pitcher-friendly with deep alleys.',
    pitchingProfile: 'Strong weekend rotation with conference-best walk rate. Bullpen rebuilt after losing three arms to the draft.',
    handednessSplit: '55% RHP starts. Lineup tilts right-handed (.284 R vs .261 L). Vulnerable to elite LHP starters.',
    howTheyWin: [
      'Elite strike-throwing by the weekend rotation limits free bases',
      'Defensive efficiency — fewest errors in the Big 12 two years running',
      'Small-ball manufacturing when the long ball isn\'t there (conference-best sacrifice bunt rate)',
      'Schlossnagle-era culture of postseason performance carries into big moments',
    ],
    howTheyLose: [
      'Bullpen reconstruction means growing pains in one-run games early',
      'Power deficit compared to SEC opponents — can\'t out-slug elite teams',
      'Depth tested if a weekend starter misses time (no proven 4th option)',
      'Road record in hostile environments (Lubbock, Stillwater) has been inconsistent',
    ],
    keyPlayers: [
      { name: 'Brayden Taylor', position: '3B', year: 'Sr.', statLine: '.301/.392/.512, 14 HR, 55 RBI (2025)' },
      { name: 'Kole Klecker', position: 'RHP', year: 'Jr.', statLine: '8-3, 3.12 ERA, 98 K in 89 IP (2025)' },
      { name: 'Garrett Wright', position: 'LHP', year: 'So.', statLine: '6-2, 3.44 ERA, 82 K in 73 IP (2025)' },
    ],
    scheduleDifficulty: 'Big 12 schedule features series at Oklahoma State (Mar 20-22), vs. Kansas (Apr 10-12), at Arizona (May 8-10). Non-conference includes a mid-week trip to Texas and a tournament in Frisco. The Big 12 is deep but lacks the top-end pitching gauntlet of the SEC.',
    outlook: 'TCU profiles as a regional host and potential super regional team. The rotation is good enough to beat anyone in a three-game set, but the rebuilt bullpen is the variable. If the new arms settle by conference play, this team has Omaha talent. If not, they\'re a two-seed in a regional — still dangerous, but not favorites.',
  },
  'ucla-2026': {
    slug: 'ucla-2026',
    name: 'UCLA',
    mascot: 'Bruins',
    conference: 'Big Ten',
    record: '48-18',
    tier: 'Omaha Favorite',
    sport: 'College Baseball',
    date: 'February 2026',
    readTime: '7 min',
    runEnvironment: 'High-powered offense (7.2 R/G). Jackie Robinson Stadium plays neutral with marine layer dampening fly balls after 7 PM.',
    pitchingProfile: 'Deep staff with four starters capable of Friday-caliber outings. Conference-best K/9 rate. Bullpen features three late-inning options with sub-3.00 ERAs.',
    handednessSplit: '50/50 L/R rotation. Switch-hitting depth in the lineup makes them matchup-proof against platoon advantages.',
    howTheyWin: [
      'Four-deep rotation allows aggressive pitching without burning arms in midweek',
      'Offensive balance — no single batter needs to carry the lineup, 6 players hit .280+',
      'Elite baserunning (conference-best stolen base percentage at 82%)',
      'West Coast scheduling advantage: opponents travel to them more than they travel east',
    ],
    howTheyLose: [
      'Unproven against SEC-level pitching in elimination games',
      'Big Ten conference schedule doesn\'t prepare them for the jump in quality at regionals',
      'Marine layer makes them a fly-ball team that can go cold in humid away environments',
      'Lack of recent CWS experience — program hasn\'t reached Omaha since 2013',
    ],
    keyPlayers: [
      { name: 'Carson Yates', position: 'SS', year: 'Jr.', statLine: '.321/.408/.498, 12 HR, 43 SB (2025)' },
      { name: 'Thatcher Hurd', position: 'RHP', year: 'Sr.', statLine: '10-1, 2.65 ERA, 121 K in 102 IP (2025)' },
      { name: 'Jake Gelof', position: '3B/DH', year: 'Jr.', statLine: '.298/.385/.545, 19 HR, 67 RBI (2025)' },
    ],
    scheduleDifficulty: 'Big Ten slate includes series at Oregon (Mar 27-29), vs. USC (Apr 24-26), at Michigan (May 8-10). Non-conference features a February tournament in Arizona and a mid-season series against Stanford. The Big Ten has improved but still lacks the consistent depth of the SEC or even Big 12.',
    outlook: 'UCLA has the deepest roster in the Big Ten and arguably the best rotation in college baseball by depth. The question — the only question — is whether a Big Ten team can survive the postseason gauntlet against SEC and ACC opponents who play that level every weekend. The talent says yes. The conference schedule says we won\'t know until June.',
  },
};

// ---------------------------------------------------------------------------
// Types for API
// ---------------------------------------------------------------------------

interface TeamApiResponse {
  team?: {
    id?: string;
    name?: string;
    mascot?: string;
    conference?: string;
    record?: string;
    wins?: number;
    losses?: number;
    roster?: Array<{ name: string; position: string; year?: string; stats?: string }>;
    stats?: Record<string, unknown>;
  };
  meta?: { source: string; fetched_at: string };
}

// ---------------------------------------------------------------------------
// Client component
// ---------------------------------------------------------------------------

export function TeamDossierClient({ slug }: { slug: string }) {
  const isSeedDossier = slug in SEED_DOSSIERS;

  // Extract team identifier from slug (remove -2026 suffix)
  const teamId = slug.replace(/-\d{4}$/, '');

  const { data: teamData, loading } =
    useSportData<TeamApiResponse>(
      isSeedDossier ? null : `/api/college-baseball/teams/${teamId}`,
      { skip: isSeedDossier }
    );

  const seedDossier = SEED_DOSSIERS[slug];
  const dossier: TeamDossierData | null = seedDossier || (teamData?.team ? {
    slug,
    name: teamData.team.name || teamId,
    mascot: teamData.team.mascot || '',
    conference: teamData.team.conference || '',
    record: teamData.team.record || (teamData.team.wins != null && teamData.team.losses != null ? `${teamData.team.wins}-${teamData.team.losses}` : ''),
    tier: 'Dark Horse',
    sport: 'College Baseball',
    date: 'February 2026',
    readTime: '5 min',
    runEnvironment: '',
    pitchingProfile: '',
    handednessSplit: '',
    howTheyWin: [],
    howTheyLose: [],
    keyPlayers: teamData.team.roster?.slice(0, 5).map((p) => ({
      name: p.name,
      position: p.position,
      year: p.year || '',
      statLine: p.stats || '',
    })) || [],
    scheduleDifficulty: '',
    outlook: '',
  } : null);

  if (loading && !dossier) {
    return (
      <>
        <div>
          <Section padding="lg">
            <Container>
              <div className="max-w-3xl animate-pulse space-y-4">
                <div className="h-6 bg-border-subtle rounded w-1/4" />
                <div className="h-10 bg-border-subtle rounded w-1/2" />
                <div className="grid grid-cols-3 gap-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-24 bg-surface-light rounded-lg" />
                  ))}
                </div>
                <div className="h-40 bg-surface-light rounded-xl" />
              </div>
            </Container>
          </Section>
        </div>
        <Footer />
      </>
    );
  }

  if (!dossier) {
    return (
      <>
        <div>
          <Section padding="lg">
            <Container>
              <h1 className="font-display text-2xl font-bold text-text-primary uppercase">Dossier Not Found</h1>
              <p className="text-text-muted mt-2">
                This team dossier doesn&#39;t exist yet.{' '}
                <Link href="/intel/team-dossiers" className="text-burnt-orange hover:text-ember transition-colors">
                  Browse all dossiers &#8594;
                </Link>
              </p>
            </Container>
          </Section>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'Article',
          headline: `${dossier.name} ${dossier.mascot} — BSI Team Dossier`,
          author: { '@type': 'Person', name: 'Austin Humphrey' },
          publisher: { '@type': 'Organization', name: 'Blaze Sports Intel' },
          datePublished: '2026-02-17',
          url: `https://blazesportsintel.com/intel/team-dossiers/${dossier.slug}`,
        }}
      />
      <div>
        <Section padding="sm" className="border-b border-border">
          <Container>
            <Breadcrumb
              items={[
                { label: 'Intel', href: '/intel' },
                { label: 'Team Dossiers', href: '/intel/team-dossiers' },
                { label: dossier.name },
              ]}
            />
          </Container>
        </Section>

        <Section padding="lg">
          <Container>
            <TeamDossier dossier={dossier} />

            <div className="mt-12 max-w-3xl">
              <CiteWidget
                title={`${dossier.name} ${dossier.mascot} — BSI Team Dossier`}
                path={`/intel/team-dossiers/${dossier.slug}`}
                date="2026-02-17"
              />
            </div>

            <div className="mt-8 flex flex-wrap gap-4 text-sm text-text-muted">
              <Link href="/intel/team-dossiers" className="hover:text-text-secondary transition-colors">
                &#8592; All Dossiers
              </Link>
              <Link href={`/college-baseball/editorial/${dossier.slug.replace('-2026', '')}-2026`} className="hover:text-text-secondary transition-colors">
                Full {dossier.name} Preview &#8594;
              </Link>
            </div>
          </Container>
        </Section>
      </div>
      <Footer />
    </>
  );
}
