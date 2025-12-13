/**
 * BSI Predictive Modeling Engine - Module Exports
 *
 * Hybrid Monte Carlo + ML prediction engine with stateful psychological modeling.
 *
 * @author Austin Humphrey - Blaze Sports Intel
 * @version 1.0.0
 */

// Types
export * from './types';

// Core Engine
export { BsiPredictionEngine } from './bsi-prediction-engine';

// Modules
export { SimulationCore } from './simulation-core';
export { MLPredictor } from './ml-predictor';
export { PsychologyModel } from './psychology-model';
export { StateTracker } from './state-tracker';
export { ExplainabilityEngine } from './explainability';
export { CalibrationEngine } from './calibration';

// Integrations
export {
  DiamondIntegration,
  diamondToPsychState,
  extractPredictionFeatures,
  enhanceTeamState,
  generateBaselineScores,
} from './diamond-integration';

// Constants re-exported for convenience
export {
  PYTHAGOREAN_EXPONENTS,
  HOME_ADVANTAGE,
  PSYCHOLOGY_PARAMS,
} from './types';
