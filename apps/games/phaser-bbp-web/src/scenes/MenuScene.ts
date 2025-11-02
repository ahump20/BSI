import Phaser from 'phaser';

export default class MenuScene extends Phaser.Scene {
  constructor() {
    super('Menu');
  }

  create() {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor('#071224');

    this.add
      .text(width / 2, height * 0.25, 'Backyard Blaze Ball', {
        fontSize: '38px',
        fontFamily: 'Inter, system-ui, sans-serif',
        color: '#fbbf24',
        fontStyle: '700'
      })
      .setOrigin(0.5);

    this.add
      .text(
        width / 2,
        height * 0.35,
        'Three innings. Thumb-quick swings.\nTap to time your swing and chase rallies.',
        {
          fontSize: '18px',
          fontFamily: 'Inter, system-ui, sans-serif',
          color: '#e0f2fe',
          align: 'center',
          wordWrap: { width: width * 0.8 }
        }
      )
      .setOrigin(0.5);

    const playButton = this.add
      .rectangle(width / 2, height * 0.55, width * 0.6, 64, 0x1d4ed8, 1)
      .setInteractive({ useHandCursor: true })
      .setStrokeStyle(4, 0x93c5fd, 1);

    this.add
      .text(playButton.x, playButton.y, 'Tap to Play', {
        fontSize: '24px',
        fontFamily: 'Inter, system-ui, sans-serif',
        color: '#eff6ff'
      })
      .setOrigin(0.5);

    playButton.on('pointerup', () => {
      this.sound.play('bleep', { volume: 0.2 });
      this.scene.start('Game');
      this.scene.launch('UI');
    });

    const tutorialText = this.add
      .text(
        width / 2,
        height * 0.75,
        'Timing is everything. Watch the pitch arc.\nTap once to swing. Outs reset the frame.',
        {
          fontSize: '16px',
          fontFamily: 'Inter, system-ui, sans-serif',
          color: '#bae6fd',
          align: 'center',
          wordWrap: { width: width * 0.75 }
        }
      )
      .setOrigin(0.5);

    tutorialText.setLineSpacing(6);
  }
}
