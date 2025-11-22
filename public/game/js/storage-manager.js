/**
 * Diamond Sluggers - Storage Manager
 * Handles save/load and progression tracking
 */

const STORAGE_KEY = 'diamond-sluggers-save';
const STORAGE_VERSION = 1;

export class StorageManager {
    constructor() {
        this.saveData = this.load();
    }

    /**
     * Get default save data structure
     */
    getDefaultSave() {
        return {
            version: STORAGE_VERSION,
            player: {
                name: 'Player',
                createdAt: Date.now(),
                lastPlayed: Date.now()
            },
            stats: {
                wins: 0,
                losses: 0,
                gamesPlayed: 0,
                totalRuns: 0,
                totalHits: 0,
                totalHomeRuns: 0,
                totalStrikeouts: 0,
                bestWinStreak: 0,
                currentWinStreak: 0
            },
            characters: {
                unlocked: ['maya-thunder', 'jackson-rocket', 'emma-glove'], // Starters
                stats: {} // Per-character stats
            },
            stadiums: {
                unlocked: ['boerne-backyard'], // Starter stadium
                favoriteStadium: 'boerne-backyard'
            },
            achievements: {
                earned: [],
                progress: {}
            },
            settings: {
                soundEnabled: true,
                musicEnabled: true,
                vibrationEnabled: true,
                difficulty: 'medium',
                showTutorial: true
            },
            career: {
                seasonWins: 0,
                seasonLosses: 0,
                championshipsWon: 0
            }
        };
    }

    /**
     * Load save data from localStorage
     */
    load() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (!saved) {
                return this.getDefaultSave();
            }

            const data = JSON.parse(saved);

            // Version migration if needed
            if (data.version !== STORAGE_VERSION) {
                return this.migrate(data);
            }

            return data;
        } catch (error) {
            console.error('Failed to load save data:', error);
            return this.getDefaultSave();
        }
    }

    /**
     * Save data to localStorage
     */
    save() {
        try {
            this.saveData.player.lastPlayed = Date.now();
            const json = JSON.stringify(this.saveData);
            localStorage.setItem(STORAGE_KEY, json);
            return true;
        } catch (error) {
            console.error('Failed to save data:', error);
            return false;
        }
    }

    /**
     * Migrate old save data to new version
     */
    migrate(oldData) {
        const newData = this.getDefaultSave();
        // Copy over compatible data
        Object.assign(newData, oldData);
        newData.version = STORAGE_VERSION;
        return newData;
    }

    /**
     * Record game result
     */
    recordGame(won, stats) {
        this.saveData.stats.gamesPlayed += 1;

        if (won) {
            this.saveData.stats.wins += 1;
            this.saveData.stats.currentWinStreak += 1;
            this.saveData.career.seasonWins += 1;

            if (this.saveData.stats.currentWinStreak > this.saveData.stats.bestWinStreak) {
                this.saveData.stats.bestWinStreak = this.saveData.stats.currentWinStreak;
            }
        } else {
            this.saveData.stats.losses += 1;
            this.saveData.stats.currentWinStreak = 0;
            this.saveData.career.seasonLosses += 1;
        }

        // Record stats
        if (stats) {
            this.saveData.stats.totalRuns += stats.runs || 0;
            this.saveData.stats.totalHits += stats.hits || 0;
            this.saveData.stats.totalHomeRuns += stats.homeRuns || 0;
            this.saveData.stats.totalStrikeouts += stats.strikeouts || 0;
        }

        // Check for achievements
        this.checkAchievements();

        // Check for unlocks
        this.checkUnlocks();

        this.save();
    }

    /**
     * Unlock character
     */
    unlockCharacter(characterId) {
        if (!this.saveData.characters.unlocked.includes(characterId)) {
            this.saveData.characters.unlocked.push(characterId);
            this.save();
            return true;
        }
        return false;
    }

    /**
     * Unlock stadium
     */
    unlockStadium(stadiumId) {
        if (!this.saveData.stadiums.unlocked.includes(stadiumId)) {
            this.saveData.stadiums.unlocked.push(stadiumId);
            this.save();
            return true;
        }
        return false;
    }

    /**
     * Check for achievement completion
     */
    checkAchievements() {
        const achievements = [
            {
                id: 'first-win',
                name: 'First Victory',
                description: 'Win your first game',
                condition: () => this.saveData.stats.wins >= 1
            },
            {
                id: 'home-run-hitter',
                name: 'Home Run Hitter',
                description: 'Hit 10 home runs',
                condition: () => this.saveData.stats.totalHomeRuns >= 10
            },
            {
                id: 'win-streak-5',
                name: 'On Fire',
                description: 'Win 5 games in a row',
                condition: () => this.saveData.stats.bestWinStreak >= 5
            },
            {
                id: 'hundred-runs',
                name: 'Century Club',
                description: 'Score 100 total runs',
                condition: () => this.saveData.stats.totalRuns >= 100
            },
            {
                id: 'all-characters',
                name: 'Full Roster',
                description: 'Unlock all characters',
                condition: () => this.saveData.characters.unlocked.length >= 12
            },
            {
                id: 'all-stadiums',
                name: 'World Tour',
                description: 'Unlock all stadiums',
                condition: () => this.saveData.stadiums.unlocked.length >= 5
            },
            {
                id: 'champion',
                name: 'Champion',
                description: 'Win the championship',
                condition: () => this.saveData.career.championshipsWon >= 1
            }
        ];

        const newUnlocks = [];

        for (const achievement of achievements) {
            if (!this.saveData.achievements.earned.includes(achievement.id)) {
                if (achievement.condition()) {
                    this.saveData.achievements.earned.push(achievement.id);
                    newUnlocks.push(achievement);
                }
            }
        }

        return newUnlocks;
    }

    /**
     * Check for character/stadium unlocks based on wins
     */
    checkUnlocks() {
        const wins = this.saveData.stats.wins;

        // Character unlock thresholds
        const characterUnlocks = {
            5: 'tyler-knuckle',
            10: 'sophia-spark',
            15: 'marcus-dash',
            20: 'olivia-cannon',
            25: 'carlos-magic',
            30: 'isabella-ice',
            35: 'ryan-wall',
            40: 'lily-zoom',
            50: 'diego-fire'
        };

        // Stadium unlock thresholds
        const stadiumUnlocks = {
            8: 'san-antonio-lot',
            15: 'austin-treehouse',
            25: 'houston-bayou',
            40: 'dallas-construction'
        };

        const unlocks = {
            characters: [],
            stadiums: []
        };

        // Check character unlocks
        for (const [threshold, characterId] of Object.entries(characterUnlocks)) {
            if (wins >= parseInt(threshold)) {
                if (this.unlockCharacter(characterId)) {
                    unlocks.characters.push(characterId);
                }
            }
        }

        // Check stadium unlocks
        for (const [threshold, stadiumId] of Object.entries(stadiumUnlocks)) {
            if (wins >= parseInt(threshold)) {
                if (this.unlockStadium(stadiumId)) {
                    unlocks.stadiums.push(stadiumId);
                }
            }
        }

        return unlocks;
    }

    /**
     * Update character stats
     */
    updateCharacterStats(characterId, stats) {
        if (!this.saveData.characters.stats[characterId]) {
            this.saveData.characters.stats[characterId] = {
                gamesPlayed: 0,
                hits: 0,
                homeRuns: 0,
                rbis: 0,
                avg: 0.000
            };
        }

        const charStats = this.saveData.characters.stats[characterId];
        charStats.gamesPlayed += 1;
        charStats.hits += stats.hits || 0;
        charStats.homeRuns += stats.homeRuns || 0;
        charStats.rbis += stats.rbis || 0;

        // Calculate batting average
        const atBats = charStats.gamesPlayed * 3; // Approximate
        charStats.avg = (charStats.hits / atBats).toFixed(3);

        this.save();
    }

    /**
     * Update settings
     */
    updateSettings(newSettings) {
        Object.assign(this.saveData.settings, newSettings);
        this.save();
    }

    /**
     * Get player stats
     */
    getPlayerStats() {
        return this.saveData.stats;
    }

    /**
     * Get unlocked content
     */
    getUnlockedContent() {
        return {
            characters: this.saveData.characters.unlocked,
            stadiums: this.saveData.stadiums.unlocked
        };
    }

    /**
     * Get achievements
     */
    getAchievements() {
        return this.saveData.achievements.earned;
    }

    /**
     * Get settings
     */
    getSettings() {
        return this.saveData.settings;
    }

    /**
     * Reset all save data
     */
    reset() {
        if (confirm('Are you sure you want to reset all progress? This cannot be undone!')) {
            this.saveData = this.getDefaultSave();
            this.save();
            return true;
        }
        return false;
    }

    /**
     * Export save data as JSON
     */
    exportSave() {
        return JSON.stringify(this.saveData, null, 2);
    }

    /**
     * Import save data from JSON
     */
    importSave(jsonString) {
        try {
            const data = JSON.parse(jsonString);
            if (data.version && data.player && data.stats) {
                this.saveData = data;
                this.save();
                return true;
            }
            return false;
        } catch (error) {
            console.error('Failed to import save:', error);
            return false;
        }
    }
}

export default StorageManager;
