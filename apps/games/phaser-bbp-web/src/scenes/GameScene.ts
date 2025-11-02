import Phaser from 'phaser';
import type UIScene from './UIScene';
import { startSession, endSession, markProgress } from '../systems/analytics';

interface SwingWindow {
  start: number;
  end: number;
}

interface GameState {
  inning: number;
  half: 'top' | 'bottom';
  outs: number;
  balls: number;
  strikes: number;
  playerScore: number;
  cpuScore: number;
  pitchesThrown: number;
}

const MAX_INNINGS = 3;

export default class GameScene extends Phaser.Scene {
  private state: GameState;
  private ui?: UIScene;
  private swingWindow?: SwingWindow;
  private ballSprite?: Phaser.Physics.Arcade.Image;
  private batter?: Phaser.GameObjects.Sprite;
  private catcher?: Phaser.GameObjects.Sprite;
  private swingInProgress = false;
  private sessionClosed = false;

  constructor() {
    super('Game');
    this.state = this.initialState();
  }

  private initialState(): GameState {
    return {
      inning: 1,
      half: 'top',
      outs: 0,
      balls: 0,
      strikes: 0,
      playerScore: 0,
      cpuScore: 0,
      pitchesThrown: 0
    };
  }

  create() {
    this.state = this.initialState();
    this.sessionClosed = false;
    this.cameras.main.setBackgroundColor('#030712');

    const field = this.add.rectangle(210, 360, 380, 520, 0x0f172a, 1);
    field.setStrokeStyle(4, 0x1d4ed8);

    this.batter = this.add.sprite(110, 520, 'player');
    this.catcher = this.add.sprite(310, 520, 'catcher');
    this.ballSprite = this.physics.add.image(210, 520, 'ball');
    this.ballSprite.setCircle(20);
    this.ballSprite.setBounce(0.4, 0.4);

    this.input.on('pointerdown', this.handleSwing, this);

    this.time.delayedCall(600, () => this.startPitch());

    this.ui = this.scene.get('UI') as UIScene;
    this.ui?.updateState(this.state);

    startSession();
    markProgress({ state: { ...this.state } });

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      if (this.sessionClosed) return;
      this.sessionClosed = true;
      endSession({
        playerScore: this.state.playerScore,
        cpuScore: this.state.cpuScore,
        innings: this.state.inning,
        shutdown: true,
      });
    });
  }

  private startPitch() {
    if (!this.ballSprite) return;

    this.swingInProgress = false;
    this.ballSprite.setPosition(210, 520);
    this.ballSprite.setVelocity(0, 0);

    const pitchType = Phaser.Math.RND.pick(['heater', 'dropper', 'slider']);
    const travelTime = Phaser.Math.Between(900, 1500);

    const controlPoints = {
      heater: [
        new Phaser.Math.Vector2(210, 520),
        new Phaser.Math.Vector2(210, 420),
        new Phaser.Math.Vector2(200, 260),
        new Phaser.Math.Vector2(210, 160)
      ],
      dropper: [
        new Phaser.Math.Vector2(210, 520),
        new Phaser.Math.Vector2(205, 440),
        new Phaser.Math.Vector2(205, 260),
        new Phaser.Math.Vector2(210, 170)
      ],
      slider: [
        new Phaser.Math.Vector2(210, 520),
        new Phaser.Math.Vector2(220, 420),
        new Phaser.Math.Vector2(240, 260),
        new Phaser.Math.Vector2(230, 165)
      ]
    };

    const curve = new Phaser.Curves.CubicBezier(
      controlPoints[pitchType][0],
      controlPoints[pitchType][1],
      controlPoints[pitchType][2],
      controlPoints[pitchType][3]
    );

    this.swingWindow = {
      start: this.time.now + travelTime * 0.55,
      end: this.time.now + travelTime * 0.9
    };

    this.tweens.add({
      targets: this.ballSprite,
      duration: travelTime,
      ease: 'Sine.easeIn',
      onUpdate: (_tween, _target, key, current) => {
        if (!this.ballSprite) return;
        const t = current as number;
        const point = curve.getPoint(t);
        this.ballSprite.setPosition(point.x, point.y);
      },
      onComplete: () => this.resolvePitch('no-swing')
    });
  }

  private handleSwing() {
    if (!this.swingWindow || this.swingInProgress) {
      return;
    }

    this.swingInProgress = true;
    const now = this.time.now;

    if (now < this.swingWindow.start) {
      this.resolvePitch('early');
    } else if (now > this.swingWindow.end) {
      this.resolvePitch('late');
    } else {
      const perfect = now < this.swingWindow.start + (this.swingWindow.end - this.swingWindow.start) * 0.45;
      this.resolvePitch(perfect ? 'perfect' : 'good');
    }
  }

  private resolvePitch(result: 'perfect' | 'good' | 'early' | 'late' | 'no-swing') {
    if (!this.ballSprite) return;

    this.state.pitchesThrown += 1;

    if (result === 'perfect' || result === 'good') {
      const bases = result === 'perfect' ? Phaser.Math.Between(2, 4) : Phaser.Math.Between(1, 3);
      const runs = this.calculateRuns(bases);
      this.state.playerScore += runs;
      this.sound.play('bleep', { volume: 0.25 });
      this.advanceInningIfNeeded();
    } else if (result === 'no-swing') {
      this.state.balls += 1;
      if (this.state.balls >= 4) {
        this.state.balls = 0;
        this.state.strikes = 0;
        this.state.playerScore += 1;
      }
    } else {
      this.state.strikes += 1;
      if (this.state.strikes >= 3) {
        this.state.outs += 1;
        this.state.strikes = 0;
        this.state.balls = 0;
      }
    }

    markProgress({
      state: { ...this.state },
      pitchResult: result,
    });

    if (this.state.outs >= 3) {
      this.handleHalfInningComplete();
    } else if (this.state.balls >= 4 || this.state.strikes >= 3) {
      this.time.delayedCall(800, () => this.startPitch());
    } else {
      this.time.delayedCall(600, () => this.startPitch());
    }

    this.ui?.updateState(this.state, result);
  }

  private calculateRuns(bases: number): number {
    // CPU scoring chance for challenge.
    if (Phaser.Math.Between(0, 100) > 70) {
      this.state.cpuScore += Phaser.Math.Between(0, 1);
    }
    return bases >= 4 ? 2 : 1;
  }

  private handleHalfInningComplete() {
    this.state.outs = 0;
    this.state.balls = 0;
    this.state.strikes = 0;

    if (this.state.half === 'top') {
      this.state.half = 'bottom';
      this.time.delayedCall(1000, () => this.startPitch());
    } else {
      if (this.state.inning >= MAX_INNINGS) {
        this.endGame();
      } else {
        this.state.inning += 1;
        this.state.half = 'top';
        this.time.delayedCall(1000, () => this.startPitch());
      }
    }

    this.ui?.updateState(this.state, 'transition');
  }

  private advanceInningIfNeeded() {
    if (this.state.pitchesThrown % 12 === 0) {
      this.state.outs = Math.min(this.state.outs + 1, 3);
    }
  }

  private endGame() {
    this.ui?.showFinalScore(this.state);
    if (!this.sessionClosed) {
      this.sessionClosed = true;
      endSession({
        playerScore: this.state.playerScore,
        cpuScore: this.state.cpuScore,
        innings: this.state.inning,
      });
    }
    this.time.delayedCall(2400, () => {
      this.scene.stop('UI');
      this.scene.start('Menu');
    });
  }
}
