import LoggerService from '../services/logger-service.js';

/**
 * Adapter responsible for normalizing Perfect Game API payloads into
 * deterministic shapes for downstream analytics layers.
 */
class PerfectGameAdapter {
  constructor(options = {}) {
    this.logger = options.logger || new LoggerService({
      service: 'perfect-game-adapter',
      environment: process.env.NODE_ENV || 'development'
    });
  }

  /**
   * Normalize a top prospects API response.
   */
  normalizeProspectsResponse(response = {}, query = {}) {
    const payload = response?.data ?? response ?? {};
    const metadata = payload.meta ?? payload.metadata ?? {};
    const prospects = this.toArray(
      payload.prospects || payload.results || payload.items || []
    );

    return {
      query: {
        gradYear: query.gradYear ?? metadata.gradYear ?? null,
        position: query.position ?? metadata.position ?? 'all',
        state: query.state ?? metadata.state ?? null,
        limit: query.limit ?? metadata.limit ?? prospects.length || null
      },
      totalProspects: metadata.total ?? payload.total ?? prospects.length,
      lastUpdated:
        metadata.lastUpdated || payload.lastUpdated || new Date().toISOString(),
      prospects: prospects.map((prospect, index) =>
        this.normalizeProspect(prospect, index)
      ),
      teamRankings: this.normalizeTeamRankings(payload.teamRankings),
      upcomingEvents: this.normalizeEvents(payload.upcomingEvents),
      rateLimit: response.rateLimit || this.extractRateLimit(metadata)
    };
  }

  /**
   * Normalize player development response.
   */
  normalizePlayerDevelopment(response = {}) {
    const payload = response?.data ?? response ?? {};
    const player = payload.player ?? payload.profile ?? {};
    const progression = payload.progression ?? payload.timeline ?? {};
    const metrics = {
      exitVelocity: this.normalizeProgression(
        progression.exitVelocity ?? progression.exitVelo
      ),
      fastballVelocity: this.normalizeProgression(
        progression.fastball ?? progression.fastballVelocity
      ),
      infieldVelocity: this.normalizeProgression(
        progression.infieldVelocity ?? progression.ifVelo
      ),
      outfieldVelocity: this.normalizeProgression(
        progression.outfieldVelocity ?? progression.ofVelo
      ),
      popTime: this.normalizeProgression(
        progression.popTime ?? progression.pop
      ),
      sixtyYardDash: this.normalizeProgression(
        progression.sixtyYard ?? progression.sixty
      )
    };

    return {
      player: {
        id: player.id ?? player.playerId ?? payload.playerId ?? null,
        name:
          this.joinName(player.firstName, player.lastName) ||
          player.name ||
          null,
        graduationYear:
          this.toNumber(player.gradYear ?? player.graduationYear) ?? null,
        birthDate: this.toDate(player.birthDate ?? player.dob),
        hometown: player.hometown ?? player.city ?? null,
        primaryPosition: player.primaryPosition ?? player.position ?? null,
        bats: player.bats ?? player.batsHand ?? null,
        throws: player.throws ?? player.throwHand ?? null,
        height: this.normalizeHeight(player.height ?? player.physical?.height),
        weight: this.normalizeWeight(player.weight ?? player.physical?.weight)
      },
      metrics,
      percentileRanks: payload.percentileRanks ?? payload.percentiles ?? {},
      notes: payload.notes ?? payload.reports ?? [],
      rateLimit: response.rateLimit ?? this.extractRateLimit(payload.meta)
    };
  }

  /**
   * Normalize NIL valuation response.
   */
  normalizeNilValuation(response = {}) {
    const payload = response?.data ?? response ?? {};
    const valuation = payload.valuation ?? payload.nil ?? payload ?? {};

    return {
      playerId: valuation.playerId ?? payload.playerId ?? null,
      currency: valuation.currency ?? 'USD',
      currentValuation: this.toCurrencyValue(valuation.current ?? valuation.value),
      projectedCollegeValuation: this.toCurrencyValue(
        valuation.projectedCollege ?? valuation.projected
      ),
      lastUpdated: valuation.updatedAt ?? payload.updatedAt ?? null,
      breakdown: valuation.breakdown ?? valuation.components ?? {},
      endorsements: this.toArray(valuation.endorsements).map(endorsement => ({
        name: endorsement.name ?? endorsement.brand ?? null,
        category: endorsement.category ?? null,
        value: this.toCurrencyValue(endorsement.value)
      })),
      social: valuation.social ?? valuation.socialMetrics ?? {},
      rateLimit: response.rateLimit ?? this.extractRateLimit(payload.meta)
    };
  }

  /**
   * Normalize event schedule.
   */
  normalizeEventsResponse(response = {}) {
    const payload = response?.data ?? response ?? {};
    const events = this.normalizeEvents(payload.events ?? payload.items);

    return {
      events,
      lastUpdated: payload.lastUpdated ?? new Date().toISOString(),
      rateLimit: response.rateLimit ?? this.extractRateLimit(payload.meta)
    };
  }

  /**
   * Normalize team rankings response.
   */
  normalizeTeamRankings(response = {}) {
    const payload = response?.data ?? response ?? {};
    const rankings = payload.rankings ?? payload.teams ?? payload ?? {};

    return {
      national: this.toArray(rankings.national).map(team => ({
        rank: this.toNumber(team.rank),
        team: team.team ?? team.name ?? null,
        state: team.state ?? null,
        points: this.toNumber(team.points),
        ageGroup: team.ageGroup ?? team.level ?? null
      })),
      regional: this.toArray(rankings.regional).map(team => ({
        rank: this.toNumber(team.rank),
        region: team.region ?? null,
        team: team.team ?? team.name ?? null,
        points: this.toNumber(team.points),
        ageGroup: team.ageGroup ?? null
      })),
      state: this.toArray(rankings.state).map(team => ({
        rank: this.toNumber(team.rank),
        state: team.state ?? null,
        team: team.team ?? team.name ?? null,
        points: this.toNumber(team.points),
        ageGroup: team.ageGroup ?? null
      }))
    };
  }

  /**
   * Normalize tournament results response.
   */
  normalizeTournamentResults(response = {}) {
    const payload = response?.data ?? response ?? {};
    const tournament = payload.tournament ?? payload.meta ?? {};

    return {
      tournament: {
        id: tournament.id ?? payload.id ?? null,
        name: tournament.name ?? payload.name ?? null,
        level: tournament.level ?? payload.level ?? null,
        startDate: this.toDate(tournament.startDate ?? payload.startDate),
        endDate: this.toDate(tournament.endDate ?? payload.endDate),
        location: tournament.location ?? payload.location ?? null
      },
      standings: this.toArray(payload.standings ?? payload.results).map(
        (team, index) => ({
          rank: this.toNumber(team.rank) ?? index + 1,
          team: team.team ?? team.name ?? null,
          record: team.record ?? null,
          runsScored: this.toNumber(team.runsScored ?? team.runs_for),
          runsAllowed: this.toNumber(team.runsAllowed ?? team.runs_against)
        })
      ),
      awards: this.toArray(payload.awards).map(award => ({
        category: award.category ?? null,
        name: award.name ?? null,
        team: award.team ?? null,
        stats: award.stats ?? null
      })),
      rateLimit: response.rateLimit ?? this.extractRateLimit(payload.meta)
    };
  }

  /**
   * Normalize draft board response.
   */
  normalizeDraftBoard(response = {}) {
    const payload = response?.data ?? response ?? {};
    const draft = payload.draft ?? payload;

    return {
      year: draft.year ?? payload.year ?? null,
      summary: draft.summary ?? {},
      prospects: this.toArray(draft.prospects).map((prospect, index) => ({
        pick: this.toNumber(prospect.pick) ?? index + 1,
        round: prospect.round ?? null,
        player: this.joinName(prospect.firstName, prospect.lastName) ||
          prospect.player ||
          null,
        position: prospect.position ?? null,
        school: prospect.school ?? prospect.highSchool ?? null,
        commitment: this.normalizeCommitment(prospect.commitment),
        tools: prospect.tools ?? {},
        notes: prospect.notes ?? null
      })),
      rateLimit: response.rateLimit ?? this.extractRateLimit(payload.meta)
    };
  }

  /**
   * Normalize a single prospect object.
   */
  normalizeProspect(prospect = {}, index = 0) {
    const player = prospect.player ?? prospect.profile ?? prospect;
    const contact = player.contact ?? {};
    const ranking = prospect.rankings ?? player.rankings ?? {};
    const metrics = this.normalizeMetrics(
      prospect.metrics ?? player.metrics ?? prospect.measurements
    );

    return {
      id: player.id ?? player.playerId ?? prospect.playerId ?? null,
      rank: this.toNumber(prospect.rank ?? prospect.nationalRank) ?? index + 1,
      name:
        this.joinName(player.firstName, player.lastName) ||
        player.name ||
        prospect.name ||
        null,
      graduationYear:
        this.toNumber(prospect.gradYear ?? player.gradYear ?? player.classYear) ??
        null,
      position: prospect.position ?? player.primaryPosition ?? null,
      bats: player.bats ?? player.batsHand ?? null,
      throws: player.throws ?? player.throwsHand ?? null,
      height: this.normalizeHeight(player.height ?? player.physical?.height),
      weight: this.normalizeWeight(player.weight ?? player.physical?.weight),
      hometown: player.hometown ?? contact.city ?? null,
      state: player.state ?? contact.state ?? null,
      highSchool: player.highSchool ?? player.school ?? null,
      travelTeam: player.travelTeam ?? player.club ?? null,
      perfectGameGrade: this.toNumber(
        prospect.perfectGameGrade ?? player.grade ?? prospect.grade
      ),
      metrics,
      rankings: {
        national: this.toNumber(ranking.national ?? ranking.overall),
        state: this.toNumber(ranking.state),
        position: this.toNumber(ranking.position ?? ranking.positional)
      },
      commitment: this.normalizeCommitment(
        prospect.commitment ?? player.commitment ?? player.college
      ),
      events: this.normalizeEvents(prospect.events ?? player.events),
      scouting: prospect.scouting ?? player.scouting ?? {}
    };
  }

  /**
   * Normalize metrics block.
   */
  normalizeMetrics(metrics = {}) {
    const data = metrics.data ?? metrics;
    const updatedAt = data.updatedAt ?? metrics.updatedAt ?? null;

    return {
      exitVelocity: this.normalizeVelocity(
        this.pickValue(data, ['exitVelocity', 'exitVelo', 'maxExitVelocity'])
      ),
      fastballVelocity: this.normalizeVelocity(
        this.pickValue(data, ['fastball', 'fbVelocity', 'fastballVelocity'])
      ),
      infieldVelocity: this.normalizeVelocity(
        this.pickValue(data, ['infieldVelocity', 'ifVelo'])
      ),
      outfieldVelocity: this.normalizeVelocity(
        this.pickValue(data, ['outfieldVelocity', 'ofVelo'])
      ),
      popTime: this.normalizeTime(
        this.pickValue(data, ['popTime', 'pop'])
      ),
      sixtyYardDash: this.normalizeTime(
        this.pickValue(data, ['sixtyYard', 'sixty'])
      ),
      spinRate: this.normalizeVelocity(
        this.pickValue(data, ['spinRate', 'spin'])
      ),
      updatedAt
    };
  }

  /**
   * Normalize arrays of events into consistent schema.
   */
  normalizeEvents(events = []) {
    return this.toArray(events).map(event => ({
      id: event.id ?? event.eventId ?? null,
      name: event.name ?? event.title ?? null,
      type: event.type ?? event.category ?? null,
      startDate: this.toDate(event.startDate ?? event.date ?? event.start),
      endDate: this.toDate(event.endDate ?? event.end),
      location: {
        venue: event.venue ?? null,
        city: event.city ?? event.location?.city ?? null,
        state: event.state ?? event.location?.state ?? null,
        country: event.country ?? event.location?.country ?? 'USA'
      },
      status: event.status ?? event.registrationStatus ?? 'scheduled',
      format: event.format ?? null,
      result: event.result ?? event.performance ?? null
    }));
  }

  /**
   * Normalize commitment strings/objects into a consistent schema.
   */
  normalizeCommitment(commitment) {
    if (!commitment) {
      return {
        school: null,
        status: 'uncommitted',
        committedAt: null,
        raw: null,
        isSigned: false
      };
    }

    if (typeof commitment === 'object') {
      return {
        school: commitment.school ?? commitment.name ?? null,
        status: this.normalizeCommitmentStatus(commitment.status),
        committedAt: commitment.committedAt ?? commitment.date ?? null,
        isSigned: Boolean(commitment.signed ?? commitment.isSigned),
        raw: commitment
      };
    }

    const match = String(commitment).match(/^(.*?)(?:\s*\((.*)\))?$/);
    const school = match?.[1]?.trim() || commitment;
    const statusText = match?.[2]?.trim() ?? 'verbal';

    return {
      school,
      status: this.normalizeCommitmentStatus(statusText),
      committedAt: null,
      isSigned: /signed/i.test(statusText),
      raw: commitment
    };
  }

  normalizeCommitmentStatus(status) {
    if (!status) return 'uncommitted';
    const normalized = status.toString().toLowerCase();

    if (normalized.includes('verbal') || normalized.includes('commit')) {
      return 'verbal';
    }

    if (normalized.includes('signed') || normalized.includes('nli')) {
      return 'signed';
    }

    if (normalized.includes('decommit')) {
      return 'decommitted';
    }

    return normalized;
  }

  /**
   * Normalize height to object with feet/inches/centimeters.
   */
  normalizeHeight(height) {
    if (!height && height !== 0) {
      return {
        raw: null,
        feet: null,
        inches: null,
        totalInches: null,
        centimeters: null,
        formatted: null
      };
    }

    let feet = null;
    let inches = null;

    if (typeof height === 'number') {
      const totalInches = Math.round(height);
      feet = Math.floor(totalInches / 12);
      inches = totalInches - feet * 12;
    } else {
      const normalized = String(height).replace(/"|\s|ft|in/gi, '');
      if (normalized.includes('-')) {
        const [ft, inch] = normalized.split('-');
        feet = this.toNumber(ft);
        inches = this.toNumber(inch);
      } else if (normalized.includes("'")) {
        const [ft, inch] = normalized.split("'");
        feet = this.toNumber(ft);
        inches = this.toNumber(inch?.replace(/"/, ''));
      } else if (/^\d+(?:\.\d+)?$/.test(normalized)) {
        const value = parseFloat(normalized);
        feet = Math.floor(value);
        inches = Math.round((value - feet) * 12);
      } else {
        const match = String(height).match(/(\d+)[^\d]+(\d+)/);
        feet = this.toNumber(match?.[1]);
        inches = this.toNumber(match?.[2]);
      }
    }

    const totalInches =
      typeof feet === 'number' && typeof inches === 'number'
        ? feet * 12 + inches
        : null;
    const centimeters =
      typeof totalInches === 'number' ? Number((totalInches * 2.54).toFixed(1)) : null;

    return {
      raw: height,
      feet,
      inches,
      totalInches,
      centimeters,
      formatted:
        typeof feet === 'number' && typeof inches === 'number'
          ? `${feet}'${inches}"`
          : height ?? null
    };
  }

  /**
   * Normalize velocity (mph default) with m/s conversion.
   */
  normalizeVelocity(value, defaultUnit = 'mph') {
    if (value == null || value === '') {
      return {
        raw: value ?? null,
        value: null,
        unit: defaultUnit,
        metersPerSecond: null,
        formatted: null
      };
    }

    let numericValue = null;
    let unit = defaultUnit;

    if (typeof value === 'object' && value !== null) {
      numericValue = this.toNumber(value.value ?? value.mph ?? value.amount);
      unit = value.unit ?? value.units ?? defaultUnit;
    } else {
      const match = String(value).match(/([\d.]+)/);
      numericValue = match ? parseFloat(match[1]) : this.toNumber(value);
      const unitMatch = String(value).match(/(mph|kph|km\/h|mps|m\/s)/i);
      if (unitMatch) {
        const normalized = unitMatch[1].toLowerCase();
        if (normalized === 'kph' || normalized === 'km/h') unit = 'km/h';
        else if (normalized === 'mps' || normalized === 'm/s') unit = 'm/s';
        else unit = 'mph';
      }
    }

    const metersPerSecond = this.convertVelocityToMps(numericValue, unit);

    return {
      raw: value,
      value: numericValue,
      unit,
      metersPerSecond,
      formatted:
        typeof numericValue === 'number' && !Number.isNaN(numericValue)
          ? `${numericValue} ${unit}`
          : null
    };
  }

  /**
   * Normalize time measurements (seconds).
   */
  normalizeTime(value, unit = 'seconds') {
    if (value == null || value === '') {
      return {
        raw: value ?? null,
        value: null,
        unit,
        formatted: null
      };
    }

    const numericValue = this.toNumber(value);
    return {
      raw: value,
      value: numericValue,
      unit,
      formatted:
        typeof numericValue === 'number' && !Number.isNaN(numericValue)
          ? `${numericValue} ${unit}`
          : null
    };
  }

  /**
   * Normalize athlete weight to consistent object.
   */
  normalizeWeight(value) {
    if (value == null || value === '') {
      return {
        raw: value ?? null,
        pounds: null,
        kilograms: null
      };
    }

    const numeric = this.toNumber(value);
    const pounds = Number.isFinite(numeric) ? numeric : null;
    const kilograms =
      typeof pounds === 'number' ? Number((pounds * 0.453592).toFixed(1)) : null;

    return {
      raw: value,
      pounds,
      kilograms
    };
  }

  normalizeProgression(entries = []) {
    return this.toArray(entries).map(entry => ({
      value: this.toNumber(entry.value ?? entry.score ?? entry.measurement),
      unit: entry.unit ?? entry.units ?? entry.metric ?? null,
      label: entry.label ?? entry.age ?? entry.level ?? null,
      recordedAt: this.toDate(entry.date ?? entry.recordedAt ?? entry.timestamp)
    }));
  }

  joinName(firstName, lastName) {
    return [firstName, lastName].filter(Boolean).join(' ').trim() || null;
  }

  toArray(value) {
    if (!value) return [];
    return Array.isArray(value) ? value : [value];
  }

  toNumber(value) {
    if (value == null || value === '') return null;
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : null;
  }

  toCurrencyValue(value) {
    if (!value && value !== 0) return null;
    if (typeof value === 'number') return value;
    const match = String(value).replace(/[$,]/g, '');
    const numeric = Number(match);
    return Number.isFinite(numeric) ? numeric : null;
  }

  toDate(value) {
    if (!value) return null;
    const date = value instanceof Date ? value : new Date(value);
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
  }

  pickValue(object, keys) {
    if (!object) return null;
    for (const key of keys) {
      if (object[key] != null && object[key] !== '') {
        return object[key];
      }
    }
    return null;
  }

  convertVelocityToMps(value, unit) {
    if (value == null || Number.isNaN(value)) return null;
    if (unit === 'km/h' || unit === 'kph') {
      return Number((value / 3.6).toFixed(2));
    }

    if (unit === 'm/s' || unit === 'mps') {
      return Number(value.toFixed(2));
    }

    // default mph
    return Number((value * 0.44704).toFixed(2));
  }

  extractRateLimit(meta = {}) {
    if (!meta) return null;
    const limit = meta.rateLimit ?? meta.limit;
    const remaining = meta.rateLimitRemaining ?? meta.remaining;
    const reset = meta.rateLimitReset ?? meta.reset;

    if (limit == null && remaining == null && reset == null) {
      return null;
    }

    return {
      limit: this.toNumber(limit),
      remaining: this.toNumber(remaining),
      reset: reset ? Number(reset) : null
    };
  }
}

const defaultAdapter = new PerfectGameAdapter();
export default defaultAdapter;
export { PerfectGameAdapter };
