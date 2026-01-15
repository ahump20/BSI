'use client';

import { useCallback, useState } from 'react';
import type * as THREE from 'three';
import { BackyardFieldViewer } from '@/components/three';

interface AnchorInfo {
  name: string;
  position: THREE.Vector3;
}

const CAMERA_PRESETS = [
  { id: 'SYB_Cam_BehindBatter', label: 'Behind Batter' },
  { id: 'SYB_Cam_StrikeZoneHigh', label: 'Strike Zone High' },
  { id: 'SYB_Cam_Isometric', label: 'Isometric' },
];

export default function BackyardFieldPage() {
  const [anchors, setAnchors] = useState<AnchorInfo[]>([]);
  const [cameras, setCameras] = useState<string[]>([]);

  const handleAnchorsReady = useCallback((map: Map<string, THREE.Object3D>) => {
    const next = Array.from(map.entries())
      .map(([name, obj]) => ({ name, position: obj.position.clone() }))
      .sort((a, b) => a.name.localeCompare(b.name));
    setAnchors(next);
  }, []);

  const handleCamerasReady = useCallback((map: Map<string, THREE.Camera>) => {
    setCameras(Array.from(map.keys()).sort());
  }, []);

  return (
    <div className="min-h-screen bg-midnight text-white">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-12 lg:flex-row">
        <div className="w-full lg:w-2/3">
          <div className="rounded-3xl border border-white/10 bg-black/40 p-4 shadow-2xl">
            <div className="aspect-[16/9] w-full overflow-hidden rounded-2xl">
              <BackyardFieldViewer
                glbUrl="/assets/syb/SYB_BackyardField.glb"
                cameraPresets={CAMERA_PRESETS}
                initialCameraName="SYB_Cam_BehindBatter"
                onAnchorsReady={handleAnchorsReady}
                onCamerasReady={handleCamerasReady}
              />
            </div>
          </div>
        </div>
        <div className="w-full space-y-6 lg:w-1/3">
          <div className="rounded-2xl border border-white/10 bg-black/40 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-burnt-orange">
              Backyard Field
            </p>
            <h1 className="mt-4 text-3xl font-display font-bold uppercase text-white">
              SYB Camera & Anchor Console
            </h1>
            <p className="mt-3 text-sm text-white/70">
              Switch between Blender-exported cameras and inspect anchor empties for player and ball
              placement.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/40 p-6">
            <h2 className="text-sm font-semibold uppercase tracking-[0.25em] text-white/70">
              Cameras ({cameras.length})
            </h2>
            <ul className="mt-4 space-y-2 text-sm text-white/80">
              {cameras.length === 0 && <li className="text-white/40">No cameras loaded.</li>}
              {cameras.map((camera) => (
                <li key={camera} className="rounded-lg border border-white/10 px-3 py-2">
                  {camera}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/40 p-6">
            <h2 className="text-sm font-semibold uppercase tracking-[0.25em] text-white/70">
              Anchors ({anchors.length})
            </h2>
            <ul className="mt-4 space-y-2 text-sm text-white/80">
              {anchors.length === 0 && <li className="text-white/40">No anchors detected.</li>}
              {anchors.map((anchor) => (
                <li key={anchor.name} className="rounded-lg border border-white/10 px-3 py-2">
                  <div className="font-semibold text-white">{anchor.name}</div>
                  <div className="text-xs text-white/60">
                    {anchor.position.x.toFixed(2)}, {anchor.position.y.toFixed(2)},
                    {anchor.position.z.toFixed(2)}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
