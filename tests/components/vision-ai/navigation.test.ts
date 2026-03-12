/**
 * Navigation Tests — Structure Validation
 *
 * Verifies the main navigation items reflect the current site structure.
 * Updated after persona-based nav restructure (Mar 2026).
 */

import { describe, it, expect } from 'vitest';
import { getMainNavItems } from '@/lib/navigation';

describe('Main Navigation — Structured (getMainNavItems)', () => {
  const { primary, secondary } = getMainNavItems();

  it('has the correct primary nav items', () => {
    const labels = primary.map((item) => item.label);
    expect(labels).toContain('Scores');
    expect(labels).toContain('College Baseball');
    expect(labels).toContain('Intel');
    expect(labels).toContain('Pricing');
  });

  it('moved About to secondary nav', () => {
    const primaryLabels = primary.map((item) => item.label);
    const secondaryLabels = secondary.map((item) => item.label);
    expect(primaryLabels).not.toContain('About');
    expect(secondaryLabels).toContain('About');
  });

  it('has Glossary and Data Sources in secondary nav', () => {
    const labels = secondary.map((item) => item.label);
    expect(labels).toContain('Glossary');
    expect(labels).toContain('Data Sources');
  });
});
