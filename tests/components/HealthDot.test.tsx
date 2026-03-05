/**
 * HealthDot Component Tests
 *
 * Tests the tiny health indicator used in the site footer.
 * Fetches /api/status once on mount and renders a colored dot.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { HealthDot } from '@/components/layout-ds/HealthDot';

// Mock next/link to render a plain anchor
vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

describe('HealthDot', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    fetchSpy = vi.spyOn(globalThis, 'fetch');
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  it('renders nothing initially (unknown state)', () => {
    fetchSpy.mockImplementation(() => new Promise(() => {})); // never resolves
    const { container } = render(<HealthDot />);
    // While loading, health is 'unknown' → returns null
    expect(container.innerHTML).toBe('');
  });

  it('renders green dot when all endpoints are healthy', async () => {
    fetchSpy.mockResolvedValueOnce(
      new Response(JSON.stringify({
        endpoints: [
          { name: 'API', status: 'ok' },
          { name: 'Homepage', status: 'ok' },
        ],
      }), { status: 200 })
    );

    render(<HealthDot />);

    await waitFor(() => {
      expect(screen.getByText('Status')).toBeTruthy();
    });
    // Link should point to /status
    const link = screen.getByText('Status').closest('a');
    expect(link?.getAttribute('href')).toBe('/status');
  });

  it('renders dot when some endpoints failed (degraded)', async () => {
    fetchSpy.mockResolvedValueOnce(
      new Response(JSON.stringify({
        endpoints: [
          { name: 'API', status: 'ok' },
          { name: 'Ingest', status: 'error' },
        ],
      }), { status: 200 })
    );

    render(<HealthDot />);

    await waitFor(() => {
      expect(screen.getByText('Status')).toBeTruthy();
    });
  });

  it('renders dot when all endpoints failed (down)', async () => {
    fetchSpy.mockResolvedValueOnce(
      new Response(JSON.stringify({
        endpoints: [
          { name: 'API', status: 'error' },
          { name: 'Ingest', status: 'error' },
        ],
      }), { status: 200 })
    );

    render(<HealthDot />);

    await waitFor(() => {
      expect(screen.getByText('Status')).toBeTruthy();
    });
  });

  it('hides silently on fetch error', async () => {
    fetchSpy.mockRejectedValueOnce(new Error('Network error'));

    const { container } = render(<HealthDot />);

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledTimes(1);
    });

    // Should remain hidden (unknown → null)
    expect(container.innerHTML).toBe('');
  });

  it('hides on non-200 response', async () => {
    fetchSpy.mockResolvedValueOnce(
      new Response('Not Found', { status: 404 })
    );

    const { container } = render(<HealthDot />);

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledTimes(1);
    });

    expect(container.innerHTML).toBe('');
  });
});
