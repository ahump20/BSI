'use client';

/**
 * Football QB Trajectory Overlay Page
 *
 * Demonstrates cinematic 3D pass visualization with:
 * - Ray tracing and volumetric lighting (WebGPU)
 * - SSAO and depth of field effects
 * - Code-split component loading
 * - Real-time pass data integration
 */

import React, { Suspense, useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import type { PassData } from '../../../../components/visuals/FootballQBTrajectory';

// Dynamic import with code splitting
const FootballQBTrajectory = dynamic(
  () => import('../../../../components/visuals/FootballQBTrajectory'),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mb-4 mx-auto"></div>
          <p className="text-xl">Loading 3D Visualization...</p>
          <p className="text-sm text-gray-400 mt-2">Code-splitting Babylon.js bundle</p>
        </div>
      </div>
    ),
  }
);

/**
 * Generate sample pass data for demonstration
 * In production, this would come from your NFL API
 */
function generateSamplePasses(): PassData[] {
  const passes: PassData[] = [];
  const passTypes: Array<'short' | 'medium' | 'deep' | 'screen'> = ['short', 'medium', 'deep', 'screen'];
  const results: Array<'complete' | 'incomplete' | 'interception' | 'touchdown'> =
    ['complete', 'incomplete', 'interception', 'touchdown'];

  const qbs = ['Patrick Mahomes', 'Josh Allen', 'Joe Burrow', 'Lamar Jackson'];
  const receivers = ['Tyreek Hill', 'Stefon Diggs', 'Ja\'Marr Chase', 'Mark Andrews'];

  for (let i = 0; i < 15; i++) {
    const passType = passTypes[i % passTypes.length];
    let airYards = 0;
    let hangTime = 0;

    // Determine pass characteristics based on type
    switch (passType) {
      case 'screen':
        airYards = -2 + Math.random() * 3; // -2 to 1 yards
        hangTime = 0.5 + Math.random() * 0.5;
        break;
      case 'short':
        airYards = 5 + Math.random() * 10; // 5-15 yards
        hangTime = 1 + Math.random() * 1;
        break;
      case 'medium':
        airYards = 15 + Math.random() * 15; // 15-30 yards
        hangTime = 2 + Math.random() * 1;
        break;
      case 'deep':
        airYards = 30 + Math.random() * 30; // 30-60 yards
        hangTime = 3 + Math.random() * 2;
        break;
    }

    const velocity = 40 + Math.random() * 30; // 40-70 mph

    // Release point (QB position, 6 feet high)
    const releasePoint: [number, number, number] = [
      (Math.random() - 0.5) * 10, // Slight lateral movement in pocket
      1.8 + Math.random() * 0.2,   // Release height
      -20 + Math.random() * 5,     // Behind line of scrimmage
    ];

    // Calculate catch point based on air yards
    const catchX = (Math.random() - 0.5) * 30; // Across the field
    const catchZ = releasePoint[2] + airYards;
    const catchY = 1.8 + Math.random() * 1; // Catch height

    const catchPoint: [number, number, number] = [catchX, catchY, catchZ];

    // Generate parabolic trajectory
    const trajectory: Array<[number, number, number]> = [];
    const steps = 40;

    for (let step = 0; step <= steps; step++) {
      const t = step / steps;

      // Interpolate position
      const x = releasePoint[0] + (catchPoint[0] - releasePoint[0]) * t;
      const z = releasePoint[2] + (catchPoint[2] - releasePoint[2]) * t;

      // Parabolic arc (peak at midpoint)
      const arcHeight = hangTime * 3; // Higher hang time = higher arc
      const y = releasePoint[1] +
                (catchPoint[1] - releasePoint[1]) * t +
                Math.sin(t * Math.PI) * arcHeight;

      trajectory.push([x, y, z]);
    }

    // Generate receiver route
    const receiverRoute: Array<[number, number, number]> = [];
    const routeSteps = 30;

    for (let step = 0; step <= routeSteps; step++) {
      const t = step / routeSteps;
      const routeZ = releasePoint[2] + (catchPoint[2] - releasePoint[2]) * t;

      let routeX: number;
      if (passType === 'deep') {
        // Go route (straight)
        routeX = catchPoint[0];
      } else if (passType === 'medium') {
        // Out route (break at midpoint)
        routeX = t < 0.5 ? 0 : catchPoint[0] * ((t - 0.5) * 2);
      } else {
        // Slant or crossing route
        routeX = catchPoint[0] * t;
      }

      receiverRoute.push([routeX, 0.05, routeZ]);
    }

    const completionProb = passType === 'screen' ? 0.8 :
                           passType === 'short' ? 0.7 :
                           passType === 'medium' ? 0.6 :
                           0.4; // deep pass

    passes.push({
      id: `pass-${i}`,
      timestamp: Date.now() - (15 - i) * 8000,
      quarterback: qbs[i % qbs.length],
      receiver: receivers[i % receivers.length],
      passType,
      releasePoint,
      trajectory,
      catchPoint,
      hangTime,
      airYards,
      velocity,
      completionProbability: completionProb + (Math.random() - 0.5) * 0.2,
      result: results[i % results.length],
      receiverRoute,
    });
  }

  return passes;
}

export default function QBTrajectoryPage() {
  const [passes, setPasses] = useState<PassData[]>([]);
  const [showField, setShowField] = useState(true);
  const [showRoutes, setShowRoutes] = useState(true);
  const [showProbabilitySpheres, setShowProbabilitySpheres] = useState(true);
  const [cameraAutoRotate, setCameraAutoRotate] = useState(false);
  const [highlightPassId, setHighlightPassId] = useState<string | null>(null);
  const [selectedPass, setSelectedPass] = useState<PassData | null>(null);

  useEffect(() => {
    // Generate sample passes on mount
    // In production: fetch from API
    setPasses(generateSamplePasses());
  }, []);

  const handlePassClick = (pass: PassData) => {
    setSelectedPass(pass);
    setHighlightPassId(pass.id);
  };

  return (
    <div className="h-screen flex flex-col bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 text-white p-4 flex items-center justify-between shadow-lg">
        <div>
          <h1 className="text-2xl font-bold">🏈 Football QB Trajectory</h1>
          <p className="text-sm text-gray-400">
            Cinematic 3D Visualization with Ray Tracing + Volumetric Lighting
          </p>
        </div>

        {/* Controls */}
        <div className="flex gap-4 items-center flex-wrap">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={showField}
              onChange={(e) => setShowField(e.target.checked)}
              className="w-4 h-4"
            />
            Show Field
          </label>

          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={showRoutes}
              onChange={(e) => setShowRoutes(e.target.checked)}
              className="w-4 h-4"
            />
            Show Routes
          </label>

          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={showProbabilitySpheres}
              onChange={(e) => setShowProbabilitySpheres(e.target.checked)}
              className="w-4 h-4"
            />
            Probability Spheres
          </label>

          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={cameraAutoRotate}
              onChange={(e) => setCameraAutoRotate(e.target.checked)}
              className="w-4 h-4"
            />
            Auto-Rotate
          </label>

          <button
            onClick={() => {
              setHighlightPassId(null);
              setSelectedPass(null);
            }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm transition-colors"
          >
            Clear Selection
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* 3D Visualization */}
        <div className="flex-1 relative">
          <Suspense fallback={
            <div className="h-full flex items-center justify-center bg-gray-900 text-white">
              <p>Loading visualization...</p>
            </div>
          }>
            <FootballQBTrajectory
              passes={passes}
              showField={showField}
              showRoutes={showRoutes}
              showProbabilitySpheres={showProbabilitySpheres}
              cameraAutoRotate={cameraAutoRotate}
              highlightPassId={highlightPassId}
              onPassClick={handlePassClick}
            />
          </Suspense>
        </div>

        {/* Sidebar */}
        <aside className="w-80 bg-gray-800 text-white p-4 overflow-y-auto">
          <h2 className="text-xl font-bold mb-4">Pass Data</h2>

          {selectedPass ? (
            <div className="bg-gray-700 p-4 rounded mb-4">
              <h3 className="font-bold text-lg mb-2">Selected Pass</h3>
              <div className="space-y-1 text-sm">
                <p><span className="text-gray-400">Type:</span> {selectedPass.passType.toUpperCase()}</p>
                <p><span className="text-gray-400">QB:</span> {selectedPass.quarterback}</p>
                <p><span className="text-gray-400">Receiver:</span> {selectedPass.receiver}</p>
                <p><span className="text-gray-400">Air Yards:</span> {selectedPass.airYards.toFixed(1)} yds</p>
                <p><span className="text-gray-400">Hang Time:</span> {selectedPass.hangTime.toFixed(2)}s</p>
                <p><span className="text-gray-400">Velocity:</span> {selectedPass.velocity.toFixed(1)} mph</p>
                <p><span className="text-gray-400">Completion Prob:</span> {(selectedPass.completionProbability * 100).toFixed(0)}%</p>
                <p><span className="text-gray-400">Result:</span> <span className={
                  selectedPass.result === 'complete' ? 'text-green-400' :
                  selectedPass.result === 'touchdown' ? 'text-yellow-400' :
                  selectedPass.result === 'incomplete' ? 'text-red-400' : 'text-purple-400'
                }>{selectedPass.result.toUpperCase()}</span></p>
              </div>
            </div>
          ) : (
            <p className="text-gray-400 text-sm mb-4">Click a pass to view details</p>
          )}

          <h3 className="font-bold mb-2">All Passes ({passes.length})</h3>
          <div className="space-y-2">
            {passes.map((pass) => (
              <button
                key={pass.id}
                onClick={() => handlePassClick(pass)}
                className={`w-full text-left p-3 rounded transition-colors ${
                  highlightPassId === pass.id
                    ? 'bg-blue-600'
                    : 'bg-gray-700 hover:bg-gray-600'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-xs uppercase">{pass.passType}</span>
                  <span className="text-xs text-gray-300">{pass.airYards.toFixed(0)} yds</span>
                </div>
                <div className="text-xs text-gray-400 mb-1">
                  {pass.quarterback} → {pass.receiver}
                </div>
                <div className="flex items-center justify-between">
                  <span className={`text-xs ${
                    pass.result === 'complete' ? 'text-green-400' :
                    pass.result === 'touchdown' ? 'text-yellow-400' :
                    pass.result === 'incomplete' ? 'text-red-400' : 'text-purple-400'
                  }`}>
                    {pass.result.toUpperCase()}
                  </span>
                  <span className="text-xs text-gray-400">
                    {(pass.completionProbability * 100).toFixed(0)}% prob
                  </span>
                </div>
              </button>
            ))}
          </div>
        </aside>
      </div>

      {/* Footer */}
      <footer className="bg-gray-800 text-white p-3 text-center text-xs">
        <p>
          Ray Tracing • Volumetric Lighting • SSAO • Depth of Field • PBR Materials
        </p>
        <p className="text-gray-400 mt-1">
          WebGPU-first rendering with graceful WebGL2 degradation • Progressive Enhancement
        </p>
      </footer>
    </div>
  );
}
