/**
 * ENVIRONMENT VALIDATION SCHEMA
 * Validates all environment variables on application startup
 * Fails fast if required configuration is missing
 */

import { z } from 'zod';
import { formatEnvError, EnvironmentValidationError } from './errors.js';

// Helper schemas for common patterns
const urlSchema = z.string().url();
const portSchema = z.coerce.number().int().positive().max(65535);
const booleanSchema = z.enum(['true', 'false', 'yes', 'no', '1', '0'])
    .transform(val => val === 'true' || val === 'yes' || val === '1');

// Node environment enum
const nodeEnvSchema = z.enum(['development', 'staging', 'production', 'test'])
    .default('development');

/**
 * Complete environment variable schema
 * Required variables will cause startup failure if missing
 * Optional variables will use defaults or undefined
 */
const envSchema = z.object({
    // ==================== ENVIRONMENT ====================
    NODE_ENV: nodeEnvSchema,
    PYTHON_ENV: z.enum(['development', 'staging', 'production', 'test']).optional(),
    DEBUG: booleanSchema.optional().default('false'),
    LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error', 'fatal']).default('info'),

    // ==================== CLOUDFLARE ====================
    CLOUDFLARE_ACCOUNT_ID: z.string().optional(),
    CLOUDFLARE_API_TOKEN: z.string().optional(),
    CLOUDFLARE_ZONE_ID: z.string().optional(),

    // ==================== DATABASE ====================
    DATABASE_URL: z.string().optional(),
    POSTGRES_HOST: z.string().default('localhost'),
    POSTGRES_PORT: portSchema.default('5432'),
    POSTGRES_DB: z.string().min(1).optional(),
    POSTGRES_USER: z.string().min(1).optional(),
    POSTGRES_PASSWORD: z.string().optional(),

    // ==================== NEON DATABASE ====================
    NEON_DATABASE_URL: z.string().optional(),
    NEON_PROJECT_ID: z.string().optional(),
    NEON_BRANCH: z.string().default('main'),

    // ==================== REDIS ====================
    REDIS_URL: z.string().optional(),
    REDIS_HOST: z.string().default('localhost'),
    REDIS_PORT: portSchema.default('6379'),
    REDIS_DB: z.coerce.number().int().min(0).default(0),

    // ==================== MINIO (S3) ====================
    MINIO_URL: z.string().optional(),
    MINIO_ACCESS_KEY: z.string().optional(),
    MINIO_SECRET_KEY: z.string().optional(),
    MINIO_BUCKET_MEDIA: z.string().default('media'),
    MINIO_BUCKET_DATA: z.string().default('analytics'),
    MINIO_BUCKET_BIOMECH: z.string().default('biomechanics'),

    // ==================== SPORTS DATA APIs ====================
    SPORTSDATAIO_API_KEY: z.string().optional(),
    MLB_API_KEY: z.string().optional(),
    NFL_API_KEY: z.string().optional(),
    NBA_API_KEY: z.string().optional(),
    NCAA_API_KEY: z.string().optional(),

    // ==================== AI/ML SERVICES ====================
    OPENAI_API_KEY: z.string().optional(),
    ANTHROPIC_API_KEY: z.string().optional(),
    GEMINI_API_KEY: z.string().optional(),

    // ==================== MACHINE LEARNING PIPELINE ====================
    TENSORFLOW_BACKEND: z.enum(['cpu', 'gpu', 'wasm']).default('cpu'),
    MODEL_STORAGE_PATH: z.string().default('./models'),
    MODEL_VERSION_PREFIX: z.string().default('v'),

    ML_BATCH_SIZE: z.coerce.number().int().positive().default(32),
    ML_EPOCHS: z.coerce.number().int().positive().default(100),
    ML_VALIDATION_SPLIT: z.coerce.number().min(0).max(1).default(0.2),
    ML_LEARNING_RATE: z.coerce.number().positive().default(0.001),
    ML_PATIENCE: z.coerce.number().int().positive().default(10),
    ML_MIN_DELTA: z.coerce.number().positive().default(0.001),

    FEATURE_STORE_TTL: z.coerce.number().int().positive().default(86400),
    FEATURE_CACHE_SIZE: z.coerce.number().int().positive().default(10000),
    ENABLE_FEATURE_DRIFT_DETECTION: booleanSchema.default('true'),

    MODEL_RETRAIN_GAME_OUTCOME: z.enum(['daily', 'weekly', 'monthly']).default('weekly'),
    MODEL_RETRAIN_SEASON_WINS: z.enum(['daily', 'weekly', 'monthly']).default('monthly'),
    MODEL_RETRAIN_PLAYER_PERFORMANCE: z.enum(['daily', 'weekly', 'monthly']).default('daily'),

    // Database for ML Pipeline
    DB_HOST: z.string().default('localhost'),
    DB_PORT: portSchema.default('5432'),
    DB_NAME: z.string().optional(),
    DB_USER: z.string().optional(),
    DB_PASSWORD: z.string().optional(),
    DB_SSL: booleanSchema.default('false'),
    DB_MAX_CONNECTIONS: z.coerce.number().int().positive().default(20),
    DB_MIN_CONNECTIONS: z.coerce.number().int().positive().default(5),

    // ==================== MONITORING ====================
    GRAFANA_USER: z.string().default('admin'),
    GRAFANA_PASSWORD: z.string().optional(),
    PROMETHEUS_PORT: portSchema.default('9090'),

    SENTRY_DSN: z.string().optional(),
    SENTRY_ENVIRONMENT: z.string().optional(),
    SENTRY_RELEASE: z.string().optional(),
    SENTRY_TRACES_SAMPLE_RATE: z.coerce.number().min(0).max(1).default(0.2),
    SENTRY_PROFILES_SAMPLE_RATE: z.coerce.number().min(0).max(1).default(0.1),
    SENTRY_EDGE_TRACES_SAMPLE_RATE: z.coerce.number().min(0).max(1).default(0.2),

    NEXT_PUBLIC_SENTRY_DSN: z.string().optional(),
    NEXT_PUBLIC_SENTRY_ENVIRONMENT: z.string().optional(),
    NEXT_PUBLIC_SENTRY_RELEASE: z.string().optional(),
    NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE: z.coerce.number().min(0).max(1).default(0.2),
    NEXT_PUBLIC_SENTRY_REPLAYS_SESSION_SAMPLE_RATE: z.coerce.number().min(0).max(1).default(0.1),
    NEXT_PUBLIC_SENTRY_REPLAYS_ERROR_SAMPLE_RATE: z.coerce.number().min(0).max(1).default(1.0),

    DATADOG_API_KEY: z.string().optional(),
    DD_API_KEY: z.string().optional(),
    DATADOG_SITE: z.string().default('datadoghq.com'),
    DATADOG_ENV: z.string().optional(),
    DATADOG_SERVICE: z.string().default('blaze-sports-intel-web'),

    NEXT_PUBLIC_DATADOG_APPLICATION_ID: z.string().optional(),
    NEXT_PUBLIC_DATADOG_CLIENT_TOKEN: z.string().optional(),
    NEXT_PUBLIC_DATADOG_SITE: z.string().default('datadoghq.com'),
    NEXT_PUBLIC_DATADOG_SESSION_SAMPLE_RATE: z.coerce.number().min(0).max(100).default(100),
    NEXT_PUBLIC_DATADOG_REPLAY_SAMPLE_RATE: z.coerce.number().min(0).max(100).default(20),

    // ==================== APPLICATION ====================
    APP_NAME: z.string().default('BSI - Blaze Sports Intelligence'),
    APP_URL: z.string().optional(),
    API_URL: z.string().optional(),
    FRONTEND_URL: z.string().optional(),
    WRANGLER_URL: z.string().optional(),
    PORT: portSchema.default('3000'),

    // ==================== SECURITY ====================
    JWT_SECRET: z.string().min(32).optional(),
    SESSION_SECRET: z.string().min(32).optional(),
    CORS_ORIGINS: z.string().optional(),

    // ==================== EMAIL ====================
    SMTP_HOST: z.string().default('localhost'),
    SMTP_PORT: portSchema.default('1025'),
    SMTP_USER: z.string().optional(),
    SMTP_PASSWORD: z.string().optional(),
    EMAIL_FROM: z.string().email().default('noreply@blazesportsintel.com'),

    // ==================== FEATURES ====================
    ENABLE_BIOMECHANICS: booleanSchema.default('true'),
    ENABLE_MONTE_CARLO: booleanSchema.default('true'),
    ENABLE_REAL_TIME: booleanSchema.default('true'),
    ENABLE_3D_VISUALIZATION: booleanSchema.default('true'),

    // ==================== PERFORMANCE ====================
    WORKER_THREADS: z.coerce.number().int().positive().default(4),
    MAX_UPLOAD_SIZE: z.string().default('100MB'),
    CACHE_TTL: z.coerce.number().int().positive().default(3600),
    RATE_LIMIT_PER_MINUTE: z.coerce.number().int().positive().default(100),

    // ==================== DEVELOPMENT ====================
    HOT_RELOAD: booleanSchema.default('true'),
    MOCK_EXTERNAL_APIS: booleanSchema.default('false'),
    VERBOSE_LOGGING: booleanSchema.default('false'),
    PROFILE_PERFORMANCE: booleanSchema.default('false'),

    // ==================== VISUAL TESTING ====================
    APPLITOOLS_API_KEY: z.string().optional(),
    APPLITOOLS_SERVER_URL: z.string().optional()
});

/**
 * Production-specific validation
 * Enforces stricter requirements for production environments
 */
const productionEnvSchema = envSchema.refine(
    (data) => {
        if (data.NODE_ENV === 'production') {
            // In production, these are required
            const requiredInProduction = [
                'DATABASE_URL',
                'JWT_SECRET',
                'SESSION_SECRET'
            ];

            const missing = requiredInProduction.filter(key => !data[key]);
            if (missing.length > 0) {
                throw new Error(`Missing required production environment variables: ${missing.join(', ')}`);
            }

            // Validate JWT and SESSION secrets are strong enough
            if (data.JWT_SECRET && data.JWT_SECRET.length < 32) {
                throw new Error('JWT_SECRET must be at least 32 characters in production');
            }
            if (data.SESSION_SECRET && data.SESSION_SECRET.length < 32) {
                throw new Error('SESSION_SECRET must be at least 32 characters in production');
            }
        }
        return true;
    },
    { message: 'Production environment validation failed' }
);

/**
 * Validates environment variables on startup
 * @param {Object} env - Environment variables object (usually process.env)
 * @returns {Object} Validated and typed environment variables
 * @throws {EnvironmentValidationError} If validation fails
 */
export function validateEnv(env = process.env) {
    try {
        const validated = productionEnvSchema.parse(env);
        return validated;
    } catch (error) {
        if (error instanceof z.ZodError) {
            const formattedError = formatEnvError(error);
            throw new EnvironmentValidationError(formattedError, error.errors);
        }
        throw error;
    }
}

/**
 * Validates environment with warnings instead of errors
 * Useful for development where not all vars are required
 * @param {Object} env - Environment variables object
 * @returns {Object} Validation result with warnings
 */
export function validateEnvWithWarnings(env = process.env) {
    const result = envSchema.safeParse(env);

    if (!result.success) {
        const warnings = result.error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
            severity: 'warning'
        }));

        return {
            success: false,
            warnings,
            data: null
        };
    }

    return {
        success: true,
        warnings: [],
        data: result.data
    };
}

/**
 * Gets a list of all required environment variables
 * @returns {Array<string>} Array of required env var names
 */
export function getRequiredEnvVars() {
    const schema = envSchema._def.schema || envSchema;
    const shape = schema.shape || {};

    return Object.entries(shape)
        .filter(([_, schema]) => !schema.isOptional())
        .map(([key]) => key);
}

/**
 * Checks if environment is properly configured for production
 * @param {Object} env - Environment variables object
 * @returns {Object} Health check result
 */
export function checkEnvHealth(env = process.env) {
    const validation = validateEnvWithWarnings(env);

    const critical = validation.warnings?.filter(w =>
        ['JWT_SECRET', 'SESSION_SECRET', 'DATABASE_URL'].includes(w.field)
    ) || [];

    return {
        healthy: validation.success && critical.length === 0,
        warnings: validation.warnings || [],
        criticalIssues: critical,
        isProduction: env.NODE_ENV === 'production'
    };
}

export { envSchema, productionEnvSchema };
export default validateEnv;
