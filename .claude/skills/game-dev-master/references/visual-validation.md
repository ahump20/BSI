# Visual Validation

How to inspect screenshots and determine pass/fail. The screenshot is the source of truth — if the screenshot is wrong, the build is wrong, regardless of what the state JSON says.

## Inspection Protocol

After every `test_game.py` run:

1. **View the screenshot:** `view /path/to/screenshots/latest.png`
2. **Compare against intent:** Does what you see match what you expect?
3. **Cross-check state JSON:** Does the JSON in the test output agree with the visual?
4. **Decide:** PASS (proceed to next feature) or FAIL (fix and re-run).

## Pass Criteria by Game Phase

### Menu Screen
- [ ] Title text visible and readable
- [ ] Instructions visible (start key, controls)
- [ ] No rendering artifacts (stray pixels, wrong colors)
- [ ] Canvas is centered, background fills entire canvas

### Gameplay
- [ ] Player entity visible at expected position
- [ ] Enemies/entities visible if they should exist
- [ ] HUD elements (score, HP) visible and updating
- [ ] Background rendered (no black void unless intended)
- [ ] No visual clipping (entities drawing outside bounds)

### State Transitions
- [ ] Pause overlay appears when paused
- [ ] Game over screen shows final score
- [ ] Restart resets visual state (no ghost entities from previous run)

## Common Visual Failures

### Black Screen
The canvas rendered nothing. Check render order, canvas context, background fill.

### Entities Stacked at Origin
Position not updating — update logic gated by mode or delta-time is zero.

### Flickering / Tearing
Double-buffering issue or clear-rect not covering full canvas. Verify `fillRect(0, 0, canvas.width, canvas.height)` runs first in render.

### HUD Overlapping Gameplay
Text rendered at wrong coordinates or font too large. Verify alignment and position constants.

### Screenshot Shows Menu After advanceTime
The game never entered `playing` mode. Test script needs to send `Enter` key before advancing time.

## State JSON Cross-Validation

When both screenshot and JSON are available, check agreement:

| JSON Field | Visual Expectation |
|-----------|-------------------|
| `mode: "menu"` | Title screen with instructions |
| `mode: "playing"` | Game world with player visible |
| `player.x, player.y` | Player sprite roughly at those coordinates |
| `score: N` | HUD shows matching score |
| `entities: [...]` | Visible entities count matches array length |

If JSON says `mode: "playing"` but screenshot shows menu -> `advanceTime` or key simulation failed.
If JSON says `player.x: 400` but player is at screen edge -> coordinate mapping or canvas size mismatch.

## Multi-Step Validation

For feature validation across time:

1. Capture screenshot at step 0 (initial state).
2. Simulate input (e.g., hold right for 60 frames).
3. Capture screenshot at step N.
4. **Compare step 0 vs step N:** player position should have changed.
5. Verify state JSON delta matches visual delta.

If position changed in JSON but not visually -> render not reflecting state.
If position changed visually but not in JSON -> `render_game_to_text` is stale.

## Validation Contract

A validation contract defines what "correct" looks like for a specific feature. Format:

```
FEATURE: <name>
PRECONDITION: <starting state>
ACTION: <input sequence>
EXPECTED VISUAL: <what the screenshot should show>
EXPECTED STATE: <JSON fields and values>
PASS IF: <both visual and state match>
FAIL IF: <any mismatch>
```

Example:
```
FEATURE: Player movement right
PRECONDITION: mode=playing, player at center
ACTION: Hold ArrowRight for 60 frames
EXPECTED VISUAL: Player sprite visibly right of center
EXPECTED STATE: player.x > 400 (starting position)
PASS IF: Screenshot shows player moved right AND JSON confirms x > 400
FAIL IF: Player at same position OR off-screen
```

Write one contract per feature before implementing. The contract is the test — implement until the contract passes.
