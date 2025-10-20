import test from 'node:test';
import assert from 'node:assert/strict';
import MLPipelineService from '../../api/ml/ml-pipeline-service.js';

const noop = () => {};

class TestLogger {
  constructor() {
    this.entries = [];
  }

  info(message, meta) {
    this.entries.push({ level: 'info', message, meta });
  }

  warn(message, meta) {
    this.entries.push({ level: 'warn', message, meta });
  }

  error(message, meta, error) {
    this.entries.push({ level: 'error', message, meta, error });
  }

  debug(message, meta) {
    this.entries.push({ level: 'debug', message, meta });
  }
}

test('trainModel handles nested train/validation feature sets', async () => {
  class TestMLPipelineService extends MLPipelineService {
    async initialize() {
      // Skip filesystem and database initialization for tests
    }
  }

  const logger = new TestLogger();
  const service = new TestMLPipelineService(
    logger,
    { connectionString: 'postgres://user:pass@localhost/db' },
    { modelStoragePath: '/tmp/models' }
  );

  service.modelConfigs = {
    game_outcome: {
      type: 'classification',
      features: ['feature_a', 'feature_b'],
      labels: ['home_win', 'away_win'],
      architecture: () => ({ fit: noop })
    }
  };

  let prepareCalled = 0;
  service.prepareTrainingData = async () => {
    prepareCalled += 1;
    return {
      train: {
        features: [
          [0.1, 0.2],
          [0.3, 0.4]
        ],
        labels: [
          [1, 0],
          [0, 1]
        ]
      },
      validation: {
        features: [
          [0.5, 0.6]
        ],
        labels: [
          [1, 0]
        ]
      },
      featureCount: 2,
      featureNames: ['feature_a', 'feature_b'],
      normalizationParams: { means: [0, 0], stds: [1, 1] }
    };
  };

  service.createTrainingRun = async () => ({ id: 'run-1', model_version: null });
  service.validateTrainingData = async () => {};
  service.trainModelWithCallbacks = async () => ({ history: [] });
  service.evaluateModel = async () => ({ accuracy: 0.9, loss: 0.1 });
  service.saveModel = async () => 'v-test';
  service.updateTrainingRun = async () => {};
  service.createGameOutcomeModel = () => ({ fit: noop });
  service.db = { query: async () => ({ rows: [] }) };

  const result = await service.trainModel('game_outcome');
  assert.equal(prepareCalled, 1, 'prepareTrainingData should be called once');

  const preparedLog = logger.entries.find(entry => entry.message === 'Prepared training data');
  assert(preparedLog, 'should log prepared training data details');
  assert.deepEqual(
    preparedLog.meta,
    {
      modelType: 'game_outcome',
      trainSamples: 2,
      validationSamples: 1,
      totalSamples: 3,
      features: 2
    },
    'log metadata should reflect train/validation sample counts'
  );

  assert.equal(result.modelVersion, 'v-test');
});
