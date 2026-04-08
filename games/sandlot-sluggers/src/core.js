export const SESSION_PHASES = Object.freeze({
  BOOT: "boot",
  HOME: "home",
  IDENTITY: "identity",
  MODE_SELECT: "mode-select",
  DIFFICULTY_SELECT: "difficulty-select",
  TEAM_SELECT: "team-select",
  PREGAME: "pregame",
  PITCH_READY: "pitch-ready",
  PITCH_FLIGHT: "pitch-flight",
  CONTACT_RESOLVE: "contact-resolve",
  BALL_IN_PLAY: "ball-in-play",
  PLATE_RESULT: "plate-result",
  INNING_BREAK: "inning-break",
  PAUSED: "paused",
  GAME_OVER: "game-over",
});

export const DIFFICULTY_PRESETS = Object.freeze({
  easy: Object.freeze({
    key: "easy",
    readyDelayMs: 1450,
    timingWindowMs: 105,
    contactRadiusMultiplier: 1.2,
    breakScaleMultiplier: 0.88,
    pitchSpeedMultiplier: 0.94,
  }),
  medium: Object.freeze({
    key: "medium",
    readyDelayMs: 1200,
    timingWindowMs: 85,
    contactRadiusMultiplier: 1,
    breakScaleMultiplier: 1,
    pitchSpeedMultiplier: 1,
  }),
  hard: Object.freeze({
    key: "hard",
    readyDelayMs: 950,
    timingWindowMs: 68,
    contactRadiusMultiplier: 0.85,
    breakScaleMultiplier: 1.14,
    pitchSpeedMultiplier: 1.06,
  }),
});

const TEAM_FALLBACK = Object.freeze({
  id: "sandlot",
  name: "Sandlot Sluggers",
  abbreviation: "SLG",
  conference: "Sandlot League",
  logoUrl: "",
  primaryColor: "#BF5700",
  secondaryColor: "#FFD700",
});

const DEFAULT_TEAM_RATINGS = Object.freeze({
  contactRating: 56,
  powerRating: 58,
  disciplineRating: 55,
  speedRating: 52,
  pitchingRating: 55,
});

const DEFAULT_HITTER_NAMES = [
  "Jet Ramirez",
  "Mason Cole",
  "Cruz Dalton",
  "Ty Walker",
  "Rhett Bishop",
  "Owen Vega",
  "Jace Mercer",
  "Noah Lane",
  "Brooks Harper",
];

const DEFAULT_POSITIONS = ["CF", "SS", "LF", "1B", "RF", "3B", "C", "2B", "DH"];

const MODE_TO_LEADERBOARD = Object.freeze({
  practice: "practice",
  quickPlay: "quick-play",
  hrDerby: "hr-derby",
  teamMode: "team-mode",
});

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function scale(value, inputMin, inputMax, outputMin, outputMax) {
  if (inputMax === inputMin) return outputMin;
  const ratio = clamp((value - inputMin) / (inputMax - inputMin), 0, 1);
  return outputMin + ratio * (outputMax - outputMin);
}

export function scaleInverse(value, inputHigh, inputLow, outputLow, outputHigh) {
  if (inputHigh === inputLow) return outputLow;
  const ratio = clamp((inputHigh - value) / (inputHigh - inputLow), 0, 1);
  return outputLow + ratio * (outputHigh - outputLow);
}

export function getDifficultyPreset(key) {
  return DIFFICULTY_PRESETS[key] ?? DIFFICULTY_PRESETS.medium;
}

export function normalizeLeaderboardMode(mode) {
  return MODE_TO_LEADERBOARD[mode] ?? "quick-play";
}

export function createSessionSeed(seed = Date.now()) {
  return (Number(seed) >>> 0) || 1;
}

export function createSeededRng(seed) {
  let value = createSessionSeed(seed);
  return () => {
    value = (value + 1831565813) | 0;
    let next = Math.imul(value ^ (value >>> 15), 1 | value);
    next = (next + Math.imul(next ^ (next >>> 7), 61 | next)) ^ next;
    return ((next ^ (next >>> 14)) >>> 0) / 4294967296;
  };
}

function toNumber(value, fallback = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function isPitcher(position = "") {
  const normalized = String(position).toUpperCase();
  return normalized === "P" || normalized === "RHP" || normalized === "LHP";
}

function normalizeTeamMeta(rawTeam, fallbackTeamId) {
  const team = rawTeam?.team ?? rawTeam ?? {};
  return {
    id: String(team.id ?? fallbackTeamId ?? TEAM_FALLBACK.id),
    name: team.name ?? TEAM_FALLBACK.name,
    abbreviation: team.abbreviation ?? team.abbr ?? TEAM_FALLBACK.abbreviation,
    conference: team.conference ?? team.conf ?? TEAM_FALLBACK.conference,
    logoUrl: team.logo ?? team.logoUrl ?? TEAM_FALLBACK.logoUrl,
    primaryColor:
      team.colors?.primary ?? team.primaryColor ?? team.color ?? TEAM_FALLBACK.primaryColor,
    secondaryColor:
      team.colors?.secondary ?? team.secondaryColor ?? team.altColor ?? TEAM_FALLBACK.secondaryColor,
  };
}

function getRosterEntries(rawTeam) {
  const team = rawTeam?.team ?? rawTeam ?? {};
  return rawTeam?.roster ?? team.roster ?? rawTeam?.players ?? [];
}

function getTeamStats(rawTeam) {
  const team = rawTeam?.team ?? rawTeam ?? {};
  return team.stats ?? rawTeam?.stats ?? {};
}

function normalizePlayerStats(rawPlayer) {
  const stats = rawPlayer?.stats ?? rawPlayer ?? {};
  return {
    avg: toNumber(stats.avg ?? stats.battingAvg, 0.25),
    obp: toNumber(stats.obp, 0.32),
    slg: toNumber(stats.slg, 0.42),
    ops: toNumber(stats.ops, 0.74),
    hr: toNumber(stats.hr ?? stats.homeRuns, 0),
    bb: toNumber(stats.bb ?? stats.walks, 0),
    k: toNumber(stats.k ?? stats.so ?? stats.strikeouts, 0),
    sb: toNumber(stats.sb ?? stats.stolenBases, 0),
    ab: toNumber(stats.ab ?? stats.atBats, 0),
    gp: toNumber(stats.gp ?? stats.gamesPlayed ?? stats.games, 1),
    rbi: toNumber(stats.rbi, 0),
  };
}

function computeHitterGameplay(stats) {
  const bbToK = clamp(stats.bb / Math.max(stats.k, 1), 0, 1);
  const disciplineMetric = 0.7 * (stats.obp - stats.avg) + 0.3 * bbToK;
  const sbPerGame = stats.gp > 0 ? stats.sb / stats.gp : 0;

  return {
    contactRating: Math.round(scale(stats.avg, 0.22, 0.34, 35, 90)),
    powerRating: Math.round(scale(stats.slg, 0.32, 0.62, 35, 90)),
    disciplineRating: Math.round(scale(disciplineMetric, 0.05, 0.18, 35, 90)),
    speedRating: Math.round(scale(sbPerGame, 0, 1.2, 40, 90)),
  };
}

function buildFallbackBatter(index) {
  const stats = {
    avg: 0.252 + index * 0.004,
    obp: 0.325 + index * 0.004,
    slg: 0.42 + index * 0.012,
    ops: 0.745 + index * 0.012,
    hr: index < 3 ? 1 : 0,
    bb: 6 + (index % 3),
    k: 10 + index,
    sb: index % 4,
    ab: 28,
    gp: 8,
    rbi: 5 + index,
  };
  return {
    id: `sandlot-${index + 1}`,
    name: DEFAULT_HITTER_NAMES[index] ?? `Sandlot ${index + 1}`,
    position: DEFAULT_POSITIONS[index] ?? "UT",
    number: String(index + 1),
    stats,
    gameplay: computeHitterGameplay(stats),
  };
}

function orderLineup(candidates) {
  const lineup = [];
  const used = new Set();

  const take = (sorted, count) => {
    for (const player of sorted) {
      if (used.has(player.id)) continue;
      lineup.push(player);
      used.add(player.id);
      if (lineup.length >= count) break;
    }
  };

  take(
    [...candidates].sort((left, right) => right.stats.obp - left.stats.obp || right.stats.avg - left.stats.avg),
    2,
  );
  take(
    [...candidates].sort((left, right) => right.stats.ops - left.stats.ops || right.stats.slg - left.stats.slg),
    4,
  );
  take(
    [...candidates].sort((left, right) => right.stats.slg - left.stats.slg || right.stats.hr - left.stats.hr),
    6,
  );
  take(
    [...candidates].sort((left, right) => {
      const leftSpeed = left.gameplay?.speedRating ?? 50;
      const rightSpeed = right.gameplay?.speedRating ?? 50;
      return right.stats.avg - left.stats.avg || rightSpeed - leftSpeed;
    }),
    9,
  );

  while (lineup.length < 9) {
    lineup.push(buildFallbackBatter(lineup.length));
  }

  return lineup.slice(0, 9);
}

function getPitcherArchetype(pitchingRating) {
  if (pitchingRating >= 70) {
    return {
      pitchMixProfile: ["Fastball", "Slider", "Curve", "Change-up"],
      pitchSpeedBand: { min: 88, max: 95 },
      pitchWeights: [34, 18, 20, 20, 8],
      speedMultiplier: 1.08,
      movementMultiplier: 1.18,
      zoneBias: "edge",
    };
  }
  if (pitchingRating >= 50) {
    return {
      pitchMixProfile: ["Fastball", "Slider", "Change-up"],
      pitchSpeedBand: { min: 86, max: 91 },
      pitchWeights: [40, 8, 24, 20, 8],
      speedMultiplier: 1,
      movementMultiplier: 1.04,
      zoneBias: "balanced",
    };
  }
  return {
    pitchMixProfile: ["Fastball", "Change-up"],
    pitchSpeedBand: { min: 84, max: 88 },
    pitchWeights: [56, 4, 10, 24, 6],
    speedMultiplier: 0.94,
    movementMultiplier: 0.92,
    zoneBias: "middle",
  };
}

function buildPitchingRating(teamStats) {
  const wins = toNumber(teamStats.wins, 1);
  const losses = toNumber(teamStats.losses, 0);
  const games = Math.max(wins + losses, 1);
  const era = toNumber(teamStats.era, 4.8);
  const runsAllowedPerGame = toNumber(teamStats.runsAllowed, 5.5 * games) / games;
  return Math.round(
    0.7 * scaleInverse(era, 7, 2.5, 35, 90) +
      0.3 * scaleInverse(runsAllowedPerGame, 9, 3, 35, 90),
  );
}

function buildFallbackRatingsFromTeamStats(teamStats) {
  const wins = toNumber(teamStats.wins, 1);
  const losses = toNumber(teamStats.losses, 0);
  const games = Math.max(wins + losses, 1);
  const battingAvg = toNumber(teamStats.battingAvg, 0.255);
  const runsScoredPerGame = toNumber(teamStats.runsScored, 5.2 * games) / games;
  return {
    contactRating: Math.round(scale(battingAvg, 0.22, 0.34, 35, 90)),
    powerRating: Math.round(scale(runsScoredPerGame, 3, 10, 35, 90)),
    disciplineRating: 55,
    speedRating: 50,
    pitchingRating: buildPitchingRating(teamStats),
  };
}

function summarizeLineupRatings(lineup) {
  const totals = lineup.reduce(
    (accumulator, batter) => {
      const weight = Math.max(batter.stats.ab, 1);
      accumulator.weight += weight;
      accumulator.avg += batter.stats.avg * weight;
      accumulator.obp += batter.stats.obp * weight;
      accumulator.slg += batter.stats.slg * weight;
      accumulator.ops += batter.stats.ops * weight;
      accumulator.bbToK += clamp(batter.stats.bb / Math.max(batter.stats.k, 1), 0, 1) * weight;
      accumulator.sbPerGame += (batter.stats.gp > 0 ? batter.stats.sb / batter.stats.gp : 0) * weight;
      return accumulator;
    },
    { weight: 0, avg: 0, obp: 0, slg: 0, ops: 0, bbToK: 0, sbPerGame: 0 },
  );

  const weight = Math.max(totals.weight, 1);
  const weightedAvg = totals.avg / weight;
  const weightedObp = totals.obp / weight;
  const weightedSlg = totals.slg / weight;
  const weightedSbPerGame = totals.sbPerGame / weight;
  const disciplineMetric = 0.7 * (weightedObp - weightedAvg) + 0.3 * (totals.bbToK / weight);

  return {
    contactRating: Math.round(scale(weightedAvg, 0.22, 0.34, 35, 90)),
    powerRating: Math.round(scale(weightedSlg, 0.32, 0.62, 35, 90)),
    disciplineRating: Math.round(scale(disciplineMetric, 0.05, 0.18, 35, 90)),
    speedRating: Math.round(scale(weightedSbPerGame, 0, 1.2, 40, 90)),
  };
}

export function createFallbackTeamProfile(meta = {}) {
  const team = {
    ...TEAM_FALLBACK,
    ...meta,
    id: String(meta.id ?? TEAM_FALLBACK.id),
  };
  const batters = Array.from({ length: 9 }, (_, index) => buildFallbackBatter(index));
  const ratings = { ...DEFAULT_TEAM_RATINGS };
  const pitcher = {
    pitchingRating: ratings.pitchingRating,
    ...getPitcherArchetype(ratings.pitchingRating),
  };

  return {
    team,
    batters,
    source: "fallback",
    contactRating: ratings.contactRating,
    powerRating: ratings.powerRating,
    disciplineRating: ratings.disciplineRating,
    speedRating: ratings.speedRating,
    pitchingRating: ratings.pitchingRating,
    pitchMixProfile: pitcher.pitchMixProfile,
    pitchSpeedBand: pitcher.pitchSpeedBand,
    pitchWeights: pitcher.pitchWeights,
    pitcher,
    targetOffenseRating: Math.round(
      0.4 * ratings.contactRating +
        0.3 * ratings.powerRating +
        0.2 * ratings.disciplineRating +
        0.1 * ratings.speedRating,
    ),
  };
}

export function buildTeamGameplayProfile(rawTeam, fallbackTeamId) {
  const team = normalizeTeamMeta(rawTeam, fallbackTeamId);
  const rosterEntries = getRosterEntries(rawTeam);
  const teamStats = getTeamStats(rawTeam);
  const hitters = rosterEntries
    .filter((player) => !isPitcher(player.position))
    .map((player, index) => {
      const stats = normalizePlayerStats(player);
      return {
        id: String(player.id ?? `${team.id}-player-${index}`),
        name: player.name ?? `Player ${index + 1}`,
        position: player.position ?? "UT",
        number: String(player.number ?? player.jersey ?? index + 1),
        stats,
        gameplay: computeHitterGameplay(stats),
      };
    });

  let eligible = hitters.filter((player) => player.stats.ab >= 10);
  if (eligible.length < 9) {
    eligible = hitters.filter((player) => player.stats.ab > 0);
  }

  if (eligible.length < 5) {
    const fallback = createFallbackTeamProfile(team);
    const ratings = buildFallbackRatingsFromTeamStats(teamStats);
    const pitcher = {
      pitchingRating: ratings.pitchingRating,
      ...getPitcherArchetype(ratings.pitchingRating),
    };
    return {
      ...fallback,
      team,
      source: "fallback-team-stats",
      contactRating: ratings.contactRating,
      powerRating: ratings.powerRating,
      disciplineRating: ratings.disciplineRating,
      speedRating: ratings.speedRating,
      pitchingRating: ratings.pitchingRating,
      pitchMixProfile: pitcher.pitchMixProfile,
      pitchSpeedBand: pitcher.pitchSpeedBand,
      pitchWeights: pitcher.pitchWeights,
      pitcher,
      targetOffenseRating: Math.round(
        0.4 * ratings.contactRating +
          0.3 * ratings.powerRating +
          0.2 * ratings.disciplineRating +
          0.1 * ratings.speedRating,
      ),
    };
  }

  const batters = orderLineup(eligible);
  const ratings = summarizeLineupRatings(batters);
  const pitchingRating = buildPitchingRating(teamStats);
  const pitcher = {
    pitchingRating,
    ...getPitcherArchetype(pitchingRating),
  };

  return {
    team,
    batters,
    source: "api",
    contactRating: ratings.contactRating,
    powerRating: ratings.powerRating,
    disciplineRating: ratings.disciplineRating,
    speedRating: ratings.speedRating,
    pitchingRating,
    pitchMixProfile: pitcher.pitchMixProfile,
    pitchSpeedBand: pitcher.pitchSpeedBand,
    pitchWeights: pitcher.pitchWeights,
    pitcher,
    targetOffenseRating: Math.round(
      0.4 * ratings.contactRating +
        0.3 * ratings.powerRating +
        0.2 * ratings.disciplineRating +
        0.1 * ratings.speedRating,
    ),
  };
}

export function createInitialGameState({
  mode,
  teamId = null,
  opponentTeamId = null,
  difficulty = "medium",
  sessionSeed = createSessionSeed(),
  targetRuns = mode === "quickPlay" || mode === "teamMode" ? 4 : null,
}) {
  return {
    mode,
    inning: 1,
    halfInning: "bottom",
    outs: 0,
    strikes: 0,
    balls: 0,
    bases: [false, false, false],
    stats: {
      runs: 0,
      hits: 0,
      homeRuns: 0,
      atBats: 0,
      pitchCount: 0,
      strikeouts: 0,
      walks: 0,
      currentStreak: 0,
      longestStreak: 0,
      derbyOuts: 0,
      rbis: 0,
      perfectContacts: 0,
      solidContacts: 0,
      totalHomeRunDistance: 0,
      bonusSwingsEarned: 0,
    },
    maxInnings: mode === "quickPlay" || mode === "teamMode" ? 3 : Number.POSITIVE_INFINITY,
    maxDerbyOuts: 10,
    teamId,
    opponentTeamId,
    targetRuns,
    suddenDeath: false,
    result: null,
    difficulty,
    sessionSeed,
  };
}

function applyInningTransition(state, outsRecorded) {
  const nextOuts = state.outs + outsRecorded;
  if (nextOuts < 3) {
    return {
      ...state,
      outs: nextOuts,
      strikes: 0,
      balls: 0,
    };
  }

  let next = {
    ...state,
    inning: state.inning + 1,
    outs: 0,
    strikes: 0,
    balls: 0,
    bases: [false, false, false],
  };

  if (state.mode === "quickPlay" || state.mode === "teamMode") {
    const closedRegulation = !state.suddenDeath && state.inning >= state.maxInnings;
    const closedSuddenDeath = state.suddenDeath && state.inning >= state.maxInnings + 1;

    if (closedRegulation) {
      if (state.stats.runs > (state.targetRuns ?? 0)) {
        next = { ...next, result: "win" };
      } else if (state.stats.runs === (state.targetRuns ?? 0)) {
        next = {
          ...next,
          suddenDeath: true,
          targetRuns: (state.targetRuns ?? 0) + 1,
        };
      } else {
        next = { ...next, result: "loss" };
      }
    } else if (closedSuddenDeath) {
      next = {
        ...next,
        result: state.stats.runs > (state.targetRuns ?? 0) ? "win" : "loss",
      };
    }
  }

  return next;
}

export function advanceBasesForWalk(bases) {
  const next = [...bases];
  let runs = 0;

  if (next[0] && next[1] && next[2]) {
    runs += 1;
  }
  if (next[0] && next[1]) {
    next[2] = true;
  }
  if (next[0]) {
    next[1] = true;
  }
  next[0] = true;

  return { bases: next, runs };
}

export function advanceBasesForHit(bases, hitType, contactTier) {
  const [first, second, third] = bases;
  if (hitType === "homeRun") {
    return {
      bases: [false, false, false],
      runs: Number(first) + Number(second) + Number(third) + 1,
    };
  }

  if (hitType === "triple") {
    return {
      bases: [false, false, true],
      runs: Number(first) + Number(second) + Number(third),
    };
  }

  if (hitType === "double") {
    let runs = Number(second) + Number(third);
    const next = [false, true, false];
    if (first) {
      if (contactTier === "solid" || contactTier === "perfect") {
        runs += 1;
      } else {
        next[2] = true;
      }
    }
    return { bases: next, runs };
  }

  let runs = Number(third);
  const next = [true, false, false];
  if (second) {
    if (contactTier === "solid" || contactTier === "perfect") {
      runs += 1;
    } else {
      next[2] = true;
    }
  }
  if (first) {
    if (contactTier === "perfect") {
      runs += 1;
    } else {
      next[contactTier === "solid" ? 2 : 1] = true;
    }
  }

  return { bases: next, runs };
}

export function advanceGameStateForPlate(state, plate) {
  let next = {
    ...state,
    bases: [...state.bases],
    stats: { ...state.stats },
    strikes: 0,
    balls: 0,
  };

  if (plate.type === "walk") {
    const walk = advanceBasesForWalk(next.bases);
    next.bases = walk.bases;
    next.stats.walks += 1;
    next.stats.runs += walk.runs;
    next.stats.rbis += walk.runs;
    return next;
  }

  if (plate.type === "strikeout") {
    next.stats.atBats += 1;
    next.stats.strikeouts += 1;
    next.stats.currentStreak = 0;
    return applyInningTransition(next, 1);
  }

  if (plate.type === "out" || plate.type === "doublePlay" || plate.type === "sacFly") {
    if (plate.type !== "sacFly") {
      next.stats.atBats += 1;
    }
    next.stats.currentStreak = 0;
    if (plate.type === "sacFly") {
      next.stats.runs += 1;
      next.stats.rbis += 1;
      next.bases[2] = false;
    }
    if (plate.type === "doublePlay") {
      next.bases[0] = false;
    }
    return applyInningTransition(next, plate.type === "doublePlay" ? 2 : 1);
  }

  const advancement = advanceBasesForHit(next.bases, plate.type, plate.contactTier);
  next.bases = advancement.bases;
  next.stats.runs += advancement.runs;
  next.stats.rbis += advancement.runs;
  next.stats.hits += 1;
  next.stats.atBats += 1;
  next.stats.currentStreak += 1;
  next.stats.longestStreak = Math.max(next.stats.longestStreak, next.stats.currentStreak);
  if (plate.contactTier === "perfect") {
    next.stats.perfectContacts += 1;
  }
  if (plate.contactTier === "solid") {
    next.stats.solidContacts += 1;
  }
  if (plate.type === "homeRun") {
    next.stats.homeRuns += 1;
    next.stats.totalHomeRunDistance += Math.round(plate.distanceFt ?? 0);
  }

  return next;
}

export function advanceDerbyState(state, plate) {
  let next = {
    ...state,
    stats: { ...state.stats },
    strikes: 0,
    balls: 0,
  };

  if (plate.type === "homeRun") {
    next.stats.homeRuns += 1;
    next.stats.runs += 1;
    next.stats.hits += 1;
    next.stats.atBats += 1;
    next.stats.currentStreak += 1;
    next.stats.longestStreak = Math.max(next.stats.longestStreak, next.stats.currentStreak);
    next.stats.rbis += 1;
    next.stats.totalHomeRunDistance += Math.round(plate.distanceFt ?? 0);
    if (plate.contactTier === "perfect") {
      next.stats.perfectContacts += 1;
    }
    if (plate.contactTier === "solid") {
      next.stats.solidContacts += 1;
    }
    if (
      (plate.distanceFt ?? 0) >= 430 &&
      next.stats.bonusSwingsEarned < 4
    ) {
      next.stats.bonusSwingsEarned += 1;
      next.maxDerbyOuts += 1;
    }
    return next;
  }

  if (plate.type === "foul") {
    return next;
  }

  next.stats.derbyOuts += 1;
  next.stats.atBats += 1;
  next.stats.currentStreak = 0;
  return next;
}

export function isGameOver(state) {
  if (state.mode === "hrDerby") {
    return state.stats.derbyOuts >= state.maxDerbyOuts;
  }
  if (state.mode === "quickPlay" || state.mode === "teamMode") {
    return state.result === "win" || state.result === "loss";
  }
  return false;
}

export function computeTargetRuns({
  playerPrevention = DEFAULT_TEAM_RATINGS.pitchingRating,
  opponentOffense = 60,
  difficulty = "medium",
  seed = 1,
}) {
  const difficultyBump =
    difficulty === "easy" ? -0.4 : difficulty === "hard" ? 0.5 : 0;
  const seededVariance = [-1, 0, 1][Math.abs(createSessionSeed(seed)) % 3];
  return clamp(
    Math.round(2 + (opponentOffense - playerPrevention) / 18 + difficultyBump + seededVariance),
    2,
    10,
  );
}

export function evaluateSwingContact({
  swingTimeMs,
  strikeTimeMs,
  contactPoint,
  zoneCenter = { x: 0, z: 0.8 },
  isInZone,
  hitterRatings = DEFAULT_TEAM_RATINGS,
  pitchSpeedMph = 88,
  difficulty = "medium",
}) {
  const preset = getDifficultyPreset(difficulty);
  const timingDeltaMs = swingTimeMs - strikeTimeMs;
  const dx = toNumber(contactPoint?.x, 0) - toNumber(zoneCenter?.x, 0);
  const dz = toNumber(contactPoint?.z, 0.8) - toNumber(zoneCenter?.z, 0.8);
  const contactPointDistance = Math.sqrt(dx * dx + dz * dz);
  const contactRadius = 0.19 * preset.contactRadiusMultiplier;
  const timingScore = clamp(1 - Math.abs(timingDeltaMs) / preset.timingWindowMs, 0, 1);
  const zoneScore = clamp(1 - contactPointDistance / contactRadius, 0, 1);

  let chasePenalty = 0;
  if (!isInZone) {
    chasePenalty =
      contactPointDistance <= contactRadius * 1.25 ? 0.12 : 0.25;
  }

  const noOverlap =
    Math.abs(timingDeltaMs) > preset.timingWindowMs * 1.7 ||
    contactPointDistance > contactRadius * 1.9;
  const contactQuality = clamp(
    100 *
      (0.6 * timingScore +
        0.25 * zoneScore +
        0.1 * ((hitterRatings.contactRating ?? 55) / 100) +
        0.05 * ((hitterRatings.disciplineRating ?? 55) / 100) -
        chasePenalty),
    0,
    100,
  );

  const foulBand =
    Math.abs(timingDeltaMs) > preset.timingWindowMs * 0.78 ||
    (!isInZone && chasePenalty > 0);

  let tier = "weak";
  if (noOverlap || contactQuality < 35) {
    tier = "whiff";
  } else if (foulBand && contactQuality < 78) {
    tier = "foul";
  } else if (contactQuality >= 92) {
    tier = "perfect";
  } else if (contactQuality >= 58) {
    tier = "solid";
  } else {
    tier = "weak";
  }

  const timingRatio = clamp(timingDeltaMs / preset.timingWindowMs, -1.5, 1.5);
  const launchBase = 18 + clamp(dz / 0.3, -1.2, 1.2) * 12;
  const launchTierBonus =
    tier === "perfect" ? 6 : tier === "solid" ? 2 : tier === "weak" ? -4 : -10;
  const launchAngleDeg = clamp(launchBase + timingRatio * 10 + launchTierBonus, -12, 55);
  const sprayAngleDeg = clamp(timingRatio * 18 + dx * 52, -38, 38);
  const exitVelocityMph = clamp(
    45 +
      pitchSpeedMph * 0.35 +
      (hitterRatings.powerRating ?? 55) * 0.35 +
      (contactQuality - 50) * 0.45,
    40,
    112,
  );
  const distanceFt = Math.round(
    clamp(
      exitVelocityMph * (2.2 + Math.max(launchAngleDeg, 0) / 32) +
        (tier === "perfect" ? 28 : tier === "solid" ? 12 : 0),
      45,
      470,
    ),
  );
  const timingLabel =
    Math.abs(timingDeltaMs) <= preset.timingWindowMs * 0.35
      ? "On Time"
      : timingDeltaMs < 0
        ? "Early"
        : "Late";

  return {
    tier,
    timingDeltaMs,
    timingLabel,
    timingWindowMs: preset.timingWindowMs,
    contactPointDistance,
    contactRadius,
    contactQuality,
    chasePenalty,
    timingScore,
    zoneScore,
    exitVelocityMph,
    launchAngleDeg,
    sprayAngleDeg,
    distanceFt,
    isFairBall: tier !== "foul" && tier !== "whiff",
    homeRunThreat:
      distanceFt >= 390 &&
      launchAngleDeg >= 18 &&
      launchAngleDeg <= 42 &&
      tier !== "weak",
  };
}

export function mapContactTierToLegacyQuality(tier) {
  switch (tier) {
    case "perfect":
      return "perfect";
    case "solid":
      return "good";
    case "foul":
      return "foul";
    case "whiff":
      return "whiff";
    default:
      return "weak";
  }
}

export function resolveBallInPlay(state, contact, seed) {
  const rng = createSeededRng(seed);

  if (contact.tier === "perfect") {
    if (contact.homeRunThreat) {
      return { type: "homeRun", contactTier: contact.tier, distanceFt: contact.distanceFt };
    }
    if (contact.distanceFt >= 335 && rng() < 0.22) {
      return { type: "triple", contactTier: contact.tier, distanceFt: contact.distanceFt };
    }
    if (contact.distanceFt >= 250 || contact.exitVelocityMph >= 95) {
      return { type: "double", contactTier: contact.tier, distanceFt: contact.distanceFt };
    }
    return { type: "single", contactTier: contact.tier, distanceFt: contact.distanceFt };
  }

  if (contact.tier === "solid") {
    if (contact.homeRunThreat && rng() < 0.16) {
      return { type: "homeRun", contactTier: contact.tier, distanceFt: contact.distanceFt };
    }
    if (state.bases[2] && state.outs < 2 && contact.launchAngleDeg >= 24 && contact.distanceFt >= 180) {
      return { type: "sacFly", contactTier: contact.tier, distanceFt: contact.distanceFt };
    }
    if (
      contact.launchAngleDeg > 48 &&
      contact.distanceFt < 215 &&
      rng() < 0.7
    ) {
      return { type: "out", contactTier: contact.tier, distanceFt: contact.distanceFt };
    }
    if (contact.distanceFt >= 315 && rng() < 0.12) {
      return { type: "triple", contactTier: contact.tier, distanceFt: contact.distanceFt };
    }
    if (contact.distanceFt >= 235 || contact.exitVelocityMph >= 88) {
      return { type: rng() < 0.48 ? "double" : "single", contactTier: contact.tier, distanceFt: contact.distanceFt };
    }
    return { type: rng() < 0.32 ? "out" : "single", contactTier: contact.tier, distanceFt: contact.distanceFt };
  }

  if (
    state.bases[0] &&
    state.outs < 2 &&
    contact.launchAngleDeg < 10 &&
    contact.exitVelocityMph < 85 &&
    rng() < 0.18
  ) {
    return { type: "doublePlay", contactTier: contact.tier, distanceFt: contact.distanceFt };
  }

  return {
    type: rng() < 0.78 ? "out" : "single",
    contactTier: contact.tier,
    distanceFt: contact.distanceFt,
  };
}

export function computeRankedScore(state) {
  if (state.mode === "hrDerby") {
    const rawScore =
      12 * state.stats.homeRuns +
      Math.floor(state.stats.totalHomeRunDistance / 40) +
      3 * state.stats.perfectContacts;
    const difficultyMultiplier =
      state.difficulty === "easy" ? 0.9 : state.difficulty === "hard" ? 1.15 : 1;
    return Math.min(Math.floor(rawScore * difficultyMultiplier), 200);
  }

  const rawScore =
    20 * state.stats.runs +
    6 * state.stats.rbis +
    4 * state.stats.hits +
    2 * state.stats.walks +
    4 * state.stats.perfectContacts +
    2 * state.stats.solidContacts -
    state.stats.strikeouts;
  const difficultyMultiplier =
    state.difficulty === "easy" ? 0.9 : state.difficulty === "hard" ? 1.15 : 1;
  const modeMultiplier = state.mode === "teamMode" ? 1.1 : 1;
  return Math.min(Math.floor(rawScore * difficultyMultiplier * modeMultiplier), 200);
}

export function computeCoinReward({ finalScore, win, currentDailyStreak = 0, mode }) {
  if (mode === "practice") return 0;
  const streakBonus = Math.min(currentDailyStreak, 5);
  return Math.max(5, Math.floor(finalScore / 12)) + (win ? 5 : 0) + streakBonus;
}

export function buildLeaderboardMetadata(state, extras = {}) {
  return {
    mode: normalizeLeaderboardMode(state.mode),
    difficulty: state.difficulty ?? "medium",
    teamId: state.teamId ?? null,
    opponentTeamId: state.opponentTeamId ?? null,
    scoreVersion: 2,
    result: state.result ?? null,
    targetRuns: state.targetRuns ?? null,
    durationSeconds: extras.durationSeconds ?? null,
    coinsEarned: extras.coinsEarned ?? 0,
    sessionSeed: state.sessionSeed,
  };
}
