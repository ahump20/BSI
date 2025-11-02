import { cp, mkdir, rm, stat } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const dist = resolve(root, 'apps/games/phaser-bbp-web/dist');
const target = resolve(root, 'public/games/bbp-web');

async function main() {
  try {
    await stat(dist);
  } catch (error) {
    console.error('Phaser dist folder missing. Run "pnpm --filter @bsi/phaser-bbp-web build" first.');
    process.exit(1);
  }

  await rm(target, { recursive: true, force: true });
  await mkdir(target, { recursive: true });
  await cp(dist, target, { recursive: true });
  console.log(`Copied Backyard Blaze Ball build to ${target}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
