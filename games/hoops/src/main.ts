/**
 * Blaze Hoops Shootout - Main Entry Point
 *
 * A 60-second 3-point shootout microgame for BlazeSportsIntel.com
 */

import { HoopsGameEngine, HoopsGameState, HoopsGameResult } from '@core/HoopsGameEngine';
import {
  getAllShooters,
  isShooterUnlocked,
  getDefaultShooter,
  HoopsShooter,
} from '@data/shooters';

/** Player ID management */
function getPlayerId(): string {
  let playerId = localStorage.getItem('hoops_player_id');
  if (!playerId) {
    playerId = `player_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    localStorage.setItem('hoops_player_id', playerId);
  }
  return playerId;
}

function getHighScore(): number {
  return parseInt(localStorage.getItem('hoops_high_score') || '0', 10);
}

function saveHighScore(score: number): void {
  const current = getHighScore();
  if (score > current) {
    localStorage.setItem('hoops_high_score', score.toString());
  }
}

function getPlayerName(): string {
  return localStorage.getItem('hoops_player_name') || '';
}

function savePlayerName(name: string): void {
  localStorage.setItem('hoops_player_name', name);
}

function getPlayerStats(): { highScore: number; gamesPlayed: number; totalThrees: number } {
  return {
    highScore: getHighScore(),
    gamesPlayed: parseInt(localStorage.getItem('hoops_games_played') || '0', 10),
    totalThrees: parseInt(localStorage.getItem('hoops_total_threes') || '0', 10),
  };
}

function updatePlayerStats(madeShots: number): void {
  const gamesPlayed = parseInt(localStorage.getItem('hoops_games_played') || '0', 10) + 1;
  const totalThrees = parseInt(localStorage.getItem('hoops_total_threes') || '0', 10) + madeShots;
  localStorage.setItem('hoops_games_played', gamesPlayed.toString());
  localStorage.setItem('hoops_total_threes', totalThrees.toString());
}

/** Store last game result for sharing */
let lastGameResult: HoopsGameResult | null = null;

/** UI Elements */
const elements = {
  loadingScreen: document.getElementById('loadingScreen')!,
  menuScreen: document.getElementById('menuScreen')!,
  renderCanvas: document.getElementById('renderCanvas') as HTMLCanvasElement,
  gameUI: document.getElementById('gameUI')!,
  gameOverScreen: document.getElementById('gameOverScreen')!,

  // Menu
  highScore: document.getElementById('highScore')!,
  shooterSelect: document.getElementById('shooterSelect')!,
  playButton: document.getElementById('playButton')!,

  // Game UI
  score: document.getElementById('score')!,
  timer: document.getElementById('timer')!,
  made: document.getElementById('made')!,
  streak: document.getElementById('streak')!,
  rack: document.getElementById('rack')!,

  // Game Over
  finalScore: document.getElementById('finalScore')!,
  gameStats: document.getElementById('gameStats')!,
  leaderboard: document.getElementById('leaderboard')!,
  playAgainButton: document.getElementById('playAgainButton')!,
  menuButton: document.getElementById('menuButton')!,

  // Name/Share
  playerNameInput: document.getElementById('playerNameInput') as HTMLInputElement,
  saveNameBtn: document.getElementById('saveNameBtn')!,
  shareXBtn: document.getElementById('shareXBtn') as HTMLAnchorElement,
  copyLinkBtn: document.getElementById('copyLinkBtn')!,
};

/** Game state */
let gameEngine: HoopsGameEngine | null = null;
let selectedShooter: HoopsShooter = getDefaultShooter();

/** Initialize the application */
async function init(): Promise<void> {
  elements.highScore.textContent = getHighScore().toLocaleString();
  populateShooterSelect();
  setupEventListeners();

  elements.loadingScreen.style.display = 'none';
  elements.menuScreen.style.display = 'flex';
}

/** Populate shooter selection */
function populateShooterSelect(): void {
  const stats = getPlayerStats();
  const shooters = getAllShooters();

  shooters.forEach((shooter) => {
    const isUnlocked = isShooterUnlocked(shooter, stats);
    const isSelected = selectedShooter.id === shooter.id;

    const card = document.createElement('div');
    card.className = `shooter-card${isSelected ? ' selected' : ''}${!isUnlocked ? ' locked' : ''}`;
    card.dataset.shooterId = shooter.id;

    card.innerHTML = `
      <div class="shooter-avatar" style="background-color: ${shooter.jerseyColor};">
        ${isUnlocked ? shooter.name.charAt(0) : '?'}
      </div>
      <div class="shooter-name">${isUnlocked ? shooter.nickname : 'Locked'}</div>
      <div class="shooter-stats">
        ${isUnlocked ? `ACC ${shooter.accuracy} | REL ${shooter.release}` : getUnlockHint(shooter)}
      </div>
    `;

    if (isUnlocked) {
      card.addEventListener('click', () => {
        document.querySelectorAll('.shooter-card').forEach((c) => c.classList.remove('selected'));
        card.classList.add('selected');
        selectedShooter = shooter;
      });
    }

    elements.shooterSelect.appendChild(card);
  });
}

function getUnlockHint(shooter: HoopsShooter): string {
  if (shooter.id === 'blaze_shooter_005') return 'Score 5000+';
  if (shooter.id === 'blaze_shooter_006') return 'Hit 100 threes';
  return 'Play more!';
}

/** Setup event listeners */
function setupEventListeners(): void {
  elements.playButton.addEventListener('click', startGame);
  elements.playAgainButton.addEventListener('click', startGame);
  elements.menuButton.addEventListener('click', showMenu);
  elements.saveNameBtn.addEventListener('click', handleSaveName);
  elements.copyLinkBtn.addEventListener('click', handleCopyLink);

  const savedName = getPlayerName();
  if (savedName) {
    elements.playerNameInput.value = savedName;
  }
}

/** Handle saving player name */
async function handleSaveName(): Promise<void> {
  const name = elements.playerNameInput.value.trim();
  if (!name) return;

  savePlayerName(name);

  try {
    elements.saveNameBtn.textContent = 'Saving...';
    elements.saveNameBtn.setAttribute('disabled', 'true');

    await fetch('/api/hoops/submit-score', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        playerId: getPlayerId(),
        playerName: name,
        score: lastGameResult?.finalScore || 0,
        shooterId: lastGameResult?.shooterId || selectedShooter.id,
        stats: {
          shotsMade: lastGameResult?.shotsMade || 0,
          shotsAttempted: lastGameResult?.shotsAttempted || 0,
          shootingPercentage: lastGameResult?.shootingPercentage || 0,
          longestStreak: lastGameResult?.longestStreak || 0,
          swishes: lastGameResult?.swishes || 0,
          moneyBallsMade: lastGameResult?.moneyBallsMade || 0,
          durationSeconds: lastGameResult?.durationSeconds || 0,
        },
      }),
    });

    elements.saveNameBtn.textContent = 'Saved!';
    await fetchLeaderboard();
  } catch (error) {
    console.error('Failed to save name:', error);
    elements.saveNameBtn.textContent = 'Error';
  } finally {
    setTimeout(() => {
      elements.saveNameBtn.textContent = 'Save Name';
      elements.saveNameBtn.removeAttribute('disabled');
    }, 2000);
  }
}

/** Handle copying share link */
function handleCopyLink(): void {
  const score = lastGameResult?.finalScore || 0;
  const shareUrl = `https://blaze-hoops-shootout.pages.dev?ref=share&score=${score}`;

  navigator.clipboard.writeText(shareUrl).then(() => {
    elements.copyLinkBtn.classList.add('copied');
    elements.copyLinkBtn.innerHTML = '<span>✓</span> Copied!';

    setTimeout(() => {
      elements.copyLinkBtn.classList.remove('copied');
      elements.copyLinkBtn.innerHTML = '<span>📋</span> Copy Link';
    }, 2000);
  }).catch(() => {
    const textArea = document.createElement('textarea');
    textArea.value = shareUrl;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);

    elements.copyLinkBtn.classList.add('copied');
    elements.copyLinkBtn.innerHTML = '<span>✓</span> Copied!';

    setTimeout(() => {
      elements.copyLinkBtn.classList.remove('copied');
      elements.copyLinkBtn.innerHTML = '<span>📋</span> Copy Link';
    }, 2000);
  });
}

/** Start the game */
async function startGame(): Promise<void> {
  elements.menuScreen.style.display = 'none';
  elements.gameOverScreen.style.display = 'none';

  elements.renderCanvas.style.display = 'block';
  elements.gameUI.style.display = 'flex';

  if (gameEngine) {
    gameEngine.dispose();
  }

  gameEngine = await HoopsGameEngine.create({
    canvas: elements.renderCanvas,
    shooter: selectedShooter,
    onGameStateChange: handleGameStateChange,
    onGameOver: handleGameOver,
  });

  await gameEngine.unlockAudio();
  gameEngine.startGame();
}

/** Handle game state changes */
function handleGameStateChange(state: HoopsGameState): void {
  elements.score.textContent = state.score.toLocaleString();

  const seconds = Math.ceil(state.timeRemaining / 1000);
  elements.timer.textContent = seconds.toString();
  elements.timer.classList.toggle('timer-warning', seconds <= 10);

  elements.made.textContent = `${state.shotsMade}/${state.shotsAttempted}`;
  elements.streak.textContent = state.streak.toString();
  elements.rack.textContent = `${state.currentRack}/5`;
}

/** Handle game over */
async function handleGameOver(result: HoopsGameResult): Promise<void> {
  lastGameResult = result;

  elements.gameUI.style.display = 'none';
  elements.renderCanvas.style.display = 'none';

  saveHighScore(result.finalScore);
  updatePlayerStats(result.shotsMade);
  elements.highScore.textContent = getHighScore().toLocaleString();

  elements.finalScore.textContent = result.finalScore.toLocaleString();
  elements.gameStats.innerHTML = `
    <div class="stat-row">
      <span>Shots Made</span>
      <span>${result.shotsMade}/${result.shotsAttempted}</span>
    </div>
    <div class="stat-row">
      <span>Shooting %</span>
      <span>${result.shootingPercentage}%</span>
    </div>
    <div class="stat-row">
      <span>Longest Streak</span>
      <span>${result.longestStreak}</span>
    </div>
    <div class="stat-row">
      <span>Swishes</span>
      <span>${result.swishes}</span>
    </div>
    <div class="stat-row">
      <span>Money Balls</span>
      <span>${result.moneyBallsMade}</span>
    </div>
  `;

  // Submit score
  try {
    await fetch('/api/hoops/submit-score', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        playerId: getPlayerId(),
        playerName: getPlayerName() || undefined,
        score: result.finalScore,
        shooterId: result.shooterId,
        stats: {
          shotsMade: result.shotsMade,
          shotsAttempted: result.shotsAttempted,
          shootingPercentage: result.shootingPercentage,
          longestStreak: result.longestStreak,
          swishes: result.swishes,
          moneyBallsMade: result.moneyBallsMade,
          durationSeconds: result.durationSeconds,
        },
      }),
    });
  } catch (error) {
    console.error('Failed to submit score:', error);
  }

  await fetchLeaderboard();

  // Set up share link
  const shareText = `Just scored ${result.finalScore.toLocaleString()} points in Blaze Hoops Shootout! 🏀 ${result.shotsMade}/${result.shotsAttempted} from three, ${result.longestStreak} streak. Can you beat my score?`;
  const shareUrl = 'https://blaze-hoops-shootout.pages.dev';
  elements.shareXBtn.href = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;

  const savedName = getPlayerName();
  if (savedName) {
    elements.playerNameInput.value = savedName;
  }

  elements.gameOverScreen.style.display = 'flex';
}

/** Fetch leaderboard */
async function fetchLeaderboard(): Promise<void> {
  try {
    const response = await fetch('/api/hoops/leaderboard?limit=5');
    const data = (await response.json()) as { success: boolean; entries?: Array<{ rank: number; playerName: string; score: number }> };

    if (data.success && data.entries) {
      elements.leaderboard.innerHTML = `
        <div class="leaderboard-title">Top Scores</div>
        ${data.entries.map((entry) => `
          <div class="leaderboard-entry">
            <span class="rank">#${entry.rank}</span>
            <span class="player">${entry.playerName || 'Anonymous'}</span>
            <span class="lb-score">${entry.score.toLocaleString()}</span>
          </div>
        `).join('')}
      `;
    }
  } catch (error) {
    console.error('Failed to fetch leaderboard:', error);
    elements.leaderboard.innerHTML = '<div>Leaderboard unavailable</div>';
  }
}

/** Show menu */
function showMenu(): void {
  if (gameEngine) {
    gameEngine.dispose();
    gameEngine = null;
  }

  elements.gameOverScreen.style.display = 'none';
  elements.menuScreen.style.display = 'flex';
}

// Start the app
init().catch(console.error);
