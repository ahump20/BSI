import fs from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const assetsDir = path.join(root, 'public', 'images');

async function exists(target) {
  try {
    await fs.access(target);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  if (!(await exists(assetsDir))) {
    console.log('[images:optimize] Skipping — no public/images directory found.');
    return;
  }

  console.log('[images:optimize] Skipping — optimization pipeline not configured in this build.');
}

main().catch((err) => {
  console.error('[images:optimize] Failed:', err);
  process.exit(1);
});
