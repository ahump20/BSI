/**
 * Blaze Backyard Baseball - Main Entry Point
 *
 * A 30-90 second batting microgame for BlazeSportsIntel.com
 * 100% Original IP - No Humongous Entertainment content
 */

import { BackyardGameEngine, type GameResult, type BackyardGameState, HitType } from '@core/BackyardGameEngine';
import {
  STARTER_CHARACTERS,
  UNLOCKABLE_CHARACTERS,
  SECRET_CHARACTERS,
  getAllCharacters,
  isCharacterUnlocked,
  type BackyardCharacter,
} from '@data/backyardCharacters';
import {
  STARTER_FIELDS,
  getAllFields,
  isFieldUnlocked,
  getDefaultField,
  type BackyardFieldConfig,
} from '@data/backyardField';

// DOM Elements
const canvas = document.getElementById('renderCanvas') as HTMLCanvasElement;
const menuScreen = document.getElementById('menuScreen') as HTMLDivElement;
const gameUI = document.getElementById('gameUI') as HTMLDivElement;
const gameOverScreen = document.getElementById('gameOverScreen') as HTMLDivElement;

// UI Elements
const scoreDisplay = document.getElementById('score') as HTMLSpanElement;
const outsDisplay = document.getElementById('outs') as HTMLSpanElement;
const streakDisplay = document.getElementById('streak') as HTMLSpanElement;
const multiplierDisplay = document.getElementById('multiplier') as HTMLSpanElement;
const timerDisplay = document.getElementById('timer') as HTMLSpanElement;
const hitFeedback = document.getElementById('hitFeedback') as HTMLDivElement;

// Name/Share Elements
const playerNameInput = document.getElementById('playerNameInput') as HTMLInputElement;
const saveNameBtn = document.getElementById('saveNameBtn') as HTMLButtonElement;
const shareXBtn = document.getElementById('shareXBtn') as HTMLAnchorElement;
const copyLinkBtn = document.getElementById('copyLinkBtn') as HTMLButtonElement;

// Store last game result for sharing
let lastGameResult: GameResult | null = null;

// Game state
let gameEngine: BackyardGameEngine | null = null;
let selectedCharacter: BackyardCharacter = STARTER_CHARACTERS[0];
let selectedField: BackyardFieldConfig = getDefaultField();

// Player stats (loaded from localStorage or API)
interface PlayerStats {
  playerId: string;
  playerName: string;
  highScore: number;
  gamesPlayed: number;
  totalHomeRuns: number;
  longestStreak: number;
  unlockedCharacters: string[];
  unlockedFields: string[];
}

let playerStats: PlayerStats = loadPlayerStats();

/** Load player stats from localStorage */
function loadPlayerStats(): PlayerStats {
  const stored = localStorage.getItem('blazeBackyardStats');
  if (stored) {
    return JSON.parse(stored);
  }

  // Initialize new player
  const playerId = `player_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  const stats: PlayerStats = {
    playerId,
    playerName: '',
    highScore: 0,
    gamesPlayed: 0,
    totalHomeRuns: 0,
    longestStreak: 0,
    unlockedCharacters: STARTER_CHARACTERS.map((c) => c.id),
    unlockedFields: STARTER_FIELDS.map((f) => f.id),
  };

  localStorage.setItem('blazeBackyardStats', JSON.stringify(stats));
  return stats;
}

/** Save player stats to localStorage */
function savePlayerStats(): void {
  localStorage.setItem('blazeBackyardStats', JSON.stringify(playerStats));
}

/** Initialize the menu screen */
function initializeMenu(): void {
  // Hide game UI and game over screen
  gameUI.style.display = 'none';
  gameOverScreen.style.display = 'none';
  canvas.style.display = 'none';
  menuScreen.style.display = 'flex';

  // Render character selection
  renderCharacterSelection();

  // Render field selection
  renderFieldSelection();

  // Setup play button
  const playButton = document.getElementById('playButton');
  if (playButton) {
    playButton.onclick = startGame;
  }

  // Display high score
  const highScoreDisplay = document.getElementById('highScore');
  if (highScoreDisplay) {
    highScoreDisplay.textContent = playerStats.highScore.toLocaleString();
  }
}

/** Render character selection grid */
function renderCharacterSelection(): void {
  const container = document.getElementById('characterSelect');
  if (!container) return;

  container.innerHTML = '';

  const allCharacters = getAllCharacters();
  allCharacters.forEach((character) => {
    const isUnlocked = isCharacterUnlocked(character, playerStats);
    const isSelected = selectedCharacter.id === character.id;

    const card = document.createElement('div');
    card.className = `character-card ${isSelected ? 'selected' : ''} ${!isUnlocked ? 'locked' : ''}`;
    card.innerHTML = `
      <div class="character-avatar" style="background-color: ${character.uniformColor}">
        ${isUnlocked ? character.name.charAt(0) : '?'}
      </div>
      <div class="character-name">${isUnlocked ? character.nickname : 'Locked'}</div>
      <div class="character-stats">
        ${isUnlocked ? `PWR: ${character.power} | CON: ${character.contact}` : `Unlock: ${getUnlockHint(character)}`}
      </div>
    `;

    if (isUnlocked) {
      card.onclick = () => {
        selectedCharacter = character;
        renderCharacterSelection();
      };
    }

    container.appendChild(card);
  });
}

/** Get unlock hint text for locked characters */
function getUnlockHint(character: BackyardCharacter): string {
  const req = character.unlockRequirement;
  if (!req) return 'Available';

  switch (req.type) {
    case 'score':
      return `Score ${req.value.toLocaleString()}`;
    case 'games':
      return `Play ${req.value} games`;
    case 'homeRuns':
      return `Hit ${req.value} HRs`;
    case 'streak':
      return `${req.value} hit streak`;
    default:
      return 'Available';
  }
}

/** Render field selection */
function renderFieldSelection(): void {
  const container = document.getElementById('fieldSelect');
  if (!container) return;

  container.innerHTML = '';

  const allFields = getAllFields();
  allFields.forEach((field) => {
    const isUnlocked = isFieldUnlocked(field, playerStats);
    const isSelected = selectedField.id === field.id;

    const card = document.createElement('div');
    card.className = `field-card ${isSelected ? 'selected' : ''} ${!isUnlocked ? 'locked' : ''}`;
    card.innerHTML = `
      <div class="field-preview" style="background-color: ${field.visuals.grassColor}">
        <div class="field-name">${isUnlocked ? field.name : 'Locked'}</div>
      </div>
      <div class="field-description">
        ${isUnlocked ? field.description : getFieldUnlockHint(field)}
      </div>
    `;

    if (isUnlocked) {
      card.onclick = () => {
        selectedField = field;
        renderFieldSelection();
      };
    }

    container.appendChild(card);
  });
}

/** Get unlock hint for locked fields */
function getFieldUnlockHint(field: BackyardFieldConfig): string {
  const req = field.unlockRequirement;
  if (!req) return 'Available';

  switch (req.type) {
    case 'score':
      return `Score ${req.value.toLocaleString()} to unlock`;
    case 'games':
      return `Play ${req.value} games to unlock`;
    case 'homeRuns':
      return `Hit ${req.value} home runs to unlock`;
    default:
      return 'Available';
  }
}

/** Start the game */
async function startGame(): Promise<void> {
  // Show loading state
  const playButton = document.getElementById('playButton');
  if (playButton) {
    playButton.textContent = 'Loading...';
    (playButton as HTMLButtonElement).disabled = true;
  }

  try {
    // Hide menu, show game
    menuScreen.style.display = 'none';
    canvas.style.display = 'block';
    gameUI.style.display = 'flex';

    // Create game engine
    gameEngine = await BackyardGameEngine.create({
      canvas,
      character: selectedCharacter,
      fieldConfig: selectedField,
      onGameStateChange: handleGameStateChange,
      onGameOver: handleGameOver,
    });

    // Unlock audio (requires user interaction - we have it from button click)
    await gameEngine.unlockAudio();

    // Start the game
    gameEngine.startGame();
  } catch (error) {
    console.error('Failed to start game:', error);
    alert('Failed to start game. Please refresh and try again.');
    initializeMenu();
  }
}

/** Handle game state updates */
function handleGameStateChange(state: BackyardGameState): void {
  // Update score
  if (scoreDisplay) {
    scoreDisplay.textContent = state.score.toLocaleString();
  }

  // Update outs
  if (outsDisplay) {
    outsDisplay.textContent = `${state.outs}/3`;
  }

  // Update streak
  if (streakDisplay) {
    streakDisplay.textContent = state.streak.toString();
  }

  // Update multiplier
  if (multiplierDisplay) {
    multiplierDisplay.textContent = `${state.multiplier.toFixed(1)}x`;
    multiplierDisplay.className = state.multiplier > 1 ? 'multiplier-active' : '';
  }

  // Update timer
  if (timerDisplay) {
    const seconds = Math.ceil(state.timeRemaining / 1000);
    timerDisplay.textContent = seconds.toString();
    timerDisplay.className = seconds <= 10 ? 'timer-warning' : '';
  }

  // Show hit feedback
  if (state.lastHitType) {
    showHitFeedback(state.lastHitType, state.multiplier);
  }
}

/** Show hit feedback popup */
function showHitFeedback(hitType: HitType, multiplier: number): void {
  if (!hitFeedback) return;

  let text: string;
  let className: string;

  switch (hitType) {
    case HitType.WHIFF:
      text = 'WHIFF!';
      className = 'feedback-whiff';
      break;
    case HitType.GROUNDER:
      text = 'Ground Out';
      className = 'feedback-out';
      break;
    case HitType.SINGLE:
      text = `SINGLE! +${Math.floor(100 * multiplier)}`;
      className = 'feedback-single';
      break;
    case HitType.DOUBLE:
      text = `DOUBLE! +${Math.floor(200 * multiplier)}`;
      className = 'feedback-double';
      break;
    case HitType.TRIPLE:
      text = `TRIPLE! +${Math.floor(350 * multiplier)}`;
      className = 'feedback-triple';
      break;
    case HitType.HOME_RUN:
      text = `HOME RUN! +${Math.floor(500 * multiplier)}`;
      className = 'feedback-homerun';
      break;
    default:
      return;
  }

  hitFeedback.textContent = text;
  hitFeedback.className = `hit-feedback ${className} show`;

  // Hide after animation
  setTimeout(() => {
    hitFeedback.className = 'hit-feedback';
  }, 1000);
}

/** Handle game over */
async function handleGameOver(result: GameResult): Promise<void> {
  // Store result for sharing
  lastGameResult = result;

  // Hide game UI
  gameUI.style.display = 'none';

  // Update player stats
  playerStats.gamesPlayed++;
  playerStats.totalHomeRuns += result.homeRuns;

  if (result.finalScore > playerStats.highScore) {
    playerStats.highScore = result.finalScore;
  }

  if (result.longestStreak > playerStats.longestStreak) {
    playerStats.longestStreak = result.longestStreak;
  }

  // Check for newly unlocked content
  const newlyUnlockedCharacters = checkNewUnlocks();

  // Save stats locally
  savePlayerStats();

  // Submit score to API
  try {
    await submitScore(result);
  } catch (error) {
    console.error('Failed to submit score:', error);
  }

  // Show game over screen
  showGameOverScreen(result, newlyUnlockedCharacters);
}

/** Check for newly unlocked characters/fields */
function checkNewUnlocks(): string[] {
  const newUnlocks: string[] = [];

  // Check characters
  getAllCharacters().forEach((character) => {
    if (
      !playerStats.unlockedCharacters.includes(character.id) &&
      isCharacterUnlocked(character, playerStats)
    ) {
      playerStats.unlockedCharacters.push(character.id);
      newUnlocks.push(`Character: ${character.name}`);
    }
  });

  // Check fields
  getAllFields().forEach((field) => {
    if (
      !playerStats.unlockedFields.includes(field.id) &&
      isFieldUnlocked(field, playerStats)
    ) {
      playerStats.unlockedFields.push(field.id);
      newUnlocks.push(`Field: ${field.name}`);
    }
  });

  return newUnlocks;
}

/** Submit score to API */
async function submitScore(result: GameResult): Promise<void> {
  const response = await fetch('/api/backyard/submit-score', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      playerId: playerStats.playerId,
      playerName: playerStats.playerName || undefined,
      score: result.finalScore,
      characterId: result.characterId,
      stats: {
        totalPitches: result.totalPitches,
        totalHits: result.totalHits,
        singles: result.singles,
        doubles: result.doubles,
        triples: result.triples,
        homeRuns: result.homeRuns,
        whiffs: result.whiffs,
        longestStreak: result.longestStreak,
        durationSeconds: result.durationSeconds,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to submit score: ${response.statusText}`);
  }
}

/** Show game over screen */
function showGameOverScreen(result: GameResult, newUnlocks: string[]): void {
  gameOverScreen.style.display = 'flex';

  // Update final score
  const finalScoreEl = document.getElementById('finalScore');
  if (finalScoreEl) {
    finalScoreEl.textContent = result.finalScore.toLocaleString();
  }

  // Update stats
  const statsEl = document.getElementById('gameStats');
  if (statsEl) {
    statsEl.innerHTML = `
      <div class="stat-row">
        <span>Hits:</span>
        <span>${result.totalHits}</span>
      </div>
      <div class="stat-row">
        <span>Home Runs:</span>
        <span>${result.homeRuns}</span>
      </div>
      <div class="stat-row">
        <span>Longest Streak:</span>
        <span>${result.longestStreak}</span>
      </div>
      <div class="stat-row">
        <span>High Score:</span>
        <span>${playerStats.highScore.toLocaleString()}</span>
      </div>
    `;
  }

  // Show new unlocks
  const unlocksEl = document.getElementById('newUnlocks');
  if (unlocksEl) {
    if (newUnlocks.length > 0) {
      unlocksEl.innerHTML = `
        <div class="unlocks-title">NEW UNLOCKS!</div>
        ${newUnlocks.map((u) => `<div class="unlock-item">${u}</div>`).join('')}
      `;
      unlocksEl.style.display = 'block';
    } else {
      unlocksEl.style.display = 'none';
    }
  }

  // Setup buttons
  const playAgainButton = document.getElementById('playAgainButton');
  if (playAgainButton) {
    playAgainButton.onclick = () => {
      gameOverScreen.style.display = 'none';
      if (gameEngine) {
        gameEngine.dispose();
        gameEngine = null;
      }
      startGame();
    };
  }

  const menuButton = document.getElementById('menuButton');
  if (menuButton) {
    menuButton.onclick = () => {
      gameOverScreen.style.display = 'none';
      if (gameEngine) {
        gameEngine.dispose();
        gameEngine = null;
      }
      initializeMenu();
    };
  }

  // Set up X/Twitter share link
  const shareText = `Just scored ${result.finalScore.toLocaleString()} points in Blaze Backyard Baseball! ⚾ ${result.homeRuns} home runs, ${result.longestStreak} hit streak. Can you beat my score?`;
  const shareUrl = 'https://blaze-backyard-baseball.pages.dev';
  shareXBtn.href = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;

  // Pre-fill name input if saved
  if (playerStats.playerName) {
    playerNameInput.value = playerStats.playerName;
  }

  // Fetch and display leaderboard
  fetchLeaderboard();
}

/** Handle saving player name */
async function handleSaveName(): Promise<void> {
  const name = playerNameInput.value.trim();
  if (!name) return;

  // Save locally
  playerStats.playerName = name;
  savePlayerStats();

  // Update on server
  try {
    saveNameBtn.textContent = 'Saving...';
    saveNameBtn.disabled = true;

    await fetch('/api/backyard/submit-score', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        playerId: playerStats.playerId,
        playerName: name,
        score: lastGameResult?.finalScore || 0,
        characterId: lastGameResult?.characterId || selectedCharacter.id,
        stats: {
          totalPitches: lastGameResult?.totalPitches || 0,
          totalHits: lastGameResult?.totalHits || 0,
          singles: lastGameResult?.singles || 0,
          doubles: lastGameResult?.doubles || 0,
          triples: lastGameResult?.triples || 0,
          homeRuns: lastGameResult?.homeRuns || 0,
          whiffs: lastGameResult?.whiffs || 0,
          longestStreak: lastGameResult?.longestStreak || 0,
          durationSeconds: lastGameResult?.durationSeconds || 0,
        },
      }),
    });

    saveNameBtn.textContent = 'Saved!';

    // Refresh leaderboard
    await fetchLeaderboard();
  } catch (error) {
    console.error('Failed to save name:', error);
    saveNameBtn.textContent = 'Error';
  } finally {
    setTimeout(() => {
      saveNameBtn.textContent = 'Save Name';
      saveNameBtn.disabled = false;
    }, 2000);
  }
}

/** Handle copying share link */
function handleCopyLink(): void {
  const score = lastGameResult?.finalScore || 0;
  const shareUrl = `https://blaze-backyard-baseball.pages.dev?ref=share&score=${score}`;

  navigator.clipboard.writeText(shareUrl).then(() => {
    copyLinkBtn.classList.add('copied');
    copyLinkBtn.innerHTML = '<span>✓</span> Copied!';

    setTimeout(() => {
      copyLinkBtn.classList.remove('copied');
      copyLinkBtn.innerHTML = '<span>📋</span> Copy Link';
    }, 2000);
  }).catch(() => {
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = shareUrl;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);

    copyLinkBtn.classList.add('copied');
    copyLinkBtn.innerHTML = '<span>✓</span> Copied!';

    setTimeout(() => {
      copyLinkBtn.classList.remove('copied');
      copyLinkBtn.innerHTML = '<span>📋</span> Copy Link';
    }, 2000);
  });
}

/** Fetch and display leaderboard */
async function fetchLeaderboard(): Promise<void> {
  const leaderboardEl = document.getElementById('leaderboard');
  if (!leaderboardEl) return;

  try {
    const response = await fetch('/api/backyard/leaderboard?limit=10');
    if (!response.ok) throw new Error('Failed to fetch leaderboard');

    const data = (await response.json()) as { entries?: Array<{ playerId: string; playerName: string; score: number }> };
    const entries = data.entries || [];

    leaderboardEl.innerHTML = `
      <div class="leaderboard-title">TOP SCORES</div>
      ${entries
        .map(
          (entry: any, index: number) => `
        <div class="leaderboard-entry ${entry.playerId === playerStats.playerId ? 'current-player' : ''}">
          <span class="rank">#${index + 1}</span>
          <span class="player">${entry.playerName || 'Anonymous'}</span>
          <span class="score">${entry.score.toLocaleString()}</span>
        </div>
      `
        )
        .join('')}
    `;
  } catch (error) {
    console.error('Failed to fetch leaderboard:', error);
    leaderboardEl.innerHTML = '<div class="leaderboard-error">Leaderboard unavailable</div>';
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  initializeMenu();

  // Setup name/share event listeners
  if (saveNameBtn) {
    saveNameBtn.addEventListener('click', handleSaveName);
  }
  if (copyLinkBtn) {
    copyLinkBtn.addEventListener('click', handleCopyLink);
  }
});

// Handle visibility change (pause when tab is hidden)
document.addEventListener('visibilitychange', () => {
  if (document.hidden && gameEngine) {
    // Could pause the game here in future
  }
});
