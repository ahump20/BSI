/**
 * Blaze Intelligence Data Schemas
 * Zero-tolerance for fake data - all sources must validate
 */

// Simple validation helpers (no external deps)
function z(type, validator) {
  return {
    parse: (data) => {
      try {
        const result = validator(data);
        if (!result.valid) {
          throw new Error(`Validation failed: ${result.error}`);
        }
        return data;
      } catch (error) {
        throw new Error(`Schema validation error: ${error.message}`);
      }
    },
  };
}

function validateObject(schema) {
  return (data) => {
    if (!data || typeof data !== 'object') {
      return { valid: false, error: 'Expected object' };
    }

    for (const [key, validator] of Object.entries(schema)) {
      if (!(key in data)) {
        return { valid: false, error: `Missing required field: ${key}` };
      }

      const fieldResult = validator(data[key]);
      if (!fieldResult.valid) {
        return { valid: false, error: `Field ${key}: ${fieldResult.error}` };
      }
    }
    return { valid: true };
  };
}

function validateArray(itemValidator) {
  return (data) => {
    if (!Array.isArray(data)) {
      return { valid: false, error: 'Expected array' };
    }

    for (let i = 0; i < data.length; i++) {
      const itemResult = itemValidator(data[i]);
      if (!itemResult.valid) {
        return { valid: false, error: `Item ${i}: ${itemResult.error}` };
      }
    }
    return { valid: true };
  };
}

const isString = (data) =>
  typeof data === 'string' ? { valid: true } : { valid: false, error: 'Expected string' };
const isNumber = (data) =>
  typeof data === 'number' ? { valid: true } : { valid: false, error: 'Expected number' };
const isPositiveInt = (data) =>
  Number.isInteger(data) && data >= 0
    ? { valid: true }
    : { valid: false, error: 'Expected positive integer' };
const isUrl = (data) => {
  try {
    new URL(data);
    return { valid: true };
  } catch {
    return { valid: false, error: 'Expected valid URL' };
  }
};

// Core data schemas
export const KPI = z(
  'object',
  validateObject({
    predictionsToday: isPositiveInt,
    activeClients: isPositiveInt,
    avgResponseSec: isNumber,
    alertsProcessed: isPositiveInt,
  })
);

export const AccuracySeries = z(
  'object',
  validateObject({
    labels: validateArray(isString),
    values: validateArray(isNumber),
  })
);

export const AlertBuckets = z(
  'object',
  validateObject({
    labels: validateArray(isString),
    counts: validateArray(isPositiveInt),
  })
);

export const FBSConference = z(
  'object',
  validateObject({
    id: isString,
    name: isString,
    teams: validateArray(isString),
  })
);

export const FBSData = z(
  'array',
  validateArray(
    validateObject({
      id: isString,
      name: isString,
      teams: validateArray(isString),
    })
  )
);

export const Team = z(
  'object',
  validateObject({
    id: isString,
    name: isString,
    league: isString,
  })
);

export const Teams = z(
  'array',
  validateArray(
    validateObject({
      id: isString,
      name: isString,
      league: isString,
    })
  )
);

export const PortfolioItem = z(
  'object',
  validateObject({
    title: isString,
    description: isString,
    url: isUrl,
  })
);

export const PortfolioList = z(
  'array',
  validateArray(
    validateObject({
      title: isString,
      description: isString,
      url: isUrl,
    })
  )
);

export const LeaderboardEntry = z(
  'object',
  validateObject({
    name: isString,
    score: isNumber,
  })
);

export const Leaderboard = z(
  'array',
  validateArray(
    validateObject({
      name: isString,
      score: isNumber,
    })
  )
);
