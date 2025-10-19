import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import RosterPortalHeatmap from '../../RosterPortalHeatmap.jsx';

vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }) => <div data-testid="map">{children}</div>,
  TileLayer: () => null,
  CircleMarker: ({ children }) => <div>{children}</div>,
  Tooltip: ({ children }) => <div>{children}</div>,
}));

describe('RosterPortalHeatmap', () => {
  beforeEach(() => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        timeframe: '30d',
        filters: {
          availableTimeframes: ['30d'],
          availableConferences: [],
          availablePositions: [],
        },
        regions: [
          {
            id: 'deep-south',
            name: 'Deep South',
            coordinates: [30, -90],
            metrics: {
              transferCommits: 2,
              nilEstimate: 1.4,
              recruitingIndex: 88,
            },
          },
        ],
        recentMoves: [],
        trendingPrograms: [],
      }),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    delete global.fetch;
  });

  it('renders a fallback label when top programs are missing', async () => {
    render(<RosterPortalHeatmap />);

    await waitFor(() => {
      expect(screen.getByText('Deep South')).toBeInTheDocument();
    });

    expect(screen.getByText('No featured programs yet')).toBeInTheDocument();
  });
});
