/**
 * FreshnessBadge Component Tests
 *
 * Tests the honest data-freshness badge that replaced static LiveBadge.
 * Verifies rendering for all freshness levels and the isLive gate.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FreshnessBadge } from '@/components/ui/FreshnessBadge';

describe('FreshnessBadge', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-02-25T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders nothing when isLive is false', () => {
    const { container } = render(
      <FreshnessBadge isLive={false} fetchedAt="2026-02-25T11:59:00Z" />
    );
    expect(container.innerHTML).toBe('');
  });

  it('renders nothing when isLive is omitted', () => {
    const { container } = render(
      <FreshnessBadge fetchedAt="2026-02-25T11:59:00Z" />
    );
    expect(container.innerHTML).toBe('');
  });

  it('shows green LIVE when data is less than 1 minute old', () => {
    render(
      <FreshnessBadge isLive fetchedAt="2026-02-25T11:59:30Z" />
    );
    expect(screen.getByText(/LIVE/)).toBeTruthy();
    // Under 1 minute — no age suffix
    expect(screen.queryByText(/ago/)).toBeNull();
  });

  it('shows yellow LIVE with age when data is 2-5 minutes old', () => {
    render(
      <FreshnessBadge isLive fetchedAt="2026-02-25T11:57:00Z" />
    );
    const badge = screen.getByText(/LIVE/);
    expect(badge).toBeTruthy();
    expect(badge.textContent).toContain('3m ago');
  });

  it('shows orange STALE with age when data is over 5 minutes old', () => {
    render(
      <FreshnessBadge isLive fetchedAt="2026-02-25T11:50:00Z" />
    );
    const badge = screen.getByText(/STALE/);
    expect(badge).toBeTruthy();
    expect(badge.textContent).toContain('10m ago');
  });

  it('defaults to fresh when fetchedAt is undefined', () => {
    render(
      <FreshnessBadge isLive />
    );
    // Falls back to "now" (fake timer: 2026-02-25T12:00:00Z) — should show green LIVE
    expect(screen.getByText(/LIVE/)).toBeTruthy();
    expect(screen.queryByText(/ago/)).toBeNull();
  });

  it('treats invalid date as stale', () => {
    render(
      <FreshnessBadge isLive fetchedAt="not-a-date" />
    );
    // getAgeMinutes returns 999 for invalid dates → stale
    expect(screen.getByText(/STALE/)).toBeTruthy();
  });
});
