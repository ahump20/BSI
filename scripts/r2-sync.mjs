#!/usr/bin/env node
/**
 * Upload built assets to Cloudflare R2 with cache headers.
 *
 * Required environment variables:
 * - CLOUDFLARE_R2_ACCOUNT_ID
 * - CLOUDFLARE_R2_ACCESS_KEY_ID
 * - CLOUDFLARE_R2_SECRET_ACCESS_KEY
 * - CLOUDFLARE_R2_BUCKET
 *
 * Optional:
 * - CLOUDFLARE_R2_REGION (defaults to "auto")
 * - R2_ASSETS_DIR (defaults to "dist/assets")
 */

import { S3Client, HeadObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import fs from 'fs/promises';
import { createReadStream } from 'fs';
import path from 'path';
import crypto from 'crypto';

const requiredEnv = [
  'CLOUDFLARE_R2_ACCOUNT_ID',
  'CLOUDFLARE_R2_ACCESS_KEY_ID',
  'CLOUDFLARE_R2_SECRET_ACCESS_KEY',
  'CLOUDFLARE_R2_BUCKET',
];

for (const key of requiredEnv) {
  if (!process.env[key]) {
    console.error(`Missing required environment variable: ${key}`);
    process.exit(1);
  }
}

const accountId = process.env.CLOUDFLARE_R2_ACCOUNT_ID;
const bucket = process.env.CLOUDFLARE_R2_BUCKET;
const region = process.env.CLOUDFLARE_R2_REGION || 'auto';
const assetsDir = path.resolve(process.env.R2_ASSETS_DIR || 'dist/assets');

const endpoint = `https://${accountId}.r2.cloudflarestorage.com`;

const client = new S3Client({
  region,
  endpoint,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
  },
});

const CACHE_CONTROL_IMMUTABLE = 'public, max-age=31536000, immutable';
const CACHE_CONTROL_FALLBACK = 'public, max-age=300, must-revalidate';

const CONTENT_TYPE_MAP = new Map([
  ['.js', 'application/javascript'],
  ['.mjs', 'application/javascript'],
  ['.cjs', 'application/javascript'],
  ['.css', 'text/css'],
  ['.json', 'application/json'],
  ['.map', 'application/json'],
  ['.svg', 'image/svg+xml'],
  ['.png', 'image/png'],
  ['.jpg', 'image/jpeg'],
  ['.jpeg', 'image/jpeg'],
  ['.webp', 'image/webp'],
  ['.avif', 'image/avif'],
  ['.woff', 'font/woff'],
  ['.woff2', 'font/woff2'],
  ['.ttf', 'font/ttf'],
  ['.txt', 'text/plain'],
]);

function getContentType(key) {
  const ext = path.extname(key).toLowerCase();
  return CONTENT_TYPE_MAP.get(ext) || 'application/octet-stream';
}

async function* walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* walk(fullPath);
    } else if (entry.isFile()) {
      yield fullPath;
    }
  }
}

async function fileHash(filePath) {
  const hash = crypto.createHash('md5');
  const stream = createReadStream(filePath);
  return await new Promise((resolve, reject) => {
    stream.on('data', (chunk) => hash.update(chunk));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', reject);
  });
}

async function objectETag(key) {
  try {
    const head = await client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
    if (head.ETag) {
      return head.ETag.replace(/"/g, '');
    }
    return null;
  } catch (error) {
    if (error?.$metadata?.httpStatusCode === 404) {
      return null;
    }
    if (error.name === 'NotFound') {
      return null;
    }
    throw error;
  }
}

async function uploadFile(filePath) {
  const relative = path.relative(assetsDir, filePath);
  const key = path.posix.join('assets', relative.split(path.sep).join('/'));
  const etag = await objectETag(key);
  const hash = await fileHash(filePath);

  if (etag === hash) {
    console.log(`Skipping ${relative} (unchanged)`);
    return;
  }

  const contentType = getContentType(key);
  const cacheControl = /(\.\w+)(\.[a-f0-9]{8,})?$/i.test(relative) ? CACHE_CONTROL_IMMUTABLE : CACHE_CONTROL_FALLBACK;

  const body = await fs.readFile(filePath);

  await client.send(new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: body,
    ContentType: contentType,
    CacheControl: cacheControl,
  }));

  console.log(`Uploaded ${relative} → ${key} [${contentType}]`);
}

async function main() {
  try {
    await fs.access(assetsDir);
  } catch (error) {
    console.error(`Assets directory not found: ${assetsDir}`);
    process.exit(1);
  }

  const files = [];
  for await (const file of walk(assetsDir)) {
    files.push(file);
  }

  if (files.length === 0) {
    console.warn('No files found to upload.');
    return;
  }

  console.log(`Uploading ${files.length} asset(s) from ${assetsDir} to bucket ${bucket}...`);

  for (const file of files) {
    await uploadFile(file);
  }

  console.log('Upload complete.');
}

main().catch((error) => {
  console.error('R2 upload failed:', error);
  process.exit(1);
});
