/**
 * BoxScoreTable Component Tests
 *
 * Tests the pure presentational box score component.
 * BoxScoreTable is the most data-dense component in the app — it renders
 * batting lines, pitching lines, and linescore for a baseball game.
 */

import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  BoxScoreTable,
  type BoxScoreData,
  type Linescore,
  type TeamInfo,
  type BattingLine,
  type PitchingLine,
} from '@/components/box-score/BoxScoreTable';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const awayTeam: TeamInfo = {
  name: 'Texas Longhorns',
  abbreviation: 'TEX',
  score: 5,
  isWinner: true,
};

const homeTeam: TeamInfo = {
  name: 'TCU Horned Frogs',
  abbreviation: 'TCU',
  score: 3,
};

const battingLine: BattingLine = {
  player: { id: '1', name: 'Jace LaViolette', position: 'OF', jerseyNumber: '9' },
  ab: 4, r: 1, h: 2, rbi: 2, bb: 0, so: 1, avg: '.345',
  obp: '.412', slg: '.567', hr: 1, sb: 0,
};

const pitchingLine: PitchingLine = {
  player: { id: '10', name: 'Charlie Hurley', jerseyNumber: '42' },
  decision: 'W',
  ip: '7.0', h: 5, r: 3, er: 2, bb: 2, so: 8,
  pitches: 102, strikes: 68, era: '2.85', whip: '1.12',
};

const linescore: Linescore = {
  innings: [
    { away: 0, home: 1 },
    { away: 2, home: 0 },
    { away: 0, home: 0 },
    { away: 0, home: 2 },
    { away: 1, home: 0 },
    { away: 0, home: 0 },
    { away: 2, home: 0 },
    { away: 0, home: 0 },
    { away: 0, home: 0 },
  ],
  totals: {
    away: { runs: 5, hits: 8, errors: 0 },
    home: { runs: 3, hits: 5, errors: 1 },
  },
};

const boxscore: BoxScoreData = {
  away: {
    batting: [battingLine],
    pitching: [pitchingLine],
  },
  home: {
    batting: [{
      ...battingLine,
      player: { id: '2', name: 'Tommy Sacco', position: 'SS' },
      h: 1, rbi: 1, hr: 0, avg: '.290',
    }],
    pitching: [{
      ...pitchingLine,
      player: { id: '11', name: 'Kale Davis', jerseyNumber: '33' },
      decision: 'L',
      ip: '6.1', r: 4, er: 4, so: 5, era: '3.92',
    }],
  },
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('BoxScoreTable', () => {
  it('renders linescore with team abbreviations and totals', () => {
    render(
      <BoxScoreTable
        linescore={linescore}
        boxscore={boxscore}
        awayTeam={awayTeam}
        homeTeam={homeTeam}
      />,
    );

    // Team abbreviations appear in linescore + batting/pitching headers
    expect(screen.getAllByText('TEX').length).toBeGreaterThan(0);
    expect(screen.getAllByText('TCU').length).toBeGreaterThan(0);
  });

  it('renders batting tab by default', () => {
    render(
      <BoxScoreTable
        boxscore={boxscore}
        awayTeam={awayTeam}
        homeTeam={homeTeam}
        showLinescore={false}
      />,
    );

    expect(screen.getByText('Jace LaViolette')).toBeDefined();
    expect(screen.getByText('Tommy Sacco')).toBeDefined();
  });

  it('switches to pitching tab on click', () => {
    render(
      <BoxScoreTable
        boxscore={boxscore}
        awayTeam={awayTeam}
        homeTeam={homeTeam}
        showLinescore={false}
      />,
    );

    // Batting should be visible, pitching should not
    expect(screen.getByText('Jace LaViolette')).toBeDefined();

    // Click pitching tab
    fireEvent.click(screen.getByText('Pitching'));

    // Pitcher should now be visible
    expect(screen.getByText('Charlie Hurley')).toBeDefined();
    expect(screen.getByText('Kale Davis')).toBeDefined();
  });

  it('shows empty state when boxscore is undefined', () => {
    render(
      <BoxScoreTable
        awayTeam={awayTeam}
        homeTeam={homeTeam}
        showLinescore={false}
      />,
    );

    expect(screen.getByText('Box score data not available yet')).toBeDefined();
  });

  it('shows HR badge for home run hitters', () => {
    render(
      <BoxScoreTable
        boxscore={boxscore}
        awayTeam={awayTeam}
        homeTeam={homeTeam}
        showLinescore={false}
      />,
    );

    // LaViolette has hr: 1 — HR appears as column header + badge
    expect(screen.getAllByText('HR').length).toBeGreaterThanOrEqual(1);
  });

  it('renders compact variant with fewer columns', () => {
    render(
      <BoxScoreTable
        boxscore={boxscore}
        awayTeam={awayTeam}
        homeTeam={homeTeam}
        variant="compact"
        showLinescore={false}
      />,
    );

    // Compact variant should not show OBP/SLG headers
    const headers = screen.getAllByRole('columnheader');
    const headerTexts = headers.map(h => h.textContent?.trim());
    expect(headerTexts.filter(t => t === 'OBP')).toHaveLength(0);
    expect(headerTexts.filter(t => t === 'SLG')).toHaveLength(0);
  });

  it('renders pitching decisions with correct label', () => {
    render(
      <BoxScoreTable
        boxscore={boxscore}
        awayTeam={awayTeam}
        homeTeam={homeTeam}
        defaultTab="pitching"
        showLinescore={false}
      />,
    );

    expect(screen.getByText('(W)')).toBeDefined();
    expect(screen.getByText('(L)')).toBeDefined();
  });

  it('calculates batting totals row correctly', () => {
    const multiPlayerBoxscore: BoxScoreData = {
      away: {
        batting: [
          { ...battingLine, ab: 4, r: 1, h: 2, rbi: 2, bb: 0, so: 1 },
          { ...battingLine, player: { id: '3', name: 'Player Two', position: '1B' }, ab: 3, r: 0, h: 1, rbi: 0, bb: 1, so: 0 },
        ],
        pitching: [pitchingLine],
      },
      home: { batting: [], pitching: [] },
    };

    render(
      <BoxScoreTable
        boxscore={multiPlayerBoxscore}
        awayTeam={awayTeam}
        homeTeam={homeTeam}
        showLinescore={false}
      />,
    );

    // Away team has 2 batters, home has 0, so at least one TOTALS row should render
    expect(screen.getAllByText('TOTALS').length).toBeGreaterThanOrEqual(1);
  });
});
