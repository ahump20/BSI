/**
 * Vision AI Hub Page — Smoke Tests
 *
 * Verifies the flagship /vision-ai page renders all major sections,
 * section navigation, cross-links, and child components.
 */

import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import VisionAIHub from '@/app/vision-ai/page';

describe('Vision AI Hub Page', () => {
  it('renders the hero headline', () => {
    render(<VisionAIHub />);

    // The headline is split: "How Computer Vision is " + <span>"Reshaping Sports"</span>
    expect(screen.getByText(/How Computer Vision is/)).toBeDefined();
    expect(screen.getByText('Reshaping Sports')).toBeDefined();
  });

  it('renders 13 section nav buttons with correct labels', () => {
    const { container } = render(<VisionAIHub />);

    const expectedShortLabels = [
      'Overview', 'Tracking', 'Biomechanics', 'Injury',
      'Plays', 'Officials', 'Fans', 'Scouting',
      'Frontier', 'Sony', 'College', 'OSS', 'Tools',
    ];

    // Buttons are inside a flex container (no <nav> element)
    // Each button has two spans: desktop (hidden md:inline) and mobile (md:hidden)
    // In jsdom there's no media query, so both render — textContent includes both
    const stickySection = container.querySelector('.sticky');
    const buttons = stickySection?.querySelectorAll('button') ?? [];
    expect(buttons.length).toBe(13);

    const labels = Array.from(buttons).map((b) => b.textContent?.trim());
    for (const expected of expectedShortLabels) {
      expect(labels.some((l) => l?.includes(expected))).toBe(true);
    }
  });

  it('renders all 8 application area cards', () => {
    render(<VisionAIHub />);

    const areaTitles = [
      'Player Tracking',
      'Biomechanics',
      'Injury Prediction',
      'Play Recognition',
      'Officiating Technology',
      'Fan Engagement',
      'Scouting at Scale',
      'Frontier Tech',
    ];

    for (const title of areaTitles) {
      expect(screen.getAllByText(title).length).toBeGreaterThan(0);
    }
  });

  it('renders KPI strip in the hero', () => {
    render(<VisionAIHub />);

    // KPI values appear in both hero strip and stat sidebars — use getAllByText
    expect(screen.getAllByText('12').length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Cameras/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText('225+').length).toBeGreaterThan(0);
    expect(screen.getAllByText('17%').length).toBeGreaterThan(0);
  });

  it('renders the StrikeZoneModel inside the officiating section', () => {
    const { container } = render(<VisionAIHub />);

    const svg = container.querySelector('svg[aria-label*="ABS Strike Zone Model"]');
    expect(svg).not.toBeNull();
  });

  it('renders the SonyEmpireTimeline component', () => {
    render(<VisionAIHub />);

    expect(screen.getByText('Hawk-Eye Innovations')).toBeDefined();
    expect(screen.getByText('KinaTrax')).toBeDefined();
  });

  it('renders the CollegeSportsGap component', () => {
    render(<VisionAIHub />);

    expect(screen.getByText('Optical Player Tracking')).toBeDefined();
  });

  it('renders the TechMaturityMap component', () => {
    const { container } = render(<VisionAIHub />);

    const filterButtons = container.querySelectorAll('button.rounded-full');
    expect(filterButtons.length).toBeGreaterThan(0);
    expect(screen.getByText(/technologies shown/)).toBeDefined();
  });

  it('renders the open source tools table', () => {
    const { container } = render(<VisionAIHub />);

    // Tools appear in both the OSS table and TechMaturityMap — use table-specific query
    const tables = container.querySelectorAll('table');
    expect(tables.length).toBeGreaterThan(0);

    const tableText = tables[0]?.textContent ?? '';
    expect(tableText).toContain('RF-DETR');
    expect(tableText).toContain('RTMPose');
    expect(tableText).toContain('ByteTrack');
    expect(tableText).toContain('SAM 2');
    expect(tableText).toContain('Supervision');
    expect(tableText).toContain('YOLOv8');
  });

  it('renders cross-link destinations in Go Deeper section', () => {
    const { container } = render(<VisionAIHub />);

    const links = Array.from(container.querySelectorAll('a'));
    const hrefs = links.map((a) => a.getAttribute('href'));

    expect(hrefs).toContain('/mlb/abs');
    expect(hrefs).toContain('/vision-AI-Intelligence');
    expect(hrefs).toContain('/college-baseball');
  });

  it('updates active section when a nav button is clicked', () => {
    const { container } = render(<VisionAIHub />);

    // Section nav buttons live in the sticky bar
    const stickySection = container.querySelector('.sticky');
    const navButtons = stickySection?.querySelectorAll('button') ?? [];
    expect(navButtons.length).toBe(13);

    // Click "Scouting" (index 7) — should activate
    fireEvent.click(navButtons[7]);
    expect(navButtons[7].className).toContain('border-burnt-orange');

    // "Overview" (index 0) should no longer be active
    expect(navButtons[0].className).not.toContain('border-burnt-orange');
  });

  it('renders BSI Take editorial callouts in detailed sections', () => {
    render(<VisionAIHub />);

    // 8 application areas + CollegeSportsGap = 9+ BSI Take headings
    const bsiTakes = screen.getAllByText('BSI Take');
    expect(bsiTakes.length).toBeGreaterThanOrEqual(8);
  });
});
