#!/usr/bin/env node

import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const PROJECT_NAME = 'blazesportsintel';
const DEFAULT_PRODUCTION_URL = 'https://blazesportsintel.com';
const DEPLOY_DIR = '/var/tmp/bsi-deploy-out';
const DEPLOY_BUNDLE_DIRNAME = 'deploy-bundle';
const NPM = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const NPX = process.platform === 'win32' ? 'npx.cmd' : 'npx';

function stripAnsi(text) {
  return text.replace(/\u001b\[[0-9;?]*[ -/]*[@-~]/g, '');
}

function parseArgs(argv) {
  const args = {
    previewOnly: false,
    previewBranch: `guarded-${new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 14).toLowerCase()}`,
    productionUrl: DEFAULT_PRODUCTION_URL,
    headedSmoke: false,
    artifactDir: '',
    reportFile: '',
    skipPostProductionSmoke: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const current = argv[i];
    if (current === '--preview-only') {
      args.previewOnly = true;
      continue;
    }
    if (current === '--preview-branch') {
      args.previewBranch = (argv[i + 1] ?? args.previewBranch).toLowerCase();
      i += 1;
      continue;
    }
    if (current === '--production-url') {
      args.productionUrl = argv[i + 1] ?? args.productionUrl;
      i += 1;
      continue;
    }
    if (current === '--headed-smoke') {
      args.headedSmoke = true;
      continue;
    }
    if (current === '--artifact-dir') {
      args.artifactDir = argv[i + 1] ?? args.artifactDir;
      i += 1;
      continue;
    }
    if (current === '--report-file') {
      args.reportFile = argv[i + 1] ?? args.reportFile;
      i += 1;
      continue;
    }
    if (current === '--skip-post-production-smoke') {
      args.skipPostProductionSmoke = true;
    }
  }

  return args;
}

function runCommand(command, args, label) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: process.cwd(),
      env: process.env,
      stdio: ['inherit', 'pipe', 'pipe'],
    });

    let output = '';

    const forward = (stream, writer) => {
      stream.on('data', (chunk) => {
        const text = chunk.toString();
        output += text;
        writer.write(text);
      });
    };

    forward(child.stdout, process.stdout);
    forward(child.stderr, process.stderr);

    child.on('error', (error) => {
      reject(new Error(`${label} failed to start: ${error.message}`));
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve(output);
        return;
      }
      reject(new Error(`${label} exited with code ${code}`));
    });
  });
}

function logStep(text) {
  console.log(`\n=== ${text} ===`);
}

function createSummary(args) {
  return {
    projectName: PROJECT_NAME,
    startedAt: new Date().toISOString(),
    endedAt: null,
    success: false,
    previewOnly: args.previewOnly,
    previewBranch: args.previewBranch,
    productionUrl: args.productionUrl,
    preview: null,
    production: null,
    smokeChecks: {
      prePromotion: {
        status: 'pending',
        previewUrl: '',
        productionUrl: args.productionUrl || '',
      },
      postProduction: {
        status: args.previewOnly || args.skipPostProductionSmoke ? 'skipped' : 'pending',
        productionUrl: args.productionUrl || '',
      },
    },
    artifacts: {
      deployBundleDir: '',
    },
    error: null,
  };
}

async function persistSummary(reportFile, summary) {
  if (!reportFile) {
    return;
  }

  await mkdir(path.dirname(reportFile), { recursive: true });
  await writeFile(reportFile, `${JSON.stringify(summary, null, 2)}\n`, 'utf8');
}

async function stageOutput(args, summary) {
  logStep('Staging build output to deploy dir');
  await runCommand('rsync', ['-a', '--delete', 'out/', `${DEPLOY_DIR}/`], 'rsync stage');

  if (!args.artifactDir) {
    return;
  }

  const deployBundleDir = path.join(args.artifactDir, DEPLOY_BUNDLE_DIRNAME);
  await mkdir(deployBundleDir, { recursive: true });
  await runCommand('rsync', ['-a', '--delete', `${DEPLOY_DIR}/`, `${deployBundleDir}/`], 'rsync artifact bundle');
  summary.artifacts.deployBundleDir = deployBundleDir;
}

async function deployBranch(branch) {
  logStep(`Deploying Pages branch "${branch}"`);
  const output = stripAnsi(
    await runCommand(
      NPX,
      [
        'wrangler',
        'pages',
        'deploy',
        DEPLOY_DIR,
        '--project-name',
        PROJECT_NAME,
        '--branch',
        branch,
        '--commit-dirty=true',
      ],
      `wrangler deploy ${branch}`
    )
  );

  const aliasUrl =
    output.match(/Deployment alias URL:\s*(https?:\/\/\S+)/i)?.[1] ?? '';
  const deploymentUrl =
    output.match(/Deployment complete! Take a peek over at\s*(https?:\/\/\S+)/i)?.[1] ?? '';

  if (!deploymentUrl && !aliasUrl) {
    throw new Error(`Could not parse deploy URLs for branch ${branch}`);
  }

  return {
    branch,
    aliasUrl,
    deploymentUrl,
    smokeUrl: aliasUrl || deploymentUrl,
  };
}

async function runSmoke({ previewUrl, previewLabel, productionUrl, productionLabel, headed, artifactDir }) {
  const args = ['run', 'gate:release', '--'];

  if (headed) {
    args.push('--headed');
  }

  // Set BASE_URL env for Playwright
  process.env.BASE_URL = previewUrl;

  await runCommand(NPM, args, 'smoke:homepage');
}

async function runUrlSmoke(baseUrl) {
  const previousBaseUrl = process.env.BSI_BASE_URL;
  process.env.BSI_BASE_URL = baseUrl;

  try {
    await runCommand('bash', ['scripts/post-deploy-smoke.sh'], `post-deploy smoke for ${baseUrl}`);
  } finally {
    if (previousBaseUrl === undefined) {
      delete process.env.BSI_BASE_URL;
    } else {
      process.env.BSI_BASE_URL = previousBaseUrl;
    }
  }
}

async function runGuardedDeploy(args, summary) {
  logStep('Building BSI');
  await runCommand(NPM, ['run', 'build'], 'npm run build');

  await stageOutput(args, summary);

  const preview = await deployBranch(args.previewBranch);
  summary.preview = preview;
  console.log(`Preview alias: ${preview.aliasUrl || '(none)'}`);
  console.log(`Preview deployment: ${preview.deploymentUrl || '(none)'}`);
  summary.smokeChecks.prePromotion.previewUrl = preview.smokeUrl;

  logStep('Running preview smoke verification');
  await runUrlSmoke(preview.smokeUrl);
  summary.smokeChecks.prePromotion.status = 'passed';

  if (args.previewOnly) {
    console.log('\nGuarded deploy was run in preview-only mode.');
    return;
  }

  logStep('Running gated smoke checks against preview');
  await runSmoke({
    previewUrl: preview.smokeUrl,
    previewLabel: 'preview-candidate',
    productionUrl: args.productionUrl,
    productionLabel: 'current-production',
    headed: args.headedSmoke,
    artifactDir: args.artifactDir ? path.join(args.artifactDir, 'smoke', 'pre-promotion') : '',
  });

  const production = await deployBranch('main');
  summary.production = production;
  console.log(`Production deployment: ${production.deploymentUrl || '(none)'}`);

  if (!args.skipPostProductionSmoke) {
    logStep('Running post-production smoke verification');
    await runSmoke({
      previewUrl: args.productionUrl,
      previewLabel: 'post-production',
      productionUrl: '',
      productionLabel: '',
      headed: args.headedSmoke,
      artifactDir: args.artifactDir ? path.join(args.artifactDir, 'smoke', 'post-production') : '',
    });
    summary.smokeChecks.postProduction.status = 'passed';
  }

  console.log('\nGuarded deploy completed successfully.');
}

const args = parseArgs(process.argv.slice(2));
const summary = createSummary(args);

try {
  await runGuardedDeploy(args, summary);
  summary.success = true;
} catch (error) {
  summary.error = error instanceof Error ? error.message : String(error);

  if (summary.smokeChecks.prePromotion.status === 'pending') {
    summary.smokeChecks.prePromotion.status = 'failed';
  }

  if (summary.smokeChecks.postProduction.status === 'pending') {
    summary.smokeChecks.postProduction.status = summary.production ? 'failed' : 'blocked';
  }

  console.error(`\nGuarded deploy failed: ${summary.error}`);
  process.exitCode = 1;
} finally {
  summary.endedAt = new Date().toISOString();
  await persistSummary(args.reportFile, summary);
}

if (!summary.success) {
  process.exit(process.exitCode || 1);
}
