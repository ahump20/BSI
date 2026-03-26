/**
 * Discipline Guardrail Tests
 *
 * Proves three things:
 * 1. Branch guard hook exists and targets Edit|Write on main
 * 2. Post-compact brief includes session discipline rules
 * 3. Feedback memory records the six failure patterns
 */

import { describe, test, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const HOME = process.env.HOME || '/Users/AustinHumphrey';
const MEMORY_DIR = join(HOME, '.claude/projects/-Users-AustinHumphrey-bsi-repo/memory');
const SETTINGS_PATH = join(HOME, '.claude/settings.json');

describe('Branch guard hook', () => {
  test('settings.json has a PreToolUse hook matching Edit|Write that checks for main branch', () => {
    const settings = JSON.parse(readFileSync(SETTINGS_PATH, 'utf-8'));
    const preToolHooks = settings.hooks?.PreToolUse ?? [];

    const branchGuard = preToolHooks.find(
      (h: { matcher: string; hooks: Array<{ command: string }> }) =>
        h.matcher === 'Edit|Write' &&
        h.hooks?.some((hook: { command: string }) => hook.command.includes('BRANCH GUARD'))
    );

    expect(branchGuard).toBeDefined();
  });

  test('branch guard command checks git branch for main', () => {
    const settings = JSON.parse(readFileSync(SETTINGS_PATH, 'utf-8'));
    const preToolHooks = settings.hooks?.PreToolUse ?? [];

    const branchGuard = preToolHooks.find(
      (h: { matcher: string; hooks: Array<{ command: string }> }) =>
        h.hooks?.some((hook: { command: string }) => hook.command.includes('BRANCH GUARD'))
    );

    const command = branchGuard.hooks[0].command;
    expect(command).toContain('git branch --show-current');
    expect(command).toContain('"main"');
  });

  test('branch guard exempts config and memory files', () => {
    const settings = JSON.parse(readFileSync(SETTINGS_PATH, 'utf-8'));
    const preToolHooks = settings.hooks?.PreToolUse ?? [];

    const branchGuard = preToolHooks.find(
      (h: { matcher: string; hooks: Array<{ command: string }> }) =>
        h.hooks?.some((hook: { command: string }) => hook.command.includes('BRANCH GUARD'))
    );

    const command = branchGuard.hooks[0].command;
    expect(command).toContain('CLAUDE\\.md');
    expect(command).toContain('.claude/');
  });
});

describe('Post-compact brief', () => {
  const briefPath = join(MEMORY_DIR, 'post-compact-brief.md');

  test('post-compact brief file exists', () => {
    expect(existsSync(briefPath)).toBe(true);
  });

  test('includes session discipline section', () => {
    const content = readFileSync(briefPath, 'utf-8');
    expect(content).toContain('Session Discipline');
  });

  test('includes branch-before-write rule', () => {
    const content = readFileSync(briefPath, 'utf-8');
    expect(content).toContain('Branch before write');
  });

  test('includes silence rule', () => {
    const content = readFileSync(briefPath, 'utf-8');
    expect(content).toContain('One sentence or silence');
  });

  test('includes never-ask-permission rule', () => {
    const content = readFileSync(briefPath, 'utf-8');
    expect(content).toContain('Never ask permission');
  });

  test('includes verify-every-path rule', () => {
    const content = readFileSync(briefPath, 'utf-8');
    expect(content).toContain('Verify every affected path');
  });

  test('includes read-before-deploy rule', () => {
    const content = readFileSync(briefPath, 'utf-8');
    expect(content).toContain('Read the file before deploying');
  });

  test('includes trace-from-route rule', () => {
    const content = readFileSync(briefPath, 'utf-8');
    expect(content).toContain('Trace from route registration');
  });
});

describe('Feedback memory', () => {
  const feedbackPath = join(MEMORY_DIR, 'feedback_session-discipline-2026-03-25.md');

  test('feedback memory file exists', () => {
    expect(existsSync(feedbackPath)).toBe(true);
  });

  test('has correct frontmatter type', () => {
    const content = readFileSync(feedbackPath, 'utf-8');
    expect(content).toContain('type: feedback');
  });

  test('documents all six failures', () => {
    const content = readFileSync(feedbackPath, 'utf-8');
    expect(content).toContain('Technical reporting');
    expect(content).toContain('Asked "want me to push?"');
    expect(content).toContain('Committed to main');
    expect(content).toContain('Declared victory');
    expect(content).toContain('Deployed without confirming');
    expect(content).toContain('Built plan from wrong code');
  });

  test('identifies three structural patterns', () => {
    const content = readFileSync(feedbackPath, 'utf-8');
    expect(content).toContain('performing work');
    expect(content).toContain('speed over discipline');
    expect(content).toContain('defaults under execution pressure');
  });

  test('is indexed in MEMORY.md', () => {
    const index = readFileSync(join(MEMORY_DIR, 'MEMORY.md'), 'utf-8');
    expect(index).toContain('feedback_session-discipline-2026-03-25.md');
  });
});
