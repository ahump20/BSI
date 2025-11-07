/**
 * Blaze Sports Intel - Player Projection Model Trainer
 *
 * Trains ML models for player development projections.
 * Designed to run as a Cloudflare Workers cron job.
 *
 * Training Process:
 * 1. Fetch historical player data from D1
 * 2. Extract features (stats, age, position, level)
 * 3. Train model using Workers AI or scikit-learn
 * 4. Evaluate model accuracy on test set
 * 5. Store model weights in R2
 * 6. Update predictive_models table
 * 7. Generate projections for all active players
 *
 * Cron Schedule: Daily at 3:00 AM America/Chicago
 */

/**
 * Main training function - called by cron trigger
 */
export async function trainPlayerProjectionModel(env, sport) {
  const startTime = Date.now();
  const jobId = `train_${sport}_${startTime}`;

  console.log(`[${jobId}] Starting model training for ${sport}`);

  try {
    // Create training job record
    await createTrainingJob(env.DB, jobId, sport, 'player_development');

    // Step 1: Fetch training data
    console.log(`[${jobId}] Fetching training data...`);
    const trainingData = await fetchTrainingData(env.DB, sport);

    if (!trainingData || trainingData.length < 100) {
      throw new Error(`Insufficient training data: ${trainingData?.length || 0} samples`);
    }

    console.log(`[${jobId}] Retrieved ${trainingData.length} training samples`);

    // Step 2: Prepare features and labels
    console.log(`[${jobId}] Preparing features...`);
    const { features, labels, scaler } = prepareFeatures(trainingData, sport);

    // Step 3: Split into train/test sets (80/20)
    const splitIndex = Math.floor(features.length * 0.8);
    const trainFeatures = features.slice(0, splitIndex);
    const trainLabels = labels.slice(0, splitIndex);
    const testFeatures = features.slice(splitIndex);
    const testLabels = labels.slice(splitIndex);

    console.log(`[${jobId}] Train set: ${trainFeatures.length}, Test set: ${testFeatures.length}`);

    // Step 4: Train model
    console.log(`[${jobId}] Training model...`);
    const model = await trainModel(trainFeatures, trainLabels, sport);

    // Step 5: Evaluate model
    console.log(`[${jobId}] Evaluating model...`);
    const metrics = await evaluateModel(model, testFeatures, testLabels);

    console.log(`[${jobId}] Model metrics:`, metrics);

    // Step 6: Store model in R2
    console.log(`[${jobId}] Storing model in R2...`);
    const modelPath = await storeModelInR2(env.R2, model, jobId, sport, scaler);

    // Step 7: Create model record in D1
    console.log(`[${jobId}] Creating model record...`);
    const modelId = `model_${sport}_${Date.now()}`;
    await createModelRecord(env.DB, {
      modelId,
      modelName: `Player Development - ${sport}`,
      version: '1.0.0',
      sport,
      modelType: 'player_development',
      trainedAt: Math.floor(Date.now() / 1000),
      metrics: JSON.stringify(metrics),
      parameters: JSON.stringify(model.parameters),
      r2ModelPath: modelPath,
      status: 'active'
    });

    // Step 8: Mark previous models as deprecated
    await deprecateOldModels(env.DB, modelId, sport, 'player_development');

    // Step 9: Update training job status
    const duration = Math.floor((Date.now() - startTime) / 1000);
    await updateTrainingJob(env.DB, jobId, 'completed', metrics, duration);

    console.log(`[${jobId}] Training completed in ${duration}s`);

    return {
      success: true,
      jobId,
      modelId,
      sport,
      samples: trainingData.length,
      metrics,
      duration
    };

  } catch (error) {
    console.error(`[${jobId}] Training failed:`, error);

    // Update training job with error
    await updateTrainingJob(env.DB, jobId, 'failed', {
      error: error.message,
      stack: error.stack
    });

    throw error;
  }
}

/**
 * Fetch historical player data for training
 */
async function fetchTrainingData(db, sport) {
  // Fetch players with known outcomes (drafted, reached MLB, etc.)
  const results = await db.prepare(`
    SELECT
      p.player_id,
      p.name,
      p.position,
      p.birth_date,
      p.level,
      p.stats_summary,
      p.draft_info,
      p.career_outcome
    FROM players p
    WHERE p.sport = ?
      AND p.draft_info IS NOT NULL
      AND p.career_outcome IS NOT NULL
    ORDER BY RANDOM()
    LIMIT 5000
  `).bind(sport).all();

  return results.results || [];
}

/**
 * Prepare features and labels for training
 */
function prepareFeatures(data, sport) {
  const features = [];
  const labels = [];
  const statsAccumulator = [];

  for (const player of data) {
    const stats = player.stats_summary ? JSON.parse(player.stats_summary) : {};
    const draftInfo = player.draft_info ? JSON.parse(player.draft_info) : {};
    const outcome = player.career_outcome ? JSON.parse(player.career_outcome) : {};

    // Calculate age at draft
    const birthYear = new Date(player.birth_date).getFullYear();
    const draftYear = draftInfo.year || new Date().getFullYear();
    const ageAtDraft = draftYear - birthYear;

    // Extract sport-specific features
    let sportFeatures = [];
    if (sport === 'college-baseball') {
      sportFeatures = extractBaseballFeatures(stats, player.position);
    } else if (sport === 'college-football') {
      sportFeatures = extractFootballFeatures(stats, player.position);
    }

    // Common features
    const commonFeatures = [
      ageAtDraft,
      positionToNumeric(player.position, sport),
      levelToNumeric(player.level)
    ];

    features.push([...commonFeatures, ...sportFeatures]);

    // Label: draft round (or 0 if undrafted)
    labels.push(draftInfo.round || 0);

    // Accumulate for scaling
    statsAccumulator.push([...commonFeatures, ...sportFeatures]);
  }

  // Calculate mean and std for normalization
  const scaler = calculateScaler(statsAccumulator);

  // Normalize features
  const normalizedFeatures = features.map(row =>
    row.map((val, idx) => (val - scaler.mean[idx]) / (scaler.std[idx] || 1))
  );

  return { features: normalizedFeatures, labels, scaler };
}

/**
 * Extract baseball-specific features
 */
function extractBaseballFeatures(stats, position) {
  if (position === 'P') {
    return [
      stats.era || 4.5,
      stats.whip || 1.4,
      stats.k9 || 7.0,
      stats.bb9 || 3.5,
      stats.innings || 50
    ];
  } else {
    return [
      stats.avg || 0.250,
      stats.obp || 0.320,
      stats.slg || 0.380,
      stats.hr || 5,
      stats.sb || 5,
      stats.games || 40
    ];
  }
}

/**
 * Extract football-specific features
 */
function extractFootballFeatures(stats, position) {
  return [
    stats.yards || 500,
    stats.touchdowns || 3,
    stats.yards_per_game || 50,
    stats.games || 10
  ];
}

/**
 * Convert position to numeric
 */
function positionToNumeric(position, sport) {
  if (sport === 'college-baseball') {
    const positions = { P: 1, C: 2, '1B': 3, '2B': 4, '3B': 5, SS: 6, OF: 7 };
    return positions[position] || 0;
  } else if (sport === 'college-football') {
    const positions = { QB: 1, RB: 2, WR: 3, TE: 4, OL: 5, DL: 6, LB: 7, DB: 8 };
    return positions[position] || 0;
  }
  return 0;
}

/**
 * Convert level to numeric
 */
function levelToNumeric(level) {
  const levels = { HS: 1, College: 2, A: 3, AA: 4, AAA: 5, MLB: 6 };
  return levels[level] || 0;
}

/**
 * Calculate mean and std for normalization
 */
function calculateScaler(data) {
  const numFeatures = data[0].length;
  const mean = new Array(numFeatures).fill(0);
  const std = new Array(numFeatures).fill(0);

  // Calculate mean
  for (const row of data) {
    for (let i = 0; i < numFeatures; i++) {
      mean[i] += row[i];
    }
  }
  mean.forEach((sum, i) => mean[i] = sum / data.length);

  // Calculate std
  for (const row of data) {
    for (let i = 0; i < numFeatures; i++) {
      std[i] += Math.pow(row[i] - mean[i], 2);
    }
  }
  std.forEach((sum, i) => std[i] = Math.sqrt(sum / data.length));

  return { mean, std };
}

/**
 * Train model using simple linear regression
 *
 * In production, this would use Workers AI or a more sophisticated algorithm.
 * For now, implementing a basic gradient descent linear regression.
 */
async function trainModel(features, labels, sport) {
  const numFeatures = features[0].length;
  const learningRate = 0.01;
  const epochs = 100;

  // Initialize weights randomly
  const weights = new Array(numFeatures).fill(0).map(() => Math.random() - 0.5);
  let bias = 0;

  // Gradient descent
  for (let epoch = 0; epoch < epochs; epoch++) {
    let totalError = 0;
    const gradients = new Array(numFeatures).fill(0);
    let biasGradient = 0;

    // Calculate gradients
    for (let i = 0; i < features.length; i++) {
      const prediction = predict(features[i], weights, bias);
      const error = prediction - labels[i];
      totalError += Math.abs(error);

      for (let j = 0; j < numFeatures; j++) {
        gradients[j] += error * features[i][j];
      }
      biasGradient += error;
    }

    // Update weights
    for (let j = 0; j < numFeatures; j++) {
      weights[j] -= learningRate * gradients[j] / features.length;
    }
    bias -= learningRate * biasGradient / features.length;

    if (epoch % 20 === 0) {
      console.log(`Epoch ${epoch}: Mean Absolute Error = ${(totalError / features.length).toFixed(4)}`);
    }
  }

  return {
    weights,
    bias,
    parameters: {
      learningRate,
      epochs,
      numFeatures
    }
  };
}

/**
 * Make prediction with model
 */
function predict(features, weights, bias) {
  let sum = bias;
  for (let i = 0; i < features.length; i++) {
    sum += features[i] * weights[i];
  }
  return Math.max(0, Math.round(sum)); // Round to nearest draft round, min 0
}

/**
 * Evaluate model on test set
 */
async function evaluateModel(model, testFeatures, testLabels) {
  let correct = 0;
  let within1Round = 0;
  let totalError = 0;

  for (let i = 0; i < testFeatures.length; i++) {
    const prediction = predict(testFeatures[i], model.weights, model.bias);
    const actual = testLabels[i];
    const error = Math.abs(prediction - actual);

    if (error === 0) correct++;
    if (error <= 1) within1Round++;
    totalError += error;
  }

  return {
    accuracy: correct / testFeatures.length,
    within_1_round_accuracy: within1Round / testFeatures.length,
    mean_absolute_error: totalError / testFeatures.length,
    samples_tested: testFeatures.length
  };
}

/**
 * Store model in R2
 */
async function storeModelInR2(r2, model, jobId, sport, scaler) {
  const modelPath = `models/${sport}/player_development_${jobId}.json`;

  const modelData = {
    model_id: jobId,
    sport,
    model_type: 'player_development',
    weights: model.weights,
    bias: model.bias,
    parameters: model.parameters,
    scaler,
    trained_at: new Date().toISOString()
  };

  await r2.put(modelPath, JSON.stringify(modelData));

  return modelPath;
}

/**
 * Create model record in database
 */
async function createModelRecord(db, modelData) {
  await db.prepare(`
    INSERT INTO predictive_models (
      model_id, model_name, version, sport, model_type,
      trained_at, metrics, parameters, r2_model_path, status,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    modelData.modelId,
    modelData.modelName,
    modelData.version,
    modelData.sport,
    modelData.modelType,
    modelData.trainedAt,
    modelData.metrics,
    modelData.parameters,
    modelData.r2ModelPath,
    modelData.status,
    Math.floor(Date.now() / 1000),
    Math.floor(Date.now() / 1000)
  ).run();
}

/**
 * Deprecate old models
 */
async function deprecateOldModels(db, newModelId, sport, modelType) {
  await db.prepare(`
    UPDATE predictive_models
    SET status = 'deprecated', updated_at = ?
    WHERE sport = ?
      AND model_type = ?
      AND model_id != ?
      AND status = 'active'
  `).bind(
    Math.floor(Date.now() / 1000),
    sport,
    modelType,
    newModelId
  ).run();
}

/**
 * Create training job record
 */
async function createTrainingJob(db, jobId, sport, modelType) {
  await db.prepare(`
    INSERT INTO model_training_jobs (
      job_id, model_type, sport, status, started_at
    ) VALUES (?, ?, ?, ?, ?)
  `).bind(
    jobId,
    modelType,
    sport,
    'running',
    Math.floor(Date.now() / 1000)
  ).run();
}

/**
 * Update training job record
 */
async function updateTrainingJob(db, jobId, status, metrics, duration = null) {
  await db.prepare(`
    UPDATE model_training_jobs
    SET status = ?,
        metrics = ?,
        duration_seconds = ?,
        completed_at = ?
    WHERE job_id = ?
  `).bind(
    status,
    JSON.stringify(metrics),
    duration,
    Math.floor(Date.now() / 1000),
    jobId
  ).run();
}
