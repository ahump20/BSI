#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const secretlintConfig = path.join(repoRoot, '.secretlintrc.json');
const secretlintIgnore = path.join(repoRoot, '.secretlintignore');
const npxCommand = process.platform === 'win32' ? 'npx.cmd' : 'npx';

function runGit(args, options = {}) {
  const result = spawnSync('git', args, {
    cwd: repoRoot,
    encoding: options.encoding ?? null,
    maxBuffer: 1024 * 1024 * 20,
    ...options,
  });

  if (result.status !== 0) {
    const stderr =
      typeof result.stderr === 'string'
        ? result.stderr.trim()
        : Buffer.from(result.stderr ?? []).toString('utf8').trim();
    throw new Error(stderr || `git ${args.join(' ')} failed`);
  }

  return result.stdout;
}

function getStagedFiles() {
  const output = runGit(['diff', '--cached', '--name-only', '--diff-filter=ACMR', '-z']);
  const entries = Buffer.from(output)
    .toString('utf8')
    .split('\u0000')
    .filter(Boolean);

  return entries;
}

function getStagedBlob(filePath) {
  const result = spawnSync('git', ['show', `:${filePath}`], {
    cwd: repoRoot,
    encoding: null,
    maxBuffer: 1024 * 1024 * 20,
  });

  if (result.status !== 0) {
    const stderr = Buffer.from(result.stderr ?? []).toString('utf8').trim();
    throw new Error(stderr || `Unable to read staged blob for ${filePath}`);
  }

  return result.stdout;
}

function isBinary(buffer) {
  return buffer.includes(0);
}

function runSecretlintOnBuffer(filePath, buffer) {
  return spawnSync(
    npxCommand,
    [
      '--no-install',
      'secretlint',
      '--secretlintrc',
      secretlintConfig,
      '--secretlintignore',
      secretlintIgnore,
      '--stdinFileName',
      filePath,
    ],
    {
      cwd: repoRoot,
      encoding: 'utf8',
      input: buffer,
      maxBuffer: 1024 * 1024 * 20,
    }
  );
}

function main() {
  const stagedFiles = getStagedFiles();

  if (stagedFiles.length === 0) {
    process.exit(0);
  }

  console.log(`Scanning ${stagedFiles.length} staged file(s) for secrets...`);

  let failed = false;

  for (const filePath of stagedFiles) {
    const blob = getStagedBlob(filePath);

    if (isBinary(blob)) {
      continue;
    }

    const result = runSecretlintOnBuffer(filePath, blob);

    if (result.status === 0) {
      continue;
    }

    failed = true;
    const stdout = result.stdout?.trim();
    const stderr = result.stderr?.trim();

    console.error(`\nSecret scan failed for staged file: ${filePath}`);
    if (stdout) {
      console.error(stdout);
    }
    if (stderr) {
      console.error(stderr);
    }
  }

  if (failed) {
    console.error('\nCommit blocked. Remove or rotate sensitive credentials before committing.');
    console.error('If you are intentionally testing the hook, unstage the file before retrying.');
    process.exit(1);
  }
}

try {
  main();
} catch (error) {
  console.error(
    error instanceof Error ? error.message : 'Unexpected error while scanning staged files for secrets.'
  );
  process.exit(2);
}
