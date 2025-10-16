import LoggerService from './logger-service.js';

/**
 * HTTP client wrapper for Perfect Game integrations with retry/backoff.
 */
class PerfectGameClient {
  constructor(options = {}) {
    this.baseUrl = (options.baseUrl || process.env.PERFECT_GAME_API_BASE_URL || '').replace(/\/$/, '');
    this.apiKey = options.apiKey ?? process.env.PERFECT_GAME_API_KEY ?? null;
    this.clientId = options.clientId ?? process.env.PERFECT_GAME_CLIENT_ID ?? null;
    this.clientSecret = options.clientSecret ?? process.env.PERFECT_GAME_CLIENT_SECRET ?? null;
    this.partnerCode = options.partnerCode ?? process.env.PERFECT_GAME_PARTNER_CODE ?? null;

    this.logger = options.logger ||
      new LoggerService({
        service: 'perfect-game-client',
        environment: process.env.NODE_ENV || 'development'
      });

    this.timeout = options.timeout ?? 10000;
    this.maxRetries = options.maxRetries ?? 3;
    this.retryDelay = options.retryDelay ?? 500;

    this.axios = options.axios ?? null;
    this.axiosPromise = null;

    if (!this.apiKey) {
      this.logger.warn('Perfect Game API key is not configured; requests may fail.');
    }

    if (!this.baseUrl) {
      this.baseUrl = 'https://api.perfectgame.org/v1';
    }
  }

  async fetchTopProspects(params = {}) {
    return this.request('/prospects/top', { method: 'GET', query: params });
  }

  async fetchPlayerDevelopment(playerId, params = {}) {
    if (!playerId) {
      throw new Error('playerId is required to fetch development metrics.');
    }
    return this.request(`/players/${playerId}/development`, {
      method: 'GET',
      query: params
    });
  }

  async fetchNilValuation(playerId, params = {}) {
    if (!playerId) {
      throw new Error('playerId is required to fetch NIL valuation.');
    }
    return this.request(`/players/${playerId}/nil`, {
      method: 'GET',
      query: params
    });
  }

  async fetchEventSchedule(params = {}) {
    return this.request('/events/schedule', { method: 'GET', query: params });
  }

  async fetchTeamRankings(params = {}) {
    return this.request('/teams/rankings', { method: 'GET', query: params });
  }

  async fetchTournamentResults(tournamentId, params = {}) {
    const path = tournamentId ? `/tournaments/${tournamentId}/results` : '/tournaments/results';
    return this.request(path, { method: 'GET', query: params });
  }

  async fetchDraftBoard(year, params = {}) {
    const draftYear = year ?? new Date().getFullYear();
    return this.request(`/draft/${draftYear}`, { method: 'GET', query: params });
  }

  async request(path, options = {}) {
    const method = (options.method || 'GET').toUpperCase();
    const headers = this.buildHeaders(options.headers);
    const query = this.buildQuery(options.query || options.params);
    const body = options.body ?? options.data;
    const timeout = options.timeout ?? this.timeout;

    const url = this.buildUrl(path, query);

    let attempt = 0;
    let lastError = null;
    const maxAttempts = this.maxRetries + 1;

    while (attempt < maxAttempts) {
      try {
        const response = await this.executeRequest({ url, method, headers, body, timeout });
        this.logger.debug('Perfect Game API request success', {
          url: response.url ?? url,
          method,
          status: response.status,
          rateLimit: response.rateLimit
        });
        return response;
      } catch (error) {
        lastError = error;
        attempt += 1;
        const retry = this.shouldRetry(error, attempt, maxAttempts);

        this.logger.warn('Perfect Game API request failed', {
          url,
          method,
          attempt,
          maxAttempts,
          retrying: retry,
          error: error.message,
          status: error.status ?? error.response?.status ?? null
        });

        if (!retry) {
          throw error;
        }

        await this.delay(this.getBackoffDelay(attempt));
      }
    }

    throw lastError;
  }

  async executeRequest({ url, method, headers, body, timeout }) {
    const axiosInstance = await this.ensureAxios();

    if (axiosInstance) {
      const response = await axiosInstance({
        url,
        method,
        headers,
        data: body,
        timeout,
        validateStatus: () => true
      });

      if (response.status >= 400) {
        throw this.buildHttpError(response.status, response.statusText, response.data, response);
      }

      return {
        data: response.data,
        status: response.status,
        headers: response.headers,
        url: response.config?.url ?? url,
        rateLimit: this.extractRateLimit(response.headers)
      };
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);

    try {
      const fetchOptions = {
        method,
        headers,
        signal: controller.signal
      };

      if (method !== 'GET' && body !== undefined) {
        fetchOptions.body = typeof body === 'string' ? body : JSON.stringify(body);
      }

      const response = await fetch(url, fetchOptions);
      clearTimeout(timer);

      const headersObject = Object.fromEntries(response.headers.entries());

      if (!response.ok) {
        const errorBody = await this.safeParseBody(response);
        throw this.buildHttpError(response.status, response.statusText, errorBody, {
          headers: headersObject,
          url: response.url
        });
      }

      const data = await this.safeParseBody(response);

      return {
        data,
        status: response.status,
        headers: headersObject,
        url: response.url,
        rateLimit: this.extractRateLimit(headersObject)
      };
    } catch (error) {
      clearTimeout(timer);
      if (error.name === 'AbortError') {
        const timeoutError = new Error(`Request to ${url} timed out after ${timeout}ms`);
        timeoutError.code = 'ETIMEDOUT';
        throw timeoutError;
      }
      throw error;
    }
  }

  async ensureAxios() {
    if (this.axios) {
      return this.axios;
    }

    if (this.axiosPromise) {
      return this.axiosPromise;
    }

    this.axiosPromise = import('axios')
      .then(module => {
        this.axios = module.default ?? module;
        return this.axios;
      })
      .catch(error => {
        this.logger.debug('Axios not available, falling back to fetch', { error: error.message });
        this.axios = null;
        return null;
      });

    return this.axiosPromise;
  }

  shouldRetry(error, attempt, maxAttempts) {
    if (attempt >= maxAttempts) {
      return false;
    }

    const status = error.status ?? error.response?.status;
    if (!status) {
      return true;
    }

    if (status >= 500 || status === 429) {
      return true;
    }

    const retriableCodes = ['ECONNRESET', 'ETIMEDOUT', 'EAI_AGAIN'];
    if (retriableCodes.includes(error.code)) {
      return true;
    }

    return false;
  }

  getBackoffDelay(attempt) {
    const base = this.retryDelay * Math.pow(2, attempt - 1);
    const jitter = Math.random() * 0.25 * base;
    return Math.min(base + jitter, 30000);
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  buildHeaders(additional = {}) {
    const headers = {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'User-Agent': 'BlazeSportsIntel/PerfectGameClient',
      ...additional
    };

    if (this.apiKey) headers['X-API-Key'] = this.apiKey;
    if (this.clientId) headers['X-Client-Id'] = this.clientId;
    if (this.clientSecret) headers['X-Client-Secret'] = this.clientSecret;
    if (this.partnerCode) headers['X-Partner-Code'] = this.partnerCode;

    return headers;
  }

  buildQuery(params = {}) {
    const query = new URLSearchParams();
    Object.entries(params || {}).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') return;
      query.append(key, Array.isArray(value) ? value.join(',') : value);
    });

    const queryString = query.toString();
    return queryString ? `?${queryString}` : '';
  }

  buildUrl(path, query = '') {
    const normalizedPath = path.startsWith('http')
      ? path
      : `${this.baseUrl}${path.startsWith('/') ? '' : '/'}${path}`;
    return `${normalizedPath}${query}`;
  }

  buildHttpError(status, statusText, data, response) {
    const error = new Error(`Perfect Game API responded with ${status} ${statusText}`);
    error.status = status;
    error.data = data;
    error.response = response;
    return error;
  }

  async safeParseBody(response) {
    try {
      const contentType = response.headers?.get
        ? response.headers.get('content-type')
        : response.headers?.['content-type'];

      if (contentType && contentType.includes('application/json')) {
        try {
          return await response.json();
        } catch (error) {
          if (typeof response.clone === 'function') {
            const clone = response.clone();
            const text = await clone.text();
            try {
              return text ? JSON.parse(text) : null;
            } catch (parseError) {
              return text || null;
            }
          }
          throw error;
        }
      }

      const text = await response.text();
      if (!text) return null;

      try {
        return JSON.parse(text);
      } catch (error) {
        return text;
      }
    } catch (error) {
      this.logger.debug('Failed to parse response body, returning null', {
        error: error.message
      });
      return null;
    }
  }

  extractRateLimit(headers = {}) {
    if (!headers) return null;
    const limit = headers['x-ratelimit-limit'] ?? headers['x-rate-limit-limit'];
    const remaining =
      headers['x-ratelimit-remaining'] ?? headers['x-rate-limit-remaining'];
    const reset = headers['x-ratelimit-reset'] ?? headers['x-rate-limit-reset'];

    if (limit == null && remaining == null && reset == null) {
      return null;
    }

    return {
      limit: limit != null ? Number(limit) : null,
      remaining: remaining != null ? Number(remaining) : null,
      reset: reset != null ? Number(reset) : null
    };
  }
}

export default PerfectGameClient;
export { PerfectGameClient };
