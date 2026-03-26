# Typography Reference

## Contents
- Font Pairing Library
- Type Scale System
- Fluid Typography with clamp()
- Loading Patterns

## Font Pairing Library

Organized by aesthetic direction. Each pairing lists: Display + Body + Mono (if applicable).

### Editorial / Magazine
- Playfair Display + Source Sans Pro
- Lora + Merriweather Sans
- Noto Serif Display + Noto Sans
- Libre Baskerville + Karla

### Tech / Modern
- Space Grotesk + DM Sans
- Sora + Inter (yes, Inter works as body when paired well)
- Outfit + Plus Jakarta Sans
- Manrope + General Sans

### Luxury / Premium
- Cormorant Garamond + Work Sans
- EB Garamond + Lato
- Prata + Nunito Sans
- Bodoni Moda + Montserrat

### Brutalist / Raw
- IBM Plex Mono (display + body)
- JetBrains Mono + IBM Plex Sans
- Courier Prime + system-ui (intentional)
- Fira Code + Fira Sans

### Playful / Friendly
- Fredoka + Quicksand
- Nunito + Open Sans
- Comfortaa + Poppins
- Baloo 2 + Rubik

### Retro / Vintage
- Bebas Neue + Source Serif Pro
- Oswald + Crimson Text
- Anton + Roboto Slab
- Archivo Black + Archivo

## Type Scale System

Base: 1rem = 16px. Use a ratio for consistent hierarchy.

| Scale Name | Ratio | Character |
|-----------|-------|-----------|
| Minor Second | 1.067 | Tight, dense UIs |
| Major Second | 1.125 | Compact, data-heavy |
| Minor Third | 1.200 | Balanced (recommended default) |
| Major Third | 1.250 | Comfortable reading |
| Perfect Fourth | 1.333 | Editorial, generous |
| Golden Ratio | 1.618 | Dramatic, display-heavy |

### Example (Minor Third, 1.200)

```css
:root {
  --text-xs: 0.694rem;   /* 11.1px */
  --text-sm: 0.833rem;   /* 13.3px */
  --text-base: 1rem;     /* 16px */
  --text-lg: 1.2rem;     /* 19.2px */
  --text-xl: 1.44rem;    /* 23px */
  --text-2xl: 1.728rem;  /* 27.6px */
  --text-3xl: 2.074rem;  /* 33.2px */
  --text-4xl: 2.488rem;  /* 39.8px */
}
```

## Fluid Typography with clamp()

Responsive type without media queries:

```css
h1 { font-size: clamp(2rem, 5vw + 1rem, 4rem); }
h2 { font-size: clamp(1.5rem, 3vw + 0.75rem, 2.5rem); }
p  { font-size: clamp(1rem, 1vw + 0.75rem, 1.25rem); }
```

Formula: `clamp(min, preferred, max)` where preferred uses `vw` units.

## Loading Patterns

Always use `font-display: swap` to prevent invisible text:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Display+Font:wght@400;700&family=Body+Font:wght@400;600&display=swap" rel="stylesheet">
```

For performance: preload the critical font file:
```html
<link rel="preload" as="font" type="font/woff2" href="font.woff2" crossorigin>
```
