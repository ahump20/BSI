import StrengthModel from '../../lib/strengthModel.runtime.js';

const DEFAULT_FREE_SIM_LIMIT = 400;

export default class SchedulingOptimizerService {
  constructor({ logger } = {}) {
    this.logger = logger;
  }

  runOptimization({
    teamId,
    conferenceId,
    historicalGames = [],
    teams = [],
    prospectiveMatchups = [],
    season,
    membershipTier = 'free',
    options = {},
  }) {
    if (!teamId) {
      throw new Error('teamId is required for scheduling optimization');
    }

    const normalizedTier = String(membershipTier || 'free').toLowerCase();
    const model = new StrengthModel({ games: historicalGames, teams, season });

    const shouldRestrictAdvanced =
      normalizedTier !== 'diamond-pro' &&
      (prospectiveMatchups.length > 2 ||
        Number(options.simulations ?? 0) > DEFAULT_FREE_SIM_LIMIT ||
        options.includeAdvanced === true);

    const conferenceStrength = conferenceId
      ? model.calculateConferenceStrength(conferenceId)
      : null;

    const rpiProjection = model.projectRpiShift(teamId, prospectiveMatchups);

    const scheduleImpact = model.simulateSchedulingImpact(teamId, prospectiveMatchups, {
      simulations: options.simulations,
      restrictAdvanced: shouldRestrictAdvanced,
    });

    const projectedRankings = conferenceId
      ? model.buildConferenceRanking(conferenceId, teamId, rpiProjection.projectedRpi ?? 0.5)
      : [];

    let upsell = null;
    if (shouldRestrictAdvanced) {
      scheduleImpact.gated = true;
      scheduleImpact.notes = scheduleImpact.notes ||
        'Advanced optimization features are available with a Diamond Pro membership.';
      upsell = {
        headline: 'Unlock Diamond Pro Schedule Optimization',
        message:
          'Diamond Pro unlocks unlimited simulations, opponent mix-and-match scenarios, and automated postseason odds projections.',
        bullets: [
          'Unlimited Monte Carlo paths up to 5,000 iterations',
          'Full what-if scheduling with opponent swaps',
          'Postseason odds and hosting probability tracking',
        ],
        actions: [
          { label: 'See Diamond Pro Plans', href: '/pricing/diamond-pro' },
          { label: 'Talk with an analyst', href: 'mailto:diamond@blazesportsintel.com' },
        ],
      };
    }

    const response = {
      data: {
        conferenceStrength,
        rpiProjection,
        scheduleImpact,
        projectedRankings,
      },
      membershipTier: normalizedTier,
      upsell,
      metadata: {
        generatedAt: new Date().toISOString(),
        season: conferenceStrength?.season ?? season ?? new Date().getFullYear(),
        modelVersion: '2025.10-strength-1',
      },
    };

    if (this.logger?.debug) {
      this.logger.debug('Scheduling optimization computed', {
        teamId,
        conferenceId,
        matchupCount: prospectiveMatchups.length,
        membershipTier: normalizedTier,
      });
    }

    return response;
  }
}
