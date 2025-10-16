#!/usr/bin/env node
/**
 * Cloudflare cache purge utility.
 *
 * Required environment variables:
 * - CLOUDFLARE_API_TOKEN
 * - CLOUDFLARE_ZONE_ID
 *
 * Usage:
 *   node scripts/invalidate-cloudflare.mjs
 *   node scripts/invalidate-cloudflare.mjs --files https://example.com/a.js https://example.com/b.css
 */

const requiredEnv = ['CLOUDFLARE_API_TOKEN', 'CLOUDFLARE_ZONE_ID'];

for (const key of requiredEnv) {
  if (!process.env[key]) {
    console.error(`Missing required environment variable: ${key}`);
    process.exit(1);
  }
}

const token = process.env.CLOUDFLARE_API_TOKEN;
const zoneId = process.env.CLOUDFLARE_ZONE_ID;

const args = process.argv.slice(2);
const files = [];
let purgeEverything = true;

for (let i = 0; i < args.length; i += 1) {
  const arg = args[i];
  if (arg === '--files') {
    purgeEverything = false;
    files.push(...args.slice(i + 1));
    break;
  }
}

if (!purgeEverything && files.length === 0) {
  console.error('No files provided after --files');
  process.exit(1);
}

const body = purgeEverything
  ? { purge_everything: true }
  : { files };

async function main() {
  const response = await fetch(`https://api.cloudflare.com/client/v4/zones/${zoneId}/purge_cache`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  const result = await response.json().catch(() => ({}));

  if (!response.ok || result.success === false) {
    console.error('Cache purge failed:', result.errors || result);
    process.exit(1);
  }

  if (purgeEverything) {
    console.log('Successfully purged entire Cloudflare cache.');
  } else {
    console.log(`Successfully purged ${files.length} file(s):`);
    for (const file of files) {
      console.log(` - ${file}`);
    }
  }
}

main().catch((error) => {
  console.error('Cloudflare purge error:', error);
  process.exit(1);
});
