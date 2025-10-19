import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import RosterPortalHeatmap from '../../RosterPortalHeatmap.jsx';

vi.mock('react-leaflet', async () => {
  const ReactModule = await import('react');
  const { Fragment } = ReactModule;
  return {
    MapContainer: ({ children }) => <div data-testid="map-container">{children}</div>,
    TileLayer: () => null,
    CircleMarker: ({ children }) => <Fragment>{children}</Fragment>,
    Tooltip: ({ children }) => <Fragment>{children}</Fragment>,
  };
});

describe('RosterPortalHeatmap timeframe labels', () => {
  beforeEach(() => {
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        timeframe: '30d',
        filters: {
          availableTimeframes: ['7d', '14d', '30d', '90d'],
          timeframeLabels: {
            '7d': 'Last 7 days',
            '30d': 'Last 30 days',
            '90d': 'Last 90 days',
          },
          availableConferences: [],
          availablePositions: [],
        },
        regions: [],
        recentMoves: [],
        trendingPrograms: [],
      }),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders new intervals with the expected label text', async () => {
    render(<RosterPortalHeatmap />);

    const option = await waitFor(() =>
      screen.getByRole('option', { name: 'Last 14 days' })
    );

    expect(option).toHaveValue('14d');
    expect(screen.getByRole('option', { name: 'Last 7 days' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Last 90 days' })).toBeInTheDocument();
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/portal/activity?'),
      expect.objectContaining({ signal: expect.anything() })
    );
  });
});
