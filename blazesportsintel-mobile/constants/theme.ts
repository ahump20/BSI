export const colors = {
  burntOrange: '#BF5700',
  texasSoil: '#8B4513',
  charcoal: '#1A1A1A',
  midnight: '#0D0D0D',
  bone: '#F5F2EB',
  dust: '#C4B8A5',
  ember: '#FF6B35',
  columbiaBlue: '#4B9CD3',
  teal: '#00B2A9',
  bronze: '#8C6239'
} as const;

export const fonts = {
  oswald: 'Oswald',
  cormorant: 'CormorantGaramond',
  mono: 'IBMPlexMono',
  bebas: 'BebasNeue'
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24
} as const;

export const borderRadius = {
  sm: 2,
  md: 2,
  lg: 2
} as const;

export const shadows = {
  card: {
    shadowColor: '#000000',
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3
  }
} as const;

export const heritageTheme = {
  colors,
  fontFamily: fonts,
  borderRadius
};
