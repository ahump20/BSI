import { describe, expect, it } from 'vitest';
import { withAlpha } from '@/lib/utils/color';

describe('withAlpha', () => {
  it('generates a color-mix expression with hex color and opacity', () => {
    expect(withAlpha('#BF5700', 0.5)).toBe('color-mix(in srgb, #BF5700 50%, transparent)');
  });

  it('rounds opacity to nearest integer percent', () => {
    expect(withAlpha('#000000', 0.333)).toBe('color-mix(in srgb, #000000 33%, transparent)');
    expect(withAlpha('#ffffff', 0.666)).toBe('color-mix(in srgb, #ffffff 67%, transparent)');
  });

  it('handles opacity of 0 (fully transparent)', () => {
    expect(withAlpha('#BF5700', 0)).toBe('color-mix(in srgb, #BF5700 0%, transparent)');
  });

  it('handles opacity of 1 (fully opaque)', () => {
    expect(withAlpha('#BF5700', 1)).toBe('color-mix(in srgb, #BF5700 100%, transparent)');
  });

  it('works with CSS variable references', () => {
    expect(withAlpha('var(--bsi-primary)', 0.8)).toBe(
      'color-mix(in srgb, var(--bsi-primary) 80%, transparent)'
    );
  });

  it('works with named CSS colors', () => {
    expect(withAlpha('red', 0.25)).toBe('color-mix(in srgb, red 25%, transparent)');
  });
});
