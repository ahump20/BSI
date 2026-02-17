/**
 * Navigation Tests — Structure Validation
 *
 * Verifies the main navigation items reflect the current site structure.
 * Updated after Content Intelligence Brief nav restructure (Feb 2026).
 */

import { describe, it, expect } from 'vitest';
import { mainNavItems, getMainNavItems } from '@/lib/navigation';

describe('Main Navigation — Legacy Flat List', () => {
  it('includes Intel and Models in the nav items', () => {
    const labels = mainNavItems.map((item) => item.label);
    expect(labels).toContain('Intel');
    expect(labels).toContain('Models');
  });

  it('includes Glossary in the nav items', () => {
    const glossary = mainNavItems.find((item) => item.label === 'Glossary');
    expect(glossary).toBeDefined();
    expect(glossary!.href).toBe('/glossary');
  });

  it('still contains all sport pages', () => {
    const labels = mainNavItems.map((item) => item.label);
    expect(labels).toContain('MLB');
    expect(labels).toContain('NFL');
    expect(labels).toContain('NBA');
    expect(labels).toContain('CFB');
    expect(labels).toContain('College Baseball');
    expect(labels).toContain('Dashboard');
    expect(labels).toContain('Arcade');
  });

  it('places Intel and Models before sport pages', () => {
    const labels = mainNavItems.map((item) => item.label);
    const intelIndex = labels.indexOf('Intel');
    const modelsIndex = labels.indexOf('Models');
    const mlbIndex = labels.indexOf('MLB');

    expect(intelIndex).toBeLessThan(mlbIndex);
    expect(modelsIndex).toBeLessThan(mlbIndex);
  });
});

describe('Main Navigation — Structured (getMainNavItems)', () => {
  const { primary, secondary } = getMainNavItems();

  it('has Intel and Models in primary nav', () => {
    const labels = primary.map((item) => item.label);
    expect(labels).toContain('Intel');
    expect(labels).toContain('Models');
    expect(labels).toContain('Live');
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

  it('does not include Vision AI in secondary nav', () => {
    const labels = secondary.map((item) => item.label);
    expect(labels).not.toContain('Vision AI');
  });
});
