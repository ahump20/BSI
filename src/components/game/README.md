# Backyard Baseball Game UI Components

A comprehensive mobile game UI system built on the BSI design system with a playful, kid-friendly aesthetic optimized for React Native.

## Design Philosophy

This UI system extends the core BSI design tokens while adding:

- **Playful typography** - Rounded, friendly fonts (Fredoka One, Nunito)
- **Larger touch targets** - 48px minimum, 80px for hero actions
- **Field-inspired colors** - Grass greens, dirt browns, sky blues
- **High contrast** - Optimized for outdoor/sunlight visibility
- **Celebration animations** - Confetti, bounces, glows

## Components

### MainMenu

The primary navigation hub featuring:

- Animated pulsing Play button with ember glow
- Character showcase with idle bob animation
- Currency display (coins/gems)
- Navigation to Settings, Leaderboard, Shop
- Player level badge

```tsx
import { MainMenu } from '@/components/game';

<MainMenu
  currency={{ coins: 2500, gems: 50 }}
  playerName="Slugger"
  playerLevel={12}
  featuredCharacter={selectedCharacter}
  onPlayPress={() => navigate('StadiumSelect')}
  onSettingsPress={() => navigate('Settings')}
  onLeaderboardPress={() => navigate('Leaderboard')}
  onShopPress={() => navigate('Shop')}
  onCharacterPress={() => navigate('CharacterSelect')}
/>;
```

### CharacterSelect

Grid-based character picker with:

- Character cards with rarity borders (common to legendary)
- Stats radar chart visualization
- Team roster builder (drag-to-add)
- Lock/unlock states with silhouettes
- Position indicators

```tsx
import { CharacterSelect } from '@/components/game';

<CharacterSelect
  characters={allCharacters}
  selectedTeam={myTeam}
  maxTeamSize={9}
  onCharacterSelect={(char) => addToTeam(char)}
  onCharacterDeselect={(char) => removeFromTeam(char)}
  onConfirm={() => navigate('Game')}
  onBack={() => navigate('MainMenu')}
/>;
```

### GameHUD

In-game heads-up display with:

- Scoreboard (home/away scores, inning with top/bottom indicator)
- Count display (balls, strikes, outs with dot indicators)
- Base diamond with runner positions
- Power-up slots with cooldown states
- Pitch count tracker
- Pause button

```tsx
import { GameHUD } from '@/components/game';

<GameHUD
  gameState={{
    inning: 3,
    isTopOfInning: false,
    homeScore: 4,
    awayScore: 2,
    outs: 1,
    strikes: 2,
    balls: 1,
    runners: { first: player1, second: null, third: player2 },
    pitchCount: 47,
    currentBatter: batter,
    currentPitcher: pitcher,
  }}
  powerUps={activePowerUps}
  isPaused={false}
  onPausePress={() => pauseGame()}
  onPowerUpUse={(powerUp) => usePowerUp(powerUp)}
/>;
```

### ResultsScreen

Post-game celebration with:

- Win/Loss/Tie animation (confetti for wins)
- Final score with animated reveal
- Stats breakdown (hits, runs, strikeouts, etc.)
- XP and coins earned with count-up animation
- New unlocks showcase
- Share functionality
- Rematch button

```tsx
import { ResultsScreen } from '@/components/game';

<ResultsScreen
  result={{
    outcome: 'win',
    finalScore: { home: 7, away: 3 },
    playerStats: {
      hits: 9,
      runs: 7,
      rbis: 5,
      strikeouts: 6,
      walks: 2,
      homeRuns: 2,
      stolenBases: 3,
      errors: 1,
    },
    xpEarned: 450,
    coinsEarned: 120,
    newUnlocks: ['Night Stadium', 'Power Hitter Badge'],
  }}
  onContinue={() => navigate('MainMenu')}
  onRematch={() => startRematch()}
  onShare={() => shareResults()}
/>;
```

### StadiumSelect

Stadium picker with:

- Preview cards with field images
- Time of day indicators (morning, noon, sunset, dusk, night)
- Weather badges (sunny, cloudy, rain, snow)
- Special rules display
- Lock states with unlock requirements

```tsx
import { StadiumSelect } from '@/components/game';

<StadiumSelect
  stadiums={allStadiums}
  selectedStadium={currentStadium}
  onStadiumSelect={(stadium) => selectStadium(stadium)}
  onConfirm={() => startGame()}
  onBack={() => navigate('CharacterSelect')}
/>;
```

## Design Tokens

### Game-Specific Colors

```typescript
import { gameColors } from '@/components/game';

// Field elements
gameColors.grass.base; // #4CAF50
gameColors.dirt.base; // #8D6E63
gameColors.sky.noon; // #64B5F6
gameColors.wood.bat; // #A1887F

// UI elements
gameColors.ui.buttonPrimary; // #FF6B35 (ember)
gameColors.ui.cardBackground; // #FAFAFA

// Status colors
gameColors.status.win; // #2E7D32
gameColors.status.loss; // #C62828
gameColors.status.rare; // #7B1FA2
gameColors.status.legendary; // #FFD700
```

### Typography

```typescript
import { gameTypography } from '@/components/game';

// Fonts
gameTypography.fontFamily.display; // 'Fredoka One'
gameTypography.fontFamily.body; // 'Nunito'
gameTypography.fontFamily.stats; // 'Bebas Neue'

// Sizes (in pixels for RN)
gameTypography.fontSize.base; // 16
gameTypography.fontSize['4xl']; // 36
```

### Touch Targets

All touch targets meet accessibility standards:

```typescript
import { touchTargets } from '@/components/game';

touchTargets.minimum; // 48px (WCAG minimum)
touchTargets.standard; // 56px (default buttons)
touchTargets.large; // 64px (primary actions)
touchTargets.extraLarge; // 80px (hero CTAs like Play)
```

### Shadows

React Native compatible shadow objects:

```typescript
import { gameShadows } from '@/components/game';

const styles = StyleSheet.create({
  card: {
    ...gameShadows.lg, // Applies shadowColor, shadowOffset, etc.
  },
  glowing: {
    ...gameShadows.glowOrange, // Ember glow effect
  },
});
```

## Accessibility

All components include:

- Proper `accessibilityRole` assignments
- `accessibilityLabel` for screen readers
- `accessibilityState` for selected/disabled states
- `prefers-reduced-motion` support (disables animations)
- Minimum 4.5:1 contrast ratios
- Focus indicators (2px solid burnt orange)

## Responsive Design

Components adapt to:

- **Landscape primary** - Main game orientation
- **Portrait fallback** - Adjusted layouts for menus
- **Tablet support** - Larger grid columns, side panels

Breakpoints:

- Phone portrait: 320px
- Phone landscape: 568px
- Tablet portrait: 768px
- Tablet landscape: 1024px

## BSI Integration

These components extend the core BSI design system:

| BSI Token               | Game Override | Purpose                |
| ----------------------- | ------------- | ---------------------- |
| `--color-brand-primary` | Inherited     | Burnt orange (#BF5700) |
| `--font-family-display` | Fredoka One   | Playful headlines      |
| `--radius-lg`           | Larger (16px) | Rounded corners        |
| `--shadow-glow-blaze`   | Enhanced      | More prominent glows   |

## File Structure

```
src/components/game/
├── tokens.ts          # Design tokens (colors, typography, spacing)
├── types.ts           # TypeScript interfaces
├── MainMenu.tsx       # Main navigation
├── CharacterSelect.tsx # Character picker
├── GameHUD.tsx        # In-game HUD
├── ResultsScreen.tsx  # Post-game results
├── StadiumSelect.tsx  # Stadium picker
├── index.ts           # Re-exports
└── README.md          # This file
```

## Dependencies

Required React Native packages:

```json
{
  "react-native-svg": "^14.0.0",
  "react-native": ">=0.72.0"
}
```

Optional (for web):

- Web fonts: Fredoka One, Nunito, Bebas Neue

## Contributing

When adding new components:

1. Follow BSI naming conventions
2. Use design tokens from `tokens.ts`
3. Include accessibility props
4. Support reduced motion
5. Test in landscape orientation
6. Verify 48px minimum touch targets
