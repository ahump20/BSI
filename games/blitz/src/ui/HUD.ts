/**
 * Blaze Blitz Football - Arcade HUD
 *
 * Full-screen overlay with:
 * - Score and time display
 * - Down and distance indicator
 * - Power-up status
 * - Turbo meter
 * - Play result announcements
 * - Big play animations
 */

import type { BlitzGameState } from '../core/BlitzGameEngine';
import type { PowerUpType, ActivePowerUp } from '../core/PowerUps';

/** HUD element references */
interface HUDElements {
  container: HTMLDivElement;
  score: HTMLDivElement;
  time: HTMLDivElement;
  downDistance: HTMLDivElement;
  yardsToGo: HTMLDivElement;
  turboMeter: HTMLDivElement;
  turboFill: HTMLDivElement;
  powerUps: HTMLDivElement;
  announcement: HTMLDivElement;
  playBook: HTMLDivElement;
}

/** Create arcade HUD */
export function createHUD(container: HTMLElement): HUDElements {
  // Main HUD container
  const hudContainer = document.createElement('div');
  hudContainer.id = 'blitz-hud';
  hudContainer.style.cssText = `
    position: absolute;
    inset: 0;
    pointer-events: none;
    font-family: 'Impact', 'Arial Black', sans-serif;
    color: white;
    text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
    z-index: 100;
  `;

  // Top bar (score and time)
  const topBar = document.createElement('div');
  topBar.style.cssText = `
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 60px;
    background: linear-gradient(to bottom, rgba(0,0,0,0.8), transparent);
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 20px;
  `;

  // Score display
  const score = document.createElement('div');
  score.id = 'hud-score';
  score.style.cssText = `
    font-size: 36px;
    color: #FFD700;
    letter-spacing: 2px;
  `;
  score.innerHTML = '<span style="font-size: 20px; color: #aaa;">SCORE</span> 0';

  // Time display
  const time = document.createElement('div');
  time.id = 'hud-time';
  time.style.cssText = `
    font-size: 32px;
    color: #ff4444;
    font-variant-numeric: tabular-nums;
  `;
  time.textContent = '1:00';

  topBar.appendChild(score);
  topBar.appendChild(time);
  hudContainer.appendChild(topBar);

  // Down and distance (bottom left)
  const downDistance = document.createElement('div');
  downDistance.id = 'hud-down';
  downDistance.style.cssText = `
    position: absolute;
    bottom: 80px;
    left: 20px;
    font-size: 24px;
    background: rgba(0,0,0,0.7);
    padding: 10px 20px;
    border-radius: 8px;
    border-left: 4px solid #BF5700;
  `;
  downDistance.textContent = '1st & 10';
  hudContainer.appendChild(downDistance);

  // Yards to go marker
  const yardsToGo = document.createElement('div');
  yardsToGo.id = 'hud-yards';
  yardsToGo.style.cssText = `
    position: absolute;
    bottom: 80px;
    left: 160px;
    font-size: 18px;
    color: #aaa;
  `;
  yardsToGo.textContent = 'Own 20';
  hudContainer.appendChild(yardsToGo);

  // Turbo meter (bottom right)
  const turboContainer = document.createElement('div');
  turboContainer.style.cssText = `
    position: absolute;
    bottom: 80px;
    right: 20px;
    width: 150px;
  `;

  const turboLabel = document.createElement('div');
  turboLabel.style.cssText = `
    font-size: 14px;
    color: #aaa;
    text-align: right;
    margin-bottom: 4px;
  `;
  turboLabel.textContent = 'TURBO';

  const turboMeter = document.createElement('div');
  turboMeter.id = 'hud-turbo';
  turboMeter.style.cssText = `
    width: 100%;
    height: 16px;
    background: rgba(0,0,0,0.7);
    border-radius: 8px;
    overflow: hidden;
    border: 2px solid #333;
  `;

  const turboFill = document.createElement('div');
  turboFill.id = 'hud-turbo-fill';
  turboFill.style.cssText = `
    height: 100%;
    width: 100%;
    background: linear-gradient(90deg, #FF6B35, #FFD700);
    transition: width 0.1s ease;
    box-shadow: 0 0 10px #FF6B35;
  `;

  turboMeter.appendChild(turboFill);
  turboContainer.appendChild(turboLabel);
  turboContainer.appendChild(turboMeter);
  hudContainer.appendChild(turboContainer);

  // Power-up display (right side)
  const powerUps = document.createElement('div');
  powerUps.id = 'hud-powerups';
  powerUps.style.cssText = `
    position: absolute;
    right: 20px;
    top: 80px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  `;
  hudContainer.appendChild(powerUps);

  // Announcement overlay (center)
  const announcement = document.createElement('div');
  announcement.id = 'hud-announcement';
  announcement.style.cssText = `
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 48px;
    text-align: center;
    opacity: 0;
    transition: opacity 0.3s ease;
    text-transform: uppercase;
    letter-spacing: 4px;
  `;
  hudContainer.appendChild(announcement);

  // Play book (pre-snap)
  const playBook = document.createElement('div');
  playBook.id = 'hud-playbook';
  playBook.style.cssText = `
    position: absolute;
    bottom: 120px;
    left: 50%;
    transform: translateX(-50%);
    display: none;
    background: rgba(0,0,0,0.85);
    padding: 15px 25px;
    border-radius: 12px;
    border: 2px solid #BF5700;
    pointer-events: auto;
  `;
  hudContainer.appendChild(playBook);

  container.appendChild(hudContainer);

  return {
    container: hudContainer,
    score,
    time,
    downDistance,
    yardsToGo,
    turboMeter,
    turboFill,
    powerUps,
    announcement,
    playBook,
  };
}

/** Update HUD with game state */
export function updateHUD(elements: HUDElements, state: BlitzGameState): void {
  // Score
  elements.score.innerHTML = `<span style="font-size: 20px; color: #aaa;">SCORE</span> ${state.score.toLocaleString()}`;

  // Time
  const seconds = Math.ceil(state.timeRemaining / 1000);
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  elements.time.textContent = `${mins}:${secs.toString().padStart(2, '0')}`;

  // Flash time when low
  if (seconds <= 10) {
    elements.time.style.animation = 'pulse 0.5s infinite';
  } else {
    elements.time.style.animation = '';
  }

  // Down and distance
  const downNames = ['1st', '2nd', '3rd', '4th'];
  elements.downDistance.textContent = `${downNames[state.down - 1] || '4th'} & ${state.yardsToGo}`;

  // Yard line
  const yardLine = state.lineOfScrimmage;
  let yardText: string;
  if (yardLine <= 50) {
    yardText = `Own ${yardLine}`;
  } else {
    yardText = `OPP ${100 - yardLine}`;
  }
  elements.yardsToGo.textContent = yardText;
}

/** Update turbo meter */
export function updateTurboMeter(elements: HUDElements, percentage: number): void {
  elements.turboFill.style.width = `${Math.max(0, Math.min(100, percentage))}%`;

  // Color change based on level
  if (percentage < 20) {
    elements.turboFill.style.background = 'linear-gradient(90deg, #ff4444, #ff6666)';
  } else if (percentage < 50) {
    elements.turboFill.style.background = 'linear-gradient(90deg, #ffaa44, #ffcc44)';
  } else {
    elements.turboFill.style.background = 'linear-gradient(90deg, #FF6B35, #FFD700)';
  }
}

/** Show power-up indicator */
export function showPowerUp(elements: HUDElements, powerUp: ActivePowerUp): void {
  const powerUpEl = document.createElement('div');
  powerUpEl.id = `powerup-${powerUp.type}`;
  powerUpEl.style.cssText = `
    background: rgba(0,0,0,0.8);
    padding: 8px 12px;
    border-radius: 8px;
    font-size: 16px;
    display: flex;
    align-items: center;
    gap: 8px;
    border-left: 3px solid ${getPowerUpColor(powerUp.type)};
  `;

  const icon = document.createElement('span');
  icon.textContent = getPowerUpIcon(powerUp.type);

  const timer = document.createElement('span');
  timer.className = 'powerup-timer';
  timer.textContent = Math.ceil(powerUp.remaining / 1000) + 's';
  timer.style.color = getPowerUpColor(powerUp.type);

  powerUpEl.appendChild(icon);
  powerUpEl.appendChild(timer);
  elements.powerUps.appendChild(powerUpEl);
}

/** Update power-up timers */
export function updatePowerUps(elements: HUDElements, activePowerUps: ActivePowerUp[]): void {
  // Clear old
  elements.powerUps.innerHTML = '';

  // Add current
  activePowerUps.forEach((powerUp) => showPowerUp(elements, powerUp));
}

/** Get power-up icon */
function getPowerUpIcon(type: PowerUpType): string {
  const icons: Record<PowerUpType, string> = {
    speedBoost: '⚡',
    superArm: '💪',
    ironWill: '🛡️',
    magnetHands: '🧲',
    freezeDefense: '❄️',
  };
  return icons[type] || '?';
}

/** Get power-up color */
function getPowerUpColor(type: PowerUpType): string {
  const colors: Record<PowerUpType, string> = {
    speedBoost: '#00ccff',
    superArm: '#ff8800',
    ironWill: '#888888',
    magnetHands: '#ff00ff',
    freezeDefense: '#0088ff',
  };
  return colors[type] || '#ffffff';
}

/** Show announcement */
export function showAnnouncement(
  elements: HUDElements,
  text: string,
  color: string = '#FFD700',
  duration: number = 2000
): void {
  elements.announcement.textContent = text;
  elements.announcement.style.color = color;
  elements.announcement.style.opacity = '1';

  // Big play animation
  elements.announcement.style.transform = 'translate(-50%, -50%) scale(1.2)';
  setTimeout(() => {
    elements.announcement.style.transform = 'translate(-50%, -50%) scale(1)';
  }, 100);

  setTimeout(() => {
    elements.announcement.style.opacity = '0';
  }, duration);
}

/** Show specific announcements */
export function announceTouchdown(elements: HUDElements): void {
  showAnnouncement(elements, '🔥 TOUCHDOWN! 🔥', '#FFD700', 3000);
}

export function announceFirstDown(elements: HUDElements): void {
  showAnnouncement(elements, 'FIRST DOWN!', '#00ff00', 1500);
}

export function announceBigPlay(elements: HUDElements, yards: number): void {
  showAnnouncement(elements, `${yards} YARD GAIN!`, '#FF6B35', 2000);
}

export function announceTurnover(elements: HUDElements): void {
  showAnnouncement(elements, 'TURNOVER ON DOWNS', '#ff4444', 2500);
}

export function announceIncomplete(elements: HUDElements): void {
  showAnnouncement(elements, 'INCOMPLETE', '#aaaaaa', 1500);
}

export function announceTackle(elements: HUDElements): void {
  showAnnouncement(elements, 'TACKLED!', '#ff6666', 1000);
}

/** Hide HUD */
export function hideHUD(elements: HUDElements): void {
  elements.container.style.display = 'none';
}

/** Show HUD */
export function showHUD(elements: HUDElements): void {
  elements.container.style.display = 'block';
}

/** Dispose HUD */
export function disposeHUD(elements: HUDElements): void {
  elements.container.remove();
}

/** Add CSS animation for pulsing */
export function addHUDStyles(): void {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.6; transform: scale(1.1); }
    }

    #blitz-hud * {
      box-sizing: border-box;
    }
  `;
  document.head.appendChild(style);
}
