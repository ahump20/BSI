/**
 * relativeTime Utility Tests
 *
 * Tests the relativeTime function that converts ISO date strings
 * to human-readable relative time labels.
 */

import { describe, it, expect } from 'vitest';
import { relativeTime } from '@/lib/utils/relativeTime';

describe('relativeTime', () => {
  it('returns minutes ago for recent timestamps', () => {
    // 30 minutes ago
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    expect(relativeTime(thirtyMinutesAgo)).toBe('30m ago');
  });

  it('returns hours ago for timestamps within last day', () => {
    // 5 hours ago
    const fiveHoursAgo = new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString();
    expect(relativeTime(fiveHoursAgo)).toBe('5h ago');
  });

  it('returns days ago for timestamps beyond 24 hours', () => {
    // 3 days ago
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
    expect(relativeTime(threeDaysAgo)).toBe('3d ago');
  });

  it('handles timestamps less than 1 minute ago', () => {
    // 30 seconds ago
    const justNow = new Date(Date.now() - 30 * 1000).toISOString();
    expect(relativeTime(justNow)).toBe('0m ago');
  });

  it('handles edge case of exactly 1 hour ago', () => {
    // Exactly 60 minutes ago
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    expect(relativeTime(oneHourAgo)).toBe('1h ago');
  });

  it('handles edge case of exactly 24 hours ago', () => {
    // Exactly 24 hours ago
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    expect(relativeTime(oneDayAgo)).toBe('1d ago');
  });
});
