'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import type { PlotParams } from 'react-plotly.js';
import { motion } from 'framer-motion';

const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });

export interface Pitch {
  x: number;           // Horizontal location (-1 to 1, 0 is center)
  y: number;           // Vertical location (0 to 4, roughly feet)
  type: string;        // Pitch type (FB, CB, SL, CH, etc.)
  velocity?: number;   // MPH
  result?: 'ball' | 'called_strike' | 'swinging_strike' | 'foul' | 'in_play';
  spin?: number;       // RPM
  break?: { x: number; y: number }; // Break amount
}

export interface StrikeZoneProps {
  pitches: Pitch[];
  title?: string;
  showStrikeZone?: boolean;
  colorBy?: 'type' | 'result' | 'velocity';
  height?: number;
  width?: number;
  batterSide?: 'left' | 'right';
  onPitchClick?: (pitch: Pitch) => void;
}

/**
 * Strike Zone Visualization Component
 * Interactive pitch location chart with customizable coloring and filtering
 * Optimized for baseball pitch analysis
 */
export default function StrikeZone({
  pitches,
  title = 'Strike Zone',
  showStrikeZone = true,
  colorBy = 'type',
  height = 500,
  width,
  batterSide = 'right',
  onPitchClick
}: StrikeZoneProps) {
  const [selectedPitchType, setSelectedPitchType] = useState<string | null>(null);
  const [hoveredPitch, setHoveredPitch] = useState<Pitch | null>(null);

  // Strike zone boundaries (approximate MLB zone)
  const strikeZone = {
    left: -0.83,    // ~17 inches / 2
    right: 0.83,
    bottom: 1.5,    // Bottom of knees
    top: 3.5        // Letters/chest
  };

  // Pitch type color mapping
  const pitchTypeColors: Record<string, string> = {
    'FB': 'rgba(220, 38, 38, 0.7)',     // Fastball - Red
    '4FB': 'rgba(220, 38, 38, 0.7)',    // Four-seam - Red
    '2FB': 'rgba(239, 68, 68, 0.7)',    // Two-seam - Light red
    'SI': 'rgba(249, 115, 22, 0.7)',    // Sinker - Orange
    'CT': 'rgba(251, 191, 36, 0.7)',    // Cutter - Amber
    'SL': 'rgba(59, 130, 246, 0.7)',    // Slider - Blue
    'CB': 'rgba(37, 99, 235, 0.7)',     // Curveball - Dark blue
    'CH': 'rgba(34, 197, 94, 0.7)',     // Changeup - Green
    'SP': 'rgba(168, 85, 247, 0.7)',    // Splitter - Purple
    'KN': 'rgba(236, 72, 153, 0.7)',    // Knuckleball - Pink
    'default': 'rgba(148, 163, 184, 0.7)' // Unknown - Gray
  };

  // Result color mapping
  const resultColors: Record<string, string> = {
    'ball': 'rgba(59, 130, 246, 0.7)',
    'called_strike': 'rgba(34, 197, 94, 0.7)',
    'swinging_strike': 'rgba(220, 38, 38, 0.7)',
    'foul': 'rgba(251, 191, 36, 0.7)',
    'in_play': 'rgba(168, 85, 247, 0.7)'
  };

  // Filter pitches if a type is selected
  const filteredPitches = selectedPitchType
    ? pitches.filter(p => p.type === selectedPitchType)
    : pitches;

  // Prepare scatter plot data
  const getColorForPitch = (pitch: Pitch): string => {
    if (colorBy === 'type') {
      return pitchTypeColors[pitch.type] || pitchTypeColors['default'];
    } else if (colorBy === 'result' && pitch.result) {
      return resultColors[pitch.result] || pitchTypeColors['default'];
    } else if (colorBy === 'velocity' && pitch.velocity) {
      // Gradient from blue (slow) to red (fast)
      const minVelo = 70;
      const maxVelo = 100;
      const normalized = (pitch.velocity - minVelo) / (maxVelo - minVelo);
      const r = Math.round(220 * normalized);
      const b = Math.round(246 * (1 - normalized));
      return `rgba(${r}, 130, ${b}, 0.7)`;
    }
    return pitchTypeColors['default'];
  };

  const scatterData: PlotParams['data'] = [
    {
      type: 'scatter',
      mode: 'markers',
      x: filteredPitches.map(p => p.x),
      y: filteredPitches.map(p => p.y),
      marker: {
        size: filteredPitches.map(p => p.velocity ? 8 + (p.velocity - 70) / 5 : 10),
        color: filteredPitches.map(p => getColorForPitch(p)),
        line: {
          color: 'rgba(255, 255, 255, 0.4)',
          width: 1
        },
        symbol: 'circle'
      },
      text: filteredPitches.map(p =>
        `${p.type}${p.velocity ? ` ${p.velocity}mph` : ''}${p.result ? ` - ${p.result.replace('_', ' ')}` : ''}`
      ),
      hovertemplate: '<b>%{text}</b><br>Location: (%{x:.2f}, %{y:.2f})<extra></extra>',
      customdata: filteredPitches as any
    }
  ];

  // Add strike zone rectangle if enabled
  const shapes: Partial<PlotParams['layout']>['shapes'] = showStrikeZone ? [
    {
      type: 'rect',
      x0: strikeZone.left,
      y0: strikeZone.bottom,
      x1: strikeZone.right,
      y1: strikeZone.top,
      line: {
        color: 'rgba(191, 87, 0, 0.8)',
        width: 3
      },
      fillcolor: 'rgba(191, 87, 0, 0.05)'
    },
    // Add home plate
    {
      type: 'path',
      path: 'M -0.708 0.15 L 0.708 0.15 L 0.708 0 L 0 -0.3 L -0.708 0 Z',
      line: {
        color: 'rgba(248, 250, 252, 0.6)',
        width: 2
      },
      fillcolor: 'rgba(248, 250, 252, 0.1)'
    }
  ] : [];

  const layout: Partial<PlotParams['layout']> = {
    title: {
      text: title,
      font: {
        family: 'system-ui, -apple-system, sans-serif',
        size: 20,
        color: 'rgba(248, 250, 252, 0.95)',
        weight: 600
      },
      x: 0.5,
      xanchor: 'center'
    },
    xaxis: {
      title: {
        text: 'Horizontal Location (ft)',
        font: { color: 'rgba(248, 250, 252, 0.8)', size: 12 }
      },
      range: [-2, 2],
      gridcolor: 'rgba(148, 163, 184, 0.2)',
      tickfont: { color: 'rgba(248, 250, 252, 0.7)', size: 10 },
      zeroline: true,
      zerolinecolor: 'rgba(148, 163, 184, 0.4)',
      zerolinewidth: 1,
      scaleanchor: 'y',
      scaleratio: 1
    },
    yaxis: {
      title: {
        text: 'Height (ft)',
        font: { color: 'rgba(248, 250, 252, 0.8)', size: 12 }
      },
      range: [0, 5],
      gridcolor: 'rgba(148, 163, 184, 0.2)',
      tickfont: { color: 'rgba(248, 250, 252, 0.7)', size: 10 }
    },
    shapes,
    paper_bgcolor: 'rgba(15, 23, 42, 0)',
    plot_bgcolor: 'rgba(15, 23, 42, 0.2)',
    height,
    width: width || undefined,
    autosize: !width,
    margin: { l: 60, r: 40, t: 80, b: 60 },
    hovermode: 'closest',
    hoverlabel: {
      bgcolor: 'rgba(15, 23, 42, 0.95)',
      bordercolor: 'rgba(191, 87, 0, 0.6)',
      font: { color: 'rgba(248, 250, 252, 0.95)', size: 12 }
    },
    showlegend: false
  };

  const config: Partial<PlotParams['config']> = {
    responsive: true,
    displayModeBar: true,
    displaylogo: false,
    modeBarButtonsToRemove: ['lasso2d', 'select2d'],
    toImageButtonOptions: {
      format: 'png',
      filename: `strike_zone_${Date.now()}`,
      height: 800,
      width: 800,
      scale: 2
    }
  };

  // Get unique pitch types for filter
  const pitchTypes = Array.from(new Set(pitches.map(p => p.type))).sort();

  return (
    <motion.div
      className="strike-zone-container"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      style={{
        background: 'var(--glass-light, rgba(15, 23, 42, 0.3))',
        backdropFilter: 'blur(12px)',
        borderRadius: '12px',
        border: '1px solid rgba(191, 87, 0, 0.2)',
        padding: '1.5rem',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)'
      }}
    >
      {/* Pitch type filters */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '0.5rem',
        marginBottom: '1rem',
        justifyContent: 'center'
      }}>
        <button
          onClick={() => setSelectedPitchType(null)}
          style={{
            padding: '0.375rem 0.875rem',
            borderRadius: '6px',
            border: selectedPitchType === null
              ? '2px solid rgba(191, 87, 0, 0.8)'
              : '1px solid rgba(148, 163, 184, 0.3)',
            background: selectedPitchType === null
              ? 'rgba(191, 87, 0, 0.2)'
              : 'rgba(15, 23, 42, 0.4)',
            color: 'rgba(248, 250, 252, 0.9)',
            fontSize: '0.875rem',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          All ({pitches.length})
        </button>
        {pitchTypes.map(type => (
          <button
            key={type}
            onClick={() => setSelectedPitchType(type)}
            style={{
              padding: '0.375rem 0.875rem',
              borderRadius: '6px',
              border: selectedPitchType === type
                ? '2px solid rgba(191, 87, 0, 0.8)'
                : '1px solid rgba(148, 163, 184, 0.3)',
              background: selectedPitchType === type
                ? 'rgba(191, 87, 0, 0.2)'
                : 'rgba(15, 23, 42, 0.4)',
              color: 'rgba(248, 250, 252, 0.9)',
              fontSize: '0.875rem',
              cursor: 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem'
            }}
          >
            <div style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              background: pitchTypeColors[type] || pitchTypeColors['default']
            }} />
            {type} ({pitches.filter(p => p.type === type).length})
          </button>
        ))}
      </div>

      <Plot
        data={scatterData}
        layout={layout}
        config={config}
        onClick={(event) => {
          if (onPitchClick && event.points && event.points.length > 0) {
            const pitch = event.points[0].customdata as unknown as Pitch;
            onPitchClick(pitch);
          }
        }}
        onHover={(event) => {
          if (event.points && event.points.length > 0) {
            setHoveredPitch(event.points[0].customdata as unknown as Pitch);
          }
        }}
        onUnhover={() => setHoveredPitch(null)}
        style={{ width: '100%' }}
      />

      {/* Stats summary */}
      {hoveredPitch && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            marginTop: '1rem',
            padding: '0.75rem',
            background: 'rgba(15, 23, 42, 0.6)',
            borderRadius: '8px',
            borderLeft: `3px solid ${getColorForPitch(hoveredPitch)}`,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
            gap: '0.5rem',
            fontSize: '0.875rem'
          }}
        >
          <div>
            <div style={{ color: 'rgba(148, 163, 184, 0.9)', fontSize: '0.75rem' }}>Pitch Type</div>
            <div style={{ color: 'rgba(248, 250, 252, 0.95)', fontWeight: 600 }}>{hoveredPitch.type}</div>
          </div>
          {hoveredPitch.velocity && (
            <div>
              <div style={{ color: 'rgba(148, 163, 184, 0.9)', fontSize: '0.75rem' }}>Velocity</div>
              <div style={{ color: 'rgba(248, 250, 252, 0.95)', fontWeight: 600 }}>{hoveredPitch.velocity} mph</div>
            </div>
          )}
          {hoveredPitch.spin && (
            <div>
              <div style={{ color: 'rgba(148, 163, 184, 0.9)', fontSize: '0.75rem' }}>Spin Rate</div>
              <div style={{ color: 'rgba(248, 250, 252, 0.95)', fontWeight: 600 }}>{hoveredPitch.spin} rpm</div>
            </div>
          )}
          {hoveredPitch.result && (
            <div>
              <div style={{ color: 'rgba(148, 163, 184, 0.9)', fontSize: '0.75rem' }}>Result</div>
              <div style={{ color: 'rgba(248, 250, 252, 0.95)', fontWeight: 600 }}>
                {hoveredPitch.result.replace('_', ' ')}
              </div>
            </div>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}
