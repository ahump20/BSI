import Phaser from 'phaser';

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

export default class UIScene extends Phaser.Scene {
  private scoreboard?: Phaser.GameObjects.Text;
  private countDisplay?: Phaser.GameObjects.Text;
  private banner?: Phaser.GameObjects.Text;

  constructor() {
    super('UI');
  }

  create() {
    const { width } = this.scale;
    this.scoreboard = this.add
      .text(width / 2, 48, '', {
        fontSize: '28px',
        fontFamily: 'Inter, system-ui, sans-serif',
        color: '#f8fafc'
      })
      .setOrigin(0.5);

    this.countDisplay = this.add
      .text(width / 2, 96, '', {
        fontSize: '18px',
        fontFamily: 'Inter, system-ui, sans-serif',
        color: '#bae6fd'
      })
      .setOrigin(0.5);

    this.banner = this.add
      .text(width / 2, 136, '', {
        fontSize: '20px',
        fontFamily: 'Inter, system-ui, sans-serif',
        color: '#facc15'
      })
      .setOrigin(0.5);
  }

  updateState(state: GameState, lastResult: string = '') {
    if (!this.scoreboard || !this.countDisplay) return;

    const halfLabel = state.half === 'top' ? 'Top' : 'Bottom';
    this.scoreboard.setText(
      `Inning ${state.inning} · ${halfLabel}\nPlayer ${state.playerScore} — CPU ${state.cpuScore}`
    );

    this.countDisplay.setText(`Balls ${state.balls}  Strikes ${state.strikes}  Outs ${state.outs}`);

    if (this.banner) {
      const messages: Record<string, string> = {
        perfect: 'Perfect swing! Bases clear.',
        good: 'Solid contact. Keep stacking.',
        early: 'Too early. Stay patient.',
        late: 'Late swing. Drive sooner.',
        'no-swing': 'Watch the break. Tap to swing.',
        transition: 'Switching halves. Lock back in.'
      };
      this.banner.setText(messages[lastResult] ?? '');
    }
  }

  showFinalScore(state: GameState) {
    if (!this.banner) return;

    const result =
      state.playerScore > state.cpuScore
        ? 'You won this sandlot showdown!'
        : state.playerScore === state.cpuScore
          ? 'Draw game. Rematch ready.'
          : 'CPU takes it. Dial in the timing.';

    this.banner.setText(result);
  }
}
