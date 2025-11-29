/**
 * Diamond Sluggers - Power-Up System
 * 100% Original power-ups earned through gameplay
 */

export const POWER_UPS = [
    // BATTING POWER-UPS
    {
        id: 'mega-bat',
        name: 'Mega Bat',
        description: 'Your bat grows 3x larger for perfect contact',
        category: 'batting',
        duration: 10, // seconds
        cooldown: 3, // innings
        rarity: 'common',
        effect: {
            type: 'timing-window',
            multiplier: 3
        },
        visualEffect: 'bat-grow',
        soundEffect: 'power-up'
    },
    {
        id: 'eagle-eye',
        name: 'Eagle Eye',
        description: 'See the pitch trajectory before it arrives',
        category: 'batting',
        duration: 15,
        cooldown: 2,
        rarity: 'common',
        effect: {
            type: 'pitch-preview',
            duration: 15
        },
        visualEffect: 'trajectory-line',
        soundEffect: 'vision'
    },
    {
        id: 'power-surge',
        name: 'Power Surge',
        description: 'Triple home run distance for one at-bat',
        category: 'batting',
        duration: 0, // One at-bat
        cooldown: 4,
        rarity: 'rare',
        effect: {
            type: 'power-multiplier',
            multiplier: 3
        },
        visualEffect: 'lightning-bat',
        soundEffect: 'electric'
    },
    {
        id: 'time-freeze',
        name: 'Time Freeze',
        description: 'Slow down time to perfect your swing',
        category: 'batting',
        duration: 5,
        cooldown: 5,
        rarity: 'legendary',
        effect: {
            type: 'slow-motion',
            speedMultiplier: 0.3
        },
        visualEffect: 'time-distortion',
        soundEffect: 'whoosh'
    },

    // PITCHING POWER-UPS
    {
        id: 'smoke-ball',
        name: 'Smoke Ball',
        description: 'Pitch leaves a smoke trail, harder to track',
        category: 'pitching',
        duration: 0, // One pitch
        cooldown: 2,
        rarity: 'common',
        effect: {
            type: 'visibility-reduction',
            opacity: 0.4
        },
        visualEffect: 'smoke-trail',
        soundEffect: 'whoosh'
    },
    {
        id: 'curveball-king',
        name: 'Curveball King',
        description: 'Curveballs break twice as much',
        category: 'pitching',
        duration: 20,
        cooldown: 3,
        rarity: 'rare',
        effect: {
            type: 'break-multiplier',
            multiplier: 2
        },
        visualEffect: 'spin-lines',
        soundEffect: 'curve'
    },
    {
        id: 'heat-seeker',
        name: 'Heat Seeker',
        description: 'Fastball hits the corner every time',
        category: 'pitching',
        duration: 0, // One pitch
        cooldown: 4,
        rarity: 'rare',
        effect: {
            type: 'perfect-location',
            zone: 'corner'
        },
        visualEffect: 'target-lock',
        soundEffect: 'lock-on'
    },

    // FIELDING POWER-UPS
    {
        id: 'magnet-glove',
        name: 'Magnet Glove',
        description: 'Balls are attracted to your fielders',
        category: 'fielding',
        duration: 15,
        cooldown: 3,
        rarity: 'common',
        effect: {
            type: 'catch-radius',
            multiplier: 2
        },
        visualEffect: 'magnetic-field',
        soundEffect: 'magnet'
    },
    {
        id: 'rocket-arm',
        name: 'Rocket Arm',
        description: 'Throws are instant across the diamond',
        category: 'fielding',
        duration: 10,
        cooldown: 2,
        rarity: 'common',
        effect: {
            type: 'throw-speed',
            multiplier: 10
        },
        visualEffect: 'fire-trail',
        soundEffect: 'rocket'
    },
    {
        id: 'shadow-fielder',
        name: 'Shadow Fielder',
        description: 'Ghost fielder appears for one catch',
        category: 'fielding',
        duration: 0, // One play
        cooldown: 5,
        rarity: 'legendary',
        effect: {
            type: 'extra-fielder',
            position: 'optimal'
        },
        visualEffect: 'ghost-player',
        soundEffect: 'ethereal'
    },

    // BASERUNNING POWER-UPS
    {
        id: 'speed-boost',
        name: 'Speed Boost',
        description: 'Runners move 50% faster',
        category: 'baserunning',
        duration: 15,
        cooldown: 2,
        rarity: 'common',
        effect: {
            type: 'speed-multiplier',
            multiplier: 1.5
        },
        visualEffect: 'speed-lines',
        soundEffect: 'zoom'
    },
    {
        id: 'sticky-cleats',
        name: 'Sticky Cleats',
        description: "Can't be thrown out for one base advancement",
        category: 'baserunning',
        duration: 0, // One play
        cooldown: 4,
        rarity: 'rare',
        effect: {
            type: 'safe-advance',
            guaranteed: true
        },
        visualEffect: 'glow-feet',
        soundEffect: 'safe'
    },
    {
        id: 'teleport',
        name: 'Teleport',
        description: 'Runner instantly appears on next base',
        category: 'baserunning',
        duration: 0, // Instant
        cooldown: 6,
        rarity: 'legendary',
        effect: {
            type: 'instant-advance',
            bases: 1
        },
        visualEffect: 'poof',
        soundEffect: 'teleport'
    }
];

/**
 * Power-Up Trigger Conditions
 * Defines how power-ups are earned during gameplay
 */
export const POWER_UP_TRIGGERS = [
    { condition: 'perfectHit', chance: 0.3, pool: 'batting' },
    { condition: 'strikeout', chance: 0.2, pool: 'pitching' },
    { condition: 'divingCatch', chance: 0.4, pool: 'fielding' },
    { condition: 'stolenBase', chance: 0.25, pool: 'baserunning' },
    { condition: 'leadChange', chance: 0.5, pool: 'any' },
    { condition: 'clutchHit', chance: 0.6, pool: 'batting' },
    { condition: 'doublePlay', chance: 0.35, pool: 'fielding' },
    { condition: 'walkOff', chance: 0.8, pool: 'any' }
];

/**
 * Power-Up System Manager
 */
export class PowerUpSystem {
    constructor() {
        this.availablePowerUps = [];
        this.activePowerUps = [];
        this.cooldowns = new Map();
    }

    /**
     * Check if a power-up is earned based on game event
     */
    checkTrigger(event, gameState) {
        const trigger = POWER_UP_TRIGGERS.find(t => t.condition === event);
        if (!trigger) return null;

        if (Math.random() < trigger.chance) {
            return this.grantRandomPowerUp(trigger.pool);
        }

        return null;
    }

    /**
     * Grant a random power-up from specified pool
     */
    grantRandomPowerUp(pool) {
        const eligible = POWER_UPS.filter(p =>
            (pool === 'any' || p.category === pool) &&
            !this.isOnCooldown(p.id)
        );

        if (eligible.length === 0) return null;

        // Weighted selection by rarity
        const weights = {
            common: 60,
            rare: 30,
            legendary: 10
        };

        const weighted = [];
        for (const powerUp of eligible) {
            const count = weights[powerUp.rarity] || 10;
            for (let i = 0; i < count; i++) {
                weighted.push(powerUp);
            }
        }

        const selected = weighted[Math.floor(Math.random() * weighted.length)];
        this.availablePowerUps.push({ ...selected, grantedAt: Date.now() });

        return selected;
    }

    /**
     * Activate a power-up
     */
    activate(powerUpId) {
        const index = this.availablePowerUps.findIndex(p => p.id === powerUpId);
        if (index < 0) return false;

        const powerUp = this.availablePowerUps.splice(index, 1)[0];

        this.activePowerUps.push({
            ...powerUp,
            activatedAt: Date.now(),
            remainingDuration: powerUp.duration * 1000
        });

        // Set cooldown
        this.cooldowns.set(powerUpId, powerUp.cooldown);

        return true;
    }

    /**
     * Update active power-ups (call every frame)
     */
    update(deltaTime) {
        for (let i = this.activePowerUps.length - 1; i >= 0; i--) {
            const active = this.activePowerUps[i];

            // Duration-based power-ups
            if (active.duration > 0) {
                active.remainingDuration -= deltaTime;

                if (active.remainingDuration <= 0) {
                    this.activePowerUps.splice(i, 1);
                }
            }
        }
    }

    /**
     * Called at end of inning to reduce cooldowns
     */
    endInning() {
        for (const [id, remaining] of this.cooldowns) {
            if (remaining <= 1) {
                this.cooldowns.delete(id);
            } else {
                this.cooldowns.set(id, remaining - 1);
            }
        }
    }

    /**
     * Check if power-up is on cooldown
     */
    isOnCooldown(powerUpId) {
        return this.cooldowns.has(powerUpId);
    }

    /**
     * Get all active effects of a specific type
     */
    getActiveEffects(effectType) {
        return this.activePowerUps
            .filter(p => p.effect.type === effectType)
            .map(p => p.effect);
    }

    /**
     * Check if any active power-up has the specified effect
     */
    hasActiveEffect(effectType) {
        return this.activePowerUps.some(p => p.effect.type === effectType);
    }

    /**
     * Consume a one-time power-up after use
     */
    consumeOneTime(powerUpId) {
        const index = this.activePowerUps.findIndex(
            p => p.id === powerUpId && p.duration === 0
        );

        if (index >= 0) {
            this.activePowerUps.splice(index, 1);
            return true;
        }

        return false;
    }

    /**
     * Get available power-ups for UI display
     */
    getAvailable() {
        return this.availablePowerUps.map(p => ({
            id: p.id,
            name: p.name,
            description: p.description,
            category: p.category,
            rarity: p.rarity
        }));
    }

    /**
     * Get active power-ups for HUD display
     */
    getActive() {
        return this.activePowerUps.map(p => ({
            id: p.id,
            name: p.name,
            remainingDuration: p.remainingDuration,
            isOneTime: p.duration === 0
        }));
    }

    /**
     * Reset system (new game)
     */
    reset() {
        this.availablePowerUps = [];
        this.activePowerUps = [];
        this.cooldowns.clear();
    }
}

/**
 * Apply power-up effect to game state
 */
export function applyPowerUpEffect(powerUp, context) {
    const effect = powerUp.effect;

    switch (effect.type) {
        case 'timing-window':
            return {
                timingWindowMultiplier: effect.multiplier
            };

        case 'pitch-preview':
            return {
                showTrajectory: true,
                trajectoryDuration: effect.duration
            };

        case 'power-multiplier':
            return {
                powerMultiplier: effect.multiplier
            };

        case 'slow-motion':
            return {
                gameSpeed: effect.speedMultiplier
            };

        case 'visibility-reduction':
            return {
                ballOpacity: effect.opacity
            };

        case 'break-multiplier':
            return {
                breakMultiplier: effect.multiplier
            };

        case 'perfect-location':
            return {
                guaranteedStrike: true,
                locationZone: effect.zone
            };

        case 'catch-radius':
            return {
                catchRadiusMultiplier: effect.multiplier
            };

        case 'throw-speed':
            return {
                throwSpeedMultiplier: effect.multiplier
            };

        case 'extra-fielder':
            return {
                ghostFielder: true,
                ghostPosition: effect.position
            };

        case 'speed-multiplier':
            return {
                runSpeedMultiplier: effect.multiplier
            };

        case 'safe-advance':
            return {
                guaranteedSafe: effect.guaranteed
            };

        case 'instant-advance':
            return {
                teleportBases: effect.bases
            };

        default:
            return {};
    }
}

/**
 * Get power-up by ID
 */
export function getPowerUp(id) {
    return POWER_UPS.find(p => p.id === id);
}

/**
 * Get power-ups by category
 */
export function getPowerUpsByCategory(category) {
    return POWER_UPS.filter(p => p.category === category);
}

/**
 * Get power-ups by rarity
 */
export function getPowerUpsByRarity(rarity) {
    return POWER_UPS.filter(p => p.rarity === rarity);
}

export default {
    POWER_UPS,
    POWER_UP_TRIGGERS,
    PowerUpSystem,
    applyPowerUpEffect,
    getPowerUp,
    getPowerUpsByCategory,
    getPowerUpsByRarity
};
