import Head from 'next/head';
import type { NextPage } from 'next';
import { DeveloperModePanel } from '../../components/DeveloperModePanel';

const DeveloperDashboardPage: NextPage = () => {
  const sections = [
    {
      title: 'Runtime Signals',
      metrics: [
        {
          label: 'App Environment',
          value: process.env.NEXT_PUBLIC_APP_ENV ?? 'unconfigured',
          intent: (process.env.NEXT_PUBLIC_APP_ENV ?? '') === 'production' ? 'success' : 'warning',
        },
        {
          label: 'Feature Flag • Developer Mode',
          value: process.env.NEXT_PUBLIC_FEATURE_FLAG_DEVELOPER_MODE === 'true' ? 'Enabled' : 'Disabled',
          intent: process.env.NEXT_PUBLIC_FEATURE_FLAG_DEVELOPER_MODE === 'true' ? 'success' : 'danger',
        },
        {
          label: 'Data Refresh Interval (sec)',
          value: process.env.NEXT_PUBLIC_DATA_REFRESH_INTERVAL ?? '30',
          intent: 'default',
        },
      ],
    },
    {
      title: 'Integration Targets',
      metrics: [
        {
          label: 'DevOps Status Feed',
          value: process.env.DEVOPS_STATUS_FEED_URL ? 'Configured' : 'Missing',
          intent: process.env.DEVOPS_STATUS_FEED_URL ? 'success' : 'danger',
        },
        {
          label: 'UE Bridge Health Endpoint',
          value: process.env.UNREAL_ENGINE_HEALTH_ENDPOINT ? 'Configured' : 'Missing',
          intent: process.env.UNREAL_ENGINE_HEALTH_ENDPOINT ? 'success' : 'danger',
        },
        {
          label: 'Labs Experiment Feed',
          value: process.env.LABS_EXPERIMENTS_FEED ? 'Configured' : 'Missing',
          intent: process.env.LABS_EXPERIMENTS_FEED ? 'success' : 'warning',
        },
      ],
    },
  ];

  return (
    <>
      <Head>
        <title>Developer Mode | BlazeSportsIntel</title>
        <meta name="robots" content="noindex" />
      </Head>
      <main
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          padding: '3.5rem 1.5rem',
        }}
      >
        <DeveloperModePanel
          heading="Developer Mode"
          description="Quick pulse on the systems that power our internal tooling. If a flag is red, we fix it before first pitch."
          sections={sections}
          footerNote="Live data pulls from Cloudflare Workers caches every 30 seconds. Contact platform-ops if a connector is down for more than two refreshes."
        />
      </main>
    </>
  );
};

export default DeveloperDashboardPage;
