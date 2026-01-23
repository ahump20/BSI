export const BSI_COLORS = {
  burntOrange: '#BF5700',
  texasSoil: '#8B4513',
  charcoal: '#1A1A1A',
  midnight: '#0D0D0D',
  ember: '#FF6B35',
  white: '#FFFFFF',
  muted: '#888888',
} as const;

export type BSIColorKey = keyof typeof BSI_COLORS;
