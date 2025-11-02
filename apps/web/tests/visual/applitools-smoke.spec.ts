import { test } from '@playwright/test';
import { ClassicRunner, Eyes, Target, BatchInfo, Configuration } from '@applitools/eyes-playwright';

const shouldSkip = !process.env.APPLITOOLS_API_KEY;

const routes = [
  { path: '/', name: 'Home' },
  { path: '/baseball', name: 'Baseball Landing' },
  { path: '/football', name: 'Football Landing' },
  { path: '/basketball', name: 'Basketball Landing' },
  { path: '/baseball/ncaab/games/diamond-prototype', name: 'Game Detail Prototype' }
];

test.describe('Applitools visual smoke', () => {
  test.skip(shouldSkip, 'APPLITOOLS_API_KEY is not configured.');

  const runner = new ClassicRunner();
  const batch = new BatchInfo('BSI Visual Smoke');

  const environment =
    process.env.NEXT_PUBLIC_APP_ENV ?? process.env.SENTRY_ENVIRONMENT ?? process.env.NODE_ENV ?? 'development';
  const release =
    process.env.NEXT_PUBLIC_SENTRY_RELEASE ?? process.env.SENTRY_RELEASE ?? process.env.VERCEL_GIT_COMMIT_SHA ?? 'local';

  for (const route of routes) {
    test(`captures ${route.name}`, async ({ page }, testInfo) => {
      const eyes = new Eyes(runner);
      const config = new Configuration();
      config.setBatch(batch);
      config.setAppName('BlazeSportsIntel Web');
      config.setTestName(`${route.name} (${environment})`);
      config.setEnvironmentName(environment);
      config.setViewportSize({ width: 1280, height: 720 });
      config.setProperty('route', route.path);
      config.setProperty('release', release);
      config.setProperty('build', testInfo.project.name);
      eyes.setConfiguration(config);

      try {
        await eyes.open(page);
        await page.goto(route.path, { waitUntil: 'networkidle' });
        await eyes.check(route.name, Target.window().fully());
        await eyes.closeAsync();
      } finally {
        await eyes.abortIfNotClosed();
      }
    });
  }

  test.afterAll(async () => {
    const results = await runner.getAllTestResults(false);
    console.log(results.toString());
  });
});
