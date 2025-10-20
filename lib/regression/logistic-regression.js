import { dot } from '../math/matrix.js';
import { clamp, sigmoid, safeLogit } from '../math/statistics.js';

const EPSILON = 1e-8;

export function trainLogisticRegression(features, targets, options = {}) {
  const lambda = options.lambda ?? 0.1;
  const learningRate = options.learningRate ?? 0.3;
  const iterations = options.iterations ?? 4000;

  if (features.length !== targets.length) {
    throw new Error('Feature and target lengths must match');
  }

  const featureCount = features[0]?.length ?? 0;
  if (featureCount === 0) {
    throw new Error('At least one feature is required');
  }

  let weights = Array(featureCount).fill(0);
  let bias = 0;

  for (let iter = 0; iter < iterations; iter++) {
    const gradientW = Array(featureCount).fill(0);
    let gradientB = 0;

    for (let i = 0; i < features.length; i++) {
      const prediction = sigmoid(dot(weights, features[i]) + bias);
      const error = prediction - targets[i];

      for (let j = 0; j < featureCount; j++) {
        gradientW[j] += error * features[i][j];
      }
      gradientB += error;
    }

    const scale = 1 / features.length;
    for (let j = 0; j < featureCount; j++) {
      gradientW[j] = gradientW[j] * scale + lambda * weights[j] * scale;
      weights[j] -= learningRate * gradientW[j];
    }
    gradientB *= scale;
    bias -= learningRate * gradientB;
  }

  return { weights, bias };
}

export function predictLogistic(model, standardizedFeatures) {
  const linear = dot(model.weights, standardizedFeatures) + model.bias;
  return sigmoid(linear);
}

export function evaluateLogistic(targets, predictions) {
  let logLoss = 0;
  let brier = 0;
  let correct = 0;

  for (let i = 0; i < targets.length; i++) {
    const p = clamp(predictions[i], EPSILON, 1 - EPSILON);
    logLoss += -(targets[i] * Math.log(p) + (1 - targets[i]) * Math.log(1 - p));
    brier += (p - targets[i]) ** 2;
    const predictedLabel = p >= 0.5 ? 1 : 0;
    if (predictedLabel === targets[i]) correct++;
  }

  logLoss /= targets.length;
  brier /= targets.length;
  const accuracy = correct / targets.length;
  const auc = computeAUC(targets, predictions);

  return { logLoss, brier, accuracy, auc };
}

function computeAUC(targets, predictions) {
  const combined = targets.map((target, index) => ({ target, score: predictions[index] }));
  combined.sort((a, b) => b.score - a.score);

  const positives = targets.filter((value) => value === 1).length;
  const negatives = targets.length - positives;

  if (positives === 0 || negatives === 0) {
    return 0.5;
  }

  let tp = 0;
  let fp = 0;
  let prevTpRate = 0;
  let prevFpRate = 0;
  let prevScore = Number.POSITIVE_INFINITY;
  let auc = 0;

  for (const point of combined) {
    if (point.score !== prevScore) {
      const tpRate = tp / positives;
      const fpRate = fp / negatives;
      auc += trapezoid(prevFpRate, fpRate, prevTpRate, tpRate);
      prevTpRate = tpRate;
      prevFpRate = fpRate;
      prevScore = point.score;
    }

    if (point.target === 1) {
      tp += 1;
    } else {
      fp += 1;
    }
  }

  const tpRate = tp / positives;
  const fpRate = fp / negatives;
  auc += trapezoid(prevFpRate, fpRate, prevTpRate, tpRate);

  return clamp(auc, 0, 1);
}

function trapezoid(x1, x2, y1, y2) {
  return ((x2 - x1) * (y1 + y2)) / 2;
}

export function reliabilityCurve(predictions, targets, bins = 5) {
  const binSize = 1 / bins;
  const curve = [];

  for (let i = 0; i < bins; i++) {
    const lower = i * binSize;
    const upper = lower + binSize;
    let sumPred = 0;
    let sumActual = 0;
    let count = 0;

    for (let j = 0; j < predictions.length; j++) {
      const p = predictions[j];
      if (p >= lower && (i === bins - 1 ? p <= upper : p < upper)) {
        sumPred += p;
        sumActual += targets[j];
        count++;
      }
    }

    if (count > 0) {
      curve.push({
        bucketStart: parseFloat(lower.toFixed(2)),
        bucketEnd: parseFloat(upper.toFixed(2)),
        predicted: parseFloat((sumPred / count).toFixed(3)),
        actual: parseFloat((sumActual / count).toFixed(3)),
        count,
      });
    }
  }

  return curve;
}

export function fitPlattScaling(predictions, targets) {
  const logits = predictions.map((p) => safeLogit(p));
  let a = 1;
  let b = 0;

  for (let iter = 0; iter < 50; iter++) {
    let gradA = 0;
    let gradB = 0;
    let hAA = 0;
    let hAB = 0;
    let hBB = 0;

    for (let i = 0; i < logits.length; i++) {
      const z = a * logits[i] + b;
      const p = sigmoid(z);
      const t = targets[i];
      const diff = p - t;
      gradA += diff * logits[i];
      gradB += diff;
      const w = p * (1 - p);
      hAA += w * logits[i] * logits[i];
      hAB += w * logits[i];
      hBB += w;
    }

    hAA += EPSILON;
    hBB += EPSILON;
    const det = hAA * hBB - hAB * hAB;
    if (Math.abs(det) < EPSILON) break;

    const deltaA = (hBB * gradA - hAB * gradB) / det;
    const deltaB = (hAA * gradB - hAB * gradA) / det;

    a -= deltaA;
    b -= deltaB;

    if (Math.abs(deltaA) < 1e-6 && Math.abs(deltaB) < 1e-6) {
      break;
    }
  }

  return { a, b };
}
