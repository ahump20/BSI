/**
 * Blaze Blitz Football - Main Entry Point
 *
 * Initializes the game and handles UI interactions
 */

import { BlitzGameEngine, BlitzGameState, BlitzGameResult } from '@core/BlitzGameEngine';
import { FIREBIRDS, SHADOW_WOLVES, getPlayableTeams, BlitzTeam } from '@data/teams';

/** Player ID management */
function getPlayerId(): string {
  let playerId = localStorage.getItem('blitz_player_id');
  if (!playerId) {
    playerId = `player_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    localStorage.setItem('blitz_player_id', playerId);
  }
  return playerId;
}

/** Get stored high score */
function getHighScore(): number {
  return parseInt(localStorage.getItem('blitz_high_score') || '0', 10);
}

/** Save high score */
function saveHighScore(score: number): void {
  const current = getHighScore();
  if (score > current) {
    localStorage.setItem('blitz_high_score', score.toString());
  }
}

/** Get stored player name */
function getPlayerName(): string {
  return localStorage.getItem('blitz_player_name') || '';
}

/** Save player name */
function savePlayerName(name: string): void {
  localStorage.setItem('blitz_player_name', name);
}

/** Store the last game result for sharing */
let lastGameResult: BlitzGameResult | null = null;

/** UI Elements */
const elements = {
  loadingScreen: document.getElementById('loadingScreen')!,
  menuScreen: document.getElementById('menuScreen')!,
  renderCanvas: document.getElementById('renderCanvas') as HTMLCanvasElement,
  gameUI: document.getElementById('gameUI')!,
  driveInfo: document.getElementById('driveInfo')!,
  staminaBar: document.getElementById('staminaBar')!,
  gameOverScreen: document.getElementById('gameOverScreen')!,

  // Menu
  highScore: document.getElementById('highScore')!,
  teamSelect: document.getElementById('teamSelect')!,
  playButton: document.getElementById('playButton')!,

  // Game UI
  score: document.getElementById('score')!,
  timer: document.getElementById('timer')!,
  down: document.getElementById('down')!,
  yards: document.getElementById('yards')!,
  driveText: document.getElementById('driveText')!,
  staminaFill: document.getElementById('staminaFill')!,

  // Feedback
  playFeedback: document.getElementById('playFeedback')!,

  // Game Over
  gameOverResult: document.getElementById('gameOverResult')!,
  finalScore: document.getElementById('finalScore')!,
  gameStats: document.getElementById('gameStats')!,
  leaderboard: document.getElementById('leaderboard')!,
  playAgainButton: document.getElementById('playAgainButton')!,
  menuButton: document.getElementById('menuButton')!,

  // Name and Share
  playerNameInput: document.getElementById('playerNameInput') as HTMLInputElement,
  saveNameBtn: document.getElementById('saveNameBtn')!,
  shareXBtn: document.getElementById('shareXBtn') as HTMLAnchorElement,
  copyLinkBtn: document.getElementById('copyLinkBtn')!,
};

/** Game state */
let gameEngine: BlitzGameEngine | null = null;
let selectedTeam: BlitzTeam = FIREBIRDS;
let lastFeedback: string = '';
let feedbackTimeout: number | null = null;

/** Initialize the application */
async function init(): Promise<void> {
  // Show high score
  elements.highScore.textContent = getHighScore().toLocaleString();

  // Populate team selection
  populateTeamSelect();

  // Setup event listeners
  setupEventListeners();

  // Hide loading, show menu
  elements.loadingScreen.style.display = 'none';
  elements.menuScreen.style.display = 'flex';
}

/** Populate team selection grid */
function populateTeamSelect(): void {
  const teams = getPlayableTeams();

  teams.forEach((team, index) => {
    const card = document.createElement('div');
    card.className = 'team-card' + (index === 0 ? ' selected' : '');
    card.dataset.teamId = team.id;

    card.innerHTML = `
      <div class="team-logo" style="background-color: ${team.primaryColor}; box-shadow: 0 0 15px ${team.primaryColor};">
        ${team.shortName.charAt(0)}
      </div>
      <div class="team-name" style="color: ${team.primaryColor};">${team.name}</div>
      <div class="team-stats">
        <span>OFF ${team.offense}</span>
        <span>DEF ${team.defense}</span>
        <span>SPD ${team.speed}</span>
      </div>
    `;

    card.addEventListener('click', () => {
      // Deselect all
      document.querySelectorAll('.team-card').forEach((c) => c.classList.remove('selected'));
      // Select this one
      card.classList.add('selected');
      selectedTeam = team;
    });

    elements.teamSelect.appendChild(card);
  });
}

/** Setup event listeners */
function setupEventListeners(): void {
  // Play button
  elements.playButton.addEventListener('click', startGame);

  // Play again button
  elements.playAgainButton.addEventListener('click', startGame);

  // Menu button
  elements.menuButton.addEventListener('click', showMenu);

  // Save name button
  elements.saveNameBtn.addEventListener('click', handleSaveName);

  // Copy link button
  elements.copyLinkBtn.addEventListener('click', handleCopyLink);

  // Pre-fill name input if saved
  const savedName = getPlayerName();
  if (savedName) {
    elements.playerNameInput.value = savedName;
  }
}

/** Handle saving player name */
async function handleSaveName(): Promise<void> {
  const name = elements.playerNameInput.value.trim();
  if (!name) return;

  // Save locally
  savePlayerName(name);

  // Update on server
  try {
    elements.saveNameBtn.textContent = 'Saving...';
    elements.saveNameBtn.setAttribute('disabled', 'true');

    await fetch('/api/blitz/submit-score', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        playerId: getPlayerId(),
        playerName: name,
        score: lastGameResult?.finalScore || 0,
        teamId: lastGameResult?.teamId || selectedTeam.id,
        stats: {
          yardsGained: lastGameResult?.yardsGained || 0,
          touchdowns: lastGameResult?.touchdowns || 0,
          firstDowns: lastGameResult?.firstDowns || 0,
          bigPlays: lastGameResult?.bigPlays || 0,
          turnovers: lastGameResult?.turnovers || 0,
          tacklesMade: lastGameResult?.tacklesMade || 0,
          stiffArms: lastGameResult?.stiffArms || 0,
          jukes: lastGameResult?.jukes || 0,
          turboYards: lastGameResult?.turboYards || 0,
          longestPlay: lastGameResult?.longestPlay || 0,
          durationSeconds: lastGameResult?.durationSeconds || 0,
          result: lastGameResult?.result || 'incomplete',
        },
      }),
    });

    elements.saveNameBtn.textContent = 'Saved!';

    // Refresh leaderboard to show updated name
    const response = await fetch('/api/blitz/leaderboard?limit=5');
    const data = (await response.json()) as { success: boolean; entries?: Array<{ rank: number; playerName: string; score: number }> };

    if (data.success && data.entries) {
      elements.leaderboard.innerHTML = `
        <div class="leaderboard-title">Top Scores</div>
        ${data.entries
          .map(
            (entry: { rank: number; playerName: string; score: number }) => `
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
  const shareUrl = `https://blaze-blitz-football.pages.dev?ref=share&score=${score}`;

  navigator.clipboard.writeText(shareUrl).then(() => {
    elements.copyLinkBtn.classList.add('copied');
    elements.copyLinkBtn.innerHTML = '<span>✓</span> Copied!';

    setTimeout(() => {
      elements.copyLinkBtn.classList.remove('copied');
      elements.copyLinkBtn.innerHTML = '<span>📋</span> Copy Link';
    }, 2000);
  }).catch(() => {
    // Fallback for older browsers
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
  // Hide menus
  elements.menuScreen.style.display = 'none';
  elements.gameOverScreen.style.display = 'none';

  // Show game elements
  elements.renderCanvas.style.display = 'block';
  elements.gameUI.style.display = 'flex';
  elements.driveInfo.style.display = 'block';
  elements.staminaBar.style.display = 'block';

  // Dispose existing engine if any
  if (gameEngine) {
    gameEngine.dispose();
  }

  // Create new game engine
  gameEngine = await BlitzGameEngine.create({
    canvas: elements.renderCanvas,
    homeTeam: selectedTeam,
    awayTeam: SHADOW_WOLVES,
    onGameStateChange: handleGameStateChange,
    onGameOver: handleGameOver,
  });

  // Unlock audio (requires user interaction - we have it from button click)
  await gameEngine.unlockAudio();

  // Start the game
  gameEngine.startGame();
}

/** Handle game state changes */
function handleGameStateChange(state: BlitzGameState): void {
  // Update score
  elements.score.textContent = state.score.toLocaleString();

  // Update timer
  const seconds = Math.ceil(state.timeRemaining / 1000);
  elements.timer.textContent = seconds.toString();
  elements.timer.classList.toggle('timer-warning', seconds <= 10);

  // Update down
  const downText = ['1st', '2nd', '3rd', '4th'][state.down - 1] || '4th';
  elements.down.textContent = downText;

  // Update yards
  elements.yards.textContent = state.yardsGained.toString();

  // Update drive info
  const yardLine = state.lineOfScrimmage;
  const sideText = yardLine <= 50 ? 'OWN' : 'OPP';
  const displayYardLine = yardLine <= 50 ? yardLine : 100 - yardLine;
  elements.driveText.textContent = `${downText} & ${state.yardsToGo} at ${sideText} ${displayYardLine}`;

  // Show feedback for events
  if (state.touchdowns > 0 && lastFeedback !== 'touchdown') {
    showFeedback('TOUCHDOWN!', 'feedback-touchdown');
    lastFeedback = 'touchdown';
  } else if (state.firstDowns > 0 && state.down === 1 && lastFeedback !== 'firstdown') {
    showFeedback('FIRST DOWN!', 'feedback-firstdown');
    lastFeedback = 'firstdown';
  } else if (state.bigPlays > 0 && lastFeedback !== 'bigplay') {
    showFeedback('BIG PLAY!', 'feedback-bigplay');
    lastFeedback = 'bigplay';
  }
}

/** Show feedback text */
function showFeedback(text: string, className: string): void {
  if (feedbackTimeout) {
    clearTimeout(feedbackTimeout);
  }

  elements.playFeedback.textContent = text;
  elements.playFeedback.className = `show ${className}`;

  feedbackTimeout = window.setTimeout(() => {
    elements.playFeedback.classList.remove('show');
  }, 1500);
}

/** Handle game over */
async function handleGameOver(result: BlitzGameResult): Promise<void> {
  // Store result for sharing
  lastGameResult = result;

  // Hide game elements
  elements.gameUI.style.display = 'none';
  elements.driveInfo.style.display = 'none';
  elements.staminaBar.style.display = 'none';
  elements.renderCanvas.style.display = 'none';

  // Update high score
  saveHighScore(result.finalScore);
  elements.highScore.textContent = getHighScore().toLocaleString();

  // Show result
  const resultText = {
    touchdown: 'TOUCHDOWN!',
    turnover: 'TURNOVER ON DOWNS',
    timeout: 'TIME EXPIRED',
    incomplete: 'DRIVE ENDED',
  }[result.result];

  elements.gameOverResult.textContent = resultText;
  elements.finalScore.textContent = result.finalScore.toLocaleString();

  // Populate stats
  elements.gameStats.innerHTML = `
    <div class="stat-row">
      <span class="label">Total Yards</span>
      <span class="value">${result.yardsGained}</span>
    </div>
    <div class="stat-row">
      <span class="label">Touchdowns</span>
      <span class="value">${result.touchdowns}</span>
    </div>
    <div class="stat-row">
      <span class="label">First Downs</span>
      <span class="value">${result.firstDowns}</span>
    </div>
    <div class="stat-row">
      <span class="label">Big Plays (20+ yds)</span>
      <span class="value">${result.bigPlays}</span>
    </div>
    <div class="stat-row">
      <span class="label">Longest Play</span>
      <span class="value">${result.longestPlay} yds</span>
    </div>
    <div class="stat-row">
      <span class="label">Turbo Yards</span>
      <span class="value">${result.turboYards}</span>
    </div>
    <div class="stat-row">
      <span class="label">Duration</span>
      <span class="value">${result.durationSeconds}s</span>
    </div>
  `;

  // Submit score
  try {
    const response = await fetch('/api/blitz/submit-score', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        playerId: getPlayerId(),
        score: result.finalScore,
        teamId: result.teamId,
        stats: {
          yardsGained: result.yardsGained,
          touchdowns: result.touchdowns,
          firstDowns: result.firstDowns,
          bigPlays: result.bigPlays,
          turnovers: result.turnovers,
          tacklesMade: result.tacklesMade,
          stiffArms: result.stiffArms,
          jukes: result.jukes,
          turboYards: result.turboYards,
          longestPlay: result.longestPlay,
          durationSeconds: result.durationSeconds,
          result: result.result,
        },
      }),
    });

    const data = (await response.json()) as { success: boolean; data?: { isHighScore?: boolean } };

    if (data.success && data.data?.isHighScore) {
      elements.gameOverResult.textContent += ' NEW HIGH SCORE!';
    }
  } catch (error) {
    console.error('Failed to submit score:', error);
  }

  // Fetch leaderboard
  try {
    const response = await fetch('/api/blitz/leaderboard?limit=5');
    const data = (await response.json()) as { success: boolean; entries?: Array<{ rank: number; playerName: string; score: number }> };

    if (data.success && data.entries) {
      elements.leaderboard.innerHTML = `
        <div class="leaderboard-title">Top Scores</div>
        ${data.entries
          .map(
            (entry: { rank: number; playerName: string; score: number }) => `
          <div class="leaderboard-entry ${entry.rank === 1 ? '' : ''}">
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
    elements.leaderboard.innerHTML = '';
  }

  // Set up X/Twitter share link
  const shareText = `Just scored ${result.finalScore.toLocaleString()} points in Blaze Blitz Football! 🏈 ${result.touchdowns} TDs, ${result.yardsGained} yards. Can you beat my score?`;
  const shareUrl = 'https://blaze-blitz-football.pages.dev';
  elements.shareXBtn.href = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;

  // Pre-fill name input if saved
  const savedName = getPlayerName();
  if (savedName) {
    elements.playerNameInput.value = savedName;
  }

  // Show game over screen
  elements.gameOverScreen.style.display = 'flex';

  // Reset feedback tracking
  lastFeedback = '';
}

/** Show main menu */
function showMenu(): void {
  // Dispose game engine
  if (gameEngine) {
    gameEngine.dispose();
    gameEngine = null;
  }

  // Hide game over
  elements.gameOverScreen.style.display = 'none';

  // Show menu
  elements.menuScreen.style.display = 'flex';
}

// Start the app
init().catch(console.error);
