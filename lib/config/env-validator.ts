/**
 * Environment Variable Validation
 *
 * Validates all required environment variables on application startup
 * Prevents deployment with missing or invalid configuration
 */

import { z } from 'zod';

// Environment schema
const EnvSchema = z.object({
  // Environment
  NODE_ENV: z.enum(['development', 'staging', 'production']),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error', 'fatal']).default('info'),

  // Database (REQUIRED in production)
  DATABASE_URL: z.string().url().or(z.string().startsWith('postgresql://')),
  POSTGRES_PASSWORD: z.string().min(16, 'Password must be at least 16 characters'),

  // Storage (REQUIRED in production)
  MINIO_ROOT_PASSWORD: z.string().min(16, 'Password must be at least 16 characters'),

  // Security (REQUIRED in production)
  JWT_SECRET: z.string().min(32, 'JWT secret must be at least 32 characters'),
  SESSION_SECRET: z.string().min(32, 'Session secret must be at least 32 characters'),
  CSRF_SECRET: z.string().min(32, 'CSRF secret must be at least 32 characters'),
  ENCRYPTION_KEY: z.string().min(32, 'Encryption key must be at least 32 characters'),
  API_KEY_SALT: z.string().min(32, 'API key salt must be at least 32 characters'),

  // Monitoring (REQUIRED in production)
  GRAFANA_PASSWORD: z.string().min(12, 'Grafana password must be at least 12 characters'),

  // Optional but recommended
  SENTRY_DSN: z.string().url().optional(),
  DD_API_KEY: z.string().optional(),
});

type Env = z.infer<typeof EnvSchema>;

/**
 * Validate environment variables
 */
export function validateEnv(): { valid: boolean; errors?: string[] } {
  try {
    EnvSchema.parse(process.env);
    return { valid: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map((err) => {
        const field = err.path.join('.');
        return `${field}: ${err.message}`;
      });

      return {
        valid: false,
        errors,
      };
    }

    return {
      valid: false,
      errors: ['Unknown validation error'],
    };
  }
}

/**
 * Get validated environment variables
 */
export function getEnv(): Env {
  const result = validateEnv();

  if (!result.valid) {
    const errors = result.errors?.join('\n') || 'Unknown error';
    throw new Error(`Environment validation failed:\n${errors}`);
  }

  return process.env as unknown as Env;
}

/**
 * Check for default/weak passwords
 */
export function checkForWeakSecrets(): string[] {
  const warnings: string[] = [];
  const weakPatterns = [
    'CHANGE_ME',
    'password',
    'secret',
    'admin',
    '123456',
    'blaze',
  ];

  const secretFields = [
    'POSTGRES_PASSWORD',
    'MINIO_ROOT_PASSWORD',
    'JWT_SECRET',
    'SESSION_SECRET',
    'CSRF_SECRET',
    'ENCRYPTION_KEY',
    'GRAFANA_PASSWORD',
  ];

  for (const field of secretFields) {
    const value = process.env[field] || '';

    for (const pattern of weakPatterns) {
      if (value.toLowerCase().includes(pattern.toLowerCase())) {
        warnings.push(`${field} appears to contain weak/default value`);
        break;
      }
    }

    if (value.length < 16) {
      warnings.push(`${field} is shorter than recommended 16 characters`);
    }
  }

  return warnings;
}

/**
 * Run environment validation on startup
 */
export function validateEnvironmentOnStartup(): void {
  console.log('🔍 Validating environment configuration...');

  const result = validateEnv();

  if (!result.valid) {
    console.error('❌ Environment validation failed:');
    result.errors?.forEach((error) => console.error(`  - ${error}`));
    process.exit(1);
  }

  console.log('✅ Environment validation passed');

  // Check for weak secrets in production
  if (process.env.NODE_ENV === 'production') {
    const warnings = checkForWeakSecrets();

    if (warnings.length > 0) {
      console.warn('⚠️  Security warnings:');
      warnings.forEach((warning) => console.warn(`  - ${warning}`));

      // In production, exit if weak secrets are detected
      console.error('❌ Production deployment blocked due to weak secrets');
      process.exit(1);
    }
  }
}
