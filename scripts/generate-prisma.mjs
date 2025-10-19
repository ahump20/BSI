import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');

const packages = [
  { name: '@bsi/web', dir: path.join(repoRoot, 'apps/web') },
  { name: '@bsi/ingest-worker', dir: path.join(repoRoot, 'workers/ingest') },
  { name: '@bsi/content-worker', dir: path.join(repoRoot, 'workers/content') },
];

for (const pkg of packages) {
  const pkgJsonPath = path.join(pkg.dir, 'package.json');
  if (!existsSync(pkgJsonPath)) {
    continue;
  }

  const pkgJson = JSON.parse(readFileSync(pkgJsonPath, 'utf8'));
  if (!pkgJson.scripts || !pkgJson.scripts['prisma:generate']) {
    continue;
  }

  console.log(`➡️  Generating Prisma client for ${pkg.name}...`);
  try {
    execSync('pnpm exec prisma generate --schema ../../prisma/schema.prisma', {
      cwd: pkg.dir,
      stdio: 'inherit',
      env: {
        ...process.env,
        PRISMA_GENERATE_SKIP_AUTOINSTALL: 'true',
        CI: process.env.CI ?? '1',
      },
    });
  } catch (error) {
    console.error(`❌ Failed to generate Prisma client for ${pkg.name}`);
    throw error;
  }
}

console.log('✅ Prisma clients are up to date.');
