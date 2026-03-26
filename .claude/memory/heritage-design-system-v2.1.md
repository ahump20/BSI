# Heritage Design System v2.1 (Canonical Tokens)

## Core Palette (invariant — no substitutions)
| Token | Hex | Usage |
|---|---|---|
| Burnt Orange | #BF5700 | Primary action, active states, emphasis |
| Texas Soil | #8B4513 | Secondary, warm accents |
| Charcoal | #1A1A1A | Card backgrounds, surfaces |
| Midnight | #0D0D0D | App/page background, tab bar |
| Bone | #F5F2EB | Primary text on dark backgrounds |
| Dust | #C4B8A5 | Secondary text, inactive states |
| Ember | #FF6B35 | Accent ONLY — live indicators, alerts |

## Heritage Accents (data surfaces only)
| Token | Hex | Usage |
|---|---|---|
| Columbia Blue | #4B9CD3 | Data charts, secondary data accents |
| Teal | #00B2A9 | Positive indicators, success states |
| Bronze | #8C6239 | Tertiary data, earned/premium |

## Type Stack
| Font | Role | Config |
|---|---|---|
| Oswald | Headings | Uppercase, 0.15-0.2em letter-spacing |
| Cormorant Garamond | Body text, quotes | 1.7 line-height |
| IBM Plex Mono | Data labels, timestamps | Regular weight |
| Bebas Neue | Scores, hero display | 3rem+ only |

## Hard Rules
- Border radius: 2px maximum. No exceptions.
- Dark mode only. No light backgrounds. No white screens.
- No system fonts. Load all 4 families.
- No #007AFF (iOS default blue) anywhere.
- No system gray. Use Dust or Charcoal.
- Data density beats atmosphere. Always.
