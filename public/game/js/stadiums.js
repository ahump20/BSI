/**
 * Diamond Sluggers - Stadium System
 * 100% Original Texas-inspired backyard baseball fields
 */

export const STADIUMS = [
    {
        id: 'boerne-backyard',
        name: 'Boerne Backyard',
        location: 'Boerne, TX',
        description: 'Classic Texas hill country backyard with oak trees and a tire swing',
        theme: 'hill-country',
        environment: {
            background: '#87CEEB', // Sky blue
            grass: '#90EE90',
            dirt: '#D2691E',
            fence: '#8B4513'
        },
        dimensions: {
            leftField: 180,
            centerField: 220,
            rightField: 180
        },
        features: [
            {
                type: 'tree',
                name: 'Oak Tree',
                position: { x: -150, y: 200 },
                effect: 'Balls that hit the tree drop straight down for an automatic double'
            },
            {
                type: 'obstacle',
                name: 'Tire Swing',
                position: { x: 100, y: 190 },
                effect: 'Hit the tire for bonus points!'
            },
            {
                type: 'bonus',
                name: 'Hill Slope',
                position: { x: 0, y: 210 },
                effect: 'Ground balls roll faster uphill, slower downhill'
            }
        ],
        weather: {
            wind: { x: 0.5, y: 0 }, // Slight right wind
            temperature: 85,
            condition: 'sunny'
        },
        unlockCondition: 'starter'
    },
    {
        id: 'san-antonio-lot',
        name: 'San Antonio Sand Lot',
        location: 'San Antonio, TX',
        description: 'Dusty lot near the Alamo with unique southwest character',
        theme: 'desert',
        environment: {
            background: '#FFD700',
            grass: '#DAA520',
            dirt: '#D2B48C',
            fence: '#CD853F'
        },
        dimensions: {
            leftField: 190,
            centerField: 200,
            rightField: 210 // Asymmetric!
        },
        features: [
            {
                type: 'obstacle',
                name: 'Cactus Garden',
                position: { x: -180, y: 180 },
                effect: 'Balls landing in cactus are ground rule doubles'
            },
            {
                type: 'bonus',
                name: 'Desert Wind',
                position: { x: 0, y: 0 },
                effect: 'Strong crosswind affects all fly balls'
            },
            {
                type: 'feature',
                name: 'Lizard Rock',
                position: { x: 50, y: 150 },
                effect: 'Hit the rock for a lucky bounce'
            }
        ],
        weather: {
            wind: { x: -1.5, y: 0 }, // Strong left wind
            temperature: 95,
            condition: 'hot'
        },
        unlockCondition: 'win8'
    },
    {
        id: 'austin-treehouse',
        name: 'Austin Treehouse Field',
        location: 'Austin, TX',
        description: 'Shaded field beneath a massive treehouse fortress',
        theme: 'forest',
        environment: {
            background: '#228B22',
            grass: '#32CD32',
            dirt: '#8B4513',
            fence: '#2F4F2F'
        },
        dimensions: {
            leftField: 185,
            centerField: 230, // Deep center!
            rightField: 185
        },
        features: [
            {
                type: 'structure',
                name: 'Treehouse',
                position: { x: 0, y: 220 },
                effect: 'Home runs through treehouse opening earn triple points'
            },
            {
                type: 'obstacle',
                name: 'Rope Ladder',
                position: { x: -100, y: 190 },
                effect: 'Balls caught in ladder are automatic outs'
            },
            {
                type: 'bonus',
                name: 'Shade Zone',
                position: { x: 0, y: 100 },
                effect: 'Balls in shade are harder to see'
            }
        ],
        weather: {
            wind: { x: 0, y: 0.3 }, // Slight updraft
            temperature: 78,
            condition: 'partly-cloudy'
        },
        unlockCondition: 'win15'
    },
    {
        id: 'houston-bayou',
        name: 'Houston Bayou Diamond',
        location: 'Houston, TX',
        description: 'Field next to bayou with unpredictable weather',
        theme: 'wetlands',
        environment: {
            background: '#4682B4',
            grass: '#3CB371',
            dirt: '#A0522D',
            fence: '#708090'
        },
        dimensions: {
            leftField: 195,
            centerField: 210,
            rightField: 175 // Short porch in right!
        },
        features: [
            {
                type: 'hazard',
                name: 'Bayou Water',
                position: { x: 200, y: 150 },
                effect: 'Balls in water are home runs (but lost balls!)'
            },
            {
                type: 'obstacle',
                name: 'Dock',
                position: { x: 180, y: 170 },
                effect: 'Can catch balls off the dock for spectacular plays'
            },
            {
                type: 'weather',
                name: 'Humidity',
                position: { x: 0, y: 0 },
                effect: 'Heavy air makes balls drop faster'
            }
        ],
        weather: {
            wind: { x: 0.8, y: -0.5 }, // Swirling wind
            temperature: 92,
            condition: 'humid'
        },
        unlockCondition: 'win25'
    },
    {
        id: 'dallas-construction',
        name: 'Dallas Construction Site',
        location: 'Dallas, TX',
        description: 'Urban lot surrounded by construction equipment and barriers',
        theme: 'urban',
        environment: {
            background: '#696969',
            grass: '#556B2F',
            dirt: '#BC8F8F',
            fence: '#FFD700' // Caution tape!
        },
        dimensions: {
            leftField: 170,
            centerField: 240, // Huge center!
            rightField: 170
        },
        features: [
            {
                type: 'obstacle',
                name: 'Crane',
                position: { x: 0, y: 230 },
                effect: 'Home runs that hit the crane bucket score 5x points!'
            },
            {
                type: 'structure',
                name: 'Concrete Mixer',
                position: { x: -160, y: 160 },
                effect: 'Balls bounce unpredictably off construction equipment'
            },
            {
                type: 'bonus',
                name: 'Hard Hat Zone',
                position: { x: 120, y: 140 },
                effect: 'Doubles scored here earn safety bonus points'
            }
        ],
        weather: {
            wind: { x: 0, y: 0.8 }, // Strong updraft from city
            temperature: 88,
            condition: 'clear'
        },
        unlockCondition: 'win40'
    }
];

/**
 * Get stadium by ID
 */
export function getStadium(id) {
    return STADIUMS.find(s => s.id === id);
}

/**
 * Check if stadium is unlocked
 */
export function isStadiumUnlocked(stadiumId, playerStats) {
    const stadium = getStadium(stadiumId);
    if (!stadium) return false;

    const condition = stadium.unlockCondition;
    if (condition === 'starter') return true;

    const wins = playerStats.wins || 0;
    const unlockWins = parseInt(condition.replace('win', ''));
    return wins >= unlockWins;
}

/**
 * Get unlocked stadiums
 */
export function getUnlockedStadiums(playerStats) {
    return STADIUMS.filter(s => isStadiumUnlocked(s.id, playerStats));
}

/**
 * Calculate wind effect on ball
 */
export function applyWindEffect(stadium, ballVelocity) {
    const wind = stadium.weather.wind;
    return {
        x: ballVelocity.x + wind.x * 0.1,
        y: ballVelocity.y + wind.y * 0.1
    };
}

/**
 * Check if ball hit special feature
 */
export function checkFeatureCollision(stadium, ballPosition) {
    for (const feature of stadium.features) {
        const distance = Math.sqrt(
            Math.pow(ballPosition.x - feature.position.x, 2) +
            Math.pow(ballPosition.y - feature.position.y, 2)
        );

        // Hit feature if within 20 pixels
        if (distance < 20) {
            return {
                hit: true,
                feature: feature,
                effect: feature.effect
            };
        }
    }

    return { hit: false };
}

/**
 * Get stadium difficulty rating
 */
export function getStadiumDifficulty(stadium) {
    const dimensions = stadium.dimensions;
    const avgDistance = (dimensions.leftField + dimensions.centerField + dimensions.rightField) / 3;

    // Smaller stadiums = easier to hit home runs
    if (avgDistance < 190) return 'easy';
    if (avgDistance < 210) return 'medium';
    return 'hard';
}

/**
 * Generate random weather variation
 */
export function randomizeWeather(stadium) {
    const baseWeather = stadium.weather;
    return {
        wind: {
            x: baseWeather.wind.x + (Math.random() - 0.5) * 0.5,
            y: baseWeather.wind.y + (Math.random() - 0.5) * 0.5
        },
        temperature: baseWeather.temperature + (Math.random() - 0.5) * 10,
        condition: baseWeather.condition
    };
}

/**
 * Get stadium description with current weather
 */
export function getStadiumInfo(stadium, weather) {
    const difficulty = getStadiumDifficulty(stadium);
    const windSpeed = Math.sqrt(weather.wind.x ** 2 + weather.wind.y ** 2).toFixed(1);

    return {
        name: stadium.name,
        location: stadium.location,
        description: stadium.description,
        difficulty: difficulty,
        wind: `${windSpeed} mph`,
        temp: `${Math.round(weather.temperature)}°F`,
        dimensions: `${stadium.dimensions.leftField}' - ${stadium.dimensions.centerField}' - ${stadium.dimensions.rightField}'`
    };
}

export default {
    STADIUMS,
    getStadium,
    isStadiumUnlocked,
    getUnlockedStadiums,
    applyWindEffect,
    checkFeatureCollision,
    getStadiumDifficulty,
    randomizeWeather,
    getStadiumInfo
};
