/**
 * ENVIRONMENT VALIDATION TESTS
 * Tests for environment variable validation on startup
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
    validateEnv,
    validateEnvWithWarnings,
    checkEnvHealth,
    getRequiredEnvVars
} from '../../api/validation/env.schema.js';
import { EnvironmentValidationError } from '../../api/validation/errors.js';

describe('Environment Validation', () => {
    let testEnv;

    beforeEach(() => {
        testEnv = {
            NODE_ENV: 'development',
            LOG_LEVEL: 'info',
            PORT: '3000',
            POSTGRES_HOST: 'localhost',
            POSTGRES_PORT: '5432',
            DATABASE_URL: 'postgresql://test:test@localhost:5432/testdb'
        };
    });

    describe('validateEnv', () => {
        it('should validate valid environment configuration', () => {
            const result = validateEnv(testEnv);

            expect(result).toBeDefined();
            expect(result.NODE_ENV).toBe('development');
            expect(result.LOG_LEVEL).toBe('info');
            expect(result.PORT).toBe(3000);
        });

        it('should use default values for optional variables', () => {
            const minimalEnv = {
                NODE_ENV: 'development'
            };

            const result = validateEnv(minimalEnv);

            expect(result.LOG_LEVEL).toBe('info');
            expect(result.PORT).toBe(3000);
            expect(result.POSTGRES_HOST).toBe('localhost');
        });

        it('should coerce string numbers to integers', () => {
            testEnv.PORT = '8080';
            testEnv.POSTGRES_PORT = '5433';

            const result = validateEnv(testEnv);

            expect(result.PORT).toBe(8080);
            expect(result.POSTGRES_PORT).toBe(5433);
        });

        it('should validate boolean strings', () => {
            testEnv.DEBUG = 'true';
            testEnv.ENABLE_BIOMECHANICS = 'false';

            const result = validateEnv(testEnv);

            expect(result.DEBUG).toBe(true);
            expect(result.ENABLE_BIOMECHANICS).toBe(false);
        });

        it('should throw on invalid NODE_ENV', () => {
            testEnv.NODE_ENV = 'invalid';

            expect(() => validateEnv(testEnv)).toThrow();
        });

        it('should throw on invalid port numbers', () => {
            testEnv.PORT = '99999';

            expect(() => validateEnv(testEnv)).toThrow();
        });
    });

    describe('Production Environment Validation', () => {
        beforeEach(() => {
            testEnv.NODE_ENV = 'production';
        });

        it('should require DATABASE_URL in production', () => {
            delete testEnv.DATABASE_URL;

            expect(() => validateEnv(testEnv)).toThrow(EnvironmentValidationError);
        });

        it('should require JWT_SECRET in production', () => {
            testEnv.DATABASE_URL = 'postgresql://test:test@localhost:5432/prod';
            testEnv.SESSION_SECRET = 'a'.repeat(32);

            expect(() => validateEnv(testEnv)).toThrow();
        });

        it('should require minimum secret lengths in production', () => {
            testEnv.DATABASE_URL = 'postgresql://test:test@localhost:5432/prod';
            testEnv.JWT_SECRET = 'short';
            testEnv.SESSION_SECRET = 'short';

            expect(() => validateEnv(testEnv)).toThrow();
        });

        it('should accept valid production configuration', () => {
            testEnv.DATABASE_URL = 'postgresql://user:pass@localhost:5432/prod';
            testEnv.JWT_SECRET = 'a'.repeat(32);
            testEnv.SESSION_SECRET = 'b'.repeat(32);

            const result = validateEnv(testEnv);

            expect(result.NODE_ENV).toBe('production');
        });
    });

    describe('validateEnvWithWarnings', () => {
        it('should return success with no warnings for valid config', () => {
            const result = validateEnvWithWarnings(testEnv);

            expect(result.success).toBe(true);
            expect(result.warnings).toHaveLength(0);
            expect(result.data).toBeDefined();
        });

        it('should return warnings for invalid values', () => {
            testEnv.PORT = 'invalid';

            const result = validateEnvWithWarnings(testEnv);

            expect(result.success).toBe(false);
            expect(result.warnings.length).toBeGreaterThan(0);
        });
    });

    describe('checkEnvHealth', () => {
        it('should return healthy for valid development config', () => {
            const health = checkEnvHealth(testEnv);

            expect(health.healthy).toBe(true);
            expect(health.isProduction).toBe(false);
        });

        it('should flag critical issues for production config', () => {
            testEnv.NODE_ENV = 'production';
            delete testEnv.DATABASE_URL;

            const health = checkEnvHealth(testEnv);

            expect(health.healthy).toBe(false);
        });

        it('should identify production environment', () => {
            testEnv.NODE_ENV = 'production';
            testEnv.DATABASE_URL = 'postgresql://user:pass@localhost:5432/prod';
            testEnv.JWT_SECRET = 'a'.repeat(32);
            testEnv.SESSION_SECRET = 'b'.repeat(32);

            const health = checkEnvHealth(testEnv);

            expect(health.isProduction).toBe(true);
        });
    });

    describe('ML Pipeline Configuration', () => {
        it('should validate ML configuration values', () => {
            testEnv.ML_BATCH_SIZE = '64';
            testEnv.ML_EPOCHS = '200';
            testEnv.ML_LEARNING_RATE = '0.001';
            testEnv.ML_VALIDATION_SPLIT = '0.3';

            const result = validateEnv(testEnv);

            expect(result.ML_BATCH_SIZE).toBe(64);
            expect(result.ML_EPOCHS).toBe(200);
            expect(result.ML_LEARNING_RATE).toBe(0.001);
            expect(result.ML_VALIDATION_SPLIT).toBe(0.3);
        });

        it('should use defaults for ML configuration', () => {
            const result = validateEnv(testEnv);

            expect(result.ML_BATCH_SIZE).toBe(32);
            expect(result.ML_EPOCHS).toBe(100);
            expect(result.ML_LEARNING_RATE).toBe(0.001);
        });

        it('should validate ML validation split range', () => {
            testEnv.ML_VALIDATION_SPLIT = '1.5';

            expect(() => validateEnv(testEnv)).toThrow();
        });
    });

    describe('Monitoring Configuration', () => {
        it('should validate Sentry sample rates', () => {
            testEnv.SENTRY_TRACES_SAMPLE_RATE = '0.5';
            testEnv.SENTRY_PROFILES_SAMPLE_RATE = '0.2';

            const result = validateEnv(testEnv);

            expect(result.SENTRY_TRACES_SAMPLE_RATE).toBe(0.5);
            expect(result.SENTRY_PROFILES_SAMPLE_RATE).toBe(0.2);
        });

        it('should reject invalid sample rates', () => {
            testEnv.SENTRY_TRACES_SAMPLE_RATE = '1.5';

            expect(() => validateEnv(testEnv)).toThrow();
        });

        it('should validate Datadog configuration', () => {
            testEnv.NEXT_PUBLIC_DATADOG_SESSION_SAMPLE_RATE = '80';
            testEnv.NEXT_PUBLIC_DATADOG_REPLAY_SAMPLE_RATE = '30';

            const result = validateEnv(testEnv);

            expect(result.NEXT_PUBLIC_DATADOG_SESSION_SAMPLE_RATE).toBe(80);
            expect(result.NEXT_PUBLIC_DATADOG_REPLAY_SAMPLE_RATE).toBe(30);
        });
    });

    describe('Feature Flags', () => {
        it('should validate feature flags', () => {
            testEnv.ENABLE_BIOMECHANICS = 'true';
            testEnv.ENABLE_MONTE_CARLO = 'false';
            testEnv.ENABLE_REAL_TIME = '1';
            testEnv.ENABLE_3D_VISUALIZATION = '0';

            const result = validateEnv(testEnv);

            expect(result.ENABLE_BIOMECHANICS).toBe(true);
            expect(result.ENABLE_MONTE_CARLO).toBe(false);
            expect(result.ENABLE_REAL_TIME).toBe(true);
            expect(result.ENABLE_3D_VISUALIZATION).toBe(false);
        });
    });
});
