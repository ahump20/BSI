/**
 * StrikeZoneModel Component Tests
 *
 * Tests the SVG-based ABS strike zone visualization.
 */

import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { StrikeZoneModel } from '@/components/mlb/StrikeZoneModel';

describe('StrikeZoneModel', () => {
  it('renders the SVG with proper aria-label', () => {
    render(<StrikeZoneModel />);

    const svg = screen.getByRole('img');
    expect(svg).toBeDefined();
    expect(svg.getAttribute('aria-label')).toContain('ABS Strike Zone Model');
  });

  it('shows the caption text about keypoints', () => {
    render(<StrikeZoneModel />);

    expect(screen.getByText(/18 skeletal keypoints tracked at 30fps/)).toBeDefined();
    expect(screen.getByText(/Zone top = midpoint of shoulders/)).toBeDefined();
  });

  it('renders in compact mode without dimension annotations', () => {
    const { container } = render(<StrikeZoneModel compact />);

    // In compact mode, the "ZONE" annotation text should not appear
    const svg = container.querySelector('svg');
    expect(svg).toBeDefined();
    // The compact prop removes dimension annotations and legend
    const textElements = svg!.querySelectorAll('text');
    const texts = Array.from(textElements).map((t) => t.textContent);
    expect(texts).not.toContain('ZONE');
  });

  it('renders in default mode with dimension annotations', () => {
    const { container } = render(<StrikeZoneModel />);

    const svg = container.querySelector('svg');
    const textElements = svg!.querySelectorAll('text');
    const texts = Array.from(textElements).map((t) => t.textContent);

    // Full mode shows zone annotations
    expect(texts).toContain('ZONE');
    expect(texts.some((t) => t?.includes('17 in'))).toBe(true);
  });

  it('renders the home plate polygon', () => {
    const { container } = render(<StrikeZoneModel />);

    const polygons = container.querySelectorAll('polygon');
    expect(polygons.length).toBeGreaterThan(0);
  });

  it('renders skeletal keypoint circles', () => {
    const { container } = render(<StrikeZoneModel />);

    // Should have 18 keypoint circles + possible other circles
    const circles = container.querySelectorAll('circle');
    expect(circles.length).toBeGreaterThanOrEqual(18);
  });

  it('renders skeleton lines connecting keypoints', () => {
    const { container } = render(<StrikeZoneModel />);

    // Should have skeleton connection lines
    const lines = container.querySelectorAll('line');
    expect(lines.length).toBeGreaterThanOrEqual(15); // 15 skeleton connections
  });

  it('shows keypoint label on hover', () => {
    const { container } = render(<StrikeZoneModel />);

    // Find keypoint circles (the interactive ones)
    const circles = container.querySelectorAll('circle.cursor-pointer');
    expect(circles.length).toBeGreaterThan(0);

    // Hover over the first keypoint
    fireEvent.mouseEnter(circles[0]);

    // A text label should appear with the keypoint name
    const svg = container.querySelector('svg');
    const textElements = svg!.querySelectorAll('text');
    const texts = Array.from(textElements).map((t) => t.textContent);

    // One of the keypoint labels should now be visible
    const keypointLabels = ['Head', 'Neck', 'R Shoulder', 'L Shoulder', 'R Elbow',
      'L Elbow', 'R Wrist', 'L Wrist', 'Torso', 'R Hip', 'L Hip', 'Midpoint',
      'R Knee', 'L Knee', 'R Ankle', 'L Ankle', 'Hollow of Knee', 'Belt Line'];
    const hasLabel = texts.some((t) => keypointLabels.includes(t || ''));
    expect(hasLabel).toBe(true);
  });

  it('accepts className prop', () => {
    const { container } = render(<StrikeZoneModel className="my-custom-class" />);

    const wrapper = container.firstElementChild;
    expect(wrapper?.classList.contains('my-custom-class')).toBe(true);
  });
});
