/**
 * Conference color palette for analytics charts and visualizations.
 * Used by scatter plots, bar charts, and any component that
 * color-codes data by conference.
 */

export const CONF_COLORS: Record<string, string> = {
  SEC: '#BF5700',
  'Big 12': '#D4722A',
  ACC: '#5b9bd5',
  'Big Ten': '#2980b9',
  'Pac-12': '#6B8E23',
  AAC: '#c0392b',
  'Mountain West': '#e74c3c',
  'Sun Belt': '#F59E0B',
  'Conference USA': '#aaaaaa',
  WCC: '#10B981',
};

export function getConfColor(conf: string): string {
  return CONF_COLORS[conf] ?? '#666666';
}
