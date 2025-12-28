'use client';

import dynamic from 'next/dynamic';

// Dynamic import to avoid SSR issues with TensorFlow.js and Web Audio API
const VisionCoachClient = dynamic(() => import('./VisionCoachClient'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-bsi-midnight flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-bsi-orange/30 border-t-bsi-orange rounded-full animate-spin mx-auto mb-4" />
        <p className="text-bsi-bone/70 font-oswald tracking-widest uppercase text-sm">
          Loading Vision Coach v2...
        </p>
      </div>
    </div>
  ),
});

export default function CoachPage() {
  return <VisionCoachClient />;
}
