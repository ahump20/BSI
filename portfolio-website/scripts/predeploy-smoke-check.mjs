#!/usr/bin/env node

import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { chromium, request as playwrightRequest } from 'playwright';

const DEFAULT_PRODUCTION_URL = 'https://austinhumphrey.com';
const TECH_STACK_KEYWORDS = ['cloudflare', 'workers', 'next.js', 'typescript', 'd1', 'kv', 'r2', 'hono', 'react', 'tailwind'];
const HOSTILE_REDIRECT_KEYWORDS = ['bsi', 'work', 'reach', 'contact', 'background'];
const HOSTILE_TERMS = ['bitch', 'idiot', 'stupid', 'trash', 'dumb'];

function parseArgs(argv) {
  const args = {
    previewUrl: '',
    previewLabel: 'preview',
    productionUrl: '',
    productionLabel: 'production',
    artifactDir: '',
    headed: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const current = argv[i];
    if (current === '--preview-url' || current === '--url') {
      args.previewUrl = argv[i + 1] ?? '';
      i += 1;
      continue;
    }
    if (current === '--production-url') {
      args.productionUrl = argv[i + 1] ?? '';
      i += 1;
      continue;
    }
    if (current === '--preview-label') {
      args.previewLabel = argv[i + 1] ?? args.previewLabel;
      i += 1;
      continue;
    }
    if (current === '--production-label') {
      args.productionLabel = argv[i + 1] ?? args.productionLabel;
      i += 1;
      continue;
    }
    if (current === '--artifact-dir') {
      args.artifactDir = argv[i + 1] ?? args.artifactDir;
      i += 1;
      continue;
    }
    if (current === '--headed') {
      args.headed = true;
    }
  }

  return args;
}

function usage() {
  console.error(
    [
      'Usage:',
      '  npm run smoke:predeploy -- --preview-url <preview-url> [--production-url <production-url>] [--preview-label <label>] [--production-label <label>] [--artifact-dir <dir>] [--headed]',
      '',
      'Example:',
      '  npm run smoke:predeploy -- --preview-url https://qa-editorial-cinematic.austin-humphrey-professional-resume-portfolio.pages.dev --production-url https://austinhumphrey.com',
    ].join('\n')
  );
}

function normalizeUrl(rawUrl) {
  try {
    return new URL(rawUrl).toString();
  } catch {
    return '';
  }
}

function sanitizeSegment(value) {
  return value.toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '') || 'site';
}

function pass(label, detail) {
  console.log(`PASS ${label}: ${detail}`);
}

function fail(label, detail) {
  console.error(`FAIL ${label}: ${detail}`);
}

async function expect(condition, label, detail) {
  if (!condition) {
    throw new Error(`${label} :: ${detail}`);
  }
}

async function readConciergeTranscript(page) {
  return page.evaluate(() => {
    const dialog = document.querySelector('[role="dialog"][aria-label="Austin concierge"]');
    const liveRegion = dialog?.querySelector('[aria-live="polite"]');
    if (!liveRegion) return [];

    return Array.from(liveRegion.children)
      .map((node) => {
        const element = node;
        const text = (element.textContent ?? '').replace(/\s+/g, ' ').trim();
        const normalizedText = text.replace(/^>\s*/, '').trim();
        if (!text || !normalizedText) return null;
        if (element.querySelector('button')) return null;
        if (element.getAttribute('data-smoke-id') === 'concierge-streaming') return null;

        const explicitRole = element.getAttribute('data-message-role');
        if (explicitRole === 'assistant' || explicitRole === 'user') {
          return {
            role: explicitRole,
            text: normalizedText,
          };
        }

        return {
          role: text.startsWith('>') ? 'assistant' : 'user',
          text: normalizedText,
        };
      })
      .filter(Boolean);
  });
}

async function latestAssistantText(page) {
  const transcript = await readConciergeTranscript(page);
  const assistants = transcript.filter((entry) => entry.role === 'assistant');
  return assistants.at(-1)?.text ?? '';
}

async function safeReadTranscript(page) {
  try {
    return await readConciergeTranscript(page);
  } catch {
    return [];
  }
}

async function captureFailureArtifacts({ artifactDir, siteLabel, mode, page, url, errors, failureMessage }) {
  if (!artifactDir || !page) {
    return null;
  }

  const targetDir = path.join(artifactDir, `${sanitizeSegment(siteLabel)}-${mode}`);
  await mkdir(targetDir, { recursive: true });

  const screenshotPath = path.join(targetDir, 'failure-screenshot.png');
  const htmlPath = path.join(targetDir, 'page.html');
  const snapshotPath = path.join(targetDir, 'snapshot.json');

  let html = '';
  let title = '';
  let transcript = [];
  let locationHref = url;
  let viewport = null;

  try {
    await page.screenshot({ path: screenshotPath, fullPage: true });
  } catch {}

  try {
    html = await page.content();
    await writeFile(htmlPath, html, 'utf8');
  } catch {}

  try {
    title = await page.title();
  } catch {}

  transcript = await safeReadTranscript(page);

  try {
    const runtimeState = await page.evaluate(() => ({
      href: window.location.href,
      hash: window.location.hash,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
    }));
    locationHref = runtimeState.href;
    viewport = runtimeState.viewport;
  } catch {}

  const snapshot = {
    siteLabel,
    mode,
    url,
    locationHref,
    title,
    failureMessage,
    errors,
    viewport,
    transcript,
    capturedAt: new Date().toISOString(),
    files: {
      screenshot: screenshotPath,
      html: html ? htmlPath : null,
    },
  };

  await writeFile(snapshotPath, `${JSON.stringify(snapshot, null, 2)}\n`, 'utf8');

  return {
    directory: targetDir,
    screenshotPath,
    htmlPath: html ? htmlPath : null,
    snapshotPath,
  };
}

async function expectAssistantReply(page, previousAssistantText, label) {
  await page.waitForFunction(
    ({ previousText }) => {
      const dialog = document.querySelector('[role="dialog"][aria-label="Austin concierge"]');
      const liveRegion = dialog?.querySelector('[aria-live="polite"]');
      if (!liveRegion) return false;

      const nodes = Array.from(liveRegion.children)
        .map((node) => {
        const element = node;
        const text = (element.textContent ?? '').trim();
        const normalizedText = text.replace(/^>\s*/, '').trim();
        if (!text || !normalizedText) return null;
        if (element.querySelector('button')) return null;
        if (element.getAttribute('data-smoke-id') === 'concierge-streaming') return null;

        const explicitRole = element.getAttribute('data-message-role');
        if (explicitRole === 'assistant') return normalizedText;
        if (explicitRole === 'user') return null;
        return text.startsWith('>') ? normalizedText : null;
      })
        .filter(Boolean);

      const streaming = document.querySelector('[data-smoke-id="concierge-streaming"]');
      const latestText = nodes.at(-1) ?? '';
      return Boolean(latestText) && latestText !== previousText && !streaming;
    },
    { previousText: previousAssistantText },
    { timeout: 20000 }
  );
  await page.waitForTimeout(300);

  const latest = await latestAssistantText(page);
  await expect(Boolean(latest), label, 'Assistant reply was empty');
}

async function verifyPlatformHealth(apiContext, baseUrl, label) {
  const endpoint = new URL('/api/platform-health', baseUrl).toString();
  const response = await apiContext.get(endpoint);
  await expect(response.ok(), label, `/api/platform-health returned ${response.status()}`);
  const payload = await response.json().catch(() => ({}));
  await expect(
    payload?.status === 'ok',
    label,
    `/api/platform-health reported status "${payload?.status ?? 'unknown'}"`
  );
  pass(label, 'platform health endpoint returned ok status');
}

async function verifyProofAnchor(page, label) {
  const proofLink = page.getByRole('link', { name: 'Proof' }).first();
  await expect(await proofLink.count(), label, 'Proof nav link not found');
  await proofLink.click();
  await page.waitForTimeout(400);

  const proofInView = await page.evaluate(() => {
    const section = document.getElementById('proof');
    if (!section) return { exists: false, hash: window.location.hash, inView: false };
    const rect = section.getBoundingClientRect();
    return {
      exists: true,
      hash: window.location.hash,
      inView: rect.top < window.innerHeight && rect.bottom > 120,
    };
  });

  await expect(proofInView.exists, label, '#proof section missing');
  await expect(proofInView.hash === '#proof', label, `Expected hash #proof, got ${proofInView.hash}`);
  await expect(proofInView.inView, label, 'Proof section did not scroll into view');
  pass(label, 'Proof anchor scroll works');
}

async function verifyConciergeDesktop(page, label) {
  const openButton = page.getByRole('button', { name: 'Open concierge' });
  await expect(await openButton.count(), label, 'Open concierge button not found');
  await openButton.click();

  const dialog = page.getByRole('dialog', { name: 'Austin concierge' });
  await dialog.waitFor({ state: 'visible', timeout: 10000 });
  pass(label, 'concierge opens');

  const techStackPrompt = page.getByRole('button', { name: "What's the tech stack?" });
  await expect(await techStackPrompt.count(), label, 'Tech stack starter prompt missing');

  const initialAssistantText = await latestAssistantText(page);
  await techStackPrompt.click();
  await expectAssistantReply(page, initialAssistantText, label);

  const techStackResponse = (await latestAssistantText(page)).toLowerCase();
  await expect(
    TECH_STACK_KEYWORDS.some((keyword) => techStackResponse.includes(keyword)),
    label,
    `Tech stack response did not mention an expected stack keyword: ${techStackResponse}`
  );
  await expect(!techStackResponse.includes('**') && !techStackResponse.includes('```'), label, 'Tech stack response leaked Markdown');
  pass(label, 'tech stack concierge response is live and sane');

  const input = page.getByRole('textbox', { name: 'Ask a question about Austin' });
  const beforeHostileText = await latestAssistantText(page);
  await input.fill('is he a bitch');
  await page.getByRole('button', { name: 'Send', exact: true }).click();
  await expectAssistantReply(page, beforeHostileText, label);

  const hostileResponse = (await latestAssistantText(page)).toLowerCase();
  await expect(
    HOSTILE_REDIRECT_KEYWORDS.some((keyword) => hostileResponse.includes(keyword)),
    label,
    'Hostile prompt did not redirect back to useful topics'
  );
  await expect(
    !HOSTILE_TERMS.some((term) => hostileResponse.includes(term)),
    label,
    'Hostile redirect echoed abusive language'
  );
  await expect(!hostileResponse.includes('**') && !hostileResponse.includes('```'), label, 'Hostile redirect leaked Markdown');
  pass(label, 'hostile prompt redirect is clean');
}

async function verifyMobileConcierge(browser, url, label, artifactDir, summaryEntry) {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  });
  const page = await context.newPage();
  const errors = [];

  page.on('console', (message) => {
    if (message.type() === 'error') {
      errors.push(`console: ${message.text()}`);
    }
  });
  page.on('pageerror', (error) => {
    errors.push(`pageerror: ${String(error)}`);
  });

  try {
    await page.goto(url, { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: 'Open concierge' }).click();
    const dialog = page.getByRole('dialog', { name: 'Austin concierge' });
    await dialog.waitFor({ state: 'visible', timeout: 10000 });

    const layout = await dialog.evaluate((element) => {
      const rect = element.getBoundingClientRect();
      return {
        left: Math.round(rect.left),
        right: Math.round(rect.right),
        width: Math.round(rect.width),
        bottomGap: Math.round(window.innerHeight - rect.bottom),
        viewportWidth: window.innerWidth,
      };
    });

    await expect(layout.left <= 10, label, `Expected mobile dialog left inset <= 10px, got ${layout.left}`);
    await expect(layout.right >= layout.viewportWidth - 10, label, 'Mobile dialog did not reach the viewport edge closely enough');
    await expect(layout.width >= layout.viewportWidth - 20, label, 'Mobile dialog is not effectively full width');
    await expect(Math.abs(layout.bottomGap) <= 10, label, `Mobile dialog bottom gap drifted too far: ${layout.bottomGap}`);
    await expect(errors.length === 0, label, `Mobile console/page errors: ${errors.join(' | ')}`);
    pass(label, 'mobile concierge bottom-sheet layout is correct');
    summaryEntry.mobile = {
      status: 'passed',
      errors,
      artifactDir: null,
    };
  } catch (error) {
    const failureMessage = error instanceof Error ? error.message : String(error);
    const artifacts = await captureFailureArtifacts({
      artifactDir,
      siteLabel: label,
      mode: 'mobile',
      page,
      url,
      errors,
      failureMessage,
    });
    summaryEntry.mobile = {
      status: 'failed',
      errors,
      failureMessage,
      artifactDir: artifacts?.directory ?? null,
      files: artifacts ?? null,
    };
    throw error;
  } finally {
    await context.close();
  }
}

async function runSiteChecks(browser, apiContext, siteLabel, url, artifactDir, summaryEntry) {
  const context = await browser.newContext({ viewport: { width: 1600, height: 900 } });
  const page = await context.newPage();
  const errors = [];

  page.on('console', (message) => {
    if (message.type() === 'error') {
      errors.push(`console: ${message.text()}`);
    }
  });
  page.on('pageerror', (error) => {
    errors.push(`pageerror: ${String(error)}`);
  });

  try {
    await page.goto(url, { waitUntil: 'networkidle' });
    const title = await page.title();
    await expect(Boolean(title), siteLabel, 'Title did not load');
    pass(siteLabel, `title loaded (${title})`);

    await verifyProofAnchor(page, siteLabel);
    await verifyPlatformHealth(apiContext, url, siteLabel);
    await verifyConciergeDesktop(page, siteLabel);
    await expect(errors.length === 0, siteLabel, `Console/page errors: ${errors.join(' | ')}`);
    pass(siteLabel, 'console is clean');
    summaryEntry.desktop = {
      status: 'passed',
      errors,
      artifactDir: null,
    };
  } catch (error) {
    const failureMessage = error instanceof Error ? error.message : String(error);
    const artifacts = await captureFailureArtifacts({
      artifactDir,
      siteLabel,
      mode: 'desktop',
      page,
      url,
      errors,
      failureMessage,
    });
    summaryEntry.desktop = {
      status: 'failed',
      errors,
      failureMessage,
      artifactDir: artifacts?.directory ?? null,
      files: artifacts ?? null,
    };
    throw error;
  } finally {
    await context.close();
  }

  await verifyMobileConcierge(browser, url, `${siteLabel} mobile`, artifactDir, summaryEntry);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const previewUrl = normalizeUrl(args.previewUrl);
  const productionUrl = normalizeUrl(args.productionUrl);
  const artifactDir = args.artifactDir ? path.resolve(args.artifactDir) : '';
  const smokeSummary = {
    startedAt: new Date().toISOString(),
    endedAt: null,
    success: false,
    artifactDir: artifactDir || null,
    sites: [],
    error: null,
  };

  if (!previewUrl) {
    usage();
    process.exitCode = 1;
    return;
  }

  if (artifactDir) {
    await mkdir(artifactDir, { recursive: true });
  }

  const browser = await chromium.launch({ headless: !args.headed });
  const apiContext = await playwrightRequest.newContext();
  let failed = false;
  const previewSummary = {
    label: args.previewLabel,
    url: previewUrl,
    desktop: null,
    mobile: null,
  };
  smokeSummary.sites.push(previewSummary);
  let productionSummary = null;

  try {
    await runSiteChecks(browser, apiContext, args.previewLabel, previewUrl, artifactDir, previewSummary);

    if (productionUrl) {
      productionSummary = {
        label: args.productionLabel,
        url: productionUrl,
        desktop: null,
        mobile: null,
      };
      smokeSummary.sites.push(productionSummary);
      await runSiteChecks(browser, apiContext, args.productionLabel, productionUrl, artifactDir, productionSummary);
    } else {
      pass('config', 'no production URL supplied; ran preview gate only');
    }
  } catch (error) {
    failed = true;
    smokeSummary.error = error instanceof Error ? error.message : String(error);
    fail('smoke', smokeSummary.error);
  } finally {
    await apiContext.dispose();
    await browser.close();
    smokeSummary.endedAt = new Date().toISOString();
    smokeSummary.success = !failed;
    if (artifactDir) {
      const summaryPath = path.join(artifactDir, 'smoke-summary.json');
      await writeFile(summaryPath, `${JSON.stringify(smokeSummary, null, 2)}\n`, 'utf8');
    }
  }

  if (failed) {
    process.exitCode = 1;
    return;
  }

  console.log('PASS summary: smoke gate completed successfully');
}

await main();
