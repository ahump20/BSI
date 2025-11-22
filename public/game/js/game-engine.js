/**
 * Diamond Sluggers - Game Engine
 * Mobile-optimized baseball game mechanics
 */

import { getCharacter, applyAbilityEffect } from './characters.js';
import { getStadium, applyWindEffect, checkFeatureCollision } from './stadiums.js';

export class GameEngine {
    constructor(gameState) {
        this.state = gameState;
        this.physicsTimeStep = 1000 / 60; // 60 FPS
        this.lastUpdate = Date.now();
    }

    /**
     * Main game loop update
     */
    update(deltaTime) {
        switch (this.state.gamePhase) {
            case 'pitching':
                this.updatePitching(deltaTime);
                break;
            case 'batting':
                this.updateBatting(deltaTime);
                break;
            case 'ball-in-play':
                this.updateBallInPlay(deltaTime);
                break;
            case 'baserunning':
                this.updateBaserunning(deltaTime);
                break;
            default:
                break;
        }

        this.lastUpdate = Date.now();
    }

    /**
     * Pitching phase - AI pitcher throws ball
     */
    updatePitching(deltaTime) {
        const pitch = this.state.currentPitch;

        if (!pitch.released) {
            // Wait for pitch windup
            pitch.windupTime += deltaTime;
            if (pitch.windupTime >= pitch.windupDuration) {
                this.releasePitch();
            }
        } else {
            // Ball is in flight to plate
            pitch.flightTime += deltaTime;
            const progress = pitch.flightTime / pitch.flightDuration;

            // Update ball position (parabolic arc)
            pitch.position.x = this.lerp(pitch.startPos.x, pitch.targetPos.x, progress);
            pitch.position.y = this.lerp(pitch.startPos.y, pitch.targetPos.y, progress);
            pitch.position.z = this.calculatePitchHeight(progress, pitch.type);

            // Check if pitch reached plate
            if (progress >= 1.0) {
                this.completePitch();
            }
        }
    }

    /**
     * Release the pitch from pitcher's hand
     */
    releasePitch() {
        const pitch = this.state.currentPitch;
        pitch.released = true;
        pitch.flightTime = 0;

        // Apply pitcher character ability
        const pitcher = getCharacter(this.state.currentPitcher);
        const abilityEffect = applyAbilityEffect(pitcher, this.state, 'pitch');

        if (abilityEffect && abilityEffect.ballOpacity) {
            pitch.opacity = abilityEffect.ballOpacity;
            pitch.duration = abilityEffect.duration;
        }
    }

    /**
     * Complete pitch - check for hit or miss
     */
    completePitch() {
        const pitch = this.state.currentPitch;
        const batter = getCharacter(this.state.currentBatter);

        if (this.state.swingTiming !== null) {
            // Batter swung - check timing
            const timingDiff = Math.abs(this.state.swingTiming - pitch.flightTime);
            const perfectWindow = 50; // 50ms perfect timing window
            const goodWindow = 150; // 150ms good timing window

            if (timingDiff < perfectWindow) {
                this.hitBall('perfect', batter, pitch);
            } else if (timingDiff < goodWindow) {
                this.hitBall('good', batter, pitch);
            } else {
                this.missedSwing();
            }
        } else {
            // Batter took the pitch
            this.checkPitchLocation(pitch);
        }

        this.state.swingTiming = null;
    }

    /**
     * Batter made contact with ball
     */
    hitBall(quality, batter, pitch) {
        const power = this.calculateHitPower(quality, batter, pitch);
        const angle = this.calculateHitAngle(quality, pitch);

        // Apply character ability
        const abilityEffect = applyAbilityEffect(batter, this.state, 'bat');
        if (abilityEffect) {
            if (abilityEffect.guaranteedHit) {
                quality = 'perfect';
            }
            if (abilityEffect.powerBonus) {
                power.distance *= (1 + abilityEffect.powerBonus);
            }
        }

        this.state.ball = {
            position: { x: 0, y: 0, z: 1 }, // Start at plate
            velocity: {
                x: Math.cos(angle) * power.speed,
                y: Math.sin(angle) * power.speed,
                z: power.launchAngle
            },
            rotation: { x: 0, y: 0, z: 0 },
            inPlay: true,
            quality: quality
        };

        this.state.gamePhase = 'ball-in-play';
        this.state.hitStreak = (this.state.hitStreak || 0) + 1;

        this.announceHit(quality);
    }

    /**
     * Calculate hit power based on timing and stats
     */
    calculateHitPower(quality, batter, pitch) {
        const stats = batter.stats;
        let powerMultiplier = 1.0;

        switch (quality) {
            case 'perfect':
                powerMultiplier = 1.5;
                break;
            case 'good':
                powerMultiplier = 1.0;
                break;
            default:
                powerMultiplier = 0.5;
                break;
        }

        // Mix of contact and power stats
        const effectivePower = (stats.power * 0.7 + stats.contact * 0.3) * powerMultiplier;

        return {
            distance: effectivePower * 15, // Max ~150 pixels
            speed: effectivePower * 2,
            launchAngle: 30 + (Math.random() - 0.5) * 20 // 20-40 degrees
        };
    }

    /**
     * Calculate hit angle (pull, center, opposite)
     */
    calculateHitAngle(quality, pitch) {
        const baseAngle = 45; // Degrees
        let angleVariation = 0;

        if (quality === 'perfect') {
            angleVariation = (Math.random() - 0.5) * 30; // ±15 degrees
        } else {
            angleVariation = (Math.random() - 0.5) * 60; // ±30 degrees
        }

        return (baseAngle + angleVariation) * Math.PI / 180;
    }

    /**
     * Update ball physics while in play
     */
    updateBallInPlay(deltaTime) {
        const ball = this.state.ball;
        const stadium = getStadium(this.state.currentStadium);
        const dt = deltaTime / 1000; // Convert to seconds

        // Apply gravity
        ball.velocity.z -= 9.8 * dt * 10; // Scaled gravity

        // Apply wind effect
        const windEffect = applyWindEffect(stadium, ball.velocity);
        ball.velocity.x = windEffect.x;
        ball.velocity.y = windEffect.y;

        // Update position
        ball.position.x += ball.velocity.x * dt * 50;
        ball.position.y += ball.velocity.y * dt * 50;
        ball.position.z += ball.velocity.z * dt * 50;

        // Update rotation for visual effect
        ball.rotation.x += ball.velocity.y * dt * 2;
        ball.rotation.y += ball.velocity.x * dt * 2;

        // Check for ball landing
        if (ball.position.z <= 0) {
            this.ballLanded();
        }

        // Check for feature collision
        const featureHit = checkFeatureCollision(stadium, ball.position);
        if (featureHit.hit) {
            this.handleFeatureHit(featureHit);
        }
    }

    /**
     * Ball landed - determine outcome
     */
    ballLanded() {
        const ball = this.state.ball;
        const stadium = getStadium(this.state.currentStadium);

        // Calculate distance from home plate
        const distance = Math.sqrt(ball.position.x ** 2 + ball.position.y ** 2);

        // Check if home run
        const fenceDistance = this.getFenceDistance(ball.position.x, stadium);
        if (distance >= fenceDistance) {
            this.homeRun();
            return;
        }

        // Determine hit type based on distance
        if (distance < 50) {
            this.infield Hit('single');
        } else if (distance < 100) {
            this.infieldHit('double');
        } else if (distance < fenceDistance * 0.85) {
            this.infieldHit('triple');
        } else {
            // Warning track out
            this.flyOut();
        }
    }

    /**
     * Get fence distance at given X position
     */
    getFenceDistance(x, stadium) {
        const dims = stadium.dimensions;
        const absX = Math.abs(x);

        if (absX < 50) {
            return dims.centerField;
        } else if (x < 0) {
            return dims.leftField;
        } else {
            return dims.rightField;
        }
    }

    /**
     * Home run!
     */
    homeRun() {
        const batter = getCharacter(this.state.currentBatter);
        const abilityEffect = applyAbilityEffect(batter, this.state, 'homerun');

        let points = 100;
        if (abilityEffect && abilityEffect.bonusPoints) {
            points += abilityEffect.bonusPoints;
        }

        this.state.score.home += 1;
        this.state.score.runs += 1;
        this.state.lastHit = 'homerun';

        this.announcePlay('HOME RUN!', points);
        this.advanceToNextBatter();
    }

    /**
     * Infield hit (single/double/triple)
     */
    infieldHit(hitType) {
        this.state.lastHit = hitType;
        this.state.gamePhase = 'baserunning';
        this.advanceBases(hitType);
        this.announcePlay(hitType.toUpperCase());
    }

    /**
     * Advance runners based on hit type
     */
    advanceBases(hitType) {
        const advances = {
            'single': 1,
            'double': 2,
            'triple': 3
        };

        const bases = advances[hitType];

        // Move existing runners
        for (let i = 3; i >= 1; i--) {
            if (this.state.bases[i]) {
                const newBase = i + bases;
                if (newBase > 3) {
                    this.state.score.home += 1;
                    this.state.score.runs += 1;
                } else {
                    this.state.bases[newBase] = this.state.bases[i];
                }
                this.state.bases[i] = null;
            }
        }

        // Place batter on base
        this.state.bases[bases] = this.state.currentBatter;

        this.advanceToNextBatter();
    }

    /**
     * Fly out - fielder caught it
     */
    flyOut() {
        this.state.outs += 1;
        this.state.hitStreak = 0;
        this.announcePlay('OUT');

        if (this.state.outs >= 3) {
            this.endInning();
        } else {
            this.advanceToNextBatter();
        }
    }

    /**
     * Missed swing - strike
     */
    missedSwing() {
        this.state.strikes += 1;
        this.announcePlay('STRIKE');

        if (this.state.strikes >= 3) {
            this.strikeOut();
        } else {
            this.setupNextPitch();
        }
    }

    /**
     * Strike out
     */
    strikeOut() {
        this.state.outs += 1;
        this.state.strikes = 0;
        this.state.balls = 0;
        this.state.hitStreak = 0;
        this.announcePlay('STRIKE OUT');

        if (this.state.outs >= 3) {
            this.endInning();
        } else {
            this.advanceToNextBatter();
        }
    }

    /**
     * Check pitch location (ball or strike)
     */
    checkPitchLocation(pitch) {
        const strikeZone = {
            minX: -0.5,
            maxX: 0.5,
            minY: 0.3,
            maxY: 1.2
        };

        const inStrikeZone = (
            pitch.targetPos.x >= strikeZone.minX &&
            pitch.targetPos.x <= strikeZone.maxX &&
            pitch.targetPos.y >= strikeZone.minY &&
            pitch.targetPos.y <= strikeZone.maxY
        );

        if (inStrikeZone) {
            this.state.strikes += 1;
            this.announcePlay('STRIKE');

            if (this.state.strikes >= 3) {
                this.strikeOut();
            }
        } else {
            this.state.balls += 1;
            this.announcePlay('BALL');

            if (this.state.balls >= 4) {
                this.walk();
            }
        }

        if (this.state.strikes < 3 && this.state.balls < 4) {
            this.setupNextPitch();
        }
    }

    /**
     * Walk - batter goes to first
     */
    walk() {
        this.state.balls = 0;
        this.state.strikes = 0;
        this.advanceBases('single');
        this.announcePlay('WALK');
    }

    /**
     * Setup next pitch
     */
    setupNextPitch() {
        this.state.currentPitch = {
            type: this.selectPitchType(),
            windupTime: 0,
            windupDuration: 800 + Math.random() * 400, // 800-1200ms
            flightTime: 0,
            flightDuration: 400 + Math.random() * 200, // 400-600ms
            released: false,
            startPos: { x: 0, y: 60, z: 2 },
            targetPos: this.selectPitchLocation(),
            position: { x: 0, y: 60, z: 2 },
            opacity: 1.0
        };

        this.state.gamePhase = 'pitching';
    }

    /**
     * Select pitch type (fastball, curveball, changeup)
     */
    selectPitchType() {
        const rand = Math.random();
        if (rand < 0.6) return 'fastball';
        if (rand < 0.85) return 'curveball';
        return 'changeup';
    }

    /**
     * Select where pitch will go
     */
    selectPitchLocation() {
        // Random location, sometimes in strike zone
        const inStrikeZone = Math.random() < 0.7;

        if (inStrikeZone) {
            return {
                x: -0.3 + Math.random() * 0.6,
                y: 0.4 + Math.random() * 0.7,
                z: 1.0
            };
        } else {
            return {
                x: -1.0 + Math.random() * 2.0,
                y: 0.2 + Math.random() * 1.0,
                z: 1.0
            };
        }
    }

    /**
     * Calculate pitch height during flight
     */
    calculatePitchHeight(progress, pitchType) {
        switch (pitchType) {
            case 'fastball':
                return 2.0 - progress * 1.0; // Relatively flat
            case 'curveball':
                return 2.0 + Math.sin(progress * Math.PI) * 0.5 - progress * 1.2; // Arc down
            case 'changeup':
                return 2.0 - progress * 1.1; // Drops
            default:
                return 2.0 - progress * 1.0;
        }
    }

    /**
     * Advance to next batter
     */
    advanceToNextBatter() {
        this.state.batterIndex = (this.state.batterIndex + 1) % this.state.lineup.length;
        this.state.currentBatter = this.state.lineup[this.state.batterIndex];
        this.state.strikes = 0;
        this.state.balls = 0;
        this.setupNextPitch();
    }

    /**
     * End current inning
     */
    endInning() {
        this.state.inning += 1;
        this.state.outs = 0;
        this.state.bases = { 1: null, 2: null, 3: null };
        this.state.strikes = 0;
        this.state.balls = 0;

        // Switch sides (in full game would be home/away)
        this.state.isTopInning = !this.state.isTopInning;

        if (this.state.inning > this.state.maxInnings) {
            this.endGame();
        } else {
            this.announcePlay(`END OF INNING ${this.state.inning - 1}`);
            this.setupNextPitch();
        }
    }

    /**
     * End game
     */
    endGame() {
        this.state.gamePhase = 'game-over';
        const won = this.state.score.home > this.state.score.away;
        this.announcePlay(won ? 'YOU WIN!' : 'GAME OVER');
    }

    /**
     * Handle feature hit (tree, crane, etc)
     */
    handleFeatureHit(featureHit) {
        const feature = featureHit.feature;
        this.announcePlay(`HIT THE ${feature.name.toUpperCase()}!`);

        // Apply feature effect
        switch (feature.type) {
            case 'tree':
                this.infieldHit('double');
                break;
            case 'obstacle':
                this.state.score.home += 50; // Bonus points
                break;
            default:
                break;
        }
    }

    /**
     * Announce play to UI
     */
    announcePlay(text, points = 0) {
        this.state.lastPlay = text;
        if (points > 0) {
            this.state.score.home += points;
        }

        // Accessibility announcement
        const announcer = document.getElementById('ariaAnnouncements');
        if (announcer) {
            announcer.textContent = text;
        }
    }

    /**
     * Announce hit quality
     */
    announceHit(quality) {
        const messages = {
            'perfect': '🔥 PERFECT HIT!',
            'good': '✓ Good Contact',
            'weak': 'Weak Contact'
        };
        this.announcePlay(messages[quality] || 'Hit!');
    }

    /**
     * Linear interpolation
     */
    lerp(start, end, t) {
        return start + (end - start) * t;
    }
}

export default GameEngine;
