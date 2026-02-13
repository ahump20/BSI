/**
 * SonyEmpireTimeline Component Tests
 *
 * Tests the expandable acquisition timeline for Sony's CV acquisitions.
 */

import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SonyEmpireTimeline } from '@/components/vision-ai/SonyEmpireTimeline';

describe('SonyEmpireTimeline', () => {
  it('renders all five acquisition entries', () => {
    render(<SonyEmpireTimeline />);

    expect(screen.getByText('Hawk-Eye Innovations')).toBeDefined();
    expect(screen.getByText('Beyond Sports')).toBeDefined();
    expect(screen.getByText('Pulselive')).toBeDefined();
    expect(screen.getByText('KinaTrax')).toBeDefined();
    expect(screen.getByText('STATSports')).toBeDefined();
  });

  it('shows acquisition years', () => {
    render(<SonyEmpireTimeline />);

    expect(screen.getByText('2011')).toBeDefined();
    expect(screen.getByText('2020')).toBeDefined();
    expect(screen.getByText('2021')).toBeDefined();
    expect(screen.getByText('2024')).toBeDefined();
    expect(screen.getByText('2025')).toBeDefined();
  });

  it('shows focus badges for each acquisition', () => {
    render(<SonyEmpireTimeline />);

    expect(screen.getByText('Ball & Player Tracking')).toBeDefined();
    expect(screen.getByText('Real-Time 3D Visualization')).toBeDefined();
    expect(screen.getByText('Biomechanical Motion Capture')).toBeDefined();
    expect(screen.getByText('Wearable Performance Monitoring')).toBeDefined();
  });

  it('expands an entry when clicked to show detail', () => {
    render(<SonyEmpireTimeline />);

    // Click on Hawk-Eye
    fireEvent.click(screen.getByText('Hawk-Eye Innovations'));

    // Detail text should appear
    expect(screen.getByText(/Optical tracking pioneer/)).toBeDefined();
    // Significance should appear
    expect(screen.getByText("Foundation of Sony's sports CV empire")).toBeDefined();
  });

  it('collapses an entry when clicked again', () => {
    render(<SonyEmpireTimeline />);

    // Expand
    fireEvent.click(screen.getByText('Hawk-Eye Innovations'));
    expect(screen.getByText(/Optical tracking pioneer/)).toBeDefined();

    // Collapse
    fireEvent.click(screen.getByText('Hawk-Eye Innovations'));
    expect(screen.queryByText(/Optical tracking pioneer/)).toBeNull();
  });

  it('only expands one entry at a time', () => {
    render(<SonyEmpireTimeline />);

    // Expand Hawk-Eye
    fireEvent.click(screen.getByText('Hawk-Eye Innovations'));
    expect(screen.getByText(/Optical tracking pioneer/)).toBeDefined();

    // Expand KinaTrax — Hawk-Eye should collapse
    fireEvent.click(screen.getByText('KinaTrax'));
    expect(screen.queryByText(/Optical tracking pioneer/)).toBeNull();
    expect(screen.getByText(/Markerless 3D motion capture/)).toBeDefined();
  });

  it('shows summary stats at the bottom', () => {
    render(<SonyEmpireTimeline />);

    expect(screen.getByText('Total acquisitions')).toBeDefined();
    expect(screen.getByText('5')).toBeDefined();
    expect(screen.getByText('Span')).toBeDefined();
    // Span = 2025 - 2011 = 14 years
    expect(screen.getByText('14 years')).toBeDefined();
    expect(screen.getByText('Sports covered')).toBeDefined();
    expect(screen.getByText('7+')).toBeDefined();
  });

  it('shows sport tags when expanded', () => {
    render(<SonyEmpireTimeline />);

    // Expand KinaTrax
    fireEvent.click(screen.getByText('KinaTrax'));

    // Sport tags should appear
    expect(screen.getByText('MLB')).toBeDefined();
    expect(screen.getByText('NCAA Baseball')).toBeDefined();
  });

  it('expands entry via Enter key', () => {
    const { container } = render(<SonyEmpireTimeline />);

    // Find the content div with role="button" for the first entry
    const contentButtons = container.querySelectorAll('[role="button"]');
    expect(contentButtons.length).toBeGreaterThan(0);

    fireEvent.keyDown(contentButtons[0], { key: 'Enter' });

    // Hawk-Eye detail should appear
    expect(screen.getByText(/Optical tracking pioneer/)).toBeDefined();
  });

  it('toggles entry via Space key with preventDefault', () => {
    const { container } = render(<SonyEmpireTimeline />);

    const contentButtons = container.querySelectorAll('[role="button"]');

    // Expand with Space
    fireEvent.keyDown(contentButtons[0], { key: ' ' });
    expect(screen.getByText(/Optical tracking pioneer/)).toBeDefined();

    // Collapse with Space
    fireEvent.keyDown(contentButtons[0], { key: ' ' });
    expect(screen.queryByText(/Optical tracking pioneer/)).toBeNull();
  });

  it('sets aria-expanded correctly on timeline node buttons', () => {
    const { container } = render(<SonyEmpireTimeline />);

    const timelineButtons = container.querySelectorAll('button[aria-label]');
    // All should start collapsed
    for (const btn of Array.from(timelineButtons)) {
      expect(btn.getAttribute('aria-expanded')).toBe('false');
    }

    // Click first entry
    fireEvent.click(screen.getByText('Hawk-Eye Innovations'));

    // First button should now be expanded
    const updatedButtons = container.querySelectorAll('button[aria-label]');
    expect(updatedButtons[0].getAttribute('aria-expanded')).toBe('true');
    // Others remain collapsed
    expect(updatedButtons[1].getAttribute('aria-expanded')).toBe('false');
  });
});
