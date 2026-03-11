import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PlatformVitals } from '@/components/home/PlatformVitals';

// Mock IntersectionObserver — never fires, simulating off-screen / SSR
const mockDisconnect = vi.fn();
vi.stubGlobal(
  'IntersectionObserver',
  class {
    constructor() {}
    observe() {}
    disconnect() {
      mockDisconnect();
    }
  },
);

describe('PlatformVitals', () => {
  it('renders target values immediately without waiting for IntersectionObserver', () => {
    render(<PlatformVitals />);

    // All counters should show their target values on initial render
    // "300+" is split across text nodes in the same span, so use a regex matcher
    expect(screen.getByText(/300/)).toBeTruthy();
    expect(screen.getByText(/D1 Teams/)).toBeTruthy();
    expect(screen.getByText((_, el) => el?.tagName === 'SPAN' && el.textContent === '5')).toBeTruthy();
    expect(screen.getByText((_, el) => el?.tagName === 'SPAN' && el.textContent === '22')).toBeTruthy();
    expect(screen.getByText((_, el) => el?.tagName === 'SPAN' && el.textContent === '6')).toBeTruthy();
  });

  it('never shows 0 as an initial value', () => {
    const { container } = render(<PlatformVitals />);

    // None of the animated count spans should contain "0"
    const countSpans = container.querySelectorAll('span.text-\\[var\\(--bsi-bone\\)\\]');
    const values = Array.from(countSpans).map((el) => el.textContent?.replace('+', '').trim());
    expect(values).not.toContain('0');
  });

  it('displays the correct stat labels', () => {
    render(<PlatformVitals />);

    expect(screen.getByText(/D1 Teams/)).toBeTruthy();
    expect(screen.getByText(/Sports/)).toBeTruthy();
    expect(screen.getByText(/Conferences/)).toBeTruthy();
  });
});
