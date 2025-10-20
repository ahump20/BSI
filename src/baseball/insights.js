const ORDINAL_SUFFIXES = ['th', 'st', 'nd', 'rd'];

function toNumber(value, fallback = 0) {
  const result = Number(value);
  return Number.isFinite(result) ? result : fallback;
}

function formatOrdinal(value) {
  const number = Math.max(0, Math.floor(value));
  const v = number % 100;
  if (v >= 11 && v <= 13) {
    return `${number}th`;
  }
  const suffix = ORDINAL_SUFFIXES[number % 10] ?? 'th';
  return `${number}${suffix}`;
}

function formatInning(inning, half) {
  const ordinal = formatOrdinal(inning);
  if (!half) {
    return ordinal;
  }
  const normalized = half.charAt(0).toUpperCase() + half.slice(1).toLowerCase();
  return `${normalized} ${ordinal}`;
}

function computePressureIndex({ inning, runDiff, baseRunners, outs, isLive }) {
  if (!isLive) {
    return 0;
  }

  const inningFactor = Math.min(inning, 9) / 9;
  const scoreFactor = 1 - Math.min(runDiff / 6, 1);
  const trafficFactor = Math.min(baseRunners / 3, 1);
  const outsPenalty = outs >= 2 ? 0.15 : outs === 1 ? 0.05 : 0;

  const raw = 0.45 * inningFactor + 0.4 * scoreFactor + 0.25 * trafficFactor - outsPenalty;
  return Math.max(0, Math.min(1, Number(raw.toFixed(2))));
}

function computeScoringPace({ totalRuns, inning }) {
  if (inning <= 0) {
    return 0;
  }
  const pace = totalRuns / inning;
  return Number(pace.toFixed(2));
}

function buildUniqueProperties({
  inning,
  inningHalf,
  isFinal,
  isLive,
  isScheduled,
  homeScore,
  awayScore,
  runDiff,
  totalRuns,
  startDetail,
}) {
  const properties = [];
  const signals = {
    highLeverage: false,
    longGame: false,
    slugfest: false,
    shutoutThreat: false,
    blowout: false,
  };

  const inningLabel = formatInning(inning, inningHalf);

  if (isScheduled) {
    properties.push({
      id: 'pregame-edge',
      title: 'Pregame Edge Briefing',
      description: `First pitch ${startDetail || 'time TBD'}. Track lineup cards and real-time win probabilities at go time.`,
    });
    return { properties, signals };
  }

  if (!isFinal && inning >= 10) {
    properties.push({
      id: 'extra-innings',
      title: 'Extra-Inning Pressure',
      description: `Heading into the ${inningLabel} with just a ${runDiff}-run margin.`,
    });
    signals.longGame = true;
  }

  if (isLive && inning >= 7 && runDiff <= 2) {
    const leader = homeScore === awayScore ? 'nobody' : homeScore > awayScore ? 'home side' : 'visitors';
    properties.push({
      id: 'high-leverage',
      title: 'Clutch Time Leverage',
      description: `${leader === 'nobody' ? 'Game tied' : `${leader} protecting a ${Math.max(runDiff, 1)}-run edge`} deep into the ${inningLabel}.`,
    });
    signals.highLeverage = true;
  }

  if (isLive && inning >= 6 && (homeScore === 0 || awayScore === 0)) {
    const team = homeScore === 0 ? 'Home lineup' : 'Visitors';
    properties.push({
      id: 'shutout-watch',
      title: 'Shutout Watch',
      description: `${team} still searching for their first run as the ${inningLabel} begins.`,
    });
    signals.shutoutThreat = true;
  }

  if (totalRuns >= 12 && inning <= 8) {
    properties.push({
      id: 'slugfest',
      title: 'Slugfest Pace',
      description: `Combined ${totalRuns} runs on the board by the ${formatOrdinal(inning)} inning.`,
    });
    signals.slugfest = true;
  }

  if (inning >= 5 && runDiff >= 7) {
    const leadingSide = homeScore > awayScore ? 'Home' : 'Road';
    properties.push({
      id: 'run-rule',
      title: 'Run-Rule Tracker',
      description: `${leadingSide} team leading by ${runDiff}. Mercy-rule scenarios are in play.`,
    });
    signals.blowout = true;
  }

  if (properties.length === 0 && isLive) {
    properties.push({
      id: 'steady-duel',
      title: 'Steady Duel',
      description: `Both dugouts trading blows through ${inningLabel}.`,
    });
  }

  if (isFinal) {
    if (totalRuns >= 12) {
      properties.push({
        id: 'final-slugfest',
        title: 'Final: Offense Explosion',
        description: `${totalRuns} runs logged when the dust settled.`,
      });
      signals.slugfest = true;
    }

    if (runDiff <= 2) {
      properties.push({
        id: 'final-one-run',
        title: 'Final: One-Run Margin',
        description: `Decided by a ${Math.max(runDiff, 1)}-run gap. Every late at-bat mattered.`,
      });
      signals.highLeverage = true;
    }

    if (runDiff >= 7) {
      properties.push({
        id: 'final-blowout',
        title: 'Final: Statement Win',
        description: `Separation by ${runDiff} runs. Coaches will reevaluate pitching usage.`,
      });
      signals.blowout = true;
    }

    if (properties.length === 0) {
      properties.push({
        id: 'final-report',
        title: 'Final Score Logged',
        description: `Box score closed after ${inningLabel}.`,
      });
    }
  }

  return { properties, signals };
}

export function deriveGameInsights(event) {
  const competition = event?.competitions?.[0] ?? null;
  const status = competition?.status ?? {};
  const situation = competition?.situation ?? {};
  const inning = toNumber(status?.period, 0) || toNumber(situation?.inning, 0);
  const inningHalf = typeof situation?.inningHalf === 'string' ? situation.inningHalf : null;
  const isFinal = Boolean(status?.type?.completed);
  const state = status?.type?.state ?? '';
  const isLive = state === 'in';
  const isScheduled = state === 'pre';

  const competitors = competition?.competitors ?? [];
  const home = competitors.find((team) => team.homeAway === 'home') ?? {};
  const away = competitors.find((team) => team.homeAway === 'away') ?? {};
  const homeScore = toNumber(home?.score, 0);
  const awayScore = toNumber(away?.score, 0);
  const runDiff = Math.abs(homeScore - awayScore);
  const totalRuns = homeScore + awayScore;

  const baseRunners = Array.isArray(situation?.baseRunners) ? situation.baseRunners.length : 0;
  const outs = toNumber(situation?.outs, 0);

  const pressureIndex = computePressureIndex({ inning, runDiff, baseRunners, outs, isLive });
  const scoringPace = computeScoringPace({ totalRuns, inning: Math.max(inning, 1) });
  const { properties, signals } = buildUniqueProperties({
    inning: Math.max(inning, 1),
    inningHalf,
    isFinal,
    isLive,
    isScheduled,
    homeScore,
    awayScore,
    runDiff,
    totalRuns,
    startDetail: status?.type?.shortDetail ?? status?.type?.detail ?? '',
  });

  return {
    properties,
    signals,
    meta: {
      inning,
      inningHalf,
      homeScore,
      awayScore,
      runDiff,
      totalRuns,
      baseRunners,
      outs,
      pressureIndex,
      scoringPace,
      state,
      isLive,
      isFinal,
      isScheduled,
    },
  };
}

export function summarizeUpgradeSignals(insights) {
  const summary = insights.reduce(
    (acc, insight) => {
      if (!insight) {
        return acc;
      }
      if (insight.signals.highLeverage) {
        acc.highLeverageGames += 1;
      }
      if (insight.signals.longGame) {
        acc.longGames += 1;
      }
      if (insight.signals.slugfest) {
        acc.slugfests += 1;
      }
      if (insight.signals.shutoutThreat) {
        acc.shutoutThreats += 1;
      }
      if (insight.signals.blowout) {
        acc.blowouts += 1;
      }
      if (insight.meta?.pressureIndex) {
        acc.avgPressure += insight.meta.pressureIndex;
        acc.pressureSamples += 1;
      }
      return acc;
    },
    {
      highLeverageGames: 0,
      longGames: 0,
      slugfests: 0,
      shutoutThreats: 0,
      blowouts: 0,
      avgPressure: 0,
      pressureSamples: 0,
    },
  );

  const avgPressure = summary.pressureSamples
    ? Number((summary.avgPressure / summary.pressureSamples).toFixed(2))
    : 0;

  const items = [
    {
      id: 'situational-model',
      title: 'Diamond Pro Situational Model',
      description:
        'Unlock pitch-by-pitch win probabilities, leverage scores, and momentum swings across every live game.',
      highlight: summary.highLeverageGames > 0 || summary.longGames > 0,
      badge:
        summary.highLeverageGames > 0
          ? `${summary.highLeverageGames} high-leverage game${summary.highLeverageGames > 1 ? 's' : ''}`
          : undefined,
      reason:
        summary.highLeverageGames > 0
          ? 'Tight late-inning battles detected. Model quantifies the swing for every pitch.'
          : 'Model every inning to anticipate turning points before they happen.',
    },
    {
      id: 'workload-guardian',
      title: 'Pitcher Workload Guardian',
      description:
        'Track pitch counts, rest windows, and fatigue signals to forecast bullpen availability.',
      highlight: summary.longGames > 0 || summary.slugfests > 0,
      badge:
        summary.longGames > 0
          ? `${summary.longGames} extra-inning grinder${summary.longGames > 1 ? 's' : ''}`
          : summary.slugfests > 0
            ? `${summary.slugfests} slugfest${summary.slugfests > 1 ? 's' : ''}`
            : undefined,
      reason:
        summary.longGames > 0
          ? 'Extended games stress pitching staffs. Monitor fatigue before velocity dips.'
          : 'Big run totals today — evaluate bullpen freshness before the nightcap.',
    },
    {
      id: 'zone-mapper',
      title: 'Umpire Zone Mapper',
      description:
        'Visualize personalized strike zones with chase rates and edge-call probabilities for every umpire.',
      highlight: summary.shutoutThreats > 0 || avgPressure >= 0.55,
      badge:
        summary.shutoutThreats > 0
          ? `${summary.shutoutThreats} shutout threat${summary.shutoutThreats > 1 ? 's' : ''}`
          : avgPressure >= 0.55
            ? `Avg leverage ${avgPressure}`
            : undefined,
      reason:
        summary.shutoutThreats > 0
          ? 'Zone tightening is squeezing offenses. Map edges to steal pitches.'
          : 'Pressure index trending high. Zone intel keeps at-bats alive.',
    },
  ];

  return { items, avgPressure };
}

export { formatInning };
