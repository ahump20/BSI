/**
 * Navigation Tests — Vision AI Integration
 *
 * Verifies the Vision AI nav item is properly placed in the main navigation.
 */

import { describe, it, expect } from 'vitest';
import { mainNavItems } from '@/lib/navigation';

describe('Main Navigation — Vision AI', () => {
  it('includes Vision AI in the nav items', () => {
    const visionAI = mainNavItems.find((item) => item.label === 'Vision AI');
    expect(visionAI).toBeDefined();
    expect(visionAI!.href).toBe('/vision-ai');
  });

  it('places Vision AI after College Baseball', () => {
    const labels = mainNavItems.map((item) => item.label);
    const cbIndex = labels.indexOf('College Baseball');
    const vaiIndex = labels.indexOf('Vision AI');

    expect(cbIndex).toBeGreaterThan(-1);
    expect(vaiIndex).toBeGreaterThan(-1);
    expect(vaiIndex).toBeGreaterThan(cbIndex);
  });

  it('places Vision AI before Arcade', () => {
    const labels = mainNavItems.map((item) => item.label);
    const vaiIndex = labels.indexOf('Vision AI');
    const arcadeIndex = labels.indexOf('Arcade');

    expect(vaiIndex).toBeLessThan(arcadeIndex);
  });

  it('still contains all original sport pages', () => {
    const labels = mainNavItems.map((item) => item.label);

    expect(labels).toContain('MLB');
    expect(labels).toContain('NFL');
    expect(labels).toContain('NBA');
    expect(labels).toContain('CFB');
    expect(labels).toContain('College Baseball');
    expect(labels).toContain('Dashboard');
    expect(labels).toContain('Arcade');
  });
});
