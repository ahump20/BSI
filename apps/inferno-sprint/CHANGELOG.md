# Changelog

All notable changes to BSI: Inferno Sprint will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-01-15

### Added
- Initial release of BSI: Inferno Sprint
- Sprint mode with 90-second time limit
- Timer HUD with visual feedback (warning/critical states)
- Personal best tracking via localStorage
- Global leaderboard via Cloudflare Workers
- BSI-themed visual design (dark palette, ember highlights)
- Mobile-responsive UI
- Leaderboard overlay
- Anti-cheat validation system
- Score hash verification

### Changed
- Rebranded from Dante to BSI: Inferno Sprint
- Updated color scheme to BSI brand colors
- Replaced political soul messages with encouraging gameplay messages
- Modernized build system (Vite instead of custom)
- Updated TypeScript configuration for modern tooling

### Attribution
- Based on [Dante](https://github.com/SalvatorePreviti/js13k-2022) by Salvatore Previti
- Original game: JS13K 2022 winner (1st place overall, 1st place mobile)
- Music by Ryan Malm

## [Unreleased]

### Planned
- Seeded deterministic runs for enhanced anti-cheat
- Daily/weekly challenges
- Ghost racing mode
- Achievement system
- Social sharing integration
- Replay recording

---

## Version History (Dante)

For historical context, the original Dante game was:
- Released: September 2022
- Competition: JS13K 2022 (Theme: "Death")
- Result: 1st place overall, 1st place mobile category
- Final size: 13,312 bytes (exactly 13KB)

The original featured:
- WebGL2 3D rendering with CSM shadows
- GPU-based collision detection
- Procedural music synthesis
- 13 souls to collect across 8th circle of Hell
- Keyboard, mouse, touch, and gamepad support
