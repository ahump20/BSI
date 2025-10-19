'use client';

import { useMemo, useState } from 'react';
import { SportSwitcher } from '../../components/SportSwitcher';

type ViewKey = 'scores' | 'standings' | 'stats';

type ScoreCard = {
  id: string;
  status: 'Final' | 'Live - 2nd Half' | string;
  home: {
    name: string;
    score: number;
    isWinner?: boolean;
  };
  away: {
    name: string;
    score: number;
    isWinner?: boolean;
  };
  venue: string;
  detail: string;
};

type StandingRow = {
  rank: number;
  team: string;
  conference: string;
  overall: string;
  gamesBack: string;
};

type ConferenceTable = {
  id: string;
  name: string;
  rows: StandingRow[];
};

type PlayerStat = {
  id: string;
  name: string;
  team: string;
  ppg: number;
  rpg: number;
  apg: number;
};

const SCORES: ScoreCard[] = [
  {
    id: 'uk-ut',
    status: 'Final',
    home: { name: 'Tennessee', score: 82, isWinner: true },
    away: { name: 'Kentucky', score: 78 },
    venue: 'Thompson-Boling Arena',
    detail: 'October 15, 2025'
  },
  {
    id: 'duke-unc',
    status: 'Live - 2nd Half',
    home: { name: 'North Carolina', score: 48 },
    away: { name: 'Duke', score: 45 },
    venue: 'Dean Smith Center',
    detail: '12:43 2H'
  },
  {
    id: 'ku-texas',
    status: 'Final',
    home: { name: 'Texas', score: 85 },
    away: { name: 'Kansas', score: 89, isWinner: true },
    venue: 'Moody Center',
    detail: 'October 15, 2025'
  }
];

const CONFERENCES: ConferenceTable[] = [
  {
    id: 'sec',
    name: 'SEC',
    rows: [
      { rank: 1, team: 'Tennessee', conference: '12-2', overall: '18-3', gamesBack: '-' },
      { rank: 2, team: 'Kentucky', conference: '11-3', overall: '17-4', gamesBack: '1.0' },
      { rank: 3, team: 'Auburn', conference: '10-4', overall: '16-5', gamesBack: '2.0' },
      { rank: 4, team: 'Texas A&M', conference: '9-5', overall: '15-6', gamesBack: '3.0' }
    ]
  },
  {
    id: 'big12',
    name: 'Big 12',
    rows: [
      { rank: 1, team: 'Kansas', conference: '11-2', overall: '18-3', gamesBack: '-' },
      { rank: 2, team: 'Houston', conference: '10-3', overall: '17-4', gamesBack: '1.0' },
      { rank: 3, team: 'Baylor', conference: '9-4', overall: '16-5', gamesBack: '2.0' },
      { rank: 4, team: 'Texas', conference: '8-5', overall: '15-6', gamesBack: '3.0' }
    ]
  }
];

const TOP_PLAYERS: PlayerStat[] = [
  { id: '1', name: 'Dalton Knecht', team: 'Tennessee', ppg: 22.4, rpg: 5.8, apg: 3.1 },
  { id: '2', name: 'Reed Sheppard', team: 'Kentucky', ppg: 19.6, rpg: 4.3, apg: 5.5 },
  { id: '3', name: 'Jared McCain', team: 'Duke', ppg: 18.2, rpg: 4.9, apg: 4.1 }
];

export default function BasketballExperiencePage() {
  const [view, setView] = useState<ViewKey>('scores');

  const heroCopy = useMemo(() => {
    switch (view) {
      case 'standings':
        return 'Conference race snapshots built for tournament seeding debates.';
      case 'stats':
        return 'Tracking impact players poised for March dominance.';
      default:
        return 'Real-time SEC & ACC action with blazing-fast context.';
    }
  }, [view]);

  return (
    <div className="relative flex min-h-screen flex-col">
      <header className="border-b border-border/60 bg-surface/70 px-6 py-10">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🏀</span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.4em] text-accent">Diamond Insights</p>
              <h1 className="text-3xl font-semibold tracking-tight">NCAA Basketball Intelligence</h1>
            </div>
          </div>
          <nav className="flex flex-wrap gap-2">
            {([
              { key: 'scores', label: 'Scores' },
              { key: 'standings', label: 'Standings' },
              { key: 'stats', label: 'Stats' }
            ] satisfies Array<{ key: ViewKey; label: string }>).map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setView(item.key)}
                className={`rounded-full border px-4 py-2 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                  view === item.key
                    ? 'border-accent/80 bg-accent/10 text-foreground'
                    : 'border-border/60 text-muted hover:border-accent/50 hover:text-foreground'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-6 py-10">
        <section className="card flex flex-col gap-3 px-8 py-10">
          <h2 className="text-xl font-semibold">{heroCopy}</h2>
          <p className="text-sm text-muted">
            BlazeSportsIntel keeps the hoops community dialed into pace, space, and recruiting trends with a mobile-first, dark-
            mode native layout.
          </p>
        </section>

        {view === 'scores' && (
          <section className="space-y-6">
            <h3 className="text-lg font-semibold">Live Scores</h3>
            <div className="grid gap-6 md:grid-cols-2">
              {SCORES.map((game) => (
                <article key={game.id} className="card flex flex-col gap-4 px-6 py-6">
                  <div className="flex items-center justify-between">
                    <span
                      className={`status-pill ${
                        game.status.toLowerCase().includes('live') ? 'status-live' : 'status-final'
                      }`}
                    >
                      {game.status}
                    </span>
                    <span className="text-xs text-muted">{game.venue}</span>
                  </div>

                  <div className="flex items-center justify-between text-2xl font-semibold">
                    <span>{game.away.name}</span>
                    <span>{game.away.score}</span>
                  </div>
                  <div className="flex items-center justify-between text-2xl font-semibold">
                    <span className={game.home.isWinner ? 'text-accent' : ''}>{game.home.name}</span>
                    <span>{game.home.score}</span>
                  </div>

                  <p className="text-xs text-muted">{game.detail}</p>
                </article>
              ))}
            </div>
          </section>
        )}

        {view === 'standings' && (
          <section className="space-y-6">
            <h3 className="text-lg font-semibold">Conference Standings</h3>
            <div className="grid gap-6 md:grid-cols-2">
              {CONFERENCES.map((table) => (
                <div key={table.id} className="card overflow-hidden">
                  <div className="border-b border-border/50 bg-background/40 px-6 py-4">
                    <h4 className="text-base font-semibold">{table.name}</h4>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-border/40 text-sm">
                      <thead className="bg-background/40 text-xs uppercase tracking-wide text-muted">
                        <tr>
                          <th className="px-4 py-3 text-left">Team</th>
                          <th className="px-4 py-3 text-right">Conf</th>
                          <th className="px-4 py-3 text-right">Overall</th>
                          <th className="px-4 py-3 text-right">GB</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/30">
                        {table.rows.map((row) => (
                          <tr key={`${table.id}-${row.rank}`}>
                            <td className="px-4 py-3 text-left">
                              <span className="mr-3 inline-flex h-6 w-6 items-center justify-center rounded-full bg-accent/10 text-xs font-semibold text-accent">
                                {row.rank}
                              </span>
                              {row.team}
                            </td>
                            <td className="px-4 py-3 text-right">{row.conference}</td>
                            <td className="px-4 py-3 text-right">{row.overall}</td>
                            <td className="px-4 py-3 text-right">{row.gamesBack}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {view === 'stats' && (
          <section className="space-y-6">
            <h3 className="text-lg font-semibold">Impact Players</h3>
            <div className="grid gap-6 md:grid-cols-3">
              {TOP_PLAYERS.map((player) => (
                <article key={player.id} className="card flex flex-col gap-3 px-6 py-6">
                  <div>
                    <p className="text-sm text-muted">{player.team}</p>
                    <h4 className="text-xl font-semibold">{player.name}</h4>
                  </div>
                  <dl className="grid grid-cols-3 gap-3 text-center text-sm">
                    <div className="rounded-lg bg-background/40 px-3 py-2">
                      <dt className="text-xs uppercase text-muted">PPG</dt>
                      <dd className="text-lg font-semibold">{player.ppg.toFixed(1)}</dd>
                    </div>
                    <div className="rounded-lg bg-background/40 px-3 py-2">
                      <dt className="text-xs uppercase text-muted">RPG</dt>
                      <dd className="text-lg font-semibold">{player.rpg.toFixed(1)}</dd>
                    </div>
                    <div className="rounded-lg bg-background/40 px-3 py-2">
                      <dt className="text-xs uppercase text-muted">APG</dt>
                      <dd className="text-lg font-semibold">{player.apg.toFixed(1)}</dd>
                    </div>
                  </dl>
                </article>
              ))}
            </div>
          </section>
        )}
      </main>

      <SportSwitcher currentSport="basketball" />
    </div>
  );
}
