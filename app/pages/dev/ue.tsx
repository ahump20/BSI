import Head from 'next/head';
import type { NextPage } from 'next';
import { DeveloperModePanel } from '../../components/DeveloperModePanel';

const UnrealEngineBridgePage: NextPage = () => {
  const sections = [
    {
      title: 'Bridge Status',
      metrics: [
        {
          label: 'Health Endpoint',
          value: process.env.UNREAL_ENGINE_HEALTH_ENDPOINT ? 'Reachable' : 'Not Configured',
          intent: process.env.UNREAL_ENGINE_HEALTH_ENDPOINT ? 'success' : 'danger',
        },
        {
          label: 'Frame Sync Budget',
          value: '16.6 ms target',
          intent: 'warning',
        },
        {
          label: 'Last Asset Push',
          value: 'PitchLab Stadium v2.4',
          intent: 'default',
        },
      ],
    },
    {
      title: 'Data Contracts',
      metrics: [
        {
          label: 'Pitch Chart Stream',
          value: 'WebSocket • live',
          intent: 'success',
        },
        {
          label: 'Biomechanics Feed',
          value: 'REST • staging',
          intent: 'warning',
        },
        {
          label: 'UE Command Bus',
          value: 'MQTT • 1.2.3',
          intent: 'success',
        },
      ],
    },
  ];

  return (
    <>
      <Head>
        <title>Unreal Engine Bridge | BlazeSportsIntel</title>
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
          heading="Unreal Engine Bridge"
          description="Keeps the UE5 render pipeline synced with our data backbone so every pitch-and-catch looks big-time inside the sim."
          sections={sections}
          footerNote="Contact the graphics-engine-architect if the frame sync drifts beyond the 20 ms guardrail."
        />
      </main>
    </>
  );
};

export default UnrealEngineBridgePage;
