# Diamond Sluggers - Art Asset Specifications

## Overview

This document outlines all art assets required for the Diamond Sluggers mobile baseball game. All assets should be created as original IP to avoid any copyright issues.

---

## Character Sprites (16 Characters)

### Requirements per Character

Each character needs the following sprite sheets:

| Animation | Frame Count | Frame Size | Notes |
|-----------|-------------|------------|-------|
| Idle | 4 frames | 64x64 | Looping, 6 FPS |
| Batting Stance | 4 frames | 64x64 | Looping, 6 FPS |
| Swing | 8 frames | 96x96 | One-shot, 24 FPS |
| Pitch Wind-up | 12 frames | 96x96 | One-shot, 18 FPS |
| Running | 8 frames | 64x64 | Looping, 12 FPS |
| Fielding | 6 frames | 64x64 | One-shot, 15 FPS |
| Celebration | 6 frames | 64x64 | Looping, 10 FPS |
| Portrait | 1 frame | 256x256 | High-res for UI |

### Character List

1. **Maya "Thunder" Jackson** - Black girl, 11, lightning bolt headband
2. **Jackson "Rocket" Rodriguez** - Latino boy, 12, red cap, muscular build
3. **Emma "Glove" Chen** - Asian girl, 10, oversized glove, glasses
4. **Tyler "Knuckle" Williams** - White boy, 11, freckles, crafty look
5. **Sophia "Spark" Martinez** - Latina girl, 12, purple highlights in hair
6. **Marcus "Dash" Johnson** - Black boy, 11, track shoes, lean build
7. **Olivia "Cannon" Lee** - Asian girl, 12, catcher's gear elements
8. **Carlos "Magic" Garcia** - Latino boy, 10, magician-style wristbands
9. **Isabella "Ice" Nguyen** - Vietnamese girl, 11, cool demeanor, white accents
10. **Ryan "The Wall" Brown** - White boy, 12, tall, first baseman build
11. **Lily "Zoom" Park** - Korean girl, 10, colorful, artistic flair
12. **Diego "Fire" Ramirez** - Latino boy, 12, red/orange color scheme
13. **Zoe "Whirlwind" Washington** - Black girl, 11, braids, athletic
14. **Theo "Calculator" Kim** - Asian boy, 11, smart look, analytical vibe
15. **Mia "Shadow" Okonkwo** - Black girl, 10, dark purple theme
16. **Pete "Powerhouse" Gonzalez** - Latino boy, 12, stocky, powerful

### Art Style Guidelines

- **Style:** Cartoon/chibi, friendly and approachable
- **Color Palette:** Bright, saturated colors
- **Age Range:** All characters should look 10-12 years old
- **Diversity:** Mix of ethnicities, body types, and personalities
- **Inspiration:** Think Backyard Baseball meets modern mobile game aesthetics

---

## Stadium Backgrounds (8 Stadiums)

### Requirements per Stadium

| Asset | Size | Format | Notes |
|-------|------|--------|-------|
| Background | 1920x1080 | PNG | Layered for parallax |
| Field Overlay | 1920x1080 | PNG | Grass, dirt, bases |
| Unique Features | Varies | PNG | Interactive elements |
| Weather Variants | 1920x1080 | PNG | Time of day/weather |

### Stadium List

1. **Boerne Backyard** (Starter)
   - Texas hill country setting
   - Oak trees, tire swing
   - Wooden fence
   - Sunny afternoon

2. **San Antonio Sand Lot**
   - Desert/southwest theme
   - Cactus garden
   - Adobe wall elements
   - Hot, dusty atmosphere

3. **Austin Treehouse Field**
   - Forest setting
   - Giant treehouse in center field
   - Rope ladders, wooden platforms
   - Dappled sunlight

4. **Houston Bayou Diamond**
   - Wetlands setting
   - Bayou water hazard
   - Dock in right field
   - Humid, overcast

5. **Dallas Construction Site**
   - Urban setting
   - Crane in center field
   - Concrete mixers, barriers
   - Industrial feel

6. **Galveston Beach Diamond**
   - Beach setting
   - Sand instead of dirt
   - Seagulls, sandcastles
   - Ocean backdrop

7. **Marfa Mystery Field**
   - West Texas desert
   - Mysterious lights
   - Tumbleweeds
   - Night sky/sunset

8. **NASA Training Grounds** (Final unlock)
   - Space theme
   - Rocket launch pad
   - Mars rover
   - Futuristic elements

---

## UI Elements

### Main Menu

| Asset | Size | Notes |
|-------|------|-------|
| Logo | 512x256 | "Diamond Sluggers" text with baseball |
| Play Button | 160x160 | Circular, animated glow |
| Menu Button | 200x60 | Rounded rectangle |
| Coin Icon | 32x32 | Gold coin with star |
| XP Bar | 300x20 | Progress bar with fill |

### Game HUD

| Asset | Size | Notes |
|-------|------|-------|
| Scoreboard | 400x100 | Transparent background |
| Base Indicator | 100x100 | Diamond shape with bases |
| Count Display | 150x80 | B/S/O indicators |
| Power-up Slots | 60x60 each | 3 slots, circular |
| Pause Button | 48x48 | ||/▶ icons |

### Character Select

| Asset | Size | Notes |
|-------|------|-------|
| Character Card | 180x240 | With stats preview |
| Lock Overlay | 180x240 | Padlock icon |
| Stat Radar | 200x200 | Hexagonal chart |
| Team Slot | 80x80 | Empty and filled states |

### Results Screen

| Asset | Size | Notes |
|-------|------|-------|
| Victory Banner | 600x200 | Gold, celebratory |
| Defeat Banner | 600x200 | Muted colors |
| Stats Panel | 500x200 | Dark background |
| Confetti | 20x20 | Multiple colors |

---

## Game Objects

### Baseball

| State | Size | Notes |
|-------|------|-------|
| Normal | 32x32 | White with red stitching |
| In Flight | 32x32 | Motion blur effect |
| Hit Effect | 128x128 | Spark/impact sprite sheet |

### Bat

| State | Size | Notes |
|-------|------|-------|
| Normal | 128x32 | Wooden texture |
| Power-up | 128x32 | Glowing variant |

### Bases

| Asset | Size | Notes |
|-------|------|-------|
| Base (empty) | 48x48 | White square, diamond angle |
| Base (occupied) | 48x48 | Highlighted glow |
| Home Plate | 48x48 | Pentagon shape |

---

## Effects & Particles

| Effect | Size | Frames | Notes |
|--------|------|--------|-------|
| Hit Spark | 128x128 | 6 | Impact on contact |
| Dust Cloud | 64x64 | 8 | Running, sliding |
| Home Run Trail | 64x64 | 10 | Ball flight |
| Power-up Aura | 96x96 | 8 | Character glow |
| Strikeout | 256x128 | 1 | "K" text effect |

---

## File Naming Convention

```
characters/
├── maya-thunder/
│   ├── idle.png
│   ├── swing.png
│   ├── pitch.png
│   ├── run.png
│   ├── field.png
│   ├── celebrate.png
│   └── portrait.png
├── jackson-rocket/
│   └── ...

stadiums/
├── boerne-backyard/
│   ├── background.png
│   ├── field.png
│   ├── features.png
│   └── weather-sunset.png
├── san-antonio-lot/
│   └── ...

ui/
├── menu/
├── hud/
├── character-select/
└── results/

effects/
├── hit-spark.png
├── dust-cloud.png
└── ...
```

---

## Delivery Format

- **Format:** PNG with transparency
- **Resolution:** 2x for retina displays
- **Color Space:** sRGB
- **Compression:** Optimized for web (TinyPNG or similar)

---

## Budget Estimate

| Category | Count | Est. Cost | Total |
|----------|-------|-----------|-------|
| Character Sprites | 16 chars × 7 anims | $150/char | $2,400 |
| Character Portraits | 16 | $50/each | $800 |
| Stadium Backgrounds | 8 × 4 variants | $200/stadium | $1,600 |
| UI Elements | ~50 assets | $20/each | $1,000 |
| Effects/Particles | ~20 assets | $30/each | $600 |
| **Total Estimated** | | | **$6,400** |

---

## Recommended Artists/Platforms

1. **Fiverr** - Game sprite specialists
2. **ArtStation** - Professional concept artists
3. **GameDev Market** - Pre-made assets (for prototyping)
4. **Kenney.nl** - Free placeholder assets
5. **itch.io** - Indie game asset packs

---

*Document Version: 1.0*
*Last Updated: November 2025*
*Project: Diamond Sluggers by Blaze Sports Intel*
