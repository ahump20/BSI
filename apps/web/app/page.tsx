import Link from 'next/link';

type ScoredTeam = {
  name: string;
  rank?: number;
  record: string;
  scoreByInning: string[];
  total: number;
};

type ProjectedTeam = {
  name: string;
  rank?: number;
  record: string;
  projectedStarter: string;
};

type LiveGame = {
  id: string;
  conference: string;
  status: string;
  inning: string;
  venue: string;
  startTime: string;
  awayTeam: ScoredTeam | ProjectedTeam;
  homeTeam: ScoredTeam | ProjectedTeam;
  keyMoment: string;
};

const scoreboardGames: LiveGame[] = [
  {
    id: 'lsu-vs-tennessee',
    conference: 'SEC',
    status: 'Final',
    inning: 'F/11',
    venue: 'Hoover Metropolitan Stadium',
    startTime: '7:05 PM CT',
    awayTeam: {
      name: 'LSU Tigers',
      rank: 4,
      record: '18-4',
      scoreByInning: ['0', '1', '1', '0', '2', '0', '0', '0', '1', '0', '2'],
      total: 7
    },
    homeTeam: {
      name: 'Tennessee Volunteers',
      rank: 2,
      record: '19-3',
      scoreByInning: ['1', '0', '0', '2', '0', '1', '0', '1', '0', '1', '0'],
      total: 6
    },
    keyMoment: 'LSU closer J. Guidry stranded the tying run with a 97 mph riding fastball.'
  },
  {
    id: 'wake-forest-vs-unc',
    conference: 'ACC',
    status: 'Top 7 • Live',
    inning: 'T7',
    venue: 'Boshamer Stadium',
    startTime: '5:30 PM ET',
    awayTeam: {
      name: 'Wake Forest Demon Deacons',
      rank: 6,
      record: '16-5',
      scoreByInning: ['1', '0', '0', '0', '2', '1'],
      total: 4
    },
    homeTeam: {
      name: 'North Carolina Tar Heels',
      rank: 12,
      record: '15-6',
      scoreByInning: ['0', '1', '0', '2', '0', '0'],
      total: 3
    },
    keyMoment: 'Wake Forest righty M. Johnson has 11 Ks through 6.0 IP (34% CSW).'
  },
  {
    id: 'arizona-vs-asu',
    conference: 'Pac-12',
    status: 'First Pitch 8:10 PM MT',
    inning: 'PRE',
    venue: 'Phoenix Municipal Stadium',
    startTime: '8:10 PM MT',
    awayTeam: {
      name: 'Arizona Wildcats',
      rank: 18,
      record: '14-7',
      projectedStarter: 'LHP T. Collins (2.12 ERA)'
    },
    homeTeam: {
      name: 'Arizona State Sun Devils',
      rank: 23,
      record: '13-8',
      projectedStarter: 'RHP D. Martinez (31% whiff rate)'
    },
    keyMoment: 'Diamond Pro model favors ASU 54% with bullpen edge (1.9 leverage WAR).'
  }
];

const featureHighlights = [
  {
    title: 'Diamond Pro Live Layer',
    description:
      'Sub-minute pitch ingestion with win probability, leverage index, and base-out state forecasting tuned for SEC and ACC rhythms.'
  },
  {
    title: 'Health & Durability Signals',
    description:
      'Track elbow valgus stress, hip-shoulder separation, and recovery flags pulled from wearable + in-game data before attrition hits.'
  },
  {
    title: 'Recruiting & Portal Tracker',
    description:
      'Unified board across 302 D-I rosters with momentum scoring, contact periods, and Diamond Pro-only video validation.'
  }
];

const pipelineChecks = [
  {
    label: 'Pitch-to-Insight Latency',
    value: '41s',
    context: 'Edge worker ingestion with Redis hot cache (TTL 60s max).'
  },
  {
    label: 'Secure Data Coverage',
    value: '28 conferences',
    context: 'Verified feeds for all Power 5 + top mid-majors; fallback scrapers on deck.'
  },
  {
    label: 'Diamond Pro Retention',
    value: '92%',
    context: 'Annualized renewal rate across coaching staffs + collectives.'
  }
];

const bottomNav = [
  { label: 'Scores', href: '/games' },
  { label: 'Teams', href: '/baseball/ncaab/teams' },
  { label: 'Portal', href: '/recruiting/portal' },
  { label: 'Account', href: '/account' }
];

function formatTeamDescriptor(team: ScoredTeam | ProjectedTeam) {
  const prefix = team.rank ? `No. ${team.rank} ` : '';
  if ('projectedStarter' in team) {
    return `${prefix}${team.projectedStarter}`;
  }
  return `${prefix}${team.record}`;
}

function formatTeamLabel(team: ScoredTeam | ProjectedTeam) {
  return team.rank ? `No. ${team.rank} ${team.name}` : team.name;
}

export default function HomePage() {
  return (
    <>
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div>
            <span className="accent-pill mb-2">Standard over vibes</span>
            <p className="text-lg font-serif text-foreground">Blaze Sports Intel</p>
          </div>
          <nav className="hidden items-center gap-6 text-sm font-medium text-foreground-muted md:flex">
            <Link href="/games" className="hover:text-foreground">
              Live Games
            </Link>
            <Link href="/baseball/ncaab" className="hover:text-foreground">
              NCAA Hub
            </Link>
            <Link href="/recruiting" className="hover:text-foreground">
              Recruiting
            </Link>
            <Link href="/diamond-pro" className="text-accent hover:text-accent">
              Diamond Pro
            </Link>
          </nav>
        </div>
      </header>

      <main id="main-content" className="mx-auto flex max-w-6xl flex-col gap-10 px-4 pb-[calc(6rem+var(--safe-area-inset-bottom))] pt-10">
        <section className="card-surface overflow-hidden p-0">
          <div className="bg-surface-muted px-6 py-8">
            <span className="accent-pill mb-4">NCAA Division I Baseball</span>
            <h1 className="max-w-3xl font-serif text-4xl font-semibold leading-tight text-foreground">
              Mobile-first intelligence that keeps college dugouts a pitch ahead.
            </h1>
            <p className="mt-4 max-w-2xl text-base text-foreground-muted">
              Live win probability, pitch quality scores, and attrition alerts streamed through Cloudflare Workers. Diamond Pro subscribers gate premium modules while the public tier keeps fans informed without losing trust.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-4">
              <Link
                href="/request-access"
                className="rounded-md bg-accent px-6 py-3 text-sm font-semibold text-background transition hover:bg-accent/90"
              >
                Request Diamond Pro Access
              </Link>
              <Link href="/platform/architecture" className="text-sm font-semibold text-highlight">
                Review the architecture →
              </Link>
            </div>
          </div>
          <div className="grid gap-6 px-6 py-8 lg:grid-cols-[2fr,1fr]">
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs uppercase tracking-wide text-foreground-muted">
                <span>Scoreboard</span>
                <span>Updated 58 seconds ago</span>
              </div>
              <div className="space-y-4">
                {scoreboardGames.map((game) => (
                  <article key={game.id} className="card-surface border-border/50 bg-surface/80 p-6">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <div className="space-y-1">
                        <p className="text-xs uppercase tracking-[0.3em] text-accent-muted">{game.conference}</p>
                        <h2 className="text-xl font-semibold text-foreground">
                          {formatTeamLabel(game.awayTeam)} @ {formatTeamLabel(game.homeTeam)}
                        </h2>
                        <p className="text-sm text-foreground-muted">{game.venue} • {game.startTime}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="rounded-pill border border-accent/50 px-4 py-1 text-xs font-semibold text-accent">
                          {game.status}
                        </span>
                        <span className="text-sm text-foreground-muted">{game.inning}</span>
                      </div>
                    </div>

                    {'scoreByInning' in game.awayTeam && 'scoreByInning' in game.homeTeam ? (
                      <div className="mt-4 grid gap-3 text-sm md:grid-cols-2">
                        <div className="rounded-md bg-surface-muted/60 p-3">
                          <p className="text-foreground-muted">{formatTeamLabel(game.awayTeam)}</p>
                          <div className="mt-1 flex items-center justify-between">
                            <span className="text-2xl font-semibold text-foreground">{game.awayTeam.total}</span>
                            <span className="text-xs text-foreground-muted">{game.awayTeam.record}</span>
                          </div>
                          <p className="mt-2 text-xs uppercase tracking-wide text-foreground-muted">
                            {game.awayTeam.scoreByInning.join(' • ')}
                          </p>
                        </div>
                        <div className="rounded-md bg-surface-muted/60 p-3">
                          <p className="text-foreground-muted">{formatTeamLabel(game.homeTeam)}</p>
                          <div className="mt-1 flex items-center justify-between">
                            <span className="text-2xl font-semibold text-foreground">{game.homeTeam.total}</span>
                            <span className="text-xs text-foreground-muted">{game.homeTeam.record}</span>
                          </div>
                          <p className="mt-2 text-xs uppercase tracking-wide text-foreground-muted">
                            {game.homeTeam.scoreByInning.join(' • ')}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-4 grid gap-3 text-sm md:grid-cols-2">
                        <div className="rounded-md bg-surface-muted/60 p-3">
                          <p className="text-foreground-muted">{formatTeamLabel(game.awayTeam)}</p>
                          <p className="mt-1 text-sm text-foreground-muted">{formatTeamDescriptor(game.awayTeam)}</p>
                        </div>
                        <div className="rounded-md bg-surface-muted/60 p-3">
                          <p className="text-foreground-muted">{formatTeamLabel(game.homeTeam)}</p>
                          <p className="mt-1 text-sm text-foreground-muted">{formatTeamDescriptor(game.homeTeam)}</p>
                        </div>
                      </div>
                    )}

                    <p className="mt-4 text-sm text-foreground">{game.keyMoment}</p>
                  </article>
                ))}
              </div>
            </div>
            <aside className="flex flex-col gap-4">
              <div className="card-surface bg-surface p-6">
                <h3 className="text-lg font-semibold text-foreground">Pipeline Integrity</h3>
                <p className="mt-2 text-sm text-foreground-muted">
                  Cloudflare Worker ingest, Prisma-backed Postgres, and Redis hot caches keep mobile updates sub-minute while respecting NCAA data rules.
                </p>
                <dl className="mt-4 space-y-3 text-sm">
                  {pipelineChecks.map((check) => (
                    <div key={check.label} className="rounded-md bg-surface-muted/60 px-3 py-3">
                      <dt className="text-foreground-muted">{check.label}</dt>
                      <dd className="text-lg font-semibold text-foreground">{check.value}</dd>
                      <p className="text-xs text-foreground-muted">{check.context}</p>
                    </div>
                  ))}
                </dl>
              </div>
              <div className="card-surface bg-surface p-6">
                <h3 className="text-lg font-semibold text-foreground">Diamond Pro Feature Map</h3>
                <ul className="mt-3 space-y-3 text-sm">
                  {featureHighlights.map((feature) => (
                    <li key={feature.title} className="rounded-md bg-surface-muted/60 p-3">
                      <p className="font-semibold text-foreground">{feature.title}</p>
                      <p className="text-foreground-muted">{feature.description}</p>
                    </li>
                  ))}
                </ul>
              </div>
            </aside>
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-3">
          <div className="card-surface bg-surface p-6">
            <p className="text-sm uppercase tracking-[0.28em] text-accent-muted">Coverage</p>
            <p className="mt-3 text-3xl font-semibold text-foreground">302</p>
            <p className="text-sm text-foreground-muted">Active Division I rosters tracked with granular lineup availability.</p>
          </div>
          <div className="card-surface bg-surface p-6">
            <p className="text-sm uppercase tracking-[0.28em] text-accent-muted">Latency</p>
            <p className="mt-3 text-3xl font-semibold text-foreground">{'<45s'}</p>
            <p className="text-sm text-foreground-muted">Median time from pitch ingestion to mobile scoreboard update.</p>
          </div>
          <div className="card-surface bg-surface p-6">
            <p className="text-sm uppercase tracking-[0.28em] text-accent-muted">Diamond Pro ROI</p>
            <p className="mt-3 text-3xl font-semibold text-foreground">8.2x</p>
            <p className="text-sm text-foreground-muted">Average staff efficiency gain measured across 14 partner programs.</p>
          </div>
        </section>

        <section className="card-surface grid gap-6 p-6 lg:grid-cols-[1.5fr,1fr]">
          <div>
            <p className="accent-pill mb-4">Always recruiting</p>
            <h2 className="font-serif text-3xl font-semibold text-foreground">Portal clarity without the rumor mill.</h2>
            <p className="mt-3 text-sm text-foreground-muted">
              Real-time transfer and high school board syncing into your staff workflow. Filter by position archetype, Trackman profiles, or GPA thresholds — then export to Diamond Pro for compliance-tagged outreach.
            </p>
            <ul className="mt-4 space-y-3 text-sm">
              <li className="flex items-start gap-3">
                <span className="mt-1 h-2 w-2 rounded-full bg-accent" aria-hidden="true" />
                <p>
                  <span className="font-semibold text-foreground">Verified contact cadence:</span> automatically logs last touch, coach owner, and quiet-period rules.
                </p>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 h-2 w-2 rounded-full bg-accent" aria-hidden="true" />
                <p>
                  <span className="font-semibold text-foreground">Video truthing pipeline:</span> Diamond Pro gate ensures every clip is sourced, licensed, and annotated before sharing.
                </p>
              </li>
            </ul>
          </div>
          <div className="rounded-lg bg-surface-muted/60 p-5 text-sm text-foreground-muted">
            <h3 className="text-lg font-semibold text-foreground">Compliance-first data flow</h3>
            <ol className="mt-3 list-decimal space-y-2 pl-5">
              <li>Ingestion worker normalizes NCAA + partner feeds (Cloudflare Cron).</li>
              <li>Prisma schema enforces sport-agnostic entities with baseball detail.</li>
              <li>Redis caches live pages while S3/R2 handles archive payloads.</li>
            </ol>
            <p className="mt-3">If any automated fact fails verification, we fall back to templated copy. Clarity beats noise.</p>
          </div>
        </section>
      </main>

      <nav
        className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/60 bg-surface/95 backdrop-blur md:hidden"
        aria-label="Primary"
      >
        <div className="mx-auto flex max-w-6xl justify-around px-6 py-4" style={{ paddingBottom: 'calc(1rem + var(--safe-area-inset-bottom))' }}>
          {bottomNav.map((item) => (
            <Link key={item.label} href={item.href} className="text-xs font-medium text-foreground-muted">
              {item.label}
            </Link>
          ))}
        </div>
      </nav>
    </>
  );
}
