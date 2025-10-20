import { transpose, multiply, addToDiagonal, invert } from '../math/matrix.js';
import { mean } from '../math/statistics.js';

export function trainRidgeRegression(features, targets, lambda = 0.1) {
  if (features.length !== targets.length) {
    throw new Error('Feature and target lengths must match');
  }
  if (features.length === 0) {
    throw new Error('At least one sample is required');
  }

  const featureCount = features[0].length;

  const X = features;
  const y = targets.map((value) => [value]);

  const Xt = transpose(X);
  const XtX = multiply(Xt, X);
  const regularized = addToDiagonal(XtX, lambda);
  const XtY = multiply(Xt, y);
  const inverse = invert(regularized);
  const betaMatrix = multiply(inverse, XtY);
  const coefficients = betaMatrix.map((row) => row[0]);
  const intercept = mean(targets);

  return { coefficients, intercept };
}

export function predictRidge(model, standardizedFeatures) {
  const { coefficients, intercept } = model;
  const linear = intercept + coefficients.reduce((sum, weight, index) => sum + weight * standardizedFeatures[index], 0);
  return linear;
}
