#!/usr/bin/env node

import { spawn } from 'node:child_process';
import { createWriteStream } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

function timestamp() {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

function sanitizeSegment(value) {
  return value.toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 48) || 'release';
}

function parseArgs(argv) {
  const args = {
    artifactDir: '',
    forwardedArgs: [],
    previewBranch: '',
  };

  for (let i = 0; i < argv.length; i += 1) {
    const current = argv[i];
    if (current === '--artifact-dir') {
      args.artifactDir = argv[i + 1] ?? args.artifactDir;
      i += 1;
      continue;
    }
    if (current === '--preview-branch') {
      args.previewBranch = argv[i + 1] ?? args.previewBranch;
      args.forwardedArgs.push(current, args.previewBranch);
      i += 1;
      continue;
    }

    args.forwardedArgs.push(current);
  }

  return args;
}

async function writeJson(filePath, payload) {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
}

function createArtifactDir(baseDir, previewBranch) {
  const suffix = previewBranch ? `-${sanitizeSegment(previewBranch)}` : '';
  return path.resolve(baseDir || path.join(process.cwd(), '.release-artifacts', 'releases', `${timestamp()}${suffix}`));
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const artifactDir = createArtifactDir(args.artifactDir, args.previewBranch);
  const logPath = path.join(artifactDir, 'guarded-release.log');
  const summaryPath = path.join(artifactDir, 'guarded-release-summary.json');
  const metadataPath = path.join(artifactDir, 'release-metadata.json');
  const startedAt = new Date().toISOString();

  await mkdir(artifactDir, { recursive: true });
  const logStream = createWriteStream(logPath, { flags: 'a' });

  const commandArgs = ['scripts/guarded-deploy.mjs', ...args.forwardedArgs, '--artifact-dir', artifactDir, '--report-file', summaryPath];

  console.log(`Release artifacts: ${artifactDir}`);
  console.log(`Release log: ${logPath}`);
  console.log(`Release summary: ${summaryPath}`);

  const child = spawn(process.execPath, commandArgs, {
    cwd: process.cwd(),
    env: process.env,
    stdio: ['inherit', 'pipe', 'pipe'],
  });

  let combinedOutput = '';

  const forward = (stream, writer) => {
    stream.on('data', (chunk) => {
      const text = chunk.toString();
      combinedOutput += text;
      writer.write(text);
      logStream.write(text);
    });
  };

  forward(child.stdout, process.stdout);
  forward(child.stderr, process.stderr);

  const exitCode = await new Promise((resolve, reject) => {
    child.on('error', reject);
    child.on('close', resolve);
  });

  logStream.end();

  await writeJson(metadataPath, {
    artifactDir,
    logPath,
    summaryPath,
    startedAt,
    endedAt: new Date().toISOString(),
    success: exitCode === 0,
    exitCode,
    command: [process.execPath, ...commandArgs],
    previewBranch: args.previewBranch || null,
    rawOutputLength: combinedOutput.length,
  });

  console.log(`\nRelease metadata: ${metadataPath}`);

  if (exitCode !== 0) {
    process.exit(exitCode);
  }
}

await main();
