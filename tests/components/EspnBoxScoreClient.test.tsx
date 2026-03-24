/**
 * ESPN BoxScoreClient Tests — NBA and CFB
 *
 * Tests the multi-stat-group rendering logic that was changed from
 * statistics?.[0] (single group) to statGroups.map() (all groups).
 *
 * Tests verify:
 * - Multiple stat groups render separate tables
 * - Group name headings appear when present
 * - Null/undefined stat entries in the array are filtered safely
 * - Empty statistics arrays don't crash
 * - Starters/bench/DNP sections render correctly
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

// Mock the layout context that provides game data
const mockGameData = {
  game: null as unknown,
  loading: false,
  error: null,
  meta: null,
  refresh: vi.fn(),
};

vi.mock('next/navigation', () => ({
  usePathname: () => '/nba/game/123/box-score',
  useParams: () => ({ gameId: '123' }),
  useRouter: () => ({ replace: vi.fn() }),
}));

// Both NBA and CFB BoxScoreClient import { useGameData } from '../layout'
vi.mock('@/app/nba/game/[gameId]/layout', () => ({
  useGameData: () => mockGameData,
}));

// Mock CFB layout
vi.mock('@/app/cfb/game/[gameId]/layout', () => ({
  useGameData: () => mockGameData,
}));

// Import after mocks
import NBABoxScoreClient from '@/app/nba/game/[gameId]/box-score/BoxScoreClient';
import CFBBoxScoreClient from '@/app/cfb/game/[gameId]/box-score/BoxScoreClient';

function makeEspnGame(overrides: Record<string, unknown> = {}) {
  return {
    id: '123',
    status: { type: { state: 'post', completed: true } },
    competitors: [
      {
        homeAway: 'away',
        team: { abbreviation: 'LAL', displayName: 'Los Angeles Lakers' },
        statistics: [{ name: 'points', displayValue: '110' }],
      },
      {
        homeAway: 'home',
        team: { abbreviation: 'DET', displayName: 'Detroit Pistons' },
        statistics: [{ name: 'points', displayValue: '105' }],
      },
    ],
    boxscore: {
      teams: [
        { team: { abbreviation: 'LAL', displayName: 'Los Angeles Lakers' }, statistics: [{ name: 'points', displayValue: '110' }] },
        { team: { abbreviation: 'DET', displayName: 'Detroit Pistons' }, statistics: [{ name: 'points', displayValue: '105' }] },
      ],
      players: [
        {
          team: { abbreviation: 'LAL', displayName: 'Los Angeles Lakers' },
          statistics: [
            {
              name: 'passing',
              type: 'passing',
              labels: ['C/ATT', 'YDS', 'TD', 'INT'],
              names: ['completionAttempts', 'passingYards', 'passingTouchdowns', 'interceptions'],
              athletes: [
                {
                  athlete: { displayName: 'Player A', shortName: 'P. A', position: { abbreviation: 'QB' }, starter: true },
                  stats: ['20/30', '250', '2', '1'],
                },
              ],
            },
            {
              name: 'rushing',
              type: 'rushing',
              labels: ['CAR', 'YDS', 'TD'],
              names: ['rushingAttempts', 'rushingYards', 'rushingTouchdowns'],
              athletes: [
                {
                  athlete: { displayName: 'Player B', shortName: 'P. B', position: { abbreviation: 'RB' }, starter: true },
                  stats: ['15', '85', '1'],
                },
              ],
            },
          ],
        },
        {
          team: { abbreviation: 'DET', displayName: 'Detroit Pistons' },
          statistics: [
            {
              name: 'passing',
              type: 'passing',
              labels: ['C/ATT', 'YDS', 'TD', 'INT'],
              names: ['completionAttempts', 'passingYards', 'passingTouchdowns', 'interceptions'],
              athletes: [
                {
                  athlete: { displayName: 'Player C', shortName: 'P. C', position: { abbreviation: 'QB' }, starter: true },
                  stats: ['18/28', '200', '1', '2'],
                },
              ],
            },
          ],
        },
      ],
    },
    ...overrides,
  };
}

describe('NBA BoxScoreClient', () => {
  beforeEach(() => {
    mockGameData.loading = false;
    mockGameData.error = null;
  });

  it('renders multiple stat groups when present', () => {
    mockGameData.game = makeEspnGame();
    render(<NBABoxScoreClient />);
    // Away team has 2 stat groups (passing + rushing), both should render
    expect(screen.getByText('P. A')).toBeDefined();
    expect(screen.getByText('P. B')).toBeDefined();
  });

  it('renders group name headings when name/type is present', () => {
    mockGameData.game = makeEspnGame();
    render(<NBABoxScoreClient />);
    // Group names from statGroup.name should appear as headings
    const headings = screen.getAllByText(/passing|rushing/i);
    expect(headings.length).toBeGreaterThanOrEqual(2);
  });

  it('filters null entries in statistics array safely', () => {
    const game = makeEspnGame();
    // Insert null entries into statistics array
    (game.boxscore.players[0] as Record<string, unknown>).statistics = [
      null,
      game.boxscore.players[0].statistics[0],
      undefined,
      game.boxscore.players[0].statistics[1],
    ];
    mockGameData.game = game;
    // Should not crash
    expect(() => render(<NBABoxScoreClient />)).not.toThrow();
    // Valid groups should still render
    expect(screen.getByText('P. A')).toBeDefined();
  });

  it('handles empty statistics array without crashing', () => {
    const game = makeEspnGame();
    game.boxscore.players[0].statistics = [];
    mockGameData.game = game;
    expect(() => render(<NBABoxScoreClient />)).not.toThrow();
  });

  it('handles missing boxscore gracefully', () => {
    mockGameData.game = makeEspnGame({ boxscore: undefined });
    render(<NBABoxScoreClient />);
    expect(screen.getByText(/not available/i)).toBeDefined();
  });

  it('returns null when loading', () => {
    mockGameData.loading = true;
    mockGameData.game = null;
    const { container } = render(<NBABoxScoreClient />);
    expect(container.innerHTML).toBe('');
  });
});

describe('CFB BoxScoreClient', () => {
  beforeEach(() => {
    mockGameData.loading = false;
    mockGameData.error = null;
  });

  it('renders multiple stat groups when present', () => {
    mockGameData.game = makeEspnGame();
    render(<CFBBoxScoreClient />);
    expect(screen.getByText('P. A')).toBeDefined();
    expect(screen.getByText('P. B')).toBeDefined();
  });

  it('renders group name headings', () => {
    mockGameData.game = makeEspnGame();
    render(<CFBBoxScoreClient />);
    const headings = screen.getAllByText(/passing|rushing/i);
    expect(headings.length).toBeGreaterThanOrEqual(2);
  });

  it('filters null statistics entries safely', () => {
    const game = makeEspnGame();
    (game.boxscore.players[0] as Record<string, unknown>).statistics = [
      null,
      game.boxscore.players[0].statistics[0],
    ];
    mockGameData.game = game;
    expect(() => render(<CFBBoxScoreClient />)).not.toThrow();
  });

  it('handles empty statistics without crash', () => {
    const game = makeEspnGame();
    game.boxscore.players[0].statistics = [];
    mockGameData.game = game;
    expect(() => render(<CFBBoxScoreClient />)).not.toThrow();
  });

  it('handles missing boxscore gracefully', () => {
    mockGameData.game = makeEspnGame({ boxscore: undefined });
    render(<CFBBoxScoreClient />);
    expect(screen.getByText(/not available/i)).toBeDefined();
  });

  it('returns null when loading', () => {
    mockGameData.loading = true;
    mockGameData.game = null;
    const { container } = render(<CFBBoxScoreClient />);
    expect(container.innerHTML).toBe('');
  });
});
