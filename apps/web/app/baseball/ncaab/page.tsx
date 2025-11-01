import type { Metadata } from 'next';
import Link from 'next/link';
import { getNcaabScoreboard } from '@/lib/baseball/scoreboard';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'NCAA D1 Baseball Scoreboard',
  description:
    'Live NCAA Division I college baseball scoreboard with conference filters, Top 25 focus, and Diamond Pro win probability cues updated every minute.',
};

type SearchParams = Record<string, string | string[] | undefined>;

type PageProps = {
  searchParams?: Promise<SearchParams>;
};

const timeFormatter = new Intl.DateTimeFormat('en-US', {
  hour: 'numeric',
  minute: '2-digit',
  timeZone: 'America/Chicago',
});

function formatStatus(status: 'scheduled' | 'live' | 'final', startTimeISO: string) {
  switch (status) {
    case 'live':
      return { label: 'Live', className: 'bg-brand-crimson/20 text-brand-gold' };
    case 'final':
      return { label: 'Final', className: 'bg-emerald-500/20 text-emerald-300' };
    default:
      return {
        label: `First pitch ${timeFormatter.format(new Date(startTimeISO))} CT`,
        className: 'bg-white/5 text-slate-200',
      };
  }
}

function ordinal(value: number) {
  const modulo = value % 100;
  if (modulo >= 11 && modulo <= 13) {
    return `${value}th`;
  }
  switch (value % 10) {
    case 1:
      return `${value}st`;
    case 2:
      return `${value}nd`;
    case 3:
      return `${value}rd`;
    default:
      return `${value}th`;
  }
}

function BasesDiagram({ runners }: { runners?: ('1B' | '2B' | '3B')[] }) {
  const active = new Set(runners ?? []);
  const cellClasses = 'flex h-8 w-8 items-center justify-center rounded-md border border-white/10 text-[0.65rem] font-semibold';
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="grid grid-cols-3 gap-1">
        <div />
        <div className={`${cellClasses} ${active.has('2B') ? 'bg-brand-gold text-brand-slate' : 'bg-white/5 text-slate-400'}`}>2B</div>
        <div />
        <div className={`${cellClasses} ${active.has('3B') ? 'bg-brand-gold text-brand-slate' : 'bg-white/5 text-slate-400'}`}>3B</div>
        <div className="flex h-8 w-8 items-center justify-center text-xs text-slate-400">◢</div>
        <div className={`${cellClasses} ${active.has('1B') ? 'bg-brand-gold text-brand-slate' : 'bg-white/5 text-slate-400'}`}>1B</div>
      </div>
      <span className="text-[0.65rem] uppercase tracking-wider text-slate-400">Base State</span>
    </div>
  );
}

function MetricCard({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="card-surface flex flex-col gap-1 rounded-2xl border border-white/10 px-4 py-3">
      <span className="text-xs uppercase tracking-wider text-slate-400">{label}</span>
      <span className={`text-2xl font-semibold text-white ${accent ?? ''}`}>{value}</span>
    </div>
  );
}

function FilterPill({
  label,
  isActive,
  href,
}: {
  label: string;
  isActive: boolean;
  href: string;
}) {
  return (
    <Link
      href={href}
      className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
        isActive
          ? 'border-brand-gold bg-brand-gold/20 text-brand-gold'
          : 'border-white/10 bg-white/5 text-slate-200 hover:border-brand-gold/60 hover:text-brand-gold'
      } focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-gold`}
    >
      {label}
    </Link>
  );
}

function buildHref({
  conference,
  ranked,
  date,
}: {
  conference?: string;
  ranked?: boolean;
  date?: string;
}) {
  const params = new URLSearchParams();
  if (conference) {
    params.set('conference', conference);
  }
  if (ranked) {
    params.set('ranked', 'true');
  }
  if (date) {
    params.set('date', date);
  }
  const query = params.toString();
  return query ? `/baseball/ncaab?${query}` : '/baseball/ncaab';
}

function formatWinProbability(probability?: number) {
  if (probability === undefined) {
    return '—';
  }
  return `${Math.round(probability * 100)}%`;
}

function ScoreboardCard({ game }: { game: Awaited<ReturnType<typeof getNcaabScoreboard>>['games'][number] }) {
  const [away, home] = game.teams;
  const statusMeta = formatStatus(game.status, game.startTime);
  const isLive = game.status === 'live';
  const situation = game.situation;

  return (
    <article className="card-surface flex flex-col gap-4 p-4 sm:p-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-wider text-slate-300">
          <span className="rounded-full border border-white/10 px-3 py-1">{game.conference}</span>
          {game.isConferenceGame ? <span className="rounded-full border border-brand-gold px-3 py-1 text-brand-gold">League</span> : null}
          {game.isRankedMatchup ? (
            <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-slate-200">Top 25</span>
          ) : null}
        </div>
        <span className={`inline-flex items-center justify-center rounded-full px-3 py-1 text-xs font-semibold ${statusMeta.className}`}>
          {statusMeta.label}
        </span>
      </header>

      <div className="space-y-4">
        {[away, home].map((team, index) => (
          <div key={team.id} className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/5 text-sm font-semibold text-white">
                {team.abbreviation}
              </div>
              <div>
                <p className="text-base font-semibold text-white">
                  {team.rank ? `#${team.rank} ` : ''}
                  {team.shortName}
                </p>
                <p className="text-xs text-slate-400">{team.record}</p>
                <p className="text-[0.65rem] uppercase tracking-wider text-slate-500">{index === 0 ? 'Away' : 'Home'}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-white">{team.score}</p>
              <p className="text-[0.7rem] uppercase tracking-wide text-slate-400">H {team.hits} • E {team.errors}</p>
            </div>
          </div>
        ))}
      </div>

      {isLive && situation ? (
        <div className="grid gap-4 rounded-2xl border border-white/10 bg-black/30 p-4 sm:grid-cols-2">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-wider text-slate-400">Inning</p>
            <p className="text-lg font-semibold text-white">{`${situation.half} ${ordinal(situation.inning)}`}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-wider text-slate-400">Pitch Count</p>
            <p className="text-lg font-semibold text-white">{situation.pitchCount}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-wider text-slate-400">Count</p>
            <p className="text-lg font-semibold text-white">{`${situation.balls}-${situation.strikes}, ${situation.outs} out${situation.outs === 1 ? '' : 's'}`}</p>
          </div>
          <div className="flex flex-col items-center justify-center gap-2">
            <BasesDiagram runners={situation.runners} />
            <p className="text-xs text-slate-400">Home Win%: {formatWinProbability(situation.winProbabilityHome)}</p>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-slate-300">
          <span>First pitch {timeFormatter.format(new Date(game.startTime))} CT</span>
          <span>{game.venue}</span>
        </div>
      )}

      {game.note ? <p className="text-xs text-brand-gold">{game.note}</p> : null}
    </article>
  );
}

async function ScoreboardContent({ searchParams }: { searchParams: SearchParams }) {
  const conferenceParam = searchParams.conference;
  const rankedParam = searchParams.ranked;
  const dateParam = searchParams.date;

  const conference = Array.isArray(conferenceParam)
    ? conferenceParam.at(0) ?? undefined
    : typeof conferenceParam === 'string'
      ? conferenceParam
      : undefined;
  const ranked = Array.isArray(rankedParam)
    ? rankedParam.includes('true')
    : rankedParam === 'true';
  const date = Array.isArray(dateParam)
    ? dateParam.at(0)
    : typeof dateParam === 'string'
      ? dateParam
      : undefined;

  const scoreboard = await getNcaabScoreboard({
    conference,
    rankedOnly: ranked,
    date,
  });

  const lastUpdated = new Date(scoreboard.lastUpdated);
  const relativeUpdated = lastUpdated.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  });

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-6">
        <header className="flex flex-col gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-brand-gold">NCAA Division I</p>
            <h1 className="text-3xl font-serif text-white sm:text-4xl">College Baseball Scoreboard</h1>
            <p className="text-sm text-slate-300">{scoreboard.date} • Updated {relativeUpdated}</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-4">
            <MetricCard label="Games" value={String(scoreboard.metrics.totalGames)} />
            <MetricCard label="Live" value={String(scoreboard.metrics.liveGames)} accent="text-brand-gold" />
            <MetricCard label="Ranked" value={String(scoreboard.metrics.rankedMatchups)} />
            <MetricCard label="Conferences" value={String(scoreboard.metrics.conferences)} />
          </div>
        </header>

        <div className="flex flex-wrap items-center gap-3">
          <FilterPill label="All conferences" href={buildHref({ ranked, date })} isActive={!conference} />
          {scoreboard.conferences.map((item) => (
            <FilterPill
              key={item}
              label={item}
              href={buildHref({ conference: item, ranked, date })}
              isActive={conference?.toLowerCase() === item.toLowerCase()}
            />
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <FilterPill label="Full slate" href={buildHref({ conference, date })} isActive={!ranked} />
          <FilterPill label="Top 25 focus" href={buildHref({ conference, ranked: true, date })} isActive={ranked} />
        </div>
      </section>

      <section className="grid gap-6">
        {scoreboard.games.length === 0 ? (
          <div className="card-surface flex flex-col items-center justify-center gap-3 p-8 text-center text-slate-300">
            <p className="text-lg font-semibold text-white">No games match this filter.</p>
            <p className="text-sm text-slate-400">Try selecting a different conference or switch back to the full slate.</p>
          </div>
        ) : (
          scoreboard.games.map((game) => <ScoreboardCard key={game.id} game={game} />)
        )}
      </section>
    </div>
  );
}

export default async function NcaabScoreboardPage({ searchParams }: PageProps) {
  const resolvedParams = (await searchParams) ?? {};

  return <ScoreboardContent searchParams={resolvedParams} />;
}
