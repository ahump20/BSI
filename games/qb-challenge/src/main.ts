/**
 * Blaze QB Challenge - Main Entry Point
 *
 * A 60-second QB accuracy challenge microgame for BlazeSportsIntel.com
 */

import { QBGameEngine, QBGameState, QBGameResult } from '@core/QBGameEngine';
import { getAllQBs, isQBUnlocked, getDefaultQB, Quarterback } from '@data/quarterbacks';

/** Player ID management */
function getPlayerId(): string {
  let playerId = localStorage.getItem('qb_player_id');
  if (!playerId) {
    playerId = `player_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    localStorage.setItem('qb_player_id', playerId);
  }
  return playerId;
}

function getHighScore(): number {
  return parseInt(localStorage.getItem('qb_high_score') || '0', 10);
}

function saveHighScore(score: number): void {
  const current = getHighScore();
  if (score > current) {
    localStorage.setItem('qb_high_score', score.toString());
  }
}

function getPlayerName(): string {
  return localStorage.getItem('qb_player_name') || '';
}

function savePlayerName(name: string): void {
  localStorage.setItem('qb_player_name', name);
}

function getPlayerStats(): {
  highScore: number;
  gamesPlayed: number;
  totalCompletions: number;
} {
  return {
    highScore: getHighScore(),
    gamesPlayed: parseInt(localStorage.getItem('qb_games_played') || '0', 10),
    totalCompletions: parseInt(localStorage.getItem('qb_total_completions') || '0', 10),
  };
}

function updatePlayerStats(completions: number): void {
  const gamesPlayed = parseInt(localStorage.getItem('qb_games_played') || '0', 10) + 1;
  const totalCompletions =
    parseInt(localStorage.getItem('qb_total_completions') || '0', 10) + completions;
  localStorage.setItem('qb_games_played', gamesPlayed.toString());
  localStorage.setItem('qb_total_completions', totalCompletions.toString());
}

/** Store last game result for sharing */
let lastGameResult: QBGameResult | null = null;

/** UI Elements */
const elements = {
  loadingScreen: document.getElementById('loadingScreen')!,
  menuScreen: document.getElementById('menuScreen')!,
  renderCanvas: document.getElementById('renderCanvas') as HTMLCanvasElement,
  gameUI: document.getElementById('gameUI')!,
  gameOverScreen: document.getElementById('gameOverScreen')!,
  targetIndicator: document.getElementById('targetIndicator')!,

  // Menu
  highScore: document.getElementById('highScore')!,
  qbSelect: document.getElementById('qbSelect')!,
  playButton: document.getElementById('playButton')!,

  // Game UI
  score: document.getElementById('score')!,
  timer: document.getElementById('timer')!,
  completed: document.getElementById('completed')!,
  streak: document.getElementById('streak')!,
  targetName: document.getElementById('targetName')!,

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
let gameEngine: QBGameEngine | null = null;
let selectedQB: Quarterback = getDefaultQB();

/** Initialize the application */
async function init(): Promise<void> {
  elements.highScore.textContent = getHighScore().toLocaleString();
  populateQBSelect();
  setupEventListeners();

  elements.loadingScreen.style.display = 'none';
  elements.menuScreen.style.display = 'flex';
}

/** Populate QB selection */
function populateQBSelect(): void {
  const stats = getPlayerStats();
  const qbs = getAllQBs();

  qbs.forEach((qb) => {
    const isUnlocked = isQBUnlocked(qb, stats);
    const isSelected = selectedQB.id === qb.id;

    const card = document.createElement('div');
    card.className = `qb-card${isSelected ? ' selected' : ''}${!isUnlocked ? ' locked' : ''}`;
    card.dataset.qbId = qb.id;

    card.innerHTML = `
      <div class="qb-avatar" style="background-color: ${qb.jerseyColor};">
        ${isUnlocked ? qb.name.charAt(0) : '?'}
      </div>
      <div class="qb-name">${isUnlocked ? qb.nickname : 'Locked'}</div>
      <div class="qb-stats">
        ${isUnlocked ? `ACC ${qb.accuracy} | ARM ${qb.armStrength}` : getUnlockHint(qb)}
      </div>
    `;

    if (isUnlocked) {
      card.addEventListener('click', () => {
        document.querySelectorAll('.qb-card').forEach((c) => c.classList.remove('selected'));
        card.classList.add('selected');
        selectedQB = qb;
      });
    }

    elements.qbSelect.appendChild(card);
  });
}

function getUnlockHint(qb: Quarterback): string {
  if (qb.id === 'blaze_qb_005') return 'Score 5000+';
  if (qb.id === 'blaze_qb_006') return 'Complete 100';
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

    await fetch('/api/qb/submit-score', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        playerId: getPlayerId(),
        playerName: name,
        score: lastGameResult?.finalScore || 0,
        qbId: lastGameResult?.qbId || selectedQB.id,
        stats: {
          completions: lastGameResult?.completions || 0,
          attempts: lastGameResult?.attempts || 0,
          completionPercentage: lastGameResult?.completionPercentage || 0,
          longestStreak: lastGameResult?.longestStreak || 0,
          touchdowns: lastGameResult?.touchdowns || 0,
          perfectThrows: lastGameResult?.perfectThrows || 0,
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
      elements.saveNameBtn.textContent = 'Save';
      elements.saveNameBtn.removeAttribute('disabled');
    }, 2000);
  }
}

/** Handle copying share link */
function handleCopyLink(): void {
  const score = lastGameResult?.finalScore || 0;
  const shareUrl = `https://blaze-qb-challenge.pages.dev?ref=share&score=${score}`;

  navigator.clipboard
    .writeText(shareUrl)
    .then(() => {
      elements.copyLinkBtn.classList.add('copied');
      elements.copyLinkBtn.innerHTML = '<span>✓</span> Copied!';

      setTimeout(() => {
        elements.copyLinkBtn.classList.remove('copied');
        elements.copyLinkBtn.innerHTML = '<span>📋</span> Copy Link';
      }, 2000);
    })
    .catch(() => {
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
  elements.targetIndicator.style.display = 'block';

  if (gameEngine) {
    gameEngine.dispose();
  }

  gameEngine = await QBGameEngine.create({
    canvas: elements.renderCanvas,
    qb: selectedQB,
    onGameStateChange: handleGameStateChange,
    onGameOver: handleGameOver,
  });

  await gameEngine.unlockAudio();
  gameEngine.startGame();
}

/** Handle game state changes */
function handleGameStateChange(state: QBGameState): void {
  elements.score.textContent = state.score.toLocaleString();

  const seconds = Math.ceil(state.timeRemaining / 1000);
  elements.timer.textContent = seconds.toString();
  elements.timer.classList.toggle('timer-warning', seconds <= 10);

  elements.completed.textContent = `${state.completions}/${state.attempts}`;
  elements.streak.textContent = state.streak.toString();
  elements.targetName.textContent = state.currentTarget || 'Waiting...';
}

/** Handle game over */
async function handleGameOver(result: QBGameResult): Promise<void> {
  lastGameResult = result;

  elements.gameUI.style.display = 'none';
  elements.renderCanvas.style.display = 'none';
  elements.targetIndicator.style.display = 'none';

  saveHighScore(result.finalScore);
  updatePlayerStats(result.completions);
  elements.highScore.textContent = getHighScore().toLocaleString();

  elements.finalScore.textContent = result.finalScore.toLocaleString();
  elements.gameStats.innerHTML = `
    <div class="stat-row">
      <span>Completions</span>
      <span>${result.completions}/${result.attempts}</span>
    </div>
    <div class="stat-row">
      <span>Completion %</span>
      <span>${result.completionPercentage}%</span>
    </div>
    <div class="stat-row">
      <span>Longest Streak</span>
      <span>${result.longestStreak}</span>
    </div>
    <div class="stat-row">
      <span>Touchdowns</span>
      <span>${result.touchdowns}</span>
    </div>
    <div class="stat-row">
      <span>Perfect Throws</span>
      <span>${result.perfectThrows}</span>
    </div>
  `;

  // Submit score
  try {
    await fetch('/api/qb/submit-score', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        playerId: getPlayerId(),
        playerName: getPlayerName() || undefined,
        score: result.finalScore,
        qbId: result.qbId,
        stats: {
          completions: result.completions,
          attempts: result.attempts,
          completionPercentage: result.completionPercentage,
          longestStreak: result.longestStreak,
          touchdowns: result.touchdowns,
          perfectThrows: result.perfectThrows,
          durationSeconds: result.durationSeconds,
        },
      }),
    });
  } catch (error) {
    console.error('Failed to submit score:', error);
  }

  await fetchLeaderboard();

  // Set up share link
  const shareText = `Just scored ${result.finalScore.toLocaleString()} points in Blaze QB Challenge! 🏈 ${result.completions}/${result.attempts} completions, ${result.touchdowns} TDs. Can you beat my score?`;
  const shareUrl = 'https://blaze-qb-challenge.pages.dev';
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
    const response = await fetch('/api/qb/leaderboard?limit=5');
    const data = (await response.json()) as {
      success: boolean;
      entries?: Array<{ rank: number; playerName: string; score: number }>;
    };

    if (data.success && data.entries) {
      elements.leaderboard.innerHTML = `
        <div class="leaderboard-title">Top Scores</div>
        ${data.entries
          .map(
            (entry) => `
          <div class="leaderboard-entry">
            <span class="rank">#${entry.rank}</span>
            <span class="player">${entry.playerName || 'Anonymous'}</span>
            <span class="lb-score">${entry.score.toLocaleString()}</span>
          </div>
        `
          )
          .join('')}
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
  elements.targetIndicator.style.display = 'none';
  elements.menuScreen.style.display = 'flex';
}

// Start the app
init().catch(console.error);
