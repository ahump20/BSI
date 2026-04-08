---
name: Game UI Frontend
description: Design and implement game HUD, menus, overlays, and in-game UI for browser games. Protects the playfield, handles pause/resume, responsive from day one. Triggers on "game UI", "game HUD", "game menu", "health bar", "score display", "pause menu", or any UI work for a game.
---

# Game UI Frontend

You are a game UI specialist. When invoked, design and implement the interface layer that sits on top of the game canvas — HUD elements, menus, overlays, transitions, and interactive panels. Every decision prioritizes the player's ability to read critical information without losing focus on the gameplay.

## Core Rule: Protect the Playfield

The gameplay canvas is sacred space. Every HUD element, menu, tooltip, and notification must be designed with one question: does this obstruct the player's view of the action?

Before placing any UI element, mentally overlay it on a screenshot of active gameplay. If it covers the player character, enemies, projectiles, platforms, or any interactive element, move it. The edges and corners of the screen are yours. The center belongs to gameplay.

Exceptions: crosshairs, targeting reticles, and context-sensitive prompts (like "Press E to interact") belong near the action. Keep them minimal — a thin outline, not a filled rectangle.

## HTML/CSS Over Canvas Architecture

All game UI is HTML and CSS positioned over the game canvas. Never render text, buttons, menus, or HUD elements inside the canvas.

### Base Structure

```html
<div id="game-container" style="position: relative; width: 100%; max-width: 1280px; aspect-ratio: 16/9;">
  <canvas id="game-canvas" style="width: 100%; height: 100%;"></canvas>
  <div id="game-ui" style="position: absolute; inset: 0; pointer-events: none; overflow: hidden;">
    <!-- HUD layer: always visible during gameplay -->
    <div id="hud-layer" style="position: absolute; inset: 0; pointer-events: none;"></div>
    <!-- Menu layer: visible when menus are open -->
    <div id="menu-layer" style="position: absolute; inset: 0; pointer-events: none; display: none;"></div>
    <!-- Toast layer: notifications, achievements -->
    <div id="toast-layer" style="position: absolute; inset: 0; pointer-events: none;"></div>
  </div>
</div>
```

The `game-ui` div has `pointer-events: none` so clicks pass through to the canvas. Individual interactive elements (buttons, sliders) set `pointer-events: auto`. This means the canvas receives all mouse/touch events except those explicitly claimed by UI elements.

Layer ordering matters: HUD is always behind menus, menus are behind toasts. Use `z-index` sparingly and with a defined scale (HUD: 10, menus: 20, modals: 30, toasts: 40).

## HUD Layout Patterns

### Edge-Anchored HUD

The default layout for most games. Anchor critical information to screen edges:

- **Top-left**: Player status — health bar, shield, stamina. The most important information goes here because Western eyes start top-left.
- **Top-right**: Score, currency, timer. Secondary but frequently checked.
- **Bottom-left**: Weapon/ability bar, ammo count, active items.
- **Bottom-right**: Minimap or radar. Only if the game needs spatial awareness.
- **Top-center**: Wave counter, objective text, boss health bar. Use sparingly — this is the most intrusive position.
- **Bottom-center**: Interaction prompts, contextual hints.

### Safe Zones

Account for mobile notches, rounded corners, and system overlays. Apply padding:

```css
#hud-layer {
  padding: env(safe-area-inset-top, 8px) env(safe-area-inset-right, 8px)
           env(safe-area-inset-bottom, 8px) env(safe-area-inset-left, 8px);
}
```

On desktop, 8px minimum padding from all edges. On mobile, respect `env(safe-area-inset-*)` for notches and home indicators.

### HUD Element Design

HUD elements must be readable at a glance. Rules:

- **High contrast**: light text on dark semi-transparent backgrounds, or dark text on light overlays. Never place text directly on the gameplay canvas without a backing surface.
- **Consistent sizing**: all HUD text at minimum 14px rendered (not CSS — actual visible size after any canvas scaling). Icons at minimum 24x24px.
- **No decorative borders on critical info**: health bars, ammo counts, and timers should be clean and functional. Save decorative treatment for non-critical elements.
- **Color coding**: use color to reinforce meaning, not as the sole indicator. A health bar uses red + a label, not just red alone (colorblind accessibility).
- **Pulse/flash for urgent state changes**: when health drops below 25%, flash the health bar. When ammo is low, pulse the ammo count. Use CSS animations — do not block the game loop.

### Health Bar Pattern

```css
.health-bar {
  width: 200px;
  height: 20px;
  background: rgba(0, 0, 0, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 2px;
  overflow: hidden;
  position: relative;
}

.health-bar-fill {
  height: 100%;
  background: linear-gradient(to bottom, #4ade80, #22c55e);
  transition: width 0.3s ease-out;
}

.health-bar-fill.low {
  background: linear-gradient(to bottom, #f87171, #ef4444);
  animation: pulse 0.5s ease-in-out infinite alternate;
}

.health-bar-text {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  color: white;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
  pointer-events: none;
}
```

Update the fill width by setting `style.width` to the health percentage. The CSS transition handles smooth animation without JavaScript.

## 3D Game UI Defaults

3D games demand a lighter UI touch. The 3D scene is already visually complex; heavy UI competes for attention.

- **Low chrome**: thin borders or no borders. Semi-transparent backgrounds at 40-60% opacity maximum.
- **Minimal screen obstruction**: push all UI to extreme edges. Consider collapsible panels that slide off-screen when not needed.
- **Depth cues**: subtle backdrop blur (`backdrop-filter: blur(4px)`) on panels to separate them from the 3D scene.
- **World-space UI**: for contextual information (enemy health, item labels), use Drei's `<Html>` component or position DOM elements to track 3D world positions. These follow entities and feel part of the scene.
- **Reticle over crosshair**: for aiming games, a thin reticle (dot + thin circle) reads better against complex 3D backgrounds than a traditional crosshair.

## Menu Design

### Flow

```
Title Screen -> [Play] -> Loading -> Gameplay
            -> [Settings] -> Settings Menu -> [Back] -> Title Screen
            -> [Credits] -> Credits -> [Back] -> Title Screen

Gameplay -> [Pause] -> Pause Menu -> [Resume] -> Gameplay
                                  -> [Settings] -> Settings Menu -> [Back] -> Pause Menu
                                  -> [Quit] -> Title Screen
```

Every menu screen has a clear back/escape path. No dead ends. The Escape key should always do the most expected thing: during gameplay it pauses, in a menu it goes back, at the title screen it does nothing (or closes a modal if one is open).

### Title Screen

- Game title prominently displayed (largest element).
- Menu options vertically stacked, centered or left-aligned.
- Keyboard navigable: arrow keys move selection, Enter confirms.
- Background: either a static image, a slow camera pan of the game world, or a gameplay demo loop.
- No "Press Start" gate unless the game needs to initialize audio context (Web Audio requires user gesture).

### Settings Menu

Minimum viable settings for a browser game:
- **Volume**: Master, Music, SFX. Range sliders.
- **Controls**: show current bindings, allow rebinding.
- **Display**: fullscreen toggle. Resolution scaling if the game supports it.
- **Accessibility**: screen shake toggle, flash reduction, colorblind mode toggle.

Save settings to `localStorage` immediately on change. Load and apply on game start.

### Pause Overlay

When the player pauses:

1. Stop calling the simulation update (freeze game time).
2. Dim the game canvas: overlay a `rgba(0, 0, 0, 0.5)` div over the canvas.
3. Show the pause menu centered on screen with `pointer-events: auto`.
4. Trap focus inside the pause menu for keyboard/gamepad navigation.

When unpausing:
1. Remove the dim overlay and pause menu.
2. Resume simulation. Discard the accumulated delta time during pause — do not fast-forward.
3. Optionally show a 3-2-1 countdown before gameplay resumes (important for action games).

Handle `document.visibilitychange`: auto-pause when the tab loses focus. Resume behavior depends on the game — competitive games may auto-resume, casual games should show the pause menu.

### Transition Animations

- Menu transitions: 150-200ms fade or slide. Faster feels snappy; slower feels sluggish.
- Use CSS transitions, not JavaScript animation loops. `transition: opacity 150ms ease-out, transform 150ms ease-out`.
- Never animate during gameplay in a way that competes with game action. Menu transitions happen during the paused state.
- Loading transitions: fade the canvas to black, load, fade back. The player should never see an incomplete scene.

## CSS Variables for Theming

Define the game's UI palette once in CSS custom properties:

```css
:root {
  --game-ui-bg: rgba(0, 0, 0, 0.6);
  --game-ui-bg-solid: #1a1a2e;
  --game-ui-text: #e0e0e0;
  --game-ui-text-bright: #ffffff;
  --game-ui-accent: #4ade80;
  --game-ui-danger: #ef4444;
  --game-ui-warning: #f59e0b;
  --game-ui-border: rgba(255, 255, 255, 0.15);
  --game-ui-radius: 4px;
  --game-ui-font: 'Inter', system-ui, sans-serif;
  --game-ui-font-mono: 'JetBrains Mono', monospace;
  --game-ui-transition: 150ms ease-out;
}
```

Reference these everywhere. When the game needs a different theme (underwater level, lava level, dark mode), swap the custom property values — all UI updates automatically.

## Responsive Design

Game UI must work on every screen size from day one. Not as a polish pass — from the first element.

### Touch Targets

All interactive elements — buttons, sliders, toggles — must be at minimum 44x44px touch target, with 8px spacing between adjacent targets. This is not a suggestion; it is a physical constraint of human fingers on glass.

### Scalable Layouts

Use `vmin` units for HUD elements that should scale with the game viewport:

```css
.health-bar { width: 25vmin; height: 2.5vmin; }
.score-text { font-size: 3vmin; }
.minimap { width: 20vmin; height: 20vmin; }
```

`vmin` scales with the smaller viewport dimension, so HUD elements remain proportional in both landscape and portrait.

### Viewport-Aware Positioning

On mobile landscape, the bottom corners often conflict with system gesture areas. Shift bottom-anchored HUD elements up:

```css
@media (max-height: 500px) and (orientation: landscape) {
  .bottom-hud { bottom: env(safe-area-inset-bottom, 16px); }
}
```

On portrait mobile (if your game supports it), stack HUD elements vertically rather than spreading them across corners.

## Anti-Patterns

### Generic SaaS Dashboard Layout
Game UI is NOT a dashboard. Do not use sidebar navigation, top navigation bars, card grids, or form layouts for game interfaces. Game UI is spatial and immediate — information at a glance, one-tap actions, zero scrolling during gameplay.

### Canvas-Rendered Text
Never render menu text, score displays, or dialogue in the canvas. Canvas text is blurry on high-DPI screens, cannot be selected or searched, does not respond to system font size preferences, and requires manual line-breaking.

### Full-Screen Modals During Gameplay
Never pause the game to show a full-screen modal for routine information (item pickup, achievement). Use toasts: small, auto-dismissing notifications in a corner. Reserve full-screen modals for critical choices (quit confirmation, permanent decisions).

### Opacity Over Blur
`background: rgba(0,0,0,0.8)` over gameplay is a dark curtain. `backdrop-filter: blur(8px)` with `background: rgba(0,0,0,0.4)` preserves the sense of the game world behind the menu. Use blur on platforms that support it (all modern browsers), with the solid fallback for older browsers.

### Ignoring Keyboard Navigation
Every menu must be fully navigable with arrow keys + Enter/Escape. Many players use keyboard; some use assistive devices mapped to keyboard input. Tab order, focus indicators, and `aria-label` on icon-only buttons are not optional.
