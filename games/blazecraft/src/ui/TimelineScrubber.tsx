/**
 * TimelineScrubber - Replay timeline control
 *
 * Play/pause, seek, speed control. The VCR-style transport controls
 * for navigating through replay ticks.
 */

import React, { useCallback, useRef } from 'react';
import type { PlaybackState } from '@core/ReplayEngine';
import { IconSkipBack, IconStepBack, IconPlay, IconPause, IconStepForward, IconSkipForward } from './Icons';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface TimelineScrubberProps {
  currentTick: number;
  totalTicks: number;
  playbackState: PlaybackState;
  playbackSpeed: number;
  onSeek: (tick: number) => void;
  onPlayPause: () => void;
  onSpeedChange: (speed: number) => void;
  onStep: (direction: 1 | -1) => void;
}

// ─────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────

const styles = {
  container: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    padding: '0.5rem 0',
  },
  controls: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  button: {
    width: '36px',
    height: '36px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#333',
    border: 'none',
    borderRadius: '4px',
    color: '#F5F5DC',
    cursor: 'pointer',
    fontSize: '1.25rem',
    transition: 'background 0.2s',
  },
  playButton: {
    width: '44px',
    height: '44px',
    background: '#BF5700',
    borderRadius: '50%',
    fontSize: '1.5rem',
  },
  scrubber: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.25rem',
  },
  slider: {
    width: '100%',
    height: '8px',
    appearance: 'none' as const,
    background: '#333',
    borderRadius: '4px',
    cursor: 'pointer',
    outline: 'none',
  },
  tickInfo: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.75rem',
    color: '#888',
  },
  speedControl: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    minWidth: '120px',
  },
  speedLabel: {
    fontSize: '0.75rem',
    color: '#888',
    minWidth: '48px',
    textAlign: 'center' as const,
  },
  speedSlider: {
    width: '80px',
    height: '4px',
    appearance: 'none' as const,
    background: '#333',
    borderRadius: '2px',
    cursor: 'pointer',
  },
};

// Add custom slider styling
const sliderStyles = `
  .timeline-slider::-webkit-slider-thumb {
    appearance: none;
    width: 16px;
    height: 16px;
    background: #BF5700;
    border-radius: 50%;
    cursor: pointer;
    transition: transform 0.1s;
  }
  .timeline-slider::-webkit-slider-thumb:hover {
    transform: scale(1.2);
  }
  .timeline-slider::-moz-range-thumb {
    width: 16px;
    height: 16px;
    background: #BF5700;
    border: none;
    border-radius: 50%;
    cursor: pointer;
  }
  .speed-slider::-webkit-slider-thumb {
    appearance: none;
    width: 12px;
    height: 12px;
    background: #888;
    border-radius: 50%;
    cursor: pointer;
  }
  .speed-slider::-moz-range-thumb {
    width: 12px;
    height: 12px;
    background: #888;
    border: none;
    border-radius: 50%;
    cursor: pointer;
  }
`;

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────

export function TimelineScrubber({
  currentTick,
  totalTicks,
  playbackState,
  playbackSpeed,
  onSeek,
  onPlayPause,
  onSpeedChange,
  onStep,
}: TimelineScrubberProps): React.ReactElement {
  const sliderRef = useRef<HTMLInputElement>(null);

  const handleSliderChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onSeek(parseInt(e.target.value, 10));
  }, [onSeek]);

  const handleSpeedSliderChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onSpeedChange(parseInt(e.target.value, 10));
  }, [onSpeedChange]);

  const progress = totalTicks > 0 ? (currentTick / (totalTicks - 1)) * 100 : 0;

  const formatTick = (tick: number): string => {
    // Convert ticks to approximate time (assuming 10 ticks/second)
    const seconds = tick / 10;
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <>
      <style>{sliderStyles}</style>
      <div style={styles.container}>
        {/* Transport Controls */}
        <div style={styles.controls}>
          {/* Jump to Start */}
          <button
            style={styles.button}
            onClick={() => onSeek(0)}
            title="Jump to start (Home)"
          >
            <IconSkipBack size={16} />
          </button>

          {/* Step Back */}
          <button
            style={styles.button}
            onClick={() => onStep(-1)}
            title="Step back"
          >
            <IconStepBack size={16} />
          </button>

          {/* Play/Pause */}
          <button
            style={{ ...styles.button, ...styles.playButton }}
            onClick={onPlayPause}
            title={playbackState === 'playing' ? 'Pause (Space)' : 'Play (Space)'}
          >
            {playbackState === 'playing' ? <IconPause size={18} /> : <IconPlay size={18} />}
          </button>

          {/* Step Forward */}
          <button
            style={styles.button}
            onClick={() => onStep(1)}
            title="Step forward"
          >
            <IconStepForward size={16} />
          </button>

          {/* Jump to End */}
          <button
            style={styles.button}
            onClick={() => onSeek(totalTicks - 1)}
            title="Jump to end (End)"
          >
            <IconSkipForward size={16} />
          </button>
        </div>

        {/* Timeline Scrubber */}
        <div style={styles.scrubber}>
          <input
            ref={sliderRef}
            type="range"
            min="0"
            max={totalTicks - 1}
            value={currentTick}
            onChange={handleSliderChange}
            className="timeline-slider"
            style={{
              ...styles.slider,
              background: `linear-gradient(to right, #BF5700 ${progress}%, #333 ${progress}%)`,
            }}
          />
          <div style={styles.tickInfo}>
            <span>{formatTick(currentTick)}</span>
            <span>Tick {currentTick} / {totalTicks - 1}</span>
            <span>{formatTick(totalTicks - 1)}</span>
          </div>
        </div>

        {/* Speed Control */}
        <div style={styles.speedControl}>
          <span style={styles.speedLabel}>{playbackSpeed}x</span>
          <input
            type="range"
            min="1"
            max="50"
            value={playbackSpeed}
            onChange={handleSpeedSliderChange}
            className="speed-slider"
            style={styles.speedSlider}
            title="Playback speed"
          />
        </div>
      </div>
    </>
  );
}
