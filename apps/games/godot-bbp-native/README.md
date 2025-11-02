# Original Baseball Game - Native Version (Godot)

A native baseball batting game for desktop and mobile platforms, built with Godot 4.x.

## ⚠️ Legal Notice

This game contains **100% original content**. No Backyard Baseball assets, characters, names, or distinctive visual elements are used or referenced.

## Status: STUB PROJECT

This is currently a **stub/placeholder project** for future native builds. The web version (Phaser) is the primary implementation.

## Roadmap

### Phase 1: Foundation (Current)
- [x] Project structure
- [x] Menu scene placeholder
- [x] Game scene placeholder
- [ ] Port core game mechanics from Phaser version

### Phase 2: Core Gameplay
- [ ] Batting mechanics with touch controls
- [ ] Ball physics and trajectories
- [ ] Scoring and inning system
- [ ] Simple AI pitcher

### Phase 3: Polish
- [ ] Original character sprites
- [ ] Sound effects and music
- [ ] Multiple difficulty levels
- [ ] Save/load game state

### Phase 4: Platform Builds
- [ ] Android (APK)
- [ ] iOS (requires Mac)
- [ ] Desktop (Windows, macOS, Linux)

## Requirements

- **Godot 4.3+** (download from https://godotengine.org/)
- Mobile export templates for Android/iOS builds

## Development

### Open Project

1. Download and install Godot 4.3+
2. Open Godot Project Manager
3. Click "Import"
4. Navigate to this directory
5. Select `project.godot`
6. Click "Import & Edit"

### Run in Editor

Press **F5** or click the Play button in Godot Editor.

### Export Builds

1. Go to **Project > Export**
2. Add export preset (Android, iOS, or Desktop)
3. Configure signing and permissions
4. Click "Export Project"

See [Godot Export Documentation](https://docs.godotengine.org/en/stable/tutorials/export/index.html).

## Project Structure

```
godot-bbp-native/
├── project.godot        # Godot project configuration
├── scenes/              # Game scenes
│   ├── Menu.tscn       # Main menu (implemented)
│   └── Game.tscn       # Gameplay scene (placeholder)
├── scripts/             # GDScript game logic
│   └── Menu.gd         # Menu scene script
├── assets/              # Game assets
│   ├── sprites/        # Character and object sprites
│   └── audio/          # Sound effects and music
└── README.md           # This file
```

## Porting from Web Version

The Phaser web version (`../phaser-bbp-web`) contains the complete game logic. To port to Godot:

1. **Review Phaser logic**:
   - `src/systems/PhysicsSystem.ts` → Port to `scripts/PhysicsSystem.gd`
   - `src/systems/GameState.ts` → Port to `scripts/GameState.gd`
   - `src/scenes/GameScene.ts` → Port to `scenes/Game.tscn` + script

2. **Implement in GDScript**:
   - Create similar class structure
   - Use Godot's built-in physics (RigidBody2D, Area2D)
   - Implement touch input with `_input()` event

3. **Create UI**:
   - Use Control nodes for UI (Label, Button, etc.)
   - Match visual style from web version

4. **Add mobile controls**:
   - Touch screen input for swing
   - Virtual joystick if needed
   - Handle screen orientation changes

## Mobile Build Considerations

### Android

- **Min SDK**: 21 (Android 5.0+)
- **Permissions**: None required
- **Screen Orientation**: Portrait or Landscape (configurable)
- **File Size Target**: < 50MB
- **Signing**: Required for Google Play

### iOS

- **Min Version**: iOS 12.0+
- **Code Signing**: Apple Developer account required
- **TestFlight**: Recommended for beta testing
- **App Store**: Submit only when feature-complete

## Performance Targets

- **FPS**: 60fps on mid-range devices (2020+)
- **Battery**: Minimal drain (no background activity)
- **Memory**: < 150MB RAM usage
- **Storage**: < 50MB installed size

## Asset Guidelines

All assets must be:
- Original creations
- Properly licensed (if third-party)
- Documented in `assets/LICENSES.md`
- Free of any Backyard Baseball or other copyrighted content

## Testing

### Desktop Testing
- Run directly in Godot Editor (F5)
- Test keyboard controls (Space to swing)

### Mobile Testing
- Export debug APK for Android
- Install on device via ADB: `adb install game.apk`
- Use Godot's remote debug for on-device testing

## Known Limitations

- This is a stub project - gameplay not yet implemented
- Web version (Phaser) is the current playable version
- Assets are placeholders (geometric shapes)

## Contributing

When implementing features:
1. Keep parity with Phaser web version
2. Optimize for mobile (touch controls, performance)
3. Document all original assets
4. Test on real devices, not just emulators

## License

UNLICENSED - Proprietary to Blaze Sports Intel.

All game content is original. No third-party IP is used.
