import fs from 'fs';
import path from 'path';
import { trainRidgeRegression, predictRidge } from '../../lib/regression/ridge-regression.js';
import {
  trainLogisticRegression,
  predictLogistic,
  evaluateLogistic,
  reliabilityCurve,
  fitPlattScaling,
} from '../../lib/regression/logistic-regression.js';
import { mean, standardDeviation } from '../../lib/math/statistics.js';

const DATASET_PATH = path.join(process.cwd(), 'data', 'college-baseball', 'standings', 'sec.json');
const FEATURE_KEYS = [
  'conferenceWinPct',
  'homeWinPct',
  'awayWinPct',
  'neutralWinPct',
  'gamesBack',
  'streakValue',
  'conferenceWinDiff',
  'overallWinDiff',
];

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function parseRecord(record) {
  if (!record || typeof record !== 'string') {
    return { wins: 0, losses: 0, pct: 0 };
  }
  const [winsStr, lossesStr] = record.split('-');
  const wins = Number.parseInt(winsStr, 10) || 0;
  const losses = Number.parseInt(lossesStr, 10) || 0;
  const total = wins + losses;
  return {
    wins,
    losses,
    pct: total > 0 ? wins / total : 0,
  };
}

function parseGamesBack(value) {
  if (value === '—' || value === '—.--' || value === undefined || value === null) {
    return 0;
  }
  const numeric = Number.parseFloat(value);
  return Number.isFinite(numeric) ? numeric : 0;
}

function parseStreak(streak) {
  if (!streak || streak.length < 2) return 0;
  const direction = streak[0] === 'W' ? 1 : -1;
  const length = Number.parseInt(streak.slice(1), 10) || 0;
  return direction * length;
}

function enrichStandings(standings, seeds) {
  return standings.map((entry) => {
    const home = parseRecord(entry.home);
    const away = parseRecord(entry.away);
    const neutral = parseRecord(entry.neutral);
    const conferenceGames = entry.confWins + entry.confLosses;
    const overallGames = entry.overallWins + entry.overallLosses;
    const slug = slugify(entry.team);

    let seed = null;
    let postseasonLabel = null;
    for (const candidate of seeds) {
      const candidateSlug = slugify(candidate.team);
      if (
        slug.includes(candidateSlug) ||
        candidateSlug.includes(slug) ||
        entry.team.toLowerCase().includes(candidate.team.toLowerCase())
      ) {
        seed = candidate.seed;
        postseasonLabel = candidate.team;
        break;
      }
    }

    return {
      name: entry.team,
      slug,
      abbreviation: entry.team
        .split(' ')
        .map((part) => part[0])
        .join('')
        .slice(0, 4)
        .toUpperCase(),
      conference: 'SEC',
      overallWins: entry.overallWins,
      overallLosses: entry.overallLosses,
      overallWinPct: overallGames > 0 ? entry.overallWins / overallGames : 0,
      conferenceWins: entry.confWins,
      conferenceLosses: entry.confLosses,
      conferenceWinPct: conferenceGames > 0 ? entry.confWins / conferenceGames : 0,
      homeRecord: { ...home },
      awayRecord: { ...away },
      neutralRecord: { ...neutral },
      gamesBack: parseGamesBack(entry.gamesBack),
      streak: entry.streak,
      streakValue: parseStreak(entry.streak),
      tournamentSeed: seed,
      postseasonLabel,
      overallWinDiff: entry.overallWins - entry.overallLosses,
      conferenceWinDiff: entry.confWins - entry.confLosses,
      conferenceGames,
      overallGames,
      features: {
        conferenceWinPct: conferenceGames > 0 ? entry.confWins / conferenceGames : 0,
        homeWinPct: home.pct,
        awayWinPct: away.pct,
        neutralWinPct: neutral.pct,
        gamesBack: parseGamesBack(entry.gamesBack),
        streakValue: parseStreak(entry.streak),
        conferenceWinDiff: entry.confWins - entry.confLosses,
        overallWinDiff: entry.overallWins - entry.overallLosses,
      },
    };
  });
}

function standardizeDataset(dataset) {
  const stats = FEATURE_KEYS.map((key) => {
    const values = dataset.map((team) => team.features[key]);
    const featureMean = mean(values);
    const featureStd = standardDeviation(values) || 1;
    return { name: key, mean: featureMean, std: featureStd };
  });

  const standardized = dataset.map((team) => {
    const zScores = FEATURE_KEYS.map((key, index) => {
      const { mean: featureMean, std: featureStd } = stats[index];
      return featureStd === 0 ? 0 : (team.features[key] - featureMean) / featureStd;
    });
    return { ...team, standardized };
  });

  return { stats, standardized };
}

function computeRidgeMetrics(actual, predicted) {
  const residuals = actual.map((value, index) => value - predicted[index]);
  const mse = residuals.reduce((sum, value) => sum + value * value, 0) / residuals.length;
  const rmse = Math.sqrt(mse);
  const mae =
    residuals.reduce((sum, value) => sum + Math.abs(value), 0) / residuals.length;
  const targetMean = mean(actual);
  const totalVar = actual.reduce((sum, value) => {
    const diff = value - targetMean;
    return sum + diff * diff;
  }, 0);
  const residualVar = residuals.reduce((sum, value) => sum + value * value, 0);
  const rSquared = 1 - residualVar / totalVar;

  return {
    rmse: parseFloat(rmse.toFixed(4)),
    mae: parseFloat(mae.toFixed(4)),
    rSquared: parseFloat(rSquared.toFixed(4)),
  };
}

function buildArtifact({
  modelKey,
  algo,
  coefficients,
  intercept,
  featureStats,
  metrics,
  calibration,
  metadata,
}) {
  const coefficientMap = FEATURE_KEYS.reduce((acc, key, index) => {
    acc[key] = parseFloat(coefficients[index].toFixed(6));
    return acc;
  }, {});

  return {
    schema_version: '1.1',
    model_key: modelKey,
    model_id: `${modelKey}-${metadata.season}`,
    created_at: metadata.lastUpdated,
    algo,
    features: featureStats.map((stat) => ({
      name: stat.name,
      mean: parseFloat(stat.mean.toFixed(6)),
      std: parseFloat(stat.std.toFixed(6)),
    })),
    coefficients: coefficientMap,
    intercept: parseFloat(intercept.toFixed(6)),
    metrics,
    calibration,
    metadata,
  };
}

function formatRidgeModel({
  artifact,
  dataset,
  standardized,
  predictions,
  metadata,
}) {
  const leagueAverage = mean(dataset.map((team) => team.overallWinPct));

  const teamProfiles = dataset.map((team, index) => {
    const contributions = FEATURE_KEYS.map((key, featureIndex) => ({
      feature: key,
      zScore: standardized[index][featureIndex],
      weight: artifact.coefficients[key],
      impact: parseFloat((artifact.coefficients[key] * standardized[index][featureIndex]).toFixed(6)),
    })).sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact));

    return {
      team: team.name,
      slug: team.slug,
      abbreviation: team.abbreviation,
      predictedWinPct: parseFloat(predictions[index].toFixed(4)),
      actualWinPct: parseFloat(team.overallWinPct.toFixed(4)),
      residual: parseFloat((predictions[index] - team.overallWinPct).toFixed(4)),
      contributions,
    };
  });

  return {
    modelKey: artifact.model_key,
    artifact,
    leagueAverage: parseFloat(leagueAverage.toFixed(4)),
    teamProfiles,
    metadata,
  };
}

function formatLogisticModel({
  artifact,
  dataset,
  standardized,
  predictions,
  metadata,
}) {
  const teamProfiles = dataset.map((team, index) => {
    const contributions = FEATURE_KEYS.map((key, featureIndex) => ({
      feature: key,
      zScore: standardized[index][featureIndex],
      weight: artifact.coefficients[key],
      impact: parseFloat((artifact.coefficients[key] * standardized[index][featureIndex]).toFixed(6)),
    })).sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact));

    return {
      team: team.name,
      slug: team.slug,
      abbreviation: team.abbreviation,
      probability: parseFloat(predictions[index].toFixed(4)),
      actual: team.tournamentSeed && team.tournamentSeed <= 8 ? 1 : 0,
      contributions,
    };
  });

  return {
    modelKey: artifact.model_key,
    artifact,
    teamProfiles,
    metadata,
  };
}

export default class RegressionArtifactService {
  constructor(logger) {
    this.logger = logger;
    this.cache = null;
  }

  loadDataset() {
    const raw = fs.readFileSync(DATASET_PATH, 'utf-8');
    const parsed = JSON.parse(raw);
    const enriched = enrichStandings(parsed.standings, parsed.tournamentSeeds || []);
    return {
      metadata: {
        conference: parsed.conference,
        season: parsed.season,
        lastUpdated: parsed.lastUpdated,
        source: parsed.source,
        datasetSize: enriched.length,
      },
      dataset: enriched,
    };
  }

  buildCache() {
    if (this.cache) {
      return this.cache;
    }

    const { metadata, dataset } = this.loadDataset();
    const { stats, standardized } = standardizeDataset(dataset);

    const ridgeModel = trainRidgeRegression(standardized.map((team) => team.standardized), dataset.map((team) => team.overallWinPct), 0.25);
    const ridgePredictions = standardized.map((team) => predictRidge(ridgeModel, team.standardized));
    const ridgeMetrics = computeRidgeMetrics(
      dataset.map((team) => team.overallWinPct),
      ridgePredictions,
    );

    const ridgeArtifact = buildArtifact({
      modelKey: 'sec_win_pct_ridge_v1',
      algo: 'ridge_regression',
      coefficients: ridgeModel.coefficients,
      intercept: ridgeModel.intercept,
      featureStats: stats,
      metrics: ridgeMetrics,
      calibration: {
        type: 'mean-centering',
        note: 'Intercept equals league average win percentage; coefficients applied to standardized features.',
      },
      metadata,
    });

    const logisticTargets = dataset.map((team) => (team.tournamentSeed && team.tournamentSeed <= 8 ? 1 : 0));
    const logisticModel = trainLogisticRegression(
      standardized.map((team) => team.standardized),
      logisticTargets,
      { lambda: 0.15, learningRate: 0.4, iterations: 5000 },
    );
    const logisticPredictions = standardized.map((team) => predictLogistic(logisticModel, team.standardized));
    const logisticMetrics = evaluateLogistic(logisticTargets, logisticPredictions);
    const calibration = fitPlattScaling(logisticPredictions, logisticTargets);
    const reliability = reliabilityCurve(logisticPredictions, logisticTargets, 5);

    const logisticArtifact = buildArtifact({
      modelKey: 'sec_top8_logit_v1',
      algo: 'logistic_regression',
      coefficients: logisticModel.weights,
      intercept: logisticModel.bias,
      featureStats: stats,
      metrics: {
        logLoss: parseFloat(logisticMetrics.logLoss.toFixed(4)),
        brier: parseFloat(logisticMetrics.brier.toFixed(4)),
        accuracy: parseFloat(logisticMetrics.accuracy.toFixed(4)),
        auc: parseFloat(logisticMetrics.auc.toFixed(4)),
      },
      calibration: {
        type: 'platt',
        params: {
          a: parseFloat(calibration.a.toFixed(6)),
          b: parseFloat(calibration.b.toFixed(6)),
        },
        reliabilityCurve: reliability,
      },
      metadata,
    });

    const ridgeModelFormatted = formatRidgeModel({
      artifact: ridgeArtifact,
      dataset,
      standardized: standardized.map((team) => team.standardized),
      predictions: ridgePredictions,
      metadata,
    });

    const logisticModelFormatted = formatLogisticModel({
      artifact: logisticArtifact,
      dataset,
      standardized: standardized.map((team) => team.standardized),
      predictions: logisticPredictions,
      metadata,
    });

    const teams = dataset.map((team, index) => ({
      slug: team.slug,
      name: team.name,
      abbreviation: team.abbreviation,
      conference: team.conference,
      record: `${team.overallWins}-${team.overallLosses}`,
      conferenceRecord: `${team.conferenceWins}-${team.conferenceLosses}`,
      overallWins: team.overallWins,
      overallLosses: team.overallLosses,
      conferenceWins: team.conferenceWins,
      conferenceLosses: team.conferenceLosses,
      overallWinPct: parseFloat(team.overallWinPct.toFixed(3)),
      conferenceWinPct: parseFloat(team.conferenceWinPct.toFixed(3)),
      gamesBack: team.gamesBack,
      streak: team.streak,
      regression: {
        winPct: ridgeModelFormatted.teamProfiles[index],
        topEight: logisticModelFormatted.teamProfiles[index],
      },
    }));

    this.cache = {
      metadata,
      featureStats: stats,
      ridge: ridgeModelFormatted,
      logistic: logisticModelFormatted,
      teams,
    };

    return this.cache;
  }

  listTeams() {
    const cache = this.buildCache();
    return cache.teams.map((team) => ({
      slug: team.slug,
      name: team.name,
      abbreviation: team.abbreviation,
      conference: team.conference,
      record: team.record,
      conferenceRecord: team.conferenceRecord,
      overallWins: team.overallWins,
      overallLosses: team.overallLosses,
      conferenceWins: team.conferenceWins,
      conferenceLosses: team.conferenceLosses,
      overallWinPct: team.overallWinPct,
      conferenceWinPct: team.conferenceWinPct,
      gamesBack: team.gamesBack,
      streak: team.streak,
    }));
  }

  getTeamProfile(teamKey) {
    const cache = this.buildCache();
    const normalizedSlug = slugify(teamKey);
    const normalizedAbbr = teamKey.toLowerCase();

    const team = cache.teams.find(
      (entry) =>
        entry.slug === normalizedSlug ||
        entry.abbreviation.toLowerCase() === normalizedAbbr ||
        slugify(entry.name) === normalizedSlug,
    );

    if (!team) {
      throw new Error(`Team not found for key: ${teamKey}`);
    }

    const ridgeProfile = cache.ridge.teamProfiles.find((profile) => profile.slug === team.slug);
    const logisticProfile = cache.logistic.teamProfiles.find((profile) => profile.slug === team.slug);

    return {
      metadata: cache.metadata,
      team: {
        name: team.name,
        slug: team.slug,
        abbreviation: team.abbreviation,
        conference: team.conference,
        record: team.record,
        conferenceRecord: team.conferenceRecord,
        overallWins: team.overallWins,
        overallLosses: team.overallLosses,
        conferenceWins: team.conferenceWins,
        conferenceLosses: team.conferenceLosses,
        overallWinPct: team.overallWinPct,
        conferenceWinPct: team.conferenceWinPct,
        gamesBack: team.gamesBack,
        streak: team.streak,
      },
      models: {
        winPctRidge: {
          modelKey: cache.ridge.modelKey,
          leagueAverage: cache.ridge.leagueAverage,
          predictedWinPct: ridgeProfile.predictedWinPct,
          actualWinPct: ridgeProfile.actualWinPct,
          residual: ridgeProfile.residual,
          contributions: ridgeProfile.contributions.slice(0, 5),
          artifact: cache.ridge.artifact,
        },
        topEightLogit: {
          modelKey: cache.logistic.modelKey,
          probability: logisticProfile.probability,
          actual: logisticProfile.actual,
          contributions: logisticProfile.contributions.slice(0, 5),
          artifact: cache.logistic.artifact,
        },
      },
      predictions: {
        seasonWinPct: {
          predictedWinPct: ridgeProfile.predictedWinPct,
          actualWinPct: ridgeProfile.actualWinPct,
          residual: ridgeProfile.residual,
          leagueAverage: cache.ridge.leagueAverage,
          topContributors: ridgeProfile.contributions.slice(0, 5),
          modelKey: cache.ridge.modelKey,
          modelId: cache.ridge.artifact.model_id,
        },
        topEightSeed: {
          probability: logisticProfile.probability,
          actual: logisticProfile.actual,
          topContributors: logisticProfile.contributions.slice(0, 5),
          modelKey: cache.logistic.modelKey,
          modelId: cache.logistic.artifact.model_id,
          calibration: cache.logistic.artifact.calibration,
        },
      },
    };
  }

  getArtifact(modelKey) {
    const cache = this.buildCache();
    if (modelKey === cache.ridge.modelKey) {
      return cache.ridge.artifact;
    }
    if (modelKey === cache.logistic.modelKey) {
      return cache.logistic.artifact;
    }
    throw new Error(`Unknown model key: ${modelKey}`);
  }

  getMetadata() {
    const cache = this.buildCache();
    return cache.metadata;
  }
}
