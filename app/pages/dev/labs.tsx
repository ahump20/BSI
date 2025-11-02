import Head from 'next/head';
import type { NextPage } from 'next';
import { DeveloperModePanel } from '../../components/DeveloperModePanel';

const LabsPreviewPage: NextPage = () => {
  const sections = [
    {
      title: 'Active Experiments',
      metrics: [
        {
          label: 'Portal Probability Engine',
          value: 'Alpha • GCP Vertex',
          intent: 'warning',
        },
        {
          label: 'Diamond Pro Auto-Tags',
          value: 'Beta • Ship by 11/15',
          intent: 'success',
        },
        {
          label: 'Biomech Capture Overlay',
          value: 'Concept Review',
          intent: 'default',
        },
      ],
    },
    {
      title: 'Guardrails',
      metrics: [
        {
          label: 'NIL Compliance',
          value: 'Clear',
          intent: 'success',
        },
        {
          label: 'LLM Fact Checker',
          value: 'Two-Pass Verifier',
          intent: 'success',
        },
        {
          label: 'Data Drift Watch',
          value: 'Active • 0.7σ',
          intent: 'warning',
        },
      ],
    },
  ];

  return (
    <>
      <Head>
        <title>Labs | BlazeSportsIntel</title>
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
          heading="Labs & Experiments"
          description="Skunkworks zone for next-season weapons. Every test is instrumented, reversible, and ready to harden fast."
          sections={sections}
          footerNote="Labs features stay behind Diamond Pro gates until analytics + compliance sign off."
        />
      </main>
    </>
  );
};

export default LabsPreviewPage;
