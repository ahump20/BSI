// ─── Featured Team Insights ──────────────────────────────────────────────────
// Static scouting analysis for featured teams, populated from verified sources.
// Keyed by teamId (slug). Only teams with editorial depth get entries here.
// This is NOT dynamic data — update manually when new stats are available.

export interface FeaturedTeamInsight {
  teamId: string;
  lastUpdated: string;
  snapshot: string;
  whatToWatch: string[];
  offenseAnalysis: {
    headline: string;
    indicators: { label: string; value: string; context: string }[];
    narrative: string;
  };
  pitchingAnalysis: {
    headline: string;
    indicators: { label: string; value: string; context: string }[];
    narrative: string;
  };
  defenseBaserunning: {
    headline: string;
    indicators: { label: string; value: string; context: string }[];
  };
  strengths: string[];
  pressurePoints: string[];
  keyContributors: {
    name: string;
    role: string;
    statLine: string;
    scoutingSentence: string;
  }[];
  coachingContext: string;
  programContext: string;
  dataProvenance: {
    sources: { name: string; date: string }[];
    notAvailable: string[];
  };
}

export const featuredTeamInsights: Record<string, FeaturedTeamInsight> = {
  texas: {
    teamId: 'texas',
    lastUpdated: '2026-02-26',
    snapshot:
      '8-0 through four series (UC Davis, Lamar, Michigan State, UTRGV). The Longhorns are hitting .340 as a team with a 1.36 ERA — outscoring opponents 70-13 with a +57 run differential. The pitching staff has not allowed a home run in 66 innings.',

    whatToWatch: [
      'Dylan Volantis moved from closer to starter — 0.00 ERA in 14 IP with 17 K. The conversion has been seamless.',
      'BB/K ratio of 0.98 (50 BB vs 51 K) — this lineup almost never chases. That discipline matters when SEC pitching arrives.',
      'Zero home runs allowed in 66 IP. Elite, but untested against power-heavy SEC lineups.',
      'First SEC series: Ole Miss at home, March 13-15. That weekend answers the real questions.',
    ],

    offenseAnalysis: {
      headline: '.340/.452/.573 — the deepest lineup in college baseball',
      indicators: [
        { label: 'Team BA', value: '.340', context: '86 H in 253 AB across 8 games' },
        { label: 'OBP', value: '.452', context: '50 BB + 86 H — on base nearly half the time' },
        { label: 'SLG', value: '.573', context: '18 2B, 4 3B, 11 HR — ISO .233' },
        { label: 'OPS', value: '1.025', context: 'Program-wide on-base + power' },
        { label: 'BB/K', value: '0.98', context: '50 BB to 51 K — elite approach' },
        { label: 'Runs/G', value: '8.75', context: '70 R in 8 GP' },
      ],
      narrative:
        'This is a lineup that manufactures runs without relying on the long ball. The BB/K ratio near 1.00 is the signature — this team rarely gives away at-bats. Mendoza (.448), Pack Jr. (.435), and Robbins (.419) sit atop a lineup where the 7-8-9 hitters are still hitting .250+. The power is distributed: Robbins (3 HR, .452 ISO), Mendoza (3 HR), and Tinney (3 HR) all drive the ball. Stolen bases at 82.4% (14-17) show controlled aggression on the basepaths.',
    },

    pitchingAnalysis: {
      headline: '1.36 ERA, 0 HR allowed — dominant but untested',
      indicators: [
        { label: 'ERA', value: '1.36', context: '10 ER in 66 IP' },
        { label: 'WHIP', value: '0.909', context: '39 H + 21 BB allowed' },
        { label: 'K/9', value: '11.32', context: '83 K in 66 IP' },
        { label: 'BB/9', value: '2.86', context: '21 BB — controlled walks' },
        { label: 'K/BB', value: '3.95', context: '83 K to 21 BB' },
        { label: 'Opp BA', value: '.171', context: '39 H on 228 AB faced' },
      ],
      narrative:
        'Volantis (0.00 ERA, 17 K in 14 IP) moved from closer to starter and has been unhittable. Riojas (1.64 ERA, 15.55 K/9, 9.5 K/BB ratio) is the most dominant reliever on the staff. Cozart (1.12 ERA, 13.50 K/9 as a freshman) shows the pitching pipeline is producing. The zero home runs allowed stat is striking but comes against non-power lineups — UC Davis, Lamar, Michigan State, and UTRGV are not SEC-caliber. The real test is March.',
    },

    defenseBaserunning: {
      headline: '.985 FLD%, 82.4% SB rate',
      indicators: [
        { label: 'FLD%', value: '.985', context: '4 E in 269 TC' },
        { label: 'DP', value: '7', context: 'Double plays turned in 8 games' },
        { label: 'SB%', value: '82.4%', context: '14-17 on steal attempts' },
        { label: 'R Diff', value: '+57', context: '70 scored, 13 allowed' },
      ],
    },

    strengths: [
      'Lineup depth 1 through 8 — no free outs in the order',
      'Pitching staff has not allowed a HR in 66 innings',
      'Plate discipline: BB/K near 1.00 is elite at any level',
      'Coaching staff depth (Schlossnagle, Weiner, Tulowitzki, Cain)',
      'Portal additions already producing (Becerra .308, Burns 9 K in 3.2 IP)',
    ],

    pressurePoints: [
      'Schedule so far: UC Davis, Lamar, Michigan State, UTRGV — no power programs',
      'Zero conference games played; SEC pitching will be a different animal',
      'No pitch tracking or batted-ball data available yet — can\'t assess swing quality',
      'Pythagorean W% of .966 will regress; the question is how far',
      'Volantis transition from closer to starter is working but untested in weekend series grind',
    ],

    keyContributors: [
      {
        name: 'Ethan Mendoza',
        role: 'INF, Jr.',
        statLine: '.448/.526/.793, 3 HR, 10 RBI, ISO .345',
        scoutingSentence: 'Southlake Carroll product hitting cleanup. Second-Team All-Region last year at .333 — the jump to .448 with power (.345 ISO) is the biggest development on the roster.',
      },
      {
        name: 'Jaxon Pack Jr.',
        role: 'OF, Fr. (L/L)',
        statLine: '.435/.567/.696, 1 HR, 6 BB',
        scoutingSentence: 'Left-handed freshman from Millikan HS (Long Beach). 2024 PG All-American. The .567 OBP as a true freshman is the number — he controls the strike zone like a junior.',
      },
      {
        name: 'Cameron Robbins',
        role: 'OF, Jr.',
        statLine: '.419/.486/.871, 3 HR, 11 RBI, ISO .452',
        scoutingSentence: 'The power leader. .452 ISO means he\'s doing damage when he makes contact. 11 RBI in 8 games with 3 HR — he\'s driving the ball to all fields.',
      },
      {
        name: 'Kash Tinney',
        role: 'C, Jr.',
        statLine: '.304/.529/.739, 3 HR, 11 BB / 9 K',
        scoutingSentence: 'Notre Dame transfer. NCBWA D5 Preseason Player of the Year. The 11 BB to 9 K ratio from the catcher spot is the number that matters — elite discipline plus power.',
      },
      {
        name: 'Dylan Volantis',
        role: 'LHP, So.',
        statLine: '0.00 ERA, 14.0 IP, 17 K, 2 BB, 2-0',
        scoutingSentence: 'SEC Freshman of the Year as a closer last spring (1.94 ERA, 12 saves). Moved to the rotation and has been untouchable — 0.00 ERA with 10.93 K/9. The stuff plays anywhere.',
      },
      {
        name: 'Charlie Riojas',
        role: 'RHP, Jr.',
        statLine: '1.64 ERA, 11.0 IP, 19 K, 2 BB',
        scoutingSentence: 'K/BB ratio of 9.5 — 19 strikeouts against 2 walks. At 15.55 K/9 he\'s the most dominant arm in the bullpen by rate stats.',
      },
      {
        name: 'Ty Cozart',
        role: 'RHP, Fr.',
        statLine: '1.12 ERA, 8.0 IP, 12 K, .148 opp BA, 2-0',
        scoutingSentence: 'Freshman right-hander with a 13.50 K/9. Opponents hitting .148 against him through 4 starts. The pitching pipeline is producing.',
      },
      {
        name: 'Temo Becerra',
        role: 'INF, R-Sr.',
        statLine: '.308/.455/.423, 22 assists at SS',
        scoutingSentence: 'Stanford transfer who played in a CWS. The 22 assists at shortstop in 8 games is the defensive anchor number — range and arm are both SEC-ready.',
      },
    ],

    coachingContext:
      'Schlossnagle (990-469 career, .679 W%) won the SEC outright in Year One after being picked 8th. The staff is stacked: Weiner (ex-Seattle Mariners pitching coordinator, Forbes 30 Under 30) runs a "Dominate The Zone" system that shows in the 11.32 K/9; Tulowitzki (5x MLB All-Star, Gold Glove, Silver Slugger) coaches infielders; Cain (recruited 8 top-10 classes at LSU) runs recruiting. ABCA Hall of Fame inductee in 2025.',

    programContext:
      '6 national championships (1949, 1950, 1975, 1983, 2002, 2005). 38 CWS appearances — the most in college baseball history. 88 CWS wins. 14 College Baseball Hall of Famers. UFCU Disch-Falk Field seats 7,373 on FieldTurf. 2025: Went 44-14 (22-8 SEC), won the conference in their inaugural season after being picked 8th in the preseason poll.',

    dataProvenance: {
      sources: [
        { name: 'Texas Season Stats (8 GP)', date: 'February 24, 2026' },
        { name: '2026 Texas Baseball Media Guide', date: 'February 2026' },
      ],
      notAvailable: [
        'Pitch tracking / batted-ball data (exit velo, launch angle, spin rate)',
        'Defensive metrics beyond FLD% (no DRS, UZR, OAA)',
        'Conference-only splits (0 SEC games played)',
        'Opponent-strength-adjusted stats (early schedule: UC Davis, Lamar, MSU, UTRGV)',
      ],
    },
  },
};

/** Retrieve featured insight for a team, or null if none exists */
export function getFeaturedInsight(teamId: string): FeaturedTeamInsight | null {
  return featuredTeamInsights[teamId] ?? null;
}
