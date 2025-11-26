/**
 * Diamond Sluggers - Character System
 * 100% Original IP - No copyright infringement
 *
 * 12 unique kid players with diverse backgrounds and abilities
 * All names, designs, and stats are completely original
 */

export const CHARACTERS = [
    {
        id: 'maya-thunder',
        name: 'Maya Thunder',
        emoji: '⚡',
        age: 11,
        hometown: 'Boerne, TX',
        bio: 'Lightning-fast outfielder with incredible instincts',
        stats: {
            power: 6,
            contact: 8,
            speed: 10,
            fielding: 9,
            pitching: 5
        },
        ability: {
            name: 'Thunder Steal',
            description: 'Steals bases 75% faster with 90% success rate',
            cooldown: 2
        },
        colors: {
            primary: '#FFD700',
            secondary: '#1E90FF'
        },
        unlockCondition: 'starter' // Available from start
    },
    {
        id: 'jackson-rocket',
        name: 'Jackson "Rocket" Rodriguez',
        emoji: '🚀',
        age: 12,
        hometown: 'San Antonio, TX',
        bio: 'Power hitter who crushes homers over the fence',
        stats: {
            power: 10,
            contact: 6,
            speed: 5,
            fielding: 7,
            pitching: 6
        },
        ability: {
            name: 'Launch Pad',
            description: 'Next home run goes 50% farther for bonus points',
            cooldown: 3
        },
        colors: {
            primary: '#E74C3C',
            secondary: '#C0392B'
        },
        unlockCondition: 'starter'
    },
    {
        id: 'emma-glove',
        name: 'Emma "Glove" Chen',
        emoji: '🧤',
        age: 10,
        hometown: 'Austin, TX',
        bio: 'Defensive wizard who makes impossible catches look easy',
        stats: {
            power: 5,
            contact: 7,
            speed: 7,
            fielding: 10,
            pitching: 7
        },
        ability: {
            name: 'Gold Glove Dive',
            description: 'Can catch any ball within the field for one play',
            cooldown: 4
        },
        colors: {
            primary: '#F39C12',
            secondary: '#E67E22'
        },
        unlockCondition: 'starter'
    },
    {
        id: 'tyler-knuckle',
        name: 'Tyler "Knuckle" Williams',
        emoji: '🎯',
        age: 11,
        hometown: 'Houston, TX',
        bio: 'Crafty pitcher with pinpoint accuracy and tricky moves',
        stats: {
            power: 4,
            contact: 6,
            speed: 6,
            fielding: 8,
            pitching: 10
        },
        ability: {
            name: 'Phantom Ball',
            description: 'Next pitch becomes nearly invisible for 2 seconds',
            cooldown: 3
        },
        colors: {
            primary: '#3498DB',
            secondary: '#2980B9'
        },
        unlockCondition: 'win5' // Unlock after 5 wins
    },
    {
        id: 'sophia-spark',
        name: 'Sophia "Spark" Martinez',
        emoji: '✨',
        age: 12,
        hometown: 'Dallas, TX',
        bio: 'All-around player with clutch performance in big moments',
        stats: {
            power: 7,
            contact: 8,
            speed: 8,
            fielding: 8,
            pitching: 7
        },
        ability: {
            name: 'Clutch Mode',
            description: 'All stats increase by 20% in final inning',
            cooldown: 0 // Passive ability
        },
        colors: {
            primary: '#9B59B6',
            secondary: '#8E44AD'
        },
        unlockCondition: 'win10'
    },
    {
        id: 'marcus-dash',
        name: 'Marcus "Dash" Johnson',
        emoji: '💨',
        age: 11,
        hometown: 'Fort Worth, TX',
        bio: 'Speedy center fielder who covers the whole outfield',
        stats: {
            power: 5,
            contact: 7,
            speed: 10,
            fielding: 9,
            pitching: 4
        },
        ability: {
            name: 'Wind Sprint',
            description: 'Moves twice as fast for 10 seconds',
            cooldown: 4
        },
        colors: {
            primary: '#1ABC9C',
            secondary: '#16A085'
        },
        unlockCondition: 'win15'
    },
    {
        id: 'olivia-cannon',
        name: 'Olivia "Cannon" Lee',
        emoji: '💪',
        age: 12,
        hometown: 'Arlington, TX',
        bio: 'Strong-armed catcher with a rifle throw to second',
        stats: {
            power: 8,
            contact: 7,
            speed: 4,
            fielding: 9,
            pitching: 6
        },
        ability: {
            name: 'Laser Throw',
            description: 'Throws out any base stealer for one play',
            cooldown: 3
        },
        colors: {
            primary: '#E67E22',
            secondary: '#D35400'
        },
        unlockCondition: 'win20'
    },
    {
        id: 'carlos-magic',
        name: 'Carlos "Magic" Garcia',
        emoji: '🎩',
        age: 10,
        hometown: 'El Paso, TX',
        bio: 'Trick-shot specialist who makes impossible plays',
        stats: {
            power: 6,
            contact: 9,
            speed: 7,
            fielding: 8,
            pitching: 7
        },
        ability: {
            name: 'Lucky Bounce',
            description: '15% chance any fair ball becomes a hit',
            cooldown: 0 // Passive chance
        },
        colors: {
            primary: '#34495E',
            secondary: '#2C3E50'
        },
        unlockCondition: 'win25'
    },
    {
        id: 'isabella-ice',
        name: 'Isabella "Ice" Nguyen',
        emoji: '❄️',
        age: 11,
        hometown: 'Plano, TX',
        bio: 'Cool under pressure with nerves of steel',
        stats: {
            power: 7,
            contact: 8,
            speed: 6,
            fielding: 7,
            pitching: 9
        },
        ability: {
            name: 'Ice Cold',
            description: 'No pressure penalties in high-leverage situations',
            cooldown: 0 // Always active
        },
        colors: {
            primary: '#ECF0F1',
            secondary: '#BDC3C7'
        },
        unlockCondition: 'win30'
    },
    {
        id: 'ryan-wall',
        name: 'Ryan "The Wall" Brown',
        emoji: '🛡️',
        age: 12,
        hometown: 'Corpus Christi, TX',
        bio: 'First baseman who blocks everything that comes his way',
        stats: {
            power: 8,
            contact: 7,
            speed: 4,
            fielding: 10,
            pitching: 5
        },
        ability: {
            name: 'Iron Wall',
            description: 'Prevents all ground balls from getting through infield',
            cooldown: 5
        },
        colors: {
            primary: '#95A5A6',
            secondary: '#7F8C8D'
        },
        unlockCondition: 'win35'
    },
    {
        id: 'lily-zoom',
        name: 'Lily "Zoom" Park',
        emoji: '🎨',
        age: 10,
        hometown: 'Frisco, TX',
        bio: 'Creative player who finds unique ways to score runs',
        stats: {
            power: 6,
            contact: 9,
            speed: 9,
            fielding: 7,
            pitching: 6
        },
        ability: {
            name: 'Creative Play',
            description: 'Can turn singles into doubles with smart baserunning',
            cooldown: 2
        },
        colors: {
            primary: '#FF69B4',
            secondary: '#FF1493'
        },
        unlockCondition: 'win40'
    },
    {
        id: 'diego-fire',
        name: 'Diego "Fire" Ramirez',
        emoji: '🔥',
        age: 12,
        hometown: 'Laredo, TX',
        bio: 'Fiery competitor with unstoppable determination',
        stats: {
            power: 9,
            contact: 8,
            speed: 7,
            fielding: 8,
            pitching: 8
        },
        ability: {
            name: 'Hot Streak',
            description: 'Each consecutive hit increases power by 15%',
            cooldown: 0 // Builds naturally
        },
        colors: {
            primary: '#FF4500',
            secondary: '#FF6347'
        },
        unlockCondition: 'win50'
    },
    // NEW CHARACTERS - Achievement-based unlocks
    {
        id: 'zoe-whirlwind',
        name: 'Zoe "Whirlwind" Washington',
        emoji: '🌪️',
        age: 11,
        hometown: 'Waco, TX',
        bio: 'Pitcher with devastating spin and unpredictable movement',
        stats: {
            power: 5,
            contact: 7,
            speed: 8,
            fielding: 7,
            pitching: 9
        },
        ability: {
            name: 'Tornado Curve',
            description: 'Curveball breaks twice as much for 3 pitches',
            cooldown: 4
        },
        colors: {
            primary: '#8B5CF6',
            secondary: '#6D28D9'
        },
        unlockCondition: 'tournament-win',
        voiceLines: {
            selected: "Let's spin 'em dizzy!",
            homeRun: "That's outta here!",
            strikeout: 'Sit down!'
        }
    },
    {
        id: 'theo-calculator',
        name: 'Theo "Calculator" Kim',
        emoji: '🧮',
        age: 10,
        hometown: 'Sugar Land, TX',
        bio: 'Math whiz who calculates the perfect pitch location every time',
        stats: {
            power: 4,
            contact: 10,
            speed: 5,
            fielding: 8,
            pitching: 8
        },
        ability: {
            name: 'Probability Shield',
            description: "See pitch location before it's thrown (batting only)",
            cooldown: 5
        },
        colors: {
            primary: '#0EA5E9',
            secondary: '#0284C7'
        },
        unlockCondition: 'perfect-game',
        voiceLines: {
            selected: "I've done the math.",
            homeRun: 'Statistically inevitable!',
            strikeout: 'Calculated.'
        }
    },
    {
        id: 'mia-shadow',
        name: 'Mia "Shadow" Okonkwo',
        emoji: '🌑',
        age: 12,
        hometown: 'Midland, TX',
        bio: 'Stealthy outfielder who appears out of nowhere for impossible catches',
        stats: {
            power: 6,
            contact: 8,
            speed: 9,
            fielding: 10,
            pitching: 4
        },
        ability: {
            name: 'Vanish Catch',
            description: 'Teleport to any fly ball location instantly (once per inning)',
            cooldown: 0 // Per-inning cooldown
        },
        colors: {
            primary: '#1F2937',
            secondary: '#111827'
        },
        unlockCondition: 'home-run-robbed-3',
        voiceLines: {
            selected: 'Now you see me...',
            homeRun: 'From the shadows!',
            strikeout: '...'
        }
    },
    {
        id: 'pete-powerhouse',
        name: 'Pete "Powerhouse" Gonzalez',
        emoji: '💥',
        age: 12,
        hometown: 'Amarillo, TX',
        bio: 'The strongest kid in Texas with legendary home run power',
        stats: {
            power: 10,
            contact: 5,
            speed: 3,
            fielding: 6,
            pitching: 4
        },
        ability: {
            name: 'Mega Slam',
            description: 'Next home run clears any fence by 100ft and scores all runners',
            cooldown: 6
        },
        colors: {
            primary: '#DC2626',
            secondary: '#991B1B'
        },
        unlockCondition: 'grand-slam',
        voiceLines: {
            selected: 'Time to crush it!',
            homeRun: 'BOOM!',
            strikeout: "I'll get it next time."
        }
    }
];

/**
 * Get character by ID
 */
export function getCharacter(id) {
    return CHARACTERS.find(c => c.id === id);
}

/**
 * Check if character is unlocked based on player progress
 */
export function isCharacterUnlocked(characterId, playerStats) {
    const character = getCharacter(characterId);
    if (!character) return false;

    const condition = character.unlockCondition;
    if (condition === 'starter') return true;

    const wins = playerStats.wins || 0;
    const unlockWins = parseInt(condition.replace('win', ''));
    return wins >= unlockWins;
}

/**
 * Get all unlocked characters
 */
export function getUnlockedCharacters(playerStats) {
    return CHARACTERS.filter(c => isCharacterUnlocked(c.id, playerStats));
}

/**
 * Calculate overall rating for a character
 */
export function calculateOverallRating(character) {
    const stats = character.stats;
    return Math.round(
        (stats.power + stats.contact + stats.speed + stats.fielding + stats.pitching) / 5
    );
}

/**
 * Get character display stats
 */
export function getCharacterDisplayStats(character) {
    return {
        overall: calculateOverallRating(character),
        ...character.stats
    };
}

/**
 * Apply character ability effect
 */
export function applyAbilityEffect(character, gameState, abilityContext) {
    const ability = character.ability;

    switch (character.id) {
        case 'maya-thunder':
            if (abilityContext === 'steal') {
                return {
                    stealSpeedBonus: 0.75,
                    stealSuccessRate: 0.90
                };
            }
            break;

        case 'jackson-rocket':
            if (abilityContext === 'homerun') {
                return {
                    distanceBonus: 0.50,
                    bonusPoints: 100
                };
            }
            break;

        case 'emma-glove':
            if (abilityContext === 'catch') {
                return {
                    catchAnything: true
                };
            }
            break;

        case 'tyler-knuckle':
            if (abilityContext === 'pitch') {
                return {
                    ballOpacity: 0.2,
                    duration: 2000
                };
            }
            break;

        case 'sophia-spark':
            if (gameState.inning >= gameState.maxInnings) {
                return {
                    allStatsBonus: 0.20
                };
            }
            break;

        case 'marcus-dash':
            if (abilityContext === 'fielding') {
                return {
                    speedBonus: 2.0,
                    duration: 10000
                };
            }
            break;

        case 'olivia-cannon':
            if (abilityContext === 'throw') {
                return {
                    perfectThrow: true
                };
            }
            break;

        case 'carlos-magic':
            if (abilityContext === 'bat' && Math.random() < 0.15) {
                return {
                    guaranteedHit: true
                };
            }
            break;

        case 'isabella-ice':
            if (gameState.highPressure) {
                return {
                    noPressurePenalty: true
                };
            }
            break;

        case 'ryan-wall':
            if (abilityContext === 'groundball') {
                return {
                    blockAll: true
                };
            }
            break;

        case 'lily-zoom':
            if (abilityContext === 'baserunning' && gameState.lastHit === 'single') {
                return {
                    extraBase: true
                };
            }
            break;

        case 'diego-fire':
            if (gameState.hitStreak > 0) {
                return {
                    powerBonus: gameState.hitStreak * 0.15
                };
            }
            break;
    }

    return null;
}

/**
 * Get random opponent team
 */
export function generateOpponentTeam() {
    // Shuffle and pick random characters
    const shuffled = [...CHARACTERS].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 9).map(c => c.id);
}

export default {
    CHARACTERS,
    getCharacter,
    isCharacterUnlocked,
    getUnlockedCharacters,
    calculateOverallRating,
    getCharacterDisplayStats,
    applyAbilityEffect,
    generateOpponentTeam
};
