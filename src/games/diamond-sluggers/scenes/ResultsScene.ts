/**
 * ResultsScene - Post-game results and rewards
 */

import Phaser from 'phaser';
import { API_ENDPOINTS } from '../config/game.config';
import type { MatchStats } from '../types';

interface ResultsSceneData {
  result: 'win' | 'loss' | 'tie';
  userScore: number;
  opponentScore: number;
  stats: MatchStats;
}

export class ResultsScene extends Phaser.Scene {
  private data!: ResultsSceneData;

  constructor() {
    super({ key: 'ResultsScene' });
  }

  init(data: ResultsSceneData): void {
    this.data = data;
  }

  create(): void {
    const { width, height } = this.cameras.main;
    const centerX = width / 2;

    // Background based on result
    const bgColor =
      this.data.result === 'win' ? 0x1a5f1a : this.data.result === 'tie' ? 0x5f5f1a : 0x5f1a1a;
    this.cameras.main.setBackgroundColor(bgColor);

    // Confetti for wins
    if (this.data.result === 'win') {
      this.createConfetti();
    }

    // Result text
    const resultText =
      this.data.result === 'win' ? 'VICTORY!' : this.data.result === 'tie' ? 'TIE GAME' : 'DEFEAT';
    const resultColor =
      this.data.result === 'win' ? '#FFD700' : this.data.result === 'tie' ? '#FFA500' : '#FF4444';

    this.add
      .text(centerX, 100, resultText, {
        fontFamily: 'Arial Black, sans-serif',
        fontSize: '72px',
        color: resultColor,
        stroke: '#000000',
        strokeThickness: 8,
      })
      .setOrigin(0.5);

    // Score
    this.add
      .text(centerX, 200, `${this.data.userScore} - ${this.data.opponentScore}`, {
        fontFamily: 'Arial Black, sans-serif',
        fontSize: '96px',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 6,
      })
      .setOrigin(0.5);

    // Stats panel
    this.createStatsPanel(centerX, 380);

    // Rewards (for wins)
    if (this.data.result === 'win') {
      this.createRewardsPanel(centerX, 580);
    }

    // Buttons
    this.createButton(centerX - 150, height - 100, 'PLAY AGAIN', () => {
      this.scene.start('GameScene', {
        stadium: 'boerne-backyard',
        opponent: 'cpu',
        difficulty: 'normal',
      });
    });

    this.createButton(centerX + 150, height - 100, 'MAIN MENU', () => {
      this.scene.start('MenuScene');
    });

    // Save match result to API
    this.saveMatchResult();
  }

  private createStatsPanel(x: number, y: number): void {
    const bg = this.add.graphics();
    bg.fillStyle(0x000000, 0.5);
    bg.fillRoundedRect(x - 200, y - 80, 400, 160, 15);

    const stats = [
      { label: 'Hits', value: this.data.stats.hits },
      { label: 'Home Runs', value: this.data.stats.homeRuns || 0 },
      { label: 'Strikeouts', value: this.data.stats.strikeouts || 0 },
      { label: 'Innings', value: this.data.stats.innings || 3 },
    ];

    stats.forEach((stat, i) => {
      const row = Math.floor(i / 2);
      const col = i % 2;
      const statX = x - 80 + col * 160;
      const statY = y - 40 + row * 60;

      this.add
        .text(statX, statY, stat.label, {
          fontFamily: 'Arial, sans-serif',
          fontSize: '16px',
          color: '#888888',
        })
        .setOrigin(0.5);

      this.add
        .text(statX, statY + 25, String(stat.value), {
          fontFamily: 'Arial Black, sans-serif',
          fontSize: '28px',
          color: '#ffffff',
        })
        .setOrigin(0.5);
    });
  }

  private createRewardsPanel(x: number, y: number): void {
    const bg = this.add.graphics();
    bg.fillStyle(0xffd700, 0.2);
    bg.fillRoundedRect(x - 150, y - 40, 300, 80, 10);

    // XP earned
    const xpEarned = 100 + this.data.stats.hits * 10 + this.data.stats.homeRuns * 50;
    this.add
      .text(x - 80, y, `+${xpEarned} XP`, {
        fontFamily: 'Arial Black, sans-serif',
        fontSize: '24px',
        color: '#00FF00',
      })
      .setOrigin(0.5);

    // Coins earned
    const coinsEarned = 50 + this.data.userScore * 10;
    this.add
      .text(x + 80, y, `+${coinsEarned}`, {
        fontFamily: 'Arial Black, sans-serif',
        fontSize: '24px',
        color: '#FFD700',
      })
      .setOrigin(0.5);

    // Update registry
    const currentCoins = this.registry.get('coins') || 0;
    this.registry.set('coins', currentCoins + coinsEarned);
  }

  private createButton(x: number, y: number, text: string, onClick: () => void): void {
    const bg = this.add.graphics();
    bg.fillStyle(0xbf5700, 1);
    bg.fillRoundedRect(-100, -30, 200, 60, 10);

    const label = this.add
      .text(0, 0, text, {
        fontFamily: 'Arial Black, sans-serif',
        fontSize: '20px',
        color: '#ffffff',
      })
      .setOrigin(0.5);

    const container = this.add.container(x, y, [bg, label]);
    container.setSize(200, 60);
    container.setInteractive({ useHandCursor: true });

    container.on('pointerdown', onClick);

    container.on('pointerover', () => {
      bg.clear();
      bg.fillStyle(0xff6b35, 1);
      bg.fillRoundedRect(-100, -30, 200, 60, 10);
    });

    container.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(0xbf5700, 1);
      bg.fillRoundedRect(-100, -30, 200, 60, 10);
    });
  }

  private createConfetti(): void {
    for (let i = 0; i < 50; i++) {
      const confetti = this.add.rectangle(
        Phaser.Math.Between(0, this.cameras.main.width),
        -20,
        Phaser.Math.Between(5, 15),
        Phaser.Math.Between(5, 15),
        Phaser.Math.RND.pick([0xff6b35, 0xffd700, 0x00ff00, 0xff69b4, 0x00bfff])
      );

      this.tweens.add({
        targets: confetti,
        y: this.cameras.main.height + 50,
        x: confetti.x + Phaser.Math.Between(-100, 100),
        angle: Phaser.Math.Between(0, 360),
        duration: Phaser.Math.Between(2000, 4000),
        delay: Phaser.Math.Between(0, 2000),
        repeat: -1,
      });
    }
  }

  private async saveMatchResult(): Promise<void> {
    const userId = this.registry.get('userId');

    try {
      const response = await fetch(`${API_ENDPOINTS.BASE_URL}${API_ENDPOINTS.MATCH_RESULT}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          opponentType: 'cpu',
          userScore: this.data.userScore,
          opponentScore: this.data.opponentScore,
          stadium: 'boerne-backyard',
          matchStats: this.data.stats,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Match saved:', result);

        // Check for new unlocks
        if (result.data?.newUnlocks) {
          const { characters, stadiums } = result.data.newUnlocks;
          if (characters?.length > 0 || stadiums?.length > 0) {
            this.showUnlockNotification(characters, stadiums);
          }
        }
      }
    } catch (error) {
      console.error('Failed to save match:', error);
    }
  }

  private showUnlockNotification(_characters: any[], _stadiums: any[]): void {
    const { width, height } = this.cameras.main;

    const notification = this.add.container(width / 2, height / 2 + 150);

    const bg = this.add.graphics();
    bg.fillStyle(0x000000, 0.9);
    bg.fillRoundedRect(-150, -40, 300, 80, 10);

    const text = this.add
      .text(0, 0, '🎉 NEW UNLOCK!', {
        fontFamily: 'Arial Black, sans-serif',
        fontSize: '24px',
        color: '#FFD700',
      })
      .setOrigin(0.5);

    notification.add([bg, text]);

    this.tweens.add({
      targets: notification,
      alpha: 0,
      y: notification.y - 50,
      delay: 3000,
      duration: 500,
    });
  }
}
