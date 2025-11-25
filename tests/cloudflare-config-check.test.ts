import { describe, expect, it } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import {
  mergeEnvWithFile,
  parseEnvFile,
  validateConfiguration,
  validateNodeVersion
} from '../scripts/cloudflare-config-check';

describe('parseEnvFile', () => {
  it('parses key/value pairs while ignoring comments and empty lines', () => {
    const tempDir = mkdtempSync(join(tmpdir(), 'cf-env-'));
    const envPath = join(tempDir, '.env');
    writeFileSync(envPath, "# comment\nNEXT_PUBLIC_APP_URL='https://example.com'\nAUTH0_DOMAIN=test.auth0.com\n\nJWT_SECRET=secret\n");

    const parsed = parseEnvFile(envPath);
    expect(parsed).toEqual({
      NEXT_PUBLIC_APP_URL: 'https://example.com',
      AUTH0_DOMAIN: 'test.auth0.com',
      JWT_SECRET: 'secret'
    });

    rmSync(tempDir, { recursive: true, force: true });
  });
});

describe('mergeEnvWithFile', () => {
  it('prefers existing environment variables over file values', () => {
    const tempDir = mkdtempSync(join(tmpdir(), 'cf-env-merge-'));
    const envPath = join(tempDir, '.env');
    writeFileSync(envPath, 'AUTH0_DOMAIN=file.auth0.com\nJWT_SECRET=file-secret');

    const merged = mergeEnvWithFile(
      {
        AUTH0_DOMAIN: 'runtime.auth0.com',
        SPORTSDATAIO_API_KEY: 'live-key'
      },
      envPath
    );

    expect(merged.AUTH0_DOMAIN).toBe('runtime.auth0.com');
    expect(merged.JWT_SECRET).toBe('file-secret');
    expect(merged.SPORTSDATAIO_API_KEY).toBe('live-key');

    rmSync(tempDir, { recursive: true, force: true });
  });
});

describe('validateNodeVersion', () => {
  it('returns null for acceptable versions', () => {
    expect(validateNodeVersion('18.17.0')).toBeNull();
  });

  it('returns an error for unsupported versions', () => {
    expect(validateNodeVersion('16.20.0')).toContain('Node.js 18.x or newer is required');
  });
});

describe('validateConfiguration', () => {
  const baseEnv = {
    NEXT_PUBLIC_APP_URL: 'https://blazesportsintel.com',
    NODE_ENV: 'production',
    AUTH0_DOMAIN: 'test.auth0.com',
    AUTH0_CLIENT_ID: 'client',
    AUTH0_CLIENT_SECRET: 'secret',
    AUTH0_AUDIENCE: 'https://api.example.com',
    JWT_SECRET: 'jwt-secret',
    SPORTSDATAIO_API_KEY: 'sports-key'
  } as NodeJS.ProcessEnv;

  it('passes with complete configuration', () => {
    const result = validateConfiguration({ ...baseEnv, TZ: 'America/Chicago' }, '20.0.0');
    expect(result.errors).toHaveLength(0);
    expect(result.warnings).toHaveLength(0);
  });

  it('flags missing environment variables', () => {
    const { errors } = validateConfiguration({}, '18.0.0');
    expect(errors[0]).toContain('Missing required environment variables');
  });

  it('warns when timezone is unset', () => {
    const result = validateConfiguration(baseEnv, '18.0.0');
    expect(result.warnings[0]).toContain('America/Chicago');
  });

  it('rejects invalid URLs', () => {
    const { errors } = validateConfiguration(
      {
        ...baseEnv,
        NEXT_PUBLIC_APP_URL: 'blazesportsintel.com'
      },
      '18.0.0'
    );

    expect(errors).toContain(
      'NEXT_PUBLIC_APP_URL must be an absolute URL starting with http:// or https://.'
    );
  });
});
