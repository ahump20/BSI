/**
 * Blaze Blitz Football - Main Entry Point
 *
 * Initializes the game and handles UI interactions
 */

import { BlitzGameEngine, BlitzGameState, BlitzGameResult } from '@core/BlitzGameEngine';
import { FIREBIRDS, SHADOW_WOLVES, getPlayableTeams, BlitzTeam } from '@data/teams';
import { PlaybookSystem, type FormationType, type EnhancedOffensivePlay, type GameSituation } from '@core/PlaybookSystem';
import { DriveSystem } from '@core/DriveSystem';
import { InputSystem } from '@core/InputSystem';
import { ScoreSystem } from '@core/ScoreSystem';

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

  // New HUD elements
  playClock: document.getElementById('playClock')!,
  playClockText: document.getElementById('playClockText')!,
  scoreTicker: document.getElementById('scoreTicker')!,
  homeTeamName: document.getElementById('homeTeamName')!,
  homeTeamScore: document.getElementById('homeTeamScore')!,
  awayTeamScore: document.getElementById('awayTeamScore')!,
  awayTeamName: document.getElementById('awayTeamName')!,
  quarterDisplay: document.getElementById('quarterDisplay')!,
  playCallOverlay: document.getElementById('playCallOverlay')!,
  formationPicker: document.getElementById('formationPicker')!,
  playPicker: document.getElementById('playPicker')!,
  moveIndicators: document.getElementById('moveIndicators')!,
  jukeReady: document.getElementById('jukeReady')!,
  spinReady: document.getElementById('spinReady')!,
  truckReady: document.getElementById('truckReady')!,
};

/** Game state */
let gameEngine: BlitzGameEngine | null = null;
let selectedTeam: BlitzTeam = FIREBIRDS;
let lastFeedback: string = '';
let feedbackTimeout: number | null = null;
const playbook = new PlaybookSystem();
let inputSystem: InputSystem | null = null;
let scoreSystem: ScoreSystem | null = null;
let cooldownRaf: number | null = null;
let selectedFormation: FormationType = 'shotgun';
let playClockInterval: number | null = null;
let playClockSeconds = 25;

// ── Play Call UI ──

function renderFormationPicker(): void {
  const container = elements.formationPicker;
  while (container.firstChild) container.removeChild(container.firstChild);

  const formations: Array<{ id: FormationType; label: string }> = [
    { id: 'shotgun', label: 'Shotgun' },
    { id: 'iform', label: 'I-Form' },
    { id: 'trips', label: 'Trips' },
    { id: 'spread', label: 'Spread' },
    { id: 'singleback', label: 'Singleback' },
  ];

  for (const f of formations) {
    const btn = document.createElement('button');
    btn.textContent = f.label;
    btn.style.cssText = `font-family:'Russo One',sans-serif;font-size:0.75rem;padding:0.375rem 0.75rem;border:2px solid ${f.id === selectedFormation ? 'var(--arcade-neon-green)' : 'rgba(255,255,255,0.2)'};background:${f.id === selectedFormation ? 'rgba(57,255,20,0.15)' : 'rgba(255,255,255,0.05)'};color:${f.id === selectedFormation ? 'var(--arcade-neon-green)' : 'rgba(255,255,255,0.6)'};cursor:pointer;text-transform:uppercase;letter-spacing:0.05em;transition:all 0.15s;`;
    btn.addEventListener('click', () => {
      selectedFormation = f.id;
      renderFormationPicker();
      renderPlayPicker();
    });
    container.appendChild(btn);
  }
}

function renderPlayPicker(): void {
  const container = elements.playPicker;
  while (container.firstChild) container.removeChild(container.firstChild);

  const plays = playbook.getPlaysForFormation(selectedFormation);

  for (const play of plays) {
    const card = document.createElement('button');
    card.style.cssText = `display:flex;flex-direction:column;align-items:center;padding:0.5rem 0.75rem;border:2px solid rgba(255,255,255,0.15);background:rgba(255,255,255,0.05);cursor:pointer;transition:all 0.15s;min-width:90px;`;
    const name = document.createElement('span');
    name.textContent = play.name;
    name.style.cssText = `font-family:'Russo One',sans-serif;font-size:0.6875rem;color:var(--arcade-yellow);text-transform:uppercase;`;
    const desc = document.createElement('span');
    desc.textContent = play.description ?? '';
    desc.style.cssText = `font-size:0.5rem;color:rgba(255,255,255,0.35);margin-top:2px;`;
    card.appendChild(name);
    card.appendChild(desc);

    card.addEventListener('mouseenter', () => {
      card.style.borderColor = 'var(--arcade-yellow)';
      card.style.background = 'rgba(255,215,0,0.1)';
    });
    card.addEventListener('mouseleave', () => {
      card.style.borderColor = 'rgba(255,255,255,0.15)';
      card.style.background = 'rgba(255,255,255,0.05)';
    });
    card.addEventListener('click', () => {
      selectPlay(play);
    });

    container.appendChild(card);
  }
}

function selectPlay(play: EnhancedOffensivePlay): void {
  elements.playCallOverlay.style.display = 'none';
  if (gameEngine) {
    gameEngine.setSelectedPlay(play);
    gameEngine.triggerSnap();
  }
  stopPlayClock();
}

function showPlayCallUI(): void {
  renderFormationPicker();
  renderPlayPicker();
  elements.playCallOverlay.style.display = 'flex';
  resetPlayClock();
}

function hidePlayCallUI(): void {
  elements.playCallOverlay.style.display = 'none';
  stopPlayClock();
}

function resetPlayClock(): void {
  playClockSeconds = 25;
  elements.playClockText.textContent = '25';
  elements.playClock.style.display = 'block';
  stopPlayClock();
  playClockInterval = window.setInterval(() => {
    playClockSeconds--;
    elements.playClockText.textContent = String(playClockSeconds);
    if (playClockSeconds <= 5) {
      elements.playClockText.style.color = 'var(--arcade-hot-pink)';
    }
    if (playClockSeconds <= 0) {
      stopPlayClock();
      // Auto-select recommended play
      const situation: GameSituation = { down: 1, yardsToGo: 10, yardLine: 75, scoreDiff: 0, timeRemaining: 120, quarter: 1 };
      const recs = playbook.getPlayRecommendations(situation, 1);
      if (recs.length > 0) selectPlay(recs[0]);
    }
  }, 1000);
}

function startPlayClock(): void {
  // Clock already running from showPlayCallUI
}

function stopPlayClock(): void {
  if (playClockInterval !== null) {
    clearInterval(playClockInterval);
    playClockInterval = null;
  }
  elements.playClockText.style.color = 'var(--arcade-yellow)';
}

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

  // Add "Back to Arcade" link
  const arcadeLink = document.createElement('a');
  arcadeLink.href = '/mini-games';
  arcadeLink.textContent = '\u2190 Back to Arcade';
  arcadeLink.style.cssText = 'position:fixed;top:8px;left:12px;color:#888;font-size:12px;text-decoration:none;z-index:9999;font-family:sans-serif;';
  arcadeLink.addEventListener('mouseenter', () => { arcadeLink.style.color = '#bf5700'; });
  arcadeLink.addEventListener('mouseleave', () => { arcadeLink.style.color = '#888'; });
  document.body.appendChild(arcadeLink);
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
  elements.scoreTicker.style.display = 'block';
  elements.moveIndicators.style.display = 'flex';

  // Set team names in score ticker
  elements.homeTeamName.textContent = selectedTeam.shortName;
  elements.awayTeamName.textContent = 'WOLVES';
  elements.homeTeamScore.textContent = '0';
  elements.awayTeamScore.textContent = '0';
  elements.quarterDisplay.textContent = 'Q1';

  // Dispose existing systems
  if (inputSystem) { inputSystem.dispose(); inputSystem = null; }
  if (cooldownRaf !== null) { cancelAnimationFrame(cooldownRaf); cooldownRaf = null; }
  scoreSystem = new ScoreSystem({ quarterLengthSec: 120, playClockSec: 25 });

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
    onPlayFeedback: (text, style) => showFeedback(text, `feedback-${style}`),
  });

  // Unlock audio (requires user interaction - we have it from button click)
  await gameEngine.unlockAudio();

  // Start the game
  gameEngine.startGame();

  // Create InputSystem after engine so canvas is sized
  inputSystem = new InputSystem(elements.renderCanvas);
  inputSystem.setPhase('pre_snap');

  // Wire InputSystem events → engine
  // throw/select_receiver still handled by engine's own polling in updatePlayActive.
  // Special moves use new public methods on the engine.
  inputSystem.on('juke', (e) => gameEngine?.performJuke(e.direction));
  inputSystem.on('spin', () => gameEngine?.performSpin());
  inputSystem.on('truck', () => gameEngine?.performTruck());
  inputSystem.on('dive', (e) => gameEngine?.performDive(e.direction));
  inputSystem.on('audible', () => gameEngine?.callAudible());
  inputSystem.on('pump_fake', () => gameEngine?.pumpFake());
  inputSystem.on('throw_away', () => gameEngine?.throwAway());
  inputSystem.on('hot_route_out', (e) => gameEngine?.setHotRoute(e.receiverIndex ?? 0, 'out'));
  inputSystem.on('hot_route_in', (e) => gameEngine?.setHotRoute(e.receiverIndex ?? 0, 'in'));
  inputSystem.on('hot_route_streak', (e) => gameEngine?.setHotRoute(e.receiverIndex ?? 0, 'streak'));
  inputSystem.on('hot_route_curl', (e) => gameEngine?.setHotRoute(e.receiverIndex ?? 0, 'curl'));

  // Cooldown indicator loop
  let lastTime = performance.now();
  const updateCooldowns = () => {
    const now = performance.now();
    const dt = (now - lastTime) / 1000;
    lastTime = now;

    if (inputSystem) {
      inputSystem.update(dt);

      // Update cooldown indicators
      elements.jukeReady.style.opacity = inputSystem.isOnCooldown('juke') ? '0.3' : '1';
      elements.spinReady.style.opacity = inputSystem.isOnCooldown('spin') ? '0.3' : '1';
      elements.truckReady.style.opacity = inputSystem.isOnCooldown('truck') ? '0.3' : '1';
    }

    cooldownRaf = requestAnimationFrame(updateCooldowns);
  };
  cooldownRaf = requestAnimationFrame(updateCooldowns);
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

  // Update score ticker
  elements.homeTeamScore.textContent = state.score.toString();

  // Update quarter from ScoreSystem if available
  if (scoreSystem) {
    const clock = scoreSystem.getClock();
    elements.quarterDisplay.textContent = clock.isOvertime ? 'OT' : `Q${clock.quarter}`;
  }

  // Sync input phase with game phase
  if (inputSystem) {
    if (state.phase === 'pre_snap') inputSystem.setPhase('pre_snap');
    else if (state.phase === 'play_active') inputSystem.setPhase('pocket');
    // ball_carrier phase set by engine when catch happens
  }

  // Show/hide play call overlay based on phase
  if (state.phase === 'pre_snap') {
    showPlayCallUI();
  } else {
    hidePlayCallUI();
  }

  // Move indicators - show during play_active when ball carrier
  if (state.phase === 'play_active') {
    elements.moveIndicators.style.display = 'flex';
  } else {
    elements.moveIndicators.style.display = 'none';
  }

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
  elements.scoreTicker.style.display = 'none';
  elements.playClock.style.display = 'none';
  elements.moveIndicators.style.display = 'none';
  hidePlayCallUI();

  // Tear down input loop
  if (inputSystem) { inputSystem.dispose(); inputSystem = null; }
  if (cooldownRaf !== null) { cancelAnimationFrame(cooldownRaf); cooldownRaf = null; }

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

  // Populate stats — enhanced with ScoreSystem data when available
  const ss = gameEngine?.getScoreSystem();
  const homeStats = ss?.getStats('home');
  const passerRating = homeStats?.passing.passerRating ?? 0;
  const compPct = homeStats && homeStats.passing.attempts > 0
    ? Math.round((homeStats.passing.completions / homeStats.passing.attempts) * 100)
    : 0;

  // Build stat rows using safe DOM construction
  const statsContainer = elements.gameStats;
  statsContainer.textContent = '';
  const statRows: [string, string][] = [
    ['Total Yards', String(result.yardsGained)],
    ['Touchdowns', String(result.touchdowns)],
    ['First Downs', String(result.firstDowns)],
    ['Completion %', `${compPct}%`],
    ['Passer Rating', passerRating.toFixed(1)],
    ['Big Plays (20+ yds)', String(result.bigPlays)],
    ['Longest Play', `${result.longestPlay} yds`],
    ['Turbo Yards', String(result.turboYards)],
    ['Duration', `${result.durationSeconds}s`],
  ];
  for (const [label, value] of statRows) {
    const row = document.createElement('div');
    row.className = 'stat-row';
    const labelEl = document.createElement('span');
    labelEl.className = 'label';
    labelEl.textContent = label;
    const valueEl = document.createElement('span');
    valueEl.className = 'value';
    valueEl.textContent = value;
    row.appendChild(labelEl);
    row.appendChild(valueEl);
    statsContainer.appendChild(row);
  }

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
