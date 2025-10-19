import React from 'react';
import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import RosterPortalHeatmap from '../RosterPortalHeatmap.jsx';

vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }) => <div data-testid="map">{children}</div>,
  TileLayer: () => <div data-testid="tile" />,
  CircleMarker: ({ children }) => <div data-testid="circle">{children}</div>,
  Tooltip: ({ children }) => <div data-testid="tooltip">{children}</div>,
}));

vi.mock('leaflet/dist/leaflet.css', () => ({}), { virtual: true });

describe('RosterPortalHeatmap', () => {
  const mockPayload = {
    regions: [
      {
        id: 'south-central',
        name: 'South Central',
        coordinates: [32.8, -96.8],
        topPrograms: ['Dallas Baptist', 'TCU', 'Texas A&M'],
        metrics: {
          transferCommits: 4,
          nilEstimate: 2.4,
          recruitingIndex: 'A',
        },
      },
    ],
    recentMoves: [
      {
        player: 'Mason Carter',
        geography: 'TX',
        fromTeam: 'UTA',
        toTeam: 'Dallas Baptist',
        position: 'C',
        nilEstimate: null,
        commitDate: '2024-10-01T12:00:00Z',
      },
    ],
    trendingPrograms: [
      {
        program: 'Dallas Baptist',
        conference: 'C-USA',
        geography: 'Dallas, TX',
        metrics: {
          netTransfers: 3,
          nilMomentum: null,
        },
        positionsNeed: ['C', 'RHP'],
      },
    ],
    filters: {
      availableTimeframes: ['30d'],
      availableConferences: ['C-USA'],
      availablePositions: ['C'],
    },
  };

  beforeEach(() => {
    global.fetch = vi.fn(async () => ({
      ok: true,
      json: async () => mockPayload,
    }));
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing when NIL fields are null', async () => {
    render(<RosterPortalHeatmap />);

    await waitFor(() => expect(global.fetch).toHaveBeenCalled());

    expect(await screen.findByText('Recent portal moves')).toBeInTheDocument();
    expect(await screen.findByText('Programs trending up')).toBeInTheDocument();

    const nilDisplays = await screen.findAllByText('$0');
    expect(nilDisplays.length).toBeGreaterThan(0);
  });
});
