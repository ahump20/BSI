module.exports = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
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
      },
      borderRadius: { sm: '2px', md: '2px', lg: '2px' }
    }
  }
};
