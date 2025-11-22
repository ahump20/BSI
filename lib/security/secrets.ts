/**
 * Secrets Management System
 *
 * Provides secure access to secrets from multiple sources:
 * - Cloudflare Secrets (production)
 * - Environment variables (development/local)
 * - Encrypted configuration files (optional)
 *
 * Security Features:
 * - Audit logging for secret access
 * - Secret rotation support
 * - Automatic fallback handling
 * - Type-safe secret retrieval
 */

import { z } from 'zod';

// Environment types
export type Environment = 'development' | 'staging' | 'production';

// Secret types
export interface SecretMetadata {
  name: string;
  rotatedAt?: Date;
  expiresAt?: Date;
  version?: string;
}

export interface SecretValue {
  value: string;
  metadata: SecretMetadata;
}

// Audit log entry
export interface SecretAuditLog {
  timestamp: Date;
  secretName: string;
  action: 'read' | 'write' | 'rotate' | 'delete';
  userId?: string;
  success: boolean;
  error?: string;
}

// Schema for required secrets
const RequiredSecretsSchema = z.object({
  // Database
  POSTGRES_PASSWORD: z.string().min(16, 'Password must be at least 16 characters'),
  DATABASE_URL: z.string().url().or(z.string().startsWith('postgresql://')),

  // Storage
  MINIO_ROOT_PASSWORD: z.string().min(16, 'Password must be at least 16 characters'),

  // Authentication
  JWT_SECRET: z.string().min(32, 'JWT secret must be at least 32 characters'),
  SESSION_SECRET: z.string().min(32, 'Session secret must be at least 32 characters'),
  CSRF_SECRET: z.string().min(32, 'CSRF secret must be at least 32 characters'),

  // Encryption
  ENCRYPTION_KEY: z.string().min(32, 'Encryption key must be at least 32 characters'),
  API_KEY_SALT: z.string().min(32, 'API key salt must be at least 32 characters'),

  // Monitoring
  GRAFANA_PASSWORD: z.string().min(12, 'Grafana password must be at least 12 characters'),
});

type RequiredSecrets = z.infer<typeof RequiredSecretsSchema>;

/**
 * Secrets Manager
 *
 * Handles secure retrieval and management of application secrets
 */
export class SecretsManager {
  private env: Environment;
  private auditLogs: SecretAuditLog[] = [];
  private secretsCache: Map<string, SecretValue> = new Map();
  private cacheTTL: number = 300000; // 5 minutes

  constructor(env: Environment = 'development') {
    this.env = env;
  }

  /**
   * Get a secret value securely
   *
   * @param name - Secret name
   * @param cfEnv - Cloudflare environment bindings (production)
   * @param required - Whether the secret is required (throws if missing)
   * @returns Secret value or null
   */
  async getSecret(
    name: string,
    cfEnv?: any,
    required: boolean = true
  ): Promise<string | null> {
    try {
      // Check cache first
      const cached = this.secretsCache.get(name);
      if (cached && this.isCacheValid(cached)) {
        this.logAudit(name, 'read', true);
        return cached.value;
      }

      let value: string | null = null;

      // Production: Use Cloudflare Secrets
      if (this.env === 'production' && cfEnv) {
        value = await this.getFromCloudflare(name, cfEnv);
      }

      // Fallback to environment variables (Node.js only)
      if (!value && typeof process !== 'undefined') {
        value = process.env[name] || null;
      }

      // Validate required secrets
      if (required && !value) {
        this.logAudit(name, 'read', false, `Secret ${name} not found`);
        throw new Error(`Required secret ${name} not found`);
      }

      // Cache the value
      if (value) {
        this.secretsCache.set(name, {
          value,
          metadata: {
            name,
            rotatedAt: new Date(),
          },
        });
      }

      this.logAudit(name, 'read', true);
      return value;
    } catch (error) {
      this.logAudit(name, 'read', false, error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  }

  /**
   * Get secret from Cloudflare Secrets
   */
  private async getFromCloudflare(name: string, cfEnv: any): Promise<string | null> {
    // Cloudflare Secrets are available in cfEnv directly
    return cfEnv[name] || null;
  }

  /**
   * Validate all required secrets are present
   */
  async validateRequiredSecrets(cfEnv?: any): Promise<{
    valid: boolean;
    missing: string[];
    invalid: string[];
  }> {
    const missing: string[] = [];
    const invalid: string[] = [];

    const secretNames = Object.keys(RequiredSecretsSchema.shape);

    for (const name of secretNames) {
      try {
        const value = await this.getSecret(name, cfEnv, false);

        if (!value) {
          missing.push(name);
        } else {
          // Validate the secret format
          const schema = RequiredSecretsSchema.shape[name as keyof RequiredSecrets];
          const result = schema.safeParse(value);

          if (!result.success) {
            invalid.push(`${name}: ${result.error.errors[0].message}`);
          }
        }
      } catch (error) {
        missing.push(name);
      }
    }

    return {
      valid: missing.length === 0 && invalid.length === 0,
      missing,
      invalid,
    };
  }

  /**
   * Check if cached value is still valid
   */
  private isCacheValid(secretValue: SecretValue): boolean {
    const now = new Date();

    // Check TTL
    if (secretValue.metadata.rotatedAt) {
      const age = now.getTime() - secretValue.metadata.rotatedAt.getTime();
      if (age > this.cacheTTL) {
        return false;
      }
    }

    // Check expiration
    if (secretValue.metadata.expiresAt && now > secretValue.metadata.expiresAt) {
      return false;
    }

    return true;
  }

  /**
   * Log secret access for audit trail
   */
  private logAudit(
    secretName: string,
    action: SecretAuditLog['action'],
    success: boolean,
    error?: string,
    userId?: string
  ): void {
    const log: SecretAuditLog = {
      timestamp: new Date(),
      secretName,
      action,
      success,
      error,
      userId,
    };

    this.auditLogs.push(log);

    // In production, send to monitoring service
    if (this.env === 'production') {
      // TODO: Send to Sentry/Datadog
      console.error('[SECURITY AUDIT]', JSON.stringify(log));
    }
  }

  /**
   * Get audit logs
   */
  getAuditLogs(limit?: number): SecretAuditLog[] {
    return limit ? this.auditLogs.slice(-limit) : [...this.auditLogs];
  }

  /**
   * Clear secrets cache (force refresh)
   */
  clearCache(): void {
    this.secretsCache.clear();
  }

  /**
   * Generate a secure random secret
   *
   * @param length - Length of secret in bytes (default: 32)
   * @returns Base64-encoded random secret
   */
  static generateSecret(length: number = 32): string {
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      const bytes = new Uint8Array(length);
      crypto.getRandomValues(bytes);
      return btoa(String.fromCharCode(...bytes));
    }

    // Fallback for Node.js
    const crypto = require('crypto');
    return crypto.randomBytes(length).toString('base64');
  }
}

/**
 * Global secrets manager instance
 */
let globalSecretsManager: SecretsManager | null = null;

/**
 * Get the global secrets manager instance
 */
export function getSecretsManager(env?: Environment): SecretsManager {
  if (!globalSecretsManager) {
    const environment = env || (typeof process !== 'undefined' ? process.env.NODE_ENV as Environment : null) || 'development';
    globalSecretsManager = new SecretsManager(environment);
  }
  return globalSecretsManager;
}

/**
 * Helper to get a secret value
 */
export async function getSecret(name: string, cfEnv?: any, required: boolean = true): Promise<string | null> {
  const manager = getSecretsManager();
  return manager.getSecret(name, cfEnv, required);
}

/**
 * Validate environment configuration on startup
 */
export async function validateEnvironment(cfEnv?: any): Promise<void> {
  const manager = getSecretsManager();
  const result = await manager.validateRequiredSecrets(cfEnv);

  if (!result.valid) {
    const errors: string[] = [];

    if (result.missing.length > 0) {
      errors.push(`Missing required secrets: ${result.missing.join(', ')}`);
    }

    if (result.invalid.length > 0) {
      errors.push(`Invalid secrets: ${result.invalid.join(', ')}`);
    }

    throw new Error(`Environment validation failed:\n${errors.join('\n')}`);
  }

  console.log('✅ All required secrets validated successfully');
}
