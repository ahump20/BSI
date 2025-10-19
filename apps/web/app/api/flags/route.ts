import { NextResponse } from 'next/server';

type FeatureFlagRecord = {
  key: string;
  label: string;
  description: string;
  owner: string;
  enabled: boolean;
  rollout: string;
  lastToggled?: string;
};

const featureFlags: FeatureFlagRecord[] = [
  {
    key: 'diamond-pro.paywall',
    label: 'Diamond Pro Paywall',
    description: 'Gates Diamond Pro premium flows behind authentication and subscription checks.',
    owner: 'Product',
    enabled: true,
    rollout: '100% of authenticated users',
    lastToggled: '2025-10-12T14:30:00Z'
  },
  {
    key: 'live.diamond-engine',
    label: 'Live Diamond Engine',
    description: 'Activates the mobile-first live game experience with pitch-level telemetry.',
    owner: 'Platform',
    enabled: true,
    rollout: 'Gradual → 100% by 2025-11-01',
    lastToggled: '2025-10-10T09:15:00Z'
  },
  {
    key: 'visualizations.plotly-webgpu',
    label: 'Plotly WebGPU Mode',
    description: 'Turns on million-point Plotly.js WebGPU rendering inside analytics dashboards.',
    owner: 'Data Viz',
    enabled: false,
    rollout: 'Beta group only',
    lastToggled: '2025-09-29T21:05:00Z'
  },
  {
    key: 'recruiting.portal-tracker',
    label: 'Portal Tracker Alerts',
    description: 'Sends recruiting and transfer portal alerts to Diamond Pro coaching staffs.',
    owner: 'Product Ops',
    enabled: true,
    rollout: 'Southeastern footprint',
    lastToggled: '2025-10-14T17:42:00Z'
  },
  {
    key: 'labs.webgpu-prototype',
    label: 'Labs • WebGPU Demo',
    description: 'Exposes the GPU-accelerated particle playground inside /dev/labs.',
    owner: 'Labs',
    enabled: true,
    rollout: '100% of developer mode sessions',
    lastToggled: '2025-10-15T12:00:00Z'
  }
];

export const revalidate = 0;

export async function GET() {
  return NextResponse.json({
    environment: process.env.NEXT_PUBLIC_APP_ENV ?? 'development',
    updatedAt: new Date().toISOString(),
    flags: featureFlags
  });
}
