/**
 * CollegeSportsGap Component Tests
 *
 * Tests the pro vs college tracking infrastructure comparison.
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CollegeSportsGap } from '@/components/vision-ai/CollegeSportsGap';

describe('CollegeSportsGap', () => {
  it('renders all tracking categories', () => {
    render(<CollegeSportsGap />);

    expect(screen.getByText('Optical Player Tracking')).toBeDefined();
    expect(screen.getByText('Ball Tracking')).toBeDefined();
    expect(screen.getByText('Biomechanics')).toBeDefined();
    expect(screen.getByText('GPS/Wearable')).toBeDefined();
    expect(screen.getByText('Automated Cameras')).toBeDefined();
    expect(screen.getByText('Play Recognition AI')).toBeDefined();
    expect(screen.getByText('Broadcast-Derived Tracking')).toBeDefined();
    expect(screen.getByText('Real-Time Data Feed')).toBeDefined();
  });

  it('shows summary stats for pro and college coverage', () => {
    render(<CollegeSportsGap />);

    // Pro should have most categories as "Full"
    expect(screen.getByText('Pro: Full Coverage')).toBeDefined();
    expect(screen.getByText('College: Full')).toBeDefined();
    expect(screen.getByText('Critical Gaps')).toBeDefined();
  });

  it('shows Full/Partial/Gap labels for each row', () => {
    render(<CollegeSportsGap />);

    // There should be multiple "Full", "Partial", and "Gap" indicators
    const fullLabels = screen.getAllByText('Full');
    const partialLabels = screen.getAllByText('Partial');
    const gapLabels = screen.getAllByText('Gap');

    expect(fullLabels.length).toBeGreaterThan(0);
    expect(partialLabels.length).toBeGreaterThan(0);
    expect(gapLabels.length).toBeGreaterThan(0);
  });

  it('renders BSI Take editorial section', () => {
    render(<CollegeSportsGap />);

    expect(screen.getByText('BSI Take')).toBeDefined();
    expect(screen.getByText(/Pro leagues have near-complete tracking coverage/)).toBeDefined();
  });

  it('shows pro details for known technologies', () => {
    render(<CollegeSportsGap />);

    expect(screen.getByText(/Hawk-Eye \(MLB\/NBA\)/)).toBeDefined();
    expect(screen.getByText(/KinaTrax at all 30 MLB parks/)).toBeDefined();
  });

  it('shows college details highlighting the gaps', () => {
    render(<CollegeSportsGap />);

    expect(screen.getByText(/No league-wide system/)).toBeDefined();
    expect(screen.getByText(/KinaTrax at 7 NCAA programs/)).toBeDefined();
    expect(screen.getByText(/No standardized real-time feed/)).toBeDefined();
  });
});
