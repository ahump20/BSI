/**
 * SavantLeaderboard Component Tests
 *
 * Tests tier gating, upgrade banner, and footer CTA behavior.
 * The leaderboard gates pro-only columns (wOBA, wRC+, FIP, ERA-)
 * behind a blur + lock visual and shows an inline upgrade banner
 * at the free-tier row boundary.
 */

import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  SavantLeaderboard,
  BATTING_COLUMNS,
  type ColumnDef,
} from '@/components/analytics/SavantLeaderboard';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const SIMPLE_COLS: ColumnDef[] = [
  { key: 'avg', label: 'AVG', format: (v: number) => v.toFixed(3).replace(/^0/, ''), higherIsBetter: true },
  { key: 'woba', label: 'wOBA', format: (v: number) => v.toFixed(3).replace(/^0/, ''), pro: true, higherIsBetter: true },
];

function makeMockData(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    player_id: `p${i}`,
    player_name: `Player ${i + 1}`,
    team: `Team ${String.fromCharCode(65 + (i % 5))}`,
    position: 'SS',
    avg: +(0.250 + i * 0.005).toFixed(3),
    obp: 0.380,
    slg: 0.500,
    k_pct: 0.20,
    bb_pct: 0.10,
    iso: 0.200,
    babip: 0.310,
    woba: +(0.350 + i * 0.003).toFixed(3),
    wrc_plus: 120 + i,
    ops_plus: 115 + i,
  }));
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('SavantLeaderboard', () => {
  it('renders all metric values when isPro is true', () => {
    const data = makeMockData(5);
    render(
      <SavantLeaderboard
        data={data}
        columns={SIMPLE_COLS}
        title="Batting Leaders"
        isPro={true}
        initialRows={25}
      />
    );
    // wOBA column should show actual formatted value, not blur
    expect(screen.getByText('.350')).toBeTruthy();
    // No upgrade CTA
    expect(screen.queryByText('Unlock Full Leaderboard')).toBeNull();
    expect(screen.queryByText('Upgrade to Pro')).toBeNull();
  });

  it('renders blurred lock cells for pro columns when isPro is false', () => {
    const data = makeMockData(5);
    const { container } = render(
      <SavantLeaderboard
        data={data}
        columns={SIMPLE_COLS}
        title="Batting Leaders"
        isPro={false}
        initialRows={25}
      />
    );
    // Lock icon SVGs should be present (one per row per gated column)
    const lockIcons = container.querySelectorAll('svg');
    expect(lockIcons.length).toBe(5); // 5 rows × 1 pro column

    // PRO badge in header
    expect(screen.getByText('PRO')).toBeTruthy();

    // Blurred phantom values should have blur class and aria-hidden
    const blurredSpans = container.querySelectorAll('[aria-hidden="true"]');
    expect(blurredSpans.length).toBe(5);
  });

  it('shows inline upgrade banner when data.length > 10 and isPro is false', () => {
    const data = makeMockData(25);
    render(
      <SavantLeaderboard
        data={data}
        columns={SIMPLE_COLS}
        title="Batting Leaders"
        isPro={false}
        initialRows={25}
      />
    );
    expect(screen.getByText('Unlock Full Leaderboard')).toBeTruthy();
    expect(screen.getByText(/15 more players/)).toBeTruthy();
  });

  it('hides inline upgrade banner when isPro is true', () => {
    const data = makeMockData(25);
    render(
      <SavantLeaderboard
        data={data}
        columns={SIMPLE_COLS}
        title="Batting Leaders"
        isPro={true}
        initialRows={25}
      />
    );
    expect(screen.queryByText('Unlock Full Leaderboard')).toBeNull();
  });

  it('shows "Show all" button for pro users with more data than initialRows', () => {
    const data = makeMockData(25);
    render(
      <SavantLeaderboard
        data={data}
        columns={SIMPLE_COLS}
        title="Batting Leaders"
        isPro={true}
        initialRows={10}
      />
    );
    const showAllBtn = screen.getByText(/Show all 25 players/);
    expect(showAllBtn).toBeTruthy();

    // Click it and verify all rows render
    fireEvent.click(showAllBtn);
    expect(screen.getByText('Player 25')).toBeTruthy();
  });

  it('shows correct count in free-tier footer', () => {
    const data = makeMockData(25);
    render(
      <SavantLeaderboard
        data={data}
        columns={SIMPLE_COLS}
        title="Batting Leaders"
        isPro={false}
        initialRows={25}
      />
    );
    expect(screen.getByText('Upgrade to Pro')).toBeTruthy();
    expect(screen.getByText(/Showing 10 of 25/)).toBeTruthy();
  });
});
