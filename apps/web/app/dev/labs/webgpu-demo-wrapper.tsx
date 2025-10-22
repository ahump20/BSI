'use client';

import dynamic from 'next/dynamic';

const WebGPUDemo = dynamic(() => import('../../../components/WebGPUDemo'), { ssr: false });

export default function WebGPUDemoWrapper() {
  return <WebGPUDemo />;
}
