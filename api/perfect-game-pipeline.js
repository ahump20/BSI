import PerfectGameClient from './services/perfect-game-client.js';
import { PerfectGameAdapter } from './adapters/perfect-game-adapter.js';
import LoggerService from './services/logger-service.js';

/**
 * Perfect Game Pipeline orchestrates client calls and normalization so the
 * analytics layer receives consistent, production-ready payloads.
 */
export class PerfectGamePipeline {
  constructor(options = {}) {
    this.logger = options.logger ?? new LoggerService({
      service: 'perfect-game-pipeline',
      environment: process.env.NODE_ENV || 'development'
    });

    const clientLogger = options.clientLogger ?? new LoggerService({
      service: 'perfect-game-client',
      environment: this.logger.environment
    });

    this.client = options.client ?? new PerfectGameClient({
      logger: clientLogger,
      ...options.clientOptions
    });

    this.adapter = options.adapter ?? new PerfectGameAdapter({
      logger: this.logger
    });
  }

  async getTopProspects(options = {}) {
    try {
      const response = await this.client.fetchTopProspects(options);
      return this.adapter.normalizeProspectsResponse(response, options);
    } catch (error) {
      this.logger.error('Failed to load Perfect Game top prospects', { options }, error);
      throw error;
    }
  }

  async getPlayerDevelopmentMetrics(playerId, options = {}) {
    if (!playerId) {
      throw new Error('playerId is required to fetch player development metrics.');
    }

    try {
      const response = await this.client.fetchPlayerDevelopment(playerId, options);
      return this.adapter.normalizePlayerDevelopment(response);
    } catch (error) {
      this.logger.error('Failed to load Perfect Game development metrics', { playerId, options }, error);
      throw error;
    }
  }

  async calculateYouthNIL(playerId, options = {}) {
    if (!playerId) {
      throw new Error('playerId is required to calculate NIL valuations.');
    }

    try {
      const response = await this.client.fetchNilValuation(playerId, options);
      return this.adapter.normalizeNilValuation(response);
    } catch (error) {
      this.logger.error('Failed to load Perfect Game NIL valuation', { playerId, options }, error);
      throw error;
    }
  }

  async getUpcomingEvents(options = {}) {
    try {
      const response = await this.client.fetchEventSchedule(options);
      return this.adapter.normalizeEventsResponse(response);
    } catch (error) {
      this.logger.error('Failed to load Perfect Game event schedule', { options }, error);
      throw error;
    }
  }

  async getTeamRankings(ageGroup, options = {}) {
    const query = { ...options };
    if (ageGroup) {
      query.ageGroup = ageGroup;
    }

    try {
      const response = await this.client.fetchTeamRankings(query);
      return this.adapter.normalizeTeamRankings(response);
    } catch (error) {
      this.logger.error('Failed to load Perfect Game team rankings', { ageGroup, options }, error);
      throw error;
    }
  }

  async getTournamentResults(tournamentId, options = {}) {
    try {
      const response = await this.client.fetchTournamentResults(tournamentId, options);
      return this.adapter.normalizeTournamentResults(response);
    } catch (error) {
      this.logger.error('Failed to load Perfect Game tournament results', { tournamentId, options }, error);
      throw error;
    }
  }

  async getMLBDraftPipeline(year, options = {}) {
    try {
      const response = await this.client.fetchDraftBoard(year, options);
      return this.adapter.normalizeDraftBoard(response);
    } catch (error) {
      this.logger.error('Failed to load Perfect Game draft board', { year, options }, error);
      throw error;
    }
  }
}

export default PerfectGamePipeline;
