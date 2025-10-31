'use client';

import { useEffect, useRef, useState } from 'react';
import { BlazeVisualizationEngine, PitchData, HeatMapData } from '../../lib/visualization/engine';
import GameSelector from './GameSelector';

interface PitchVisualizationProps {
  gameId: string;
}

export default function PitchVisualization({ gameId }: PitchVisualizationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<BlazeVisualizationEngine | null>(null);
  const [pitchData, setPitchData] = useState<PitchData[]>([]);
  const [pitchIndex, setPitchIndex] = useState(0);
  const [heatMapVisible, setHeatMapVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize visualization engine
  useEffect(() => {
    if (!canvasRef.current) return;

    try {
      const engine = new BlazeVisualizationEngine(canvasRef.current);
      engineRef.current = engine;

      // Create strike zone
      engine.createStrikeZone();

      return () => {
        engine.dispose();
        engineRef.current = null;
      };
    } catch (err) {
      console.error('Failed to initialize visualization engine:', err);
      setError('Failed to initialize 3D visualization');
    }
  }, []);

  // Fetch pitch data
  useEffect(() => {
    async function loadPitchData() {
      try {
        setLoading(true);
        const response = await fetch(`/api/visualization/pitches/${gameId}`);

        if (!response.ok) {
          throw new Error('Failed to fetch pitch data');
        }

        const data = await response.json();
        setPitchData(data);

        if (data.length > 0) {
          displayPitch(0, data);
        }
      } catch (err) {
        console.error('Error loading pitch data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load pitch data');
      } finally {
        setLoading(false);
      }
    }

    loadPitchData();
  }, [gameId]);

  const displayPitch = (index: number, data?: PitchData[]) => {
    const pitches = data || pitchData;
    if (index >= pitches.length || !engineRef.current) return;

    const pitch = pitches[index];
    engineRef.current.renderPitchTrajectory(pitch);
    setPitchIndex(index);
  };

  const handleNextPitch = () => {
    if (pitchData.length === 0) return;
    const nextIndex = (pitchIndex + 1) % pitchData.length;
    displayPitch(nextIndex);
  };

  const handlePreviousPitch = () => {
    if (pitchData.length === 0) return;
    const prevIndex = pitchIndex === 0 ? pitchData.length - 1 : pitchIndex - 1;
    displayPitch(prevIndex);
  };

  const handleToggleHeatMap = async () => {
    if (!engineRef.current || pitchData.length === 0) return;

    if (!heatMapVisible) {
      try {
        const pitch = pitchData[pitchIndex];
        const response = await fetch(
          `/api/visualization/movements/${gameId}/${pitch.pitcher_name.replace(/\s+/g, '_')}`
        );

        if (!response.ok) {
          throw new Error('Failed to fetch heat map data');
        }

        const heatMapData: HeatMapData = await response.json();
        engineRef.current.renderHeatMap(heatMapData);
        setHeatMapVisible(true);
      } catch (err) {
        console.error('Error loading heat map:', err);
        setError('Failed to load heat map');
      }
    } else {
      engineRef.current.clearHeatMap();
      setHeatMapVisible(false);
    }
  };

  const handleResetView = () => {
    if (!engineRef.current) return;
    engineRef.current.resetCamera();
  };

  const currentPitch = pitchData[pitchIndex];

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-black text-white">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Error</h2>
          <p className="text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen bg-black">
      <canvas
        ref={canvasRef}
        className="w-full h-full touch-none"
        style={{ display: 'block' }}
      />

      {/* Game Selector */}
      <div className="fixed top-5 right-5 z-10">
        <GameSelector currentGameId={gameId} />
      </div>

      {/* HUD Overlay */}
      {currentPitch && (
        <div className="fixed top-5 left-5 bg-black/70 backdrop-blur-md p-4 rounded-xl border border-white/10 max-w-sm z-10">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-sm font-medium">Velocity</span>
              <span className="text-red-400 text-lg font-bold">
                {currentPitch.velocity.toFixed(1)} MPH
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-sm font-medium">Spin Rate</span>
              <span className="text-green-400 text-lg font-bold">
                {Math.round(currentPitch.spin_rate)} RPM
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-sm font-medium">Break</span>
              <span className="text-blue-400 text-lg font-bold">
                {Math.round(Math.sqrt(currentPitch.break_x ** 2 + currentPitch.break_z ** 2))}″
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-sm font-medium">Pitch Type</span>
              <span className="text-white text-lg font-bold">{currentPitch.pitch_type}</span>
            </div>
            <div className="border-t border-white/10 pt-2 mt-2">
              <div className="text-xs text-gray-500">
                {currentPitch.pitcher_name} → {currentPitch.batter_name}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Pitch {pitchIndex + 1} of {pitchData.length}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-white mb-4 mx-auto"></div>
            <p className="text-white text-lg">Loading 3D Visualization...</p>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="fixed bottom-5 left-1/2 -translate-x-1/2 flex gap-3 z-10">
        <button
          onClick={handlePreviousPitch}
          disabled={pitchData.length === 0 || loading}
          className="bg-white/10 backdrop-blur-md border border-white/20 text-white px-6 py-3 rounded-lg text-sm font-semibold hover:bg-white/20 transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>
        <button
          onClick={handleNextPitch}
          disabled={pitchData.length === 0 || loading}
          className="bg-white/10 backdrop-blur-md border border-white/20 text-white px-6 py-3 rounded-lg text-sm font-semibold hover:bg-white/20 transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next Pitch
        </button>
        <button
          onClick={handleToggleHeatMap}
          disabled={pitchData.length === 0 || loading}
          className="bg-white/10 backdrop-blur-md border border-white/20 text-white px-6 py-3 rounded-lg text-sm font-semibold hover:bg-white/20 transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {heatMapVisible ? 'Hide' : 'Show'} Heat Map
        </button>
        <button
          onClick={handleResetView}
          disabled={loading}
          className="bg-white/10 backdrop-blur-md border border-white/20 text-white px-6 py-3 rounded-lg text-sm font-semibold hover:bg-white/20 transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Reset View
        </button>
      </div>

      {/* Keyboard Shortcuts Hint */}
      <div className="fixed bottom-20 right-5 bg-black/70 backdrop-blur-md p-3 rounded-lg border border-white/10 text-xs text-gray-400 z-10 hidden md:block">
        <div className="font-semibold mb-1">Controls:</div>
        <div>Mouse: Rotate camera</div>
        <div>Scroll: Zoom</div>
        <div>Touch: Pinch to zoom</div>
      </div>
    </div>
  );
}
