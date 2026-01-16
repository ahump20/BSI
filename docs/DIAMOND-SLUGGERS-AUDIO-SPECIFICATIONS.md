# Diamond Sluggers - Audio Specifications

## Overview

This document outlines all audio assets required for the Diamond Sluggers mobile baseball game. All audio should be original or properly licensed royalty-free content.

---

## Background Music

### Required Tracks

| Track                | Duration  | Tempo       | Mood                      | Loop |
| -------------------- | --------- | ----------- | ------------------------- | ---- |
| Menu Theme           | 2-3 min   | 100-110 BPM | Upbeat, playful           | Yes  |
| Game Theme           | 3-4 min   | 120-130 BPM | Exciting, competitive     | Yes  |
| Victory Fanfare      | 15-20 sec | 140 BPM     | Triumphant, celebratory   | No   |
| Defeat Theme         | 10-15 sec | 80 BPM      | Somber but not depressing | No   |
| Home Run Celebration | 10 sec    | 150 BPM     | Explosive, exciting       | No   |

### Music Style Guidelines

- **Genre:** Upbeat instrumental, sports game style
- **Instruments:** Guitar, drums, brass, synth accents
- **Feel:** Fun, energetic, kid-friendly (no lyrics)
- **Inspiration:** Backyard Sports series, Mario sports games
- **Technical:** 44.1kHz, 16-bit, stereo MP3 (128kbps for mobile)

---

## Sound Effects

### Batting Sounds

| SFX           | Duration | Description                       |
| ------------- | -------- | --------------------------------- |
| bat_swing     | 0.3s     | Whoosh of bat through air         |
| bat_hit_solid | 0.5s     | Perfect contact, satisfying crack |
| bat_hit_weak  | 0.4s     | Weak contact, softer thud         |
| bat_hit_foul  | 0.4s     | Foul ball tick                    |
| bat_miss      | 0.3s     | Swing and miss whoosh             |

### Pitching Sounds

| SFX             | Duration | Description              |
| --------------- | -------- | ------------------------ |
| pitch_throw     | 0.3s     | Ball leaving hand        |
| pitch_fastball  | 0.4s     | Fast whoosh              |
| pitch_curveball | 0.5s     | Spinning, whirring sound |
| pitch_catch     | 0.3s     | Ball into catcher's mitt |

### Fielding Sounds

| SFX             | Duration | Description           |
| --------------- | -------- | --------------------- |
| catch_glove     | 0.3s     | Clean catch pop       |
| catch_diving    | 0.5s     | Dramatic dive catch   |
| throw_quick     | 0.3s     | Quick throw           |
| throw_long      | 0.5s     | Long distance throw   |
| ball_land_grass | 0.3s     | Ball landing on grass |
| ball_land_dirt  | 0.3s     | Ball landing on dirt  |

### Base Running Sounds

| SFX           | Duration    | Description       |
| ------------- | ----------- | ----------------- |
| run_footsteps | 0.5s (loop) | Running on dirt   |
| slide         | 0.6s        | Sliding into base |
| base_touch    | 0.2s        | Touching base     |
| safe_call     | 0.5s        | Umpire "Safe!"    |
| out_call      | 0.5s        | Umpire "Out!"     |

### Game Event Sounds

| SFX           | Duration | Description           |
| ------------- | -------- | --------------------- |
| homerun       | 1.5s     | Epic home run fanfare |
| strikeout     | 0.8s     | Strikeout punch sound |
| walk          | 0.5s     | Walk sound (positive) |
| inning_change | 1.0s     | Transition sound      |
| game_start    | 1.0s     | Play ball!            |
| game_over     | 1.5s     | Final out/end game    |

### UI Sounds

| SFX              | Duration | Description            |
| ---------------- | -------- | ---------------------- |
| button_click     | 0.1s     | Menu button tap        |
| button_hover     | 0.1s     | Menu button hover      |
| menu_open        | 0.3s     | Panel/menu opening     |
| menu_close       | 0.2s     | Panel/menu closing     |
| unlock_character | 1.0s     | New character unlocked |
| unlock_stadium   | 1.0s     | New stadium unlocked   |
| coins_collect    | 0.5s     | Coins earned jingle    |
| level_up         | 1.0s     | XP level up fanfare    |
| error            | 0.3s     | Error/invalid action   |

### Crowd Sounds

| SFX           | Duration    | Description            |
| ------------- | ----------- | ---------------------- |
| crowd_ambient | 3.0s (loop) | Background crowd noise |
| crowd_cheer   | 1.5s        | Big play cheer         |
| crowd_groan   | 1.0s        | Disappointed crowd     |
| crowd_gasp    | 0.8s        | Close play reaction    |

### Power-Up Sounds

| SFX              | Duration | Description             |
| ---------------- | -------- | ----------------------- |
| powerup_activate | 0.5s     | Power-up triggered      |
| powerup_ready    | 0.3s     | Power-up available      |
| powerup_mega_bat | 0.5s     | Mega bat activation     |
| powerup_speed    | 0.5s     | Speed boost activation  |
| powerup_magnet   | 0.5s     | Magnet glove activation |

---

## Voice Lines (Optional)

### Umpire Calls

| Line          | Variations | Notes                 |
| ------------- | ---------- | --------------------- |
| "Strike!"     | 3          | Different intensities |
| "Ball!"       | 2          | Neutral tone          |
| "You're out!" | 3          | Emphatic              |
| "Safe!"       | 2          | Clear call            |
| "Foul ball!"  | 2          | Quick call            |
| "Play ball!"  | 1          | Game start            |

### Announcer (Optional Enhancement)

| Line                       | Context              |
| -------------------------- | -------------------- |
| "Going, going, GONE!"      | Home run             |
| "What a catch!"            | Great defensive play |
| "He's outta there!"        | Strikeout            |
| "That's a base hit!"       | Single               |
| "And the crowd goes wild!" | Big moment           |

---

## Technical Specifications

### Format Requirements

| Type  | Format  | Sample Rate | Bit Depth | Notes                 |
| ----- | ------- | ----------- | --------- | --------------------- |
| Music | MP3     | 44.1kHz     | 128kbps   | Compressed for mobile |
| SFX   | WAV/OGG | 44.1kHz     | 16-bit    | Higher quality        |
| Voice | MP3     | 44.1kHz     | 128kbps   | Compressed            |

### Volume Guidelines

| Category | Default Volume | Notes                        |
| -------- | -------------- | ---------------------------- |
| Music    | 30%            | Background, not overpowering |
| SFX      | 70%            | Clear and responsive         |
| Voice    | 80%            | Easily heard                 |
| UI       | 50%            | Subtle but noticeable        |

### Implementation Notes

1. All audio should have clean starts/ends (no pops or clicks)
2. Loops should be seamless
3. SFX should be normalized to consistent levels
4. Include silence padding for mobile playback
5. Test on actual mobile devices for quality

---

## File Naming Convention

```
audio/
├── music/
│   ├── bgm-menu.mp3
│   ├── bgm-game.mp3
│   ├── bgm-victory.mp3
│   ├── bgm-defeat.mp3
│   └── bgm-homerun.mp3
├── sfx/
│   ├── bat/
│   │   ├── swing.wav
│   │   ├── hit-solid.wav
│   │   ├── hit-weak.wav
│   │   └── miss.wav
│   ├── pitch/
│   │   ├── throw.wav
│   │   ├── fastball.wav
│   │   └── catch.wav
│   ├── field/
│   │   ├── catch-glove.wav
│   │   ├── throw-quick.wav
│   │   └── ball-land-grass.wav
│   ├── ui/
│   │   ├── button-click.wav
│   │   ├── unlock.wav
│   │   └── coins.wav
│   └── crowd/
│       ├── ambient.wav
│       └── cheer.wav
└── voice/ (optional)
    ├── umpire/
    │   ├── strike-1.mp3
    │   └── out-1.mp3
    └── announcer/
        └── homerun.mp3
```

---

## Recommended Sources

### Royalty-Free Music

1. **Epidemic Sound** - High quality, game-friendly
2. **Artlist** - Cinematic and upbeat tracks
3. **Soundraw** - AI-generated, customizable
4. **YouTube Audio Library** - Free, limited selection

### Sound Effects

1. **Freesound.org** - Free CC sounds
2. **ZapSplat** - Free with attribution
3. **SoundSnap** - Professional SFX library
4. **BOOM Library** - Premium sports SFX

### Custom Creation

1. **Fiverr** - Composers and sound designers
2. **Upwork** - Audio professionals
3. **r/gamedev** - Community recommendations

---

## Budget Estimate

| Category                   | Count     | Est. Cost   | Total            |
| -------------------------- | --------- | ----------- | ---------------- |
| Original Music (5 tracks)  | 5         | $200/track  | $1,000           |
| Sound Effects Package      | ~50       | License fee | $100-500         |
| Voice Recording (optional) | ~20 lines | $5/line     | $100             |
| **Total Estimated**        |           |             | **$1,200-1,600** |

### Budget Option

Use royalty-free libraries with one-time license fee:

- **Envato Elements** - $16.50/month, unlimited downloads
- Covers music and SFX needs during development

---

## Audio Integration Code Reference

```typescript
// Phaser audio setup
class GameScene extends Phaser.Scene {
  preload() {
    this.load.audio('bgm-game', 'assets/audio/bgm-game.mp3');
    this.load.audio('sfx-hit', 'assets/audio/sfx/bat/hit-solid.wav');
  }

  create() {
    // Background music
    this.bgm = this.sound.add('bgm-game', { loop: true, volume: 0.3 });

    // Sound effects
    this.hitSound = this.sound.add('sfx-hit', { volume: 0.7 });
  }

  onHit() {
    if (this.registry.get('soundEnabled')) {
      this.hitSound.play();
    }
  }
}
```

---

_Document Version: 1.0_
_Last Updated: November 2025_
_Project: Diamond Sluggers by Blaze Sports Intel_
