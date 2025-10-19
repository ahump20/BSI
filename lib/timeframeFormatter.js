const DEFAULT_TIMEFRAME_LABELS = {
  '7d': 'Last 7 days',
  '30d': 'Last 30 days',
  '90d': 'Last 90 days',
};

const toReadableFragment = (value) =>
  value
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

export const buildTimeframeLabelMap = (timeframes) => {
  if (!Array.isArray(timeframes)) {
    return {};
  }

  return timeframes.reduce((accumulator, entry) => {
    if (!entry || typeof entry === 'string') {
      return accumulator;
    }

    const key = entry.value ?? entry.key ?? entry.id;
    const label =
      entry.label ?? entry.display ?? entry.name ?? entry.text ?? entry.title;

    if (key && label) {
      accumulator[key] = label;
    }

    return accumulator;
  }, {});
};

export const formatTimeframeLabel = (timeframeKey, overrides = {}) => {
  if (!timeframeKey) {
    return '';
  }

  const normalizedKey = timeframeKey.toString().trim();

  if (normalizedKey in overrides) {
    return overrides[normalizedKey];
  }

  if (normalizedKey in DEFAULT_TIMEFRAME_LABELS) {
    return DEFAULT_TIMEFRAME_LABELS[normalizedKey];
  }

  if (/^\d+d$/i.test(normalizedKey)) {
    const days = parseInt(normalizedKey.slice(0, -1), 10);
    const suffix = days === 1 ? 'day' : 'days';
    return `Last ${days} ${suffix}`;
  }

  if (/^\d+w$/i.test(normalizedKey)) {
    const weeks = parseInt(normalizedKey.slice(0, -1), 10);
    const suffix = weeks === 1 ? 'week' : 'weeks';
    return `Last ${weeks} ${suffix}`;
  }

  if (/^\d+m$/i.test(normalizedKey)) {
    const months = parseInt(normalizedKey.slice(0, -1), 10);
    const suffix = months === 1 ? 'month' : 'months';
    return `Last ${months} ${suffix}`;
  }

  const readableFragment = toReadableFragment(normalizedKey);
  const fallback = readableFragment || normalizedKey;
  return `Last ${fallback}`;
};
