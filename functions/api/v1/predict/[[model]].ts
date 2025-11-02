/**
 * Blaze Sports Intel - Edge Inference API
 * Serves model predictions from Cloudflare Workers with <100ms latency
 *
 * POST /api/v1/predict/is_home_run_ncaa_v1
 * POST /api/v1/predict/xwoba_batball_ncaa_v1
 * etc.
 */

export interface Env {
  KV: KVNamespace;
  R2: R2Bucket;
  DB: D1Database;
  ANALYTICS: AnalyticsEngineDataset;
}

interface FeatureSpec {
  name: string;
  mean: number;
  std: number;
  unit?: string;
}

interface Artifact {
  schema_version: string;
  model_id: string;
  model_key: string;
  sport: string;
  league: string;
  algo: string;
  performance: {
    auc_roc: number;
    auc_pr: number;
    brier_score: number;
    ece: number;
  };
  features: FeatureSpec[];
  coefficients: Record<string, number>;
  intercept: number;
  calibrator?: {
    type: 'platt';
    a: number;
    b: number;
  };
  metadata?: any;
}

interface PredictionRequest {
  features: Record<string, number>;
  entity_id?: string;
  explain?: boolean;
}

interface PredictionResponse {
  model_id: string;
  model_key: string;
  prediction: number;
  probability?: number;
  linear_score: number;
  top_contributors?: Array<{
    feature: string;
    weight: number;
    contribution: number;
    value: number;
  }>;
  performance: {
    auc_roc: number;
    ece: number;
  };
  timestamp: string;
}

// ============================================================================
// MATH UTILITIES
// ============================================================================

function standardize(value: number, mean: number, std: number): number {
  return std > 0 ? (value - mean) / std : 0;
}

function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

function plattCalibration(rawProb: number, a: number, b: number): number {
  // Platt scaling: calibrate probability
  const epsilon = 1e-10;
  const clippedProb = Math.max(epsilon, Math.min(1 - epsilon, rawProb));
  const logit = Math.log(clippedProb / (1 - clippedProb));
  return sigmoid(a * logit + b);
}

// ============================================================================
// MODEL LOADING & CACHING
// ============================================================================

async function loadModel(modelKey: string, env: Env): Promise<Artifact> {
  // 1. Check KV for champion alias
  const cacheKey = `model:${modelKey}:artifact`;
  const cached = await env.KV.get(cacheKey, 'json');

  if (cached) {
    return cached as Artifact;
  }

  // 2. Get alias from KV (points to R2)
  const aliasKey = `alias:${modelKey}`;
  const r2Uri = await env.KV.get(aliasKey);

  if (!r2Uri) {
    throw new Error(`Model alias not found: ${modelKey}`);
  }

  // 3. Fetch from R2
  const r2Key = r2Uri.replace('r2://bsi-models/', '');
  const obj = await env.R2.get(r2Key);

  if (!obj) {
    throw new Error(`Artifact not found in R2: ${r2Key}`);
  }

  const artifact = await obj.json<Artifact>();

  // 4. Cache in KV (1 hour TTL)
  await env.KV.put(cacheKey, JSON.stringify(artifact), {
    expirationTtl: 3600,
  });

  return artifact;
}

// ============================================================================
// PREDICTION ENGINE
// ============================================================================

function predict(artifact: Artifact, features: Record<string, number>, explain: boolean = true) {
  // 1. Standardize features
  let linearScore = artifact.intercept;
  const contributions: Array<{
    feature: string;
    weight: number;
    contribution: number;
    value: number;
  }> = [];

  for (const featSpec of artifact.features) {
    const rawValue = features[featSpec.name] ?? 0;
    const zScore = standardize(rawValue, featSpec.mean, featSpec.std);
    const coef = artifact.coefficients[featSpec.name] ?? 0;
    const contrib = coef * zScore;

    linearScore += contrib;

    if (explain) {
      contributions.push({
        feature: featSpec.name,
        weight: coef,
        contribution: contrib,
        value: rawValue,
      });
    }
  }

  // 2. Apply sigmoid
  let probability = sigmoid(linearScore);

  // 3. Calibrate (Platt scaling)
  if (artifact.calibrator?.type === 'platt') {
    const { a, b } = artifact.calibrator;
    probability = plattCalibration(probability, a, b);
  }

  // 4. Sort contributors by absolute contribution
  if (explain) {
    contributions.sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution));
  }

  return {
    linear_score: linearScore,
    probability,
    top_contributors: explain ? contributions.slice(0, 5) : undefined,
  };
}

// ============================================================================
// LOGGING & ANALYTICS
// ============================================================================

async function logPrediction(
  env: Env,
  modelId: string,
  modelKey: string,
  entityId: string | undefined,
  features: Record<string, number>,
  prediction: number,
  probability: number | undefined,
  topContributors: any[]
) {
  try {
    // Log to D1 for audit trail
    await env.DB.prepare(`
      INSERT INTO prediction_log (
        prediction_id, model_id, entity_type, entity_id,
        features_json, prediction_value, prediction_proba,
        top_contributors_json, timestamp
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      `pred_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      modelId,
      'play',
      entityId || 'unknown',
      JSON.stringify(features),
      prediction,
      probability || null,
      JSON.stringify(topContributors),
      new Date().toISOString()
    ).run();

    // Log to Analytics Engine
    env.ANALYTICS.writeDataPoint({
      blobs: [modelKey, modelId],
      doubles: [probability || prediction],
      indexes: ['prediction'],
    });
  } catch (error) {
    // Don't fail the prediction if logging fails
    console.error('Failed to log prediction:', error);
  }
}

// ============================================================================
// API HANDLERS
// ============================================================================

export const onRequestGet: PagesFunction<Env> = async ({ params, env }) => {
  const modelKey = (params.model as string[])?.[0];

  if (!modelKey) {
    return new Response(
      JSON.stringify({ error: 'Model key required' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    // Load model metadata
    const artifact = await loadModel(modelKey, env);

    return new Response(
      JSON.stringify({
        model_key: artifact.model_key,
        model_id: artifact.model_id,
        sport: artifact.sport,
        league: artifact.league,
        algo: artifact.algo,
        performance: artifact.performance,
        features: artifact.features.map(f => ({
          name: f.name,
          unit: f.unit,
        })),
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=3600',
        },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 404, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

export const onRequestPost: PagesFunction<Env> = async ({ request, params, env }) => {
  const modelKey = (params.model as string[])?.[0];

  if (!modelKey) {
    return new Response(
      JSON.stringify({ error: 'Model key required' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    // 1. Parse request
    const body = await request.json<PredictionRequest>();

    if (!body.features || typeof body.features !== 'object') {
      return new Response(
        JSON.stringify({ error: 'Invalid request: features object required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 2. Load model
    const artifact = await loadModel(modelKey, env);

    // 3. Make prediction
    const result = predict(artifact, body.features, body.explain !== false);

    // 4. Build response
    const response: PredictionResponse = {
      model_id: artifact.model_id,
      model_key: artifact.model_key,
      prediction: result.probability || result.linear_score,
      probability: result.probability,
      linear_score: result.linear_score,
      top_contributors: result.top_contributors,
      performance: {
        auc_roc: artifact.performance.auc_roc,
        ece: artifact.performance.ece,
      },
      timestamp: new Date().toISOString(),
    };

    // 5. Log prediction (async, don't wait)
    env.waitUntil(
      logPrediction(
        env,
        artifact.model_id,
        artifact.model_key,
        body.entity_id,
        body.features,
        response.prediction,
        response.probability,
        result.top_contributors || []
      )
    );

    // 6. Return response
    return new Response(
      JSON.stringify(response),
      {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store',  // Predictions should not be cached
          'X-Model-ID': artifact.model_id,
          'X-Model-Performance': `AUC=${artifact.performance.auc_roc.toFixed(3)}`,
        },
      }
    );
  } catch (error) {
    console.error('Prediction error:', error);

    return new Response(
      JSON.stringify({
        error: (error as Error).message,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

// Health check endpoint
export const onRequestOptions: PagesFunction<Env> = async () => {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
};
