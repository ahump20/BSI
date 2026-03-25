/**
 * ESPN BoxScoreClient Tests — NBA, CFB, and NFL
 *
 * Tests the shared EspnPlayerStatsTable + EspnTeamStatsTable components
 * via each sport's BoxScoreClient thin wrapper. Verifies:
 * - Multiple stat groups render separate tables
 * - Group name headings appear when present
 * - Null/undefined stat entries in the array are filtered safely
 * - Empty statistics arrays don't crash
 * - DNP-only groups still render (not silently dropped)
 * - Null game without error shows "not available" card (not blank page)
 *
 * Uses NBA team names with football stat categories — both components
 * parse identical ESPN shapes regardless of sport-specific stat names.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

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

vi.mock('@/app/nba/game/[gameId]/layout', () => ({ useGameData: () => mockGameData }));
vi.mock('@/app/cfb/game/[gameId]/layout', () => ({ useGameData: () => mockGameData }));
vi.mock('@/app/nfl/game/[gameId]/layout', () => ({ useGameData: () => mockGameData }));

import NBABoxScoreClient from '@/app/nba/game/[gameId]/box-score/BoxScoreClient';
import CFBBoxScoreClient from '@/app/cfb/game/[gameId]/box-score/BoxScoreClient';
import NFLBoxScoreClient from '@/app/nfl/game/[gameId]/box-score/BoxScoreClient';

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

function makeGameWithDNPOnly() {
  const game = makeEspnGame();
  // All athletes in the first group are DNP — should still render the DNP section
  game.boxscore.players[0].statistics = [
    {
      name: 'passing',
      type: 'passing',
      labels: ['C/ATT', 'YDS'],
      names: ['completionAttempts', 'passingYards'],
      athletes: [
        { athlete: { displayName: 'Injured QB', shortName: 'I. QB' }, stats: [], didNotPlay: true, reason: 'Knee' },
        { athlete: { displayName: 'Backup QB', shortName: 'B. QB' }, stats: [], didNotPlay: true, reason: 'Coach Decision' },
      ],
    },
  ];
  return game;
}

// ---------- Shared test suite for each sport ----------

function testSuite(name: string, Component: React.ComponentType) {
  describe(name, () => {
    beforeEach(() => {
      mockGameData.loading = false;
      mockGameData.error = null;
      mockGameData.game = null;
    });

    it('renders multiple stat groups when present', () => {
      mockGameData.game = makeEspnGame();
      render(<Component />);
      expect(screen.getByText('P. A')).toBeDefined();
      expect(screen.getByText('P. B')).toBeDefined();
    });

    it('renders group name headings', () => {
      mockGameData.game = makeEspnGame();
      render(<Component />);
      const headings = screen.getAllByText(/passing|rushing/i);
      expect(headings.length).toBeGreaterThanOrEqual(2);
    });

    it('filters null statistics entries safely', () => {
      const game = makeEspnGame();
      (game.boxscore.players[0] as Record<string, unknown>).statistics = [
        null,
        game.boxscore.players[0].statistics[0],
        undefined,
        game.boxscore.players[0].statistics[1],
      ];
      mockGameData.game = game;
      expect(() => render(<Component />)).not.toThrow();
      expect(screen.getByText('P. A')).toBeDefined();
    });

    it('handles empty statistics without crash', () => {
      const game = makeEspnGame();
      game.boxscore.players[0].statistics = [];
      mockGameData.game = game;
      expect(() => render(<Component />)).not.toThrow();
    });

    it('shows "not available" when boxscore is missing', () => {
      mockGameData.game = makeEspnGame({ boxscore: undefined });
      render(<Component />);
      expect(screen.getByText(/not available/i)).toBeDefined();
    });

    it('shows "not available" when game is null (not blank page)', () => {
      mockGameData.game = null;
      render(<Component />);
      expect(screen.getByText(/not available/i)).toBeDefined();
    });

    it('returns null when loading', () => {
      mockGameData.loading = true;
      const { container } = render(<Component />);
      expect(container.innerHTML).toBe('');
    });

    it('returns null when error', () => {
      mockGameData.error = 'fetch failed';
      const { container } = render(<Component />);
      expect(container.innerHTML).toBe('');
    });
  });
}

testSuite('NBA BoxScoreClient', NBABoxScoreClient);
testSuite('CFB BoxScoreClient', CFBBoxScoreClient);
testSuite('NFL BoxScoreClient', NFLBoxScoreClient);

// Split-mode specific tests (CFB/NBA only — DNP handling)
describe('Split mode: DNP-only groups', () => {
  beforeEach(() => {
    mockGameData.loading = false;
    mockGameData.error = null;
    mockGameData.game = null;
  });

  it('renders DNP section when all athletes are DNP (NBA)', () => {
    mockGameData.game = makeGameWithDNPOnly();
    render(<NBABoxScoreClient />);
    expect(screen.getByText('Did Not Play')).toBeDefined();
    expect(screen.getByText('Knee')).toBeDefined();
    expect(screen.getByText('Coach Decision')).toBeDefined();
  });

  it('renders DNP section when all athletes are DNP (CFB)', () => {
    mockGameData.game = makeGameWithDNPOnly();
    render(<CFBBoxScoreClient />);
    expect(screen.getByText('Did Not Play')).toBeDefined();
    expect(screen.getByText('I. QB')).toBeDefined();
  });
});
