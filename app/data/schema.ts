// Type-safe schema with comprehensive validation and TypeScript interfaces

export interface KPIData {
  predictionsToday: number;
  activeClients: number;
  avgResponseSec: number;
  alertsProcessed: number;
  timestamp?: string;
}

export interface SeriesData {
  labels: string[];
  values: number[];
  metadata?: {
    unit?: string;
    description?: string;
  };
}

export interface AlertBucket {
  labels: string[];
  counts: number[];
  severities?: ('low' | 'medium' | 'high' | 'critical')[];
}

export interface Team {
  id: string;
  name: string;
  league: string;
  stats?: {
    wins?: number;
    losses?: number;
    rating?: number;
  };
}

export interface Player {
  id?: string;
  name: string;
  score: number;
  rank?: number;
  trend?: 'up' | 'down' | 'stable';
  avatar?: string;
}

export interface ConferenceData {
  id: string;
  name: string;
  teams: string[];
  division?: string;
}

export interface PortfolioItem {
  id?: string;
  title: string;
  description?: string;
  url: string;
  category?: string;
  tags?: string[];
  thumbnail?: string;
}

// Enhanced validators with detailed error messages
class ValidationError extends Error {
  constructor(
    public field: string,
    public expected: string,
    public received: any
  ) {
    super(`Validation failed for ${field}: expected ${expected}, got ${typeof received}`);
    this.name = 'ValidationError';
  }
}

const validators = {
  isNum: (x: any): x is number => typeof x === 'number' && Number.isFinite(x),
  isInt: (x: any): x is number => Number.isInteger(x),
  isStr: (x: any): x is string => typeof x === 'string',
  isArr: (x: any): x is any[] => Array.isArray(x),
  isObj: (x: any): x is object => x !== null && typeof x === 'object' && !Array.isArray(x),
  isUrl: (x: any): x is string => {
    try {
      new URL(x);
      return true;
    } catch {
      return false;
    }
  },
  isEmail: (x: any): x is string => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(x),
  isDate: (x: any): x is string => !isNaN(Date.parse(x)),
};

export const schema = {
  kpi(raw: any): KPIData {
    if (!validators.isObj(raw)) throw new ValidationError('kpi', 'object', raw);
    if (!validators.isInt(raw.predictionsToday))
      throw new ValidationError('predictionsToday', 'integer', raw.predictionsToday);
    if (!validators.isInt(raw.activeClients))
      throw new ValidationError('activeClients', 'integer', raw.activeClients);
    if (!validators.isNum(raw.avgResponseSec))
      throw new ValidationError('avgResponseSec', 'number', raw.avgResponseSec);
    if (!validators.isInt(raw.alertsProcessed))
      throw new ValidationError('alertsProcessed', 'integer', raw.alertsProcessed);

    return {
      predictionsToday: raw.predictionsToday,
      activeClients: raw.activeClients,
      avgResponseSec: raw.avgResponseSec,
      alertsProcessed: raw.alertsProcessed,
      timestamp: raw.timestamp || new Date().toISOString(),
    };
  },

  accuracySeries(raw: any): SeriesData {
    if (!validators.isObj(raw)) throw new ValidationError('accuracySeries', 'object', raw);
    if (!validators.isArr(raw.labels)) throw new ValidationError('labels', 'array', raw.labels);
    if (!validators.isArr(raw.values)) throw new ValidationError('values', 'array', raw.values);
    if (raw.labels.length !== raw.values.length) {
      throw new Error(
        `Length mismatch: labels(${raw.labels.length}) !== values(${raw.values.length})`
      );
    }
    if (!raw.labels.every(validators.isStr))
      throw new ValidationError('labels', 'string[]', raw.labels);
    if (!raw.values.every(validators.isNum))
      throw new ValidationError('values', 'number[]', raw.values);

    return {
      labels: raw.labels,
      values: raw.values,
      metadata: raw.metadata,
    };
  },

  alertBuckets(raw: any): AlertBucket {
    if (!validators.isObj(raw)) throw new ValidationError('alertBuckets', 'object', raw);
    if (!validators.isArr(raw.labels)) throw new ValidationError('labels', 'array', raw.labels);
    if (!validators.isArr(raw.counts)) throw new ValidationError('counts', 'array', raw.counts);
    if (raw.labels.length !== raw.counts.length) {
      throw new Error(
        `Length mismatch: labels(${raw.labels.length}) !== counts(${raw.counts.length})`
      );
    }
    if (!raw.labels.every(validators.isStr))
      throw new ValidationError('labels', 'string[]', raw.labels);
    if (!raw.counts.every(validators.isInt))
      throw new ValidationError('counts', 'integer[]', raw.counts);

    return {
      labels: raw.labels,
      counts: raw.counts,
      severities: raw.severities,
    };
  },

  teams(raw: any): Team[] {
    if (!validators.isArr(raw)) throw new ValidationError('teams', 'array', raw);
    return raw.map((t: any, i: number) => {
      if (!validators.isObj(t)) throw new ValidationError(`teams[${i}]`, 'object', t);
      if (!validators.isStr(t.id)) throw new ValidationError(`teams[${i}].id`, 'string', t.id);
      if (!validators.isStr(t.name))
        throw new ValidationError(`teams[${i}].name`, 'string', t.name);
      if (!validators.isStr(t.league))
        throw new ValidationError(`teams[${i}].league`, 'string', t.league);

      return {
        id: t.id,
        name: t.name,
        league: t.league,
        stats: t.stats,
      };
    });
  },

  leaderboard(raw: any): Player[] {
    if (!validators.isArr(raw)) throw new ValidationError('leaderboard', 'array', raw);
    return raw.map((p: any, i: number) => {
      if (!validators.isObj(p)) throw new ValidationError(`player[${i}]`, 'object', p);
      if (!validators.isStr(p.name))
        throw new ValidationError(`player[${i}].name`, 'string', p.name);
      if (!validators.isNum(p.score))
        throw new ValidationError(`player[${i}].score`, 'number', p.score);

      return {
        id: p.id,
        name: p.name,
        score: p.score,
        rank: p.rank,
        trend: p.trend,
        avatar: p.avatar,
      };
    });
  },

  portfolio(raw: any): PortfolioItem[] {
    if (!validators.isArr(raw)) throw new ValidationError('portfolio', 'array', raw);
    return raw.map((item: any, i: number) => {
      if (!validators.isObj(item)) throw new ValidationError(`portfolio[${i}]`, 'object', item);
      if (!validators.isStr(item.title))
        throw new ValidationError(`portfolio[${i}].title`, 'string', item.title);
      if (!validators.isStr(item.url))
        throw new ValidationError(`portfolio[${i}].url`, 'string', item.url);

      return {
        id: item.id,
        title: item.title,
        description: item.description,
        url: item.url,
        category: item.category,
        tags: item.tags,
        thumbnail: item.thumbnail,
      };
    });
  },
};
