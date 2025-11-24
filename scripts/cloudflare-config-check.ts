import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const REQUIRED_ENV_KEYS = [
  'NEXT_PUBLIC_APP_URL',
  'NODE_ENV',
  'AUTH0_DOMAIN',
  'AUTH0_CLIENT_ID',
  'AUTH0_CLIENT_SECRET',
  'AUTH0_AUDIENCE',
  'JWT_SECRET',
  'SPORTSDATAIO_API_KEY'
];

const REQUIRED_TIMEZONE = 'America/Chicago';

export interface ValidationReport {
  errors: string[];
  warnings: string[];
}

export function parseEnvFile(envPath: string): Record<string, string> {
  const raw = readFileSync(envPath, 'utf8');
  return raw.split(/\r?\n/).reduce<Record<string, string>>((acc, line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      return acc;
    }

    const equalsIndex = trimmed.indexOf('=');
    if (equalsIndex === -1) {
      return acc;
    }

    const key = trimmed.slice(0, equalsIndex).trim();
    const valuePortion = trimmed.slice(equalsIndex + 1).trim();
    const sanitizedValue = valuePortion.replace(/^['"]|['"]$/g, '');

    if (key.length > 0) {
      acc[key] = sanitizedValue;
    }

    return acc;
  }, {});
}

export function mergeEnvWithFile(baseEnv: NodeJS.ProcessEnv, envPath: string): NodeJS.ProcessEnv {
  if (!existsSync(envPath)) {
    return { ...baseEnv };
  }

  const fileEnv = parseEnvFile(envPath);
  return { ...fileEnv, ...baseEnv };
}

export function validateNodeVersion(nodeVersion: string, minimumMajor = 18): string | null {
  const [major] = nodeVersion.split('.').map((part) => Number.parseInt(part, 10));
  if (!Number.isInteger(major) || Number.isNaN(major)) {
    return `Unable to parse Node.js version from \"${nodeVersion}\".`;
  }

  if (major < minimumMajor) {
    return `Node.js ${minimumMajor}.x or newer is required (detected ${nodeVersion}).`;
  }

  return null;
}

function validateTimezone(env: NodeJS.ProcessEnv): string | null {
  const configuredTz = env.TZ ?? env.TIMEZONE;
  if (!configuredTz) {
    return `Set TZ=${REQUIRED_TIMEZONE} to enforce America/Chicago timestamps.`;
  }

  if (configuredTz !== REQUIRED_TIMEZONE) {
    return `Timezone must be ${REQUIRED_TIMEZONE} (current value: ${configuredTz}).`;
  }

  return null;
}

export function validateConfiguration(env: NodeJS.ProcessEnv, nodeVersion = process.versions.node): ValidationReport {
  const errors: string[] = [];
  const warnings: string[] = [];

  const missingKeys = REQUIRED_ENV_KEYS.filter((key) => !env[key]);
  if (missingKeys.length > 0) {
    errors.push(`Missing required environment variables: ${missingKeys.join(', ')}.`);
  }

  if (env.NODE_ENV && !['development', 'production'].includes(env.NODE_ENV)) {
    errors.push('NODE_ENV must be either "development" or "production".');
  }

  if (env.NEXT_PUBLIC_APP_URL && !/^https?:\/\//.test(env.NEXT_PUBLIC_APP_URL)) {
    errors.push('NEXT_PUBLIC_APP_URL must be an absolute URL starting with http:// or https://.');
  }

  const nodeVersionError = validateNodeVersion(nodeVersion);
  if (nodeVersionError) {
    errors.push(nodeVersionError);
  }

  const timezoneWarning = validateTimezone(env);
  if (timezoneWarning) {
    warnings.push(timezoneWarning);
  }

  return { errors, warnings };
}

function run(): void {
  const envPath = resolve(process.cwd(), '.env');
  const mergedEnv = mergeEnvWithFile(process.env, envPath);
  const { errors, warnings } = validateConfiguration(mergedEnv);

  if (warnings.length > 0) {
    warnings.forEach((warning) => {
      console.warn(`⚠️  ${warning}`);
    });
  }

  if (errors.length > 0) {
    errors.forEach((error) => {
      console.error(`❌ ${error}`);
    });
    process.exit(1);
  }

  console.log('✅ Cloudflare deployment configuration validated.');
}

const executedDirectly = import.meta.url === pathToFileURL(process.argv[1] ?? '').href;

if (executedDirectly) {
  run();
}
