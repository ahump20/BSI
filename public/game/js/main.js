/**
 * Diamond Sluggers - Main Application
 * Entry point and initialization
 */

import { CHARACTERS, getCharacter, isCharacterUnlocked } from './characters.js';
import { STADIUMS, getStadium, isStadiumUnlocked } from './stadiums.js';
import StorageManager from './storage-manager.js';

class DiamondSluggersApp {
    constructor() {
        this.storage = new StorageManager();
        this.currentScreen = 'loading';
        this.selectedCharacters = [];
        this.selectedStadium = 'boerne-backyard';

        this.init();
    }

    /**
     * Initialize application
     */
    async init() {
        // Show loading screen
        this.showLoadingScreen();

        // Load assets
        await this.loadAssets();

        // Register service worker for PWA
        this.registerServiceWorker();

        // Setup event listeners
        this.setupEventListeners();

        // Check for URL actions
        this.handleURLActions();

        // Show main menu
        this.showMainMenu();
    }

    /**
     * Show loading screen with progress
     */
    showLoadingScreen() {
        const loadingScreen = document.getElementById('loadingScreen');
        const progressBar = document.getElementById('loadingProgress');
        const loadingText = document.getElementById('loadingText');

        loadingScreen.style.display = 'flex';

        // Simulate loading progress
        let progress = 0;
        const interval = setInterval(() => {
            progress += Math.random() * 15;
            if (progress >= 100) {
                progress = 100;
                clearInterval(interval);
                setTimeout(() => {
                    loadingScreen.style.opacity = '0';
                    setTimeout(() => {
                        loadingScreen.style.display = 'none';
                    }, 500);
                }, 300);
            }

            progressBar.style.width = `${progress}%`;
            loadingText.textContent = this.getLoadingMessage(progress);
        }, 200);
    }

    /**
     * Get loading message based on progress
     */
    getLoadingMessage(progress) {
        if (progress < 20) return 'Loading characters...';
        if (progress < 40) return 'Preparing stadiums...';
        if (progress < 60) return 'Warming up pitchers...';
        if (progress < 80) return 'Chalking baselines...';
        if (progress < 95) return 'Almost ready...';
        return 'Play ball!';
    }

    /**
     * Load game assets
     */
    async loadAssets() {
        // In a full implementation, load images, sounds, etc.
        // For now, just a delay to simulate loading
        return new Promise(resolve => {
            setTimeout(resolve, 2000);
        });
    }

    /**
     * Register service worker for offline support
     */
    registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/game/sw.js')
                .then(registration => {
                    console.log('Service Worker registered:', registration);
                })
                .catch(error => {
                    console.log('Service Worker registration failed:', error);
                });
        }
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Main menu buttons
        document.getElementById('playButton').addEventListener('click', () => {
            this.showCharacterSelect();
        });

        document.getElementById('charactersButton').addEventListener('click', () => {
            this.showRosterScreen();
        });

        document.getElementById('statsButton').addEventListener('click', () => {
            this.showStatsScreen();
        });

        document.getElementById('settingsButton').addEventListener('click', () => {
            this.showSettingsScreen();
        });

        // Character selection
        document.getElementById('startGameButton').addEventListener('click', () => {
            if (this.selectedCharacters.length >= 3) {
                this.startGame();
            } else {
                alert('Please select at least 3 characters for your team!');
            }
        });

        document.getElementById('backButton').addEventListener('click', () => {
            this.showMainMenu();
        });

        // Swing button
        document.getElementById('swingButton').addEventListener('click', () => {
            this.handleSwing();
        });

        // Handle visibility change (pause when tab hidden)
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.pauseGame();
            } else {
                this.resumeGame();
            }
        });
    }

    /**
     * Handle URL actions (shortcuts)
     */
    handleURLActions() {
        const params = new URLSearchParams(window.location.search);
        const action = params.get('action');

        if (action === 'play') {
            this.showCharacterSelect();
        } else if (action === 'stats') {
            this.showStatsScreen();
        }
    }

    /**
     * Show main menu
     */
    showMainMenu() {
        this.hideAllScreens();
        document.getElementById('mainMenu').classList.add('active');
        this.currentScreen = 'main-menu';
    }

    /**
     * Show character selection screen
     */
    showCharacterSelect() {
        this.hideAllScreens();
        document.getElementById('characterMenu').classList.add('active');
        this.currentScreen = 'character-select';

        // Populate character grid
        this.populateCharacterGrid();
    }

    /**
     * Populate character selection grid
     */
    populateCharacterGrid() {
        const grid = document.getElementById('characterGrid');
        grid.innerHTML = '';

        const playerStats = this.storage.getPlayerStats();

        CHARACTERS.forEach(character => {
            const unlocked = isCharacterUnlocked(character.id, playerStats);

            const card = document.createElement('div');
            card.className = 'character-card';
            if (!unlocked) {
                card.style.opacity = '0.4';
                card.style.pointerEvents = 'none';
            }

            card.innerHTML = `
                <div class="character-avatar" style="background: linear-gradient(135deg, ${character.colors.primary}, ${character.colors.secondary})">
                    ${character.emoji}
                </div>
                <div class="character-name">${character.name}</div>
                <div class="character-stats">
                    ${unlocked ?
                        `PWR: ${character.stats.power} | SPD: ${character.stats.speed}` :
                        `🔒 ${character.unlockCondition.replace('win', 'Win ')} games`
                    }
                </div>
            `;

            if (unlocked) {
                card.addEventListener('click', () => {
                    this.toggleCharacterSelection(character.id, card);
                });
            }

            grid.appendChild(card);
        });
    }

    /**
     * Toggle character selection
     */
    toggleCharacterSelection(characterId, card) {
        const index = this.selectedCharacters.indexOf(characterId);

        if (index === -1) {
            // Select character
            if (this.selectedCharacters.length < 9) {
                this.selectedCharacters.push(characterId);
                card.classList.add('selected');
            } else {
                alert('Maximum 9 characters per team!');
            }
        } else {
            // Deselect character
            this.selectedCharacters.splice(index, 1);
            card.classList.remove('selected');
        }
    }

    /**
     * Start game
     */
    startGame() {
        this.hideAllScreens();

        // Initialize game state
        this.gameState = {
            gamePhase: 'pitching',
            inning: 1,
            maxInnings: 3, // Can be 3, 6, or 9
            isTopInning: true,
            outs: 0,
            strikes: 0,
            balls: 0,
            bases: { 1: null, 2: null, 3: null },
            score: { home: 0, away: 0, runs: 0 },
            lineup: this.selectedCharacters,
            batterIndex: 0,
            currentBatter: this.selectedCharacters[0],
            currentPitcher: 'opponent-pitcher',
            currentStadium: this.selectedStadium,
            swingTiming: null,
            hitStreak: 0,
            lastPlay: '',
            lastHit: null
        };

        // Show game UI
        document.getElementById('gameHud').classList.add('active');
        document.getElementById('touchControls').classList.add('active');
        document.getElementById('gameCanvas').style.display = 'block';

        this.currentScreen = 'gameplay';

        // Initialize game engine and renderer
        // (These would be imported and instantiated here)
        this.startGameLoop();
    }

    /**
     * Start main game loop
     */
    startGameLoop() {
        let lastTime = Date.now();

        const loop = () => {
            const now = Date.now();
            const deltaTime = now - lastTime;
            lastTime = now;

            // Update game logic
            this.updateGame(deltaTime);

            // Render game
            this.renderGame();

            // Update HUD
            this.updateHUD();

            if (this.currentScreen === 'gameplay') {
                this.gameLoopId = requestAnimationFrame(loop);
            }
        };

        loop();
    }

    /**
     * Update game logic
     */
    updateGame(deltaTime) {
        // Game engine would be updated here
        // For now, just placeholder logic
    }

    /**
     * Render game graphics
     */
    renderGame() {
        const canvas = document.getElementById('gameCanvas');
        const ctx = canvas.getContext('2d');

        // Set canvas size
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        // Clear canvas
        ctx.fillStyle = '#2ecc71';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw field (simplified)
        this.drawField(ctx, canvas.width, canvas.height);

        // Draw game elements
        // (Ball, players, etc would be drawn here)
    }

    /**
     * Draw baseball field
     */
    drawField(ctx, width, height) {
        const centerX = width / 2;
        const centerY = height * 0.8;

        // Draw grass
        ctx.fillStyle = '#2ecc71';
        ctx.fillRect(0, 0, width, height);

        // Draw dirt infield
        ctx.fillStyle = '#cd853f';
        ctx.beginPath();
        ctx.moveTo(centerX, centerY); // Home plate
        ctx.lineTo(centerX - 100, centerY - 100); // 3rd base
        ctx.lineTo(centerX, centerY - 200); // 2nd base
        ctx.lineTo(centerX + 100, centerY - 100); // 1st base
        ctx.closePath();
        ctx.fill();

        // Draw bases
        this.drawBase(ctx, centerX, centerY, 'Home');
        this.drawBase(ctx, centerX + 100, centerY - 100, '1st');
        this.drawBase(ctx, centerX, centerY - 200, '2nd');
        this.drawBase(ctx, centerX - 100, centerY - 100, '3rd');

        // Draw mound
        ctx.fillStyle = '#a0522d';
        ctx.beginPath();
        ctx.arc(centerX, centerY - 60, 15, 0, Math.PI * 2);
        ctx.fill();

        // Draw foul lines
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(0, 0);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(width, 0);
        ctx.stroke();
    }

    /**
     * Draw base
     */
    drawBase(ctx, x, y, label) {
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(x, y, 8, 0, Math.PI * 2);
        ctx.fill();
    }

    /**
     * Update HUD
     */
    updateHUD() {
        if (!this.gameState) return;

        const scoreElement = document.getElementById('hudScore');
        const inningElement = document.getElementById('hudInning');

        scoreElement.textContent = `${this.gameState.score.home} - ${this.gameState.score.away}`;
        inningElement.textContent = `${this.gameState.isTopInning ? 'Top' : 'Bot'} ${this.gameState.inning}`;
    }

    /**
     * Handle swing input
     */
    handleSwing() {
        if (this.gameState && this.gameState.gamePhase === 'pitching') {
            this.gameState.swingTiming = Date.now();

            // Haptic feedback
            if ('vibrate' in navigator && this.storage.getSettings().vibrationEnabled) {
                navigator.vibrate(50);
            }
        }
    }

    /**
     * Show stats screen
     */
    showStatsScreen() {
        this.hideAllScreens();
        const stats = this.storage.getPlayerStats();

        // Create stats screen (simplified)
        alert(`Your Stats:\nWins: ${stats.wins}\nLosses: ${stats.losses}\nHome Runs: ${stats.totalHomeRuns}\nWin Streak: ${stats.currentWinStreak}`);

        this.showMainMenu();
    }

    /**
     * Show roster screen
     */
    showRosterScreen() {
        this.showCharacterSelect();
    }

    /**
     * Show settings screen
     */
    showSettingsScreen() {
        this.hideAllScreens();
        const settings = this.storage.getSettings();

        // Create settings screen (simplified)
        const newSettings = {
            soundEnabled: confirm('Enable sound effects?'),
            vibrationEnabled: confirm('Enable haptic feedback?')
        };

        this.storage.updateSettings(newSettings);
        this.showMainMenu();
    }

    /**
     * Hide all screens
     */
    hideAllScreens() {
        document.querySelectorAll('.menu-screen').forEach(screen => {
            screen.classList.remove('active');
        });
        document.getElementById('gameHud').classList.remove('active');
        document.getElementById('touchControls').classList.remove('active');
    }

    /**
     * Pause game
     */
    pauseGame() {
        if (this.gameLoopId) {
            cancelAnimationFrame(this.gameLoopId);
        }
    }

    /**
     * Resume game
     */
    resumeGame() {
        if (this.currentScreen === 'gameplay') {
            this.startGameLoop();
        }
    }
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.gameApp = new DiamondSluggersApp();
    });
} else {
    window.gameApp = new DiamondSluggersApp();
}

export default DiamondSluggersApp;
