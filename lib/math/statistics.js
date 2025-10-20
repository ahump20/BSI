export function mean(values) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function variance(values, sample = false) {
  if (values.length === 0) return 0;
  const avg = mean(values);
  const denom = sample && values.length > 1 ? values.length - 1 : values.length;
  if (denom === 0) return 0;
  const sumSq = values.reduce((sum, value) => {
    const diff = value - avg;
    return sum + diff * diff;
  }, 0);
  return sumSq / denom;
}

export function standardDeviation(values, sample = false) {
  return Math.sqrt(variance(values, sample));
}

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function sigmoid(value) {
  if (value >= 0) {
    const z = Math.exp(-value);
    return 1 / (1 + z);
  }
  const z = Math.exp(value);
  return z / (1 + z);
}

export function safeLogit(probability, epsilon = 1e-6) {
  const p = clamp(probability, epsilon, 1 - epsilon);
  return Math.log(p / (1 - p));
}
