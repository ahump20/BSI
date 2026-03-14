#!/usr/bin/env node

import { spawn } from 'node:child_process';
import { access, readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const NPX = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const DEFAULT_PROJECT_NAME = 'blazesportsintel';
const DEFAULT_BRANCH = 'main';
const DEFAULT_RELEASES_DIR = path.resolve(process.cwd(), '.release-artifacts', 'releases');
const DEPLOY_BUNDLE_DIRNAME = 'deploy-bundle';

function parseArgs(argv) {
  const args = {
    artifactDir: '',
    projectName: DEFAULT_PROJECT_NAME,
    branch: DEFAULT_BRANCH,
    releasesDir: DEFAULT_RELEASES_DIR,
    list: false,
    yes: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const current = argv[i];

    if (current === '--artifact-dir') {
      args.artifactDir = path.resolve(argv[i + 1] ?? '');
      i += 1;
      continue;
    }
    if (current === '--project-name') {
      args.projectName = argv[i + 1] ?? args.projectName;
      i += 1;
      continue;
    }
    if (current === '--branch') {
      args.branch = argv[i + 1] ?? args.branch;
      i += 1;
      continue;
    }
    if (current === '--releases-dir') {
      args.releasesDir = path.resolve(argv[i + 1] ?? args.releasesDir);
      i += 1;
      continue;
    }
    if (current === '--list') {
      args.list = true;
      continue;
    }
    if (current === '--yes') {
      args.yes = true;
    }
  }

  return args;
}

async function pathExists(targetPath) {
  try {
    await access(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function readJsonIfPresent(filePath) {
  if (!(await pathExists(filePath))) {
    return null;
  }
  const raw = await readFile(filePath, 'utf8');
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function listReleaseDirectories(releasesDir) {
  if (!(await pathExists(releasesDir))) {
    return [];
  }

  const entries = await readdir(releasesDir, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(releasesDir, entry.name))
    .sort((a, b) => b.localeCompare(a));
}

function runCommand(command, args, label) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: process.cwd(),
      env: process.env,
      stdio: 'inherit',
    });

    child.on('error', (error) => {
      reject(new Error(`${label} failed to start: ${error.message}`));
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`${label} exited with code ${code}`));
    });
  });
}

async function resolveArtifactDir(args) {
  if (args.artifactDir) {
    return args.artifactDir;
  }

  const releases = await listReleaseDirectories(args.releasesDir);
  return releases[0] || '';
}

async function printReleaseList(args) {
  const releases = await listReleaseDirectories(args.releasesDir);
  if (releases.length === 0) {
    console.log(`No release artifacts found in ${args.releasesDir}`);
    return;
  }

  console.log(`Release artifacts in ${args.releasesDir}:`);
  for (const release of releases) {
    const metadata = await readJsonIfPresent(path.join(release, 'release-metadata.json'));
    const summary = await readJsonIfPresent(path.join(release, 'guarded-release-summary.json'));
    const succeeded = metadata?.success === true || summary?.success === true;
    const status = succeeded ? 'success' : 'failed/unknown';
    console.log(`- ${release} (${status})`);
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.list) {
    await printReleaseList(args);
    return;
  }

  const artifactDir = await resolveArtifactDir(args);
  if (!artifactDir) {
    throw new Error(`No release artifact directory found. Checked: ${args.releasesDir}`);
  }

  const deployBundleDir = path.join(artifactDir, DEPLOY_BUNDLE_DIRNAME);
  if (!(await pathExists(deployBundleDir))) {
    throw new Error(`Rollback bundle is missing: ${deployBundleDir}`);
  }

  const metadataPath = path.join(artifactDir, 'release-metadata.json');
  const summaryPath = path.join(artifactDir, 'guarded-release-summary.json');
  const metadata = await readJsonIfPresent(metadataPath);
  const summary = await readJsonIfPresent(summaryPath);

  console.log(`Rollback artifact: ${artifactDir}`);
  console.log(`Deploy bundle: ${deployBundleDir}`);
  if (metadata?.startedAt) {
    console.log(`Artifact started: ${metadata.startedAt}`);
  }
  if (summary?.production?.deploymentUrl) {
    console.log(`Artifact production deployment: ${summary.production.deploymentUrl}`);
  }
  if (summary?.success === false) {
    console.log('Warning: artifact summary indicates the original release failed.');
  }

  if (!args.yes) {
    throw new Error('Rollback is a production action. Re-run with --yes to confirm.');
  }

  const deployArgs = [
    'wrangler',
    'pages',
    'deploy',
    deployBundleDir,
    '--project-name',
    args.projectName,
    '--branch',
    args.branch,
    '--commit-dirty=true',
  ];

  await runCommand(NPX, deployArgs, 'wrangler pages deploy rollback');
  console.log('Rollback deploy completed.');
}

await main();
