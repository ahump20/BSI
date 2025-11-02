import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const sourceDir = path.join(repoRoot, 'apps/games/phaser-bbp-web/dist');
const targetDir = path.join(repoRoot, 'apps/web/public/games/bbp-web');

function ensureSourceExists() {
  if (!fs.existsSync(sourceDir)) {
    console.error(`⚠️  Phaser build output not found at ${sourceDir}. Run "pnpm --filter @bsi/phaser-bbp-web build" first.`);
    process.exit(1);
  }
}

function copyDirectory(source, target) {
  fs.rmSync(target, { recursive: true, force: true });
  fs.mkdirSync(target, { recursive: true });
  fs.cpSync(source, target, { recursive: true });
}

try {
  ensureSourceExists();
  copyDirectory(sourceDir, targetDir);
  console.log(`✅ Copied Phaser build from ${sourceDir} to ${targetDir}`);
} catch (error) {
  console.error('❌ Failed to copy Phaser build output:', error);
  process.exit(1);
}
