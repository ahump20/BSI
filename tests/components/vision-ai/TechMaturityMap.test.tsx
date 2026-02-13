/**
 * TechMaturityMap Component Tests
 *
 * Tests the interactive CV technology grid with sport/maturity filtering.
 */

import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TechMaturityMap } from '@/components/vision-ai/TechMaturityMap';

/**
 * Helper: get the sport filter button row (first flex-wrap container).
 * Filter buttons are round-full styled buttons; sport tags on entries use
 * a different class (text-[9px]).
 */
function getFilterButtons(container: HTMLElement) {
  // Filter buttons have rounded-full class and are direct children of the first flex-wrap div
  const buttons = container.querySelectorAll('button.rounded-full');
  return Array.from(buttons);
}

function clickSportFilter(container: HTMLElement, label: string) {
  const buttons = getFilterButtons(container);
  const btn = buttons.find((b) => b.textContent?.trim() === label);
  if (!btn) throw new Error(`Sport filter "${label}" not found`);
  fireEvent.click(btn);
}

function clickMaturityFilter(container: HTMLElement, label: string) {
  const buttons = getFilterButtons(container);
  const btn = buttons.find((b) => b.textContent?.trim() === label);
  if (!btn) throw new Error(`Maturity filter "${label}" not found`);
  fireEvent.click(btn);
}

describe('TechMaturityMap', () => {
  it('renders all technology entries by default', () => {
    render(<TechMaturityMap />);

    // Check for known companies (unique text — no collision with filter buttons)
    expect(screen.getByText('Hawk-Eye (Sony)')).toBeDefined();
    expect(screen.getByText('Statcast (MLB)')).toBeDefined();
    expect(screen.getByText('Rapsodo')).toBeDefined();
    expect(screen.getByText('RF-DETR')).toBeDefined();
  });

  it('shows sport filter buttons', () => {
    const { container } = render(<TechMaturityMap />);

    const buttons = getFilterButtons(container);
    const labels = buttons.map((b) => b.textContent?.trim());

    expect(labels).toContain('All');
    expect(labels).toContain('MLB');
    expect(labels).toContain('NFL');
    expect(labels).toContain('NBA');
    expect(labels).toContain('NCAA Baseball');
    expect(labels).toContain('NCAA Football');
  });

  it('filters entries by sport when NBA is clicked', () => {
    const { container } = render(<TechMaturityMap />);

    clickSportFilter(container, 'NBA');

    // Second Spectrum is NBA
    expect(screen.getByText('Second Spectrum')).toBeDefined();

    // Rapsodo is MLB/NCAA Baseball only — should not appear
    expect(screen.queryByText('Rapsodo')).toBeNull();
  });

  it('filters by maturity level', () => {
    const { container } = render(<TechMaturityMap />);

    clickMaturityFilter(container, 'Research');

    // RF-DETR is research
    expect(screen.getByText('RF-DETR')).toBeDefined();
    // RTMPose is research
    expect(screen.getByText('RTMPose')).toBeDefined();

    // Hawk-Eye is production — should not appear
    expect(screen.queryByText('Hawk-Eye (Sony)')).toBeNull();
  });

  it('shows maturity badges with correct labels', () => {
    render(<TechMaturityMap />);

    // Maturity badges appear on entries (not just filter buttons)
    // "Production" appears in both filter and entry badges — check for > 1
    const productionElements = screen.getAllByText('Production');
    const growthElements = screen.getAllByText('Growth');
    const researchElements = screen.getAllByText('Research');

    // Filter button + at least one entry badge
    expect(productionElements.length).toBeGreaterThan(1);
    expect(growthElements.length).toBeGreaterThan(1);
    expect(researchElements.length).toBeGreaterThan(1);
  });

  it('shows technology count in summary', () => {
    render(<TechMaturityMap />);

    expect(screen.getByText(/technologies shown/)).toBeDefined();
  });

  it('groups entries by domain', () => {
    render(<TechMaturityMap />);

    expect(screen.getByText('Player Tracking')).toBeDefined();
    expect(screen.getByText('Biomechanics')).toBeDefined();
    expect(screen.getByText('Scouting')).toBeDefined();
  });

  it('can combine sport and maturity filters', () => {
    const { container } = render(<TechMaturityMap />);

    clickSportFilter(container, 'MLB');
    clickMaturityFilter(container, 'Production');

    // Statcast is MLB + Production
    expect(screen.getByText('Statcast (MLB)')).toBeDefined();

    // RF-DETR is Research, not Production
    expect(screen.queryByText('RF-DETR')).toBeNull();
  });

  it('returns to all entries when All sport is clicked', () => {
    const { container } = render(<TechMaturityMap />);

    // Filter to NBA
    clickSportFilter(container, 'NBA');
    expect(screen.queryByText('Rapsodo')).toBeNull();

    // Click All to reset
    clickSportFilter(container, 'All');
    expect(screen.getByText('Rapsodo')).toBeDefined();
  });
});
