#!/usr/bin/env ts-node
/**
 * Move processed ingest JSON files from ingest/ to archive/ within Supabase S3 storage.
 *
 * Required environment variables:
 * - SUPABASE_S3_ENDPOINT
 * - SUPABASE_S3_ACCESS_KEY
 * - SUPABASE_S3_SECRET_KEY
 * - SUPABASE_S3_BUCKET
 *
 * Optional environment variables:
 * - SUPABASE_S3_REGION (default: us-east-1)
 * - SUPABASE_S3_INGEST_PREFIX (default: ingest/)
 * - SUPABASE_S3_ARCHIVE_PREFIX (default: archive/)
 */

import { S3Client, ListObjectsV2Command, CopyObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

const requiredEnv = [
  'SUPABASE_S3_ENDPOINT',
  'SUPABASE_S3_ACCESS_KEY',
  'SUPABASE_S3_SECRET_KEY',
  'SUPABASE_S3_BUCKET',
];

for (const key of requiredEnv) {
  if (!process.env[key]) {
    console.error(`Missing required environment variable: ${key}`);
    process.exit(1);
  }
}

const endpoint = process.env.SUPABASE_S3_ENDPOINT as string;
const accessKeyId = process.env.SUPABASE_S3_ACCESS_KEY as string;
const secretAccessKey = process.env.SUPABASE_S3_SECRET_KEY as string;
const bucket = process.env.SUPABASE_S3_BUCKET as string;
const region = process.env.SUPABASE_S3_REGION || 'us-east-1';
const ingestPrefix = process.env.SUPABASE_S3_INGEST_PREFIX || 'ingest/';
const archivePrefix = process.env.SUPABASE_S3_ARCHIVE_PREFIX || 'archive/';

const client = new S3Client({
  region,
  endpoint,
  forcePathStyle: true,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
});

interface ObjectSummary {
  Key: string;
}

async function listObjects(prefix: string): Promise<ObjectSummary[]> {
  const results: ObjectSummary[] = [];
  let continuationToken: string | undefined;

  do {
    const command = new ListObjectsV2Command({
      Bucket: bucket,
      Prefix: prefix,
      ContinuationToken: continuationToken,
    });

    const response = await client.send(command);
    const contents = response.Contents || [];
    for (const item of contents) {
      if (item.Key) {
        results.push({ Key: item.Key });
      }
    }
    continuationToken = response.IsTruncated ? response.NextContinuationToken : undefined;
  } while (continuationToken);

  return results;
}

function destinationKey(key: string): string {
  if (!key.startsWith(ingestPrefix)) {
    return `${archivePrefix}${key}`;
  }
  return `${archivePrefix}${key.slice(ingestPrefix.length)}`;
}

async function moveObject(key: string): Promise<void> {
  const destKey = destinationKey(key);
  const encodedKey = encodeURIComponent(key).replace(/%2F/g, '/');
  const copySource = `${bucket}/${encodedKey}`;

  await client.send(new CopyObjectCommand({
    Bucket: bucket,
    Key: destKey,
    CopySource: copySource,
    MetadataDirective: 'COPY',
  }));

  await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));

  console.log(`Archived ${key} → ${destKey}`);
}

async function main(): Promise<void> {
  console.log(`Scanning bucket ${bucket} for JSON payloads under ${ingestPrefix}...`);
  const objects = await listObjects(ingestPrefix);
  const jsonObjects = objects.filter((obj) => obj.Key.toLowerCase().endsWith('.json'));

  if (jsonObjects.length === 0) {
    console.log('No JSON objects found to archive.');
    return;
  }

  for (const obj of jsonObjects) {
    await moveObject(obj.Key);
  }

  console.log(`Archived ${jsonObjects.length} file(s) to ${archivePrefix}`);
}

main().catch((error) => {
  console.error('S3 archive failed:', error);
  process.exit(1);
});
