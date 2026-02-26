/**
 * Apply alpha transparency to any CSS color value.
 *
 * Replaces the brittle `${hex}XX` concatenation pattern (which only works with hex
 * and produces opaque 8-digit hex strings). This works with hex (#BF5700),
 * CSS variables (var(--bsi-primary)), named colors, rgb(), hsl(), etc.
 *
 * Uses color-mix() — supported in Chrome 111+, Firefox 113+, Safari 16.2+.
 *
 * @param color - Any valid CSS color value
 * @param opacity - 0 to 1
 */
export function withAlpha(color: string, opacity: number): string {
  return `color-mix(in srgb, ${color} ${Math.round(opacity * 100)}%, transparent)`;
}
