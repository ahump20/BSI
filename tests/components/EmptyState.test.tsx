/**
 * EmptyState Component Tests
 *
 * Tests all five empty state types, with focus on the new
 * 'source-unavailable' variant added in the trust hardening session.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EmptyState } from '@/components/ui/EmptyState';

describe('EmptyState', () => {
  it('renders no-games state', () => {
    render(<EmptyState type="no-games" />);
    expect(screen.getByText('No Games Found')).toBeTruthy();
    expect(screen.getByText(/no games scheduled/i)).toBeTruthy();
  });

  it('renders no-results state', () => {
    render(<EmptyState type="no-results" />);
    expect(screen.getByText('No Results')).toBeTruthy();
  });

  it('renders error state with retry button', () => {
    const onRetry = vi.fn();
    render(<EmptyState type="error" onRetry={onRetry} />);
    expect(screen.getByText('Something Went Wrong')).toBeTruthy();

    const button = screen.getByText('Try Again');
    fireEvent.click(button);
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('renders offseason state without retry button', () => {
    const onRetry = vi.fn();
    render(<EmptyState type="offseason" onRetry={onRetry} />);
    expect(screen.getByText('Offseason')).toBeTruthy();
    // Offseason should NOT show retry
    expect(screen.queryByText('Try Again')).toBeNull();
  });

  it('renders source-unavailable state', () => {
    render(<EmptyState type="source-unavailable" />);
    expect(screen.getByText('Data Source Unavailable')).toBeTruthy();
    expect(screen.getByText(/data provider isn't responding/i)).toBeTruthy();
  });

  it('shows retry button for source-unavailable when onRetry provided', () => {
    const onRetry = vi.fn();
    render(<EmptyState type="source-unavailable" onRetry={onRetry} />);
    const button = screen.getByText('Try Again');
    fireEvent.click(button);
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('hides retry button for source-unavailable when no onRetry', () => {
    render(<EmptyState type="source-unavailable" />);
    expect(screen.queryByText('Try Again')).toBeNull();
  });

  it('hides retry button for no-games even when onRetry provided', () => {
    render(<EmptyState type="no-games" onRetry={() => {}} />);
    expect(screen.queryByText('Try Again')).toBeNull();
  });
});
