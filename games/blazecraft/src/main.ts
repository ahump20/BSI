/**
 * Blazecraft - Main Entry Point
 *
 * Two modes:
 * - CITY (default): Warcraft-style city builder with live agent events
 * - REPLAY: RTS replay viewer for analyzing agent decisions
 *
 * Switch modes via URL:
 * - /games/blazecraft/ or ?mode=city → City Builder
 * - /games/blazecraft/?mode=replay → Replay Viewer
 */

import { createRoot } from 'react-dom/client';
import { StrictMode, createElement } from 'react';
import { BlazecraftApp } from '@ui/BlazecraftApp';
import { CityBuilderApp } from '@ui/CityBuilderApp';

// ─────────────────────────────────────────────────────────────
// Mode Detection
// ─────────────────────────────────────────────────────────────

type AppMode = 'city' | 'replay';

function getAppMode(): AppMode {
  const params = new URLSearchParams(window.location.search);
  const mode = params.get('mode');

  if (mode === 'replay') {
    return 'replay';
  }

  // Default to city mode (the new Warcraft-style builder)
  return 'city';
}

// ─────────────────────────────────────────────────────────────
// Bootstrap
// ─────────────────────────────────────────────────────────────

function bootstrap(): void {
  const container = document.getElementById('app');

  if (!container) {
    throw new Error('Root container not found');
  }

  const mode = getAppMode();
  const root = createRoot(container);

  // Render appropriate app based on mode
  const AppComponent = mode === 'city' ? CityBuilderApp : BlazecraftApp;

  root.render(
    createElement(StrictMode, null,
      createElement(AppComponent)
    )
  );

  console.log(`[BlazeCraft] Running in ${mode.toUpperCase()} mode`);
}

// Initialize on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap);
} else {
  bootstrap();
}

// ─────────────────────────────────────────────────────────────
// Version Info
// ─────────────────────────────────────────────────────────────

console.log(
  `%c⚔️ Blazecraft v${__APP_VERSION__}`,
  'color: #BF5700; font-weight: bold; font-size: 14px;'
);
console.log(
  '%cRTS Agent Visualization & Analysis',
  'color: #888; font-size: 11px;'
);
