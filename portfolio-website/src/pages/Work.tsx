import { useState, useEffect } from 'react';
import BSIShowcase from '../components/BSIShowcase';
import AIFeatures from '../components/AIFeatures';
import PlatformStatus from '../components/PlatformStatus';

const BSI_BASE = 'https://blazesportsintel.com';

interface ScoresData {
  gameCount: number;
  teamCount: number;
}

function CollegeBaseballCard() {
  const [data, setData] = useState<ScoresData | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchScores() {
      try {
        const res = await fetch(`${BSI_BASE}/api/college-baseball/scores`, {
          signal: AbortSignal.timeout(8000),
        });
        if (!res.ok) return;
        const json = await res.json();
        if (cancelled || !json.data) return;

        const games = Array.isArray(json.data) ? json.data : [];
        const teams = new Set<string>();
        for (const game of games) {
          if (game.homeTeam?.name) teams.add(game.homeTeam.name);
          if (game.awayTeam?.name) teams.add(game.awayTeam.name);
          if (game.home_team) teams.add(game.home_team);
          if (game.away_team) teams.add(game.away_team);
        }

        setData({
          gameCount: games.length,
          teamCount: teams.size || 300,
        });
      } catch {
        // Scores unavailable — card renders with static content only
      }
    }

    fetchScores();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="card p-8 reveal">
      <div className="flex items-start justify-between mb-6">
        <div>
          <p className="section-label mb-2">// Flagship Coverage</p>
          <h3 className="font-sans font-semibold text-xl uppercase tracking-wider text-bone">
            College Baseball Analytics
          </h3>
        </div>
        <span className="text-xs font-mono bg-burnt-orange/10 text-burnt-orange border border-burnt-orange/20 px-3 py-1 rounded-full whitespace-nowrap">
          D1 Baseball
        </span>
      </div>

      <p className="text-warm-gray leading-relaxed mb-6">
        Deep analytical coverage of NCAA Division I baseball — scores, standings, rankings,
        team profiles, and editorial analysis. The sport mainstream media ignores at the depth
        it deserves.
      </p>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center">
          <p className="text-2xl font-bold font-sans text-burnt-orange">
            {data ? data.gameCount : '--'}
          </p>
          <p className="text-[0.65rem] font-mono text-warm-gray mt-1">Games Today</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold font-sans text-burnt-orange">50+</p>
          <p className="text-[0.65rem] font-mono text-warm-gray mt-1">Editorial Articles</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold font-sans text-burnt-orange">
            {data ? data.teamCount : '300+'}
          </p>
          <p className="text-[0.65rem] font-mono text-warm-gray mt-1">Teams Tracked</p>
        </div>
      </div>

      <a
        href="https://blazesportsintel.com/college-baseball"
        target="_blank"
        rel="noopener noreferrer"
        className="btn-outline text-center w-full block"
      >
        View College Baseball Hub
      </a>
    </div>
  );
}

export default function Work() {
  return (
    <>
      {/* Platform header */}
      <div className="section-padding pb-0">
        <div className="container-custom">
          <div className="flex items-center justify-between flex-wrap gap-4 mb-0">
            <div>
              <p className="section-label">// Work</p>
              <h1 className="section-title mb-0">BSI Platform</h1>
            </div>
            <PlatformStatus />
          </div>
        </div>
      </div>

      <BSIShowcase />

      {/* College Baseball project card */}
      <section className="section-padding section-border" aria-labelledby="cbb-heading">
        <div className="container-custom">
          <h2 id="cbb-heading" className="sr-only">College Baseball Analytics</h2>
          <div className="max-w-2xl mx-auto">
            <CollegeBaseballCard />
          </div>
        </div>
      </section>

      <AIFeatures />
    </>
  );
}
