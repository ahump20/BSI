# Debugging Playbook

Systematic diagnosis for common game failures. Work top-to-bottom — fix the first error found before looking deeper.

## Triage Order

1. **Does it load?** — Check for JS syntax errors, missing files, server not running.
2. **Does it render?** — Canvas visible, background drawn, no blank screen.
3. **Does it respond?** — Input handler firing, state changing on keypress.
4. **Does it play correctly?** — Physics, collision, scoring, state transitions.

## Symptom -> Diagnosis -> Fix

### Blank Screen (nothing renders)

**Check:** Console errors in test output.

| Likely Cause | Fix |
|-------------|-----|
| JS syntax error | Read console errors. Fix the first one. |
| Canvas not found | Verify `document.getElementById('game')` matches the `<canvas>` id. |
| `render()` never called | Confirm `requestAnimationFrame(gameLoop)` is present and `gameLoop` calls `render()`. |
| Context lost | Confirm `canvas.getContext('2d')` is called before any draw operations. |

### Game Loads but Player Invisible

| Likely Cause | Fix |
|-------------|-----|
| Player drawn behind background | Draw background first, then player. Check render order. |
| Fill color matches background | Change player color. Inspect both `fillStyle` values. |
| Player position off-screen | Log `state.player.x, y` — clamp to canvas bounds. |
| Width/height zero | Verify `state.player.w` and `state.player.h` are positive numbers. |

### Input Not Working

| Likely Cause | Fix |
|-------------|-----|
| Wrong event listener | Use `keydown`/`keyup`, not `keypress`. |
| Mode check blocking | Verify `state.mode === 'playing'` when expecting input to work. |
| Key name mismatch | `ArrowLeft` not `Left`. `' '` (space) not `'space'`. Log `e.key` to confirm. |
| Canvas stealing focus | Add `tabindex="0"` to canvas and call `canvas.focus()` on game start. |

### Movement Jittery or Too Fast/Slow

| Likely Cause | Fix |
|-------------|-----|
| Not using delta-time | Multiply velocity by `dt`, not fixed constants. |
| Delta-time too large | Clamp `dt` to `Math.min(dt, 0.05)` to prevent teleportation on tab-switch. |
| Pixel-level rounding | Round positions only for rendering, not state updates. |

### Collision Not Detecting

| Likely Cause | Fix |
|-------------|-----|
| Wrong coordinate system | Verify both entities use same origin (top-left). |
| Size not accounted for | AABB needs `x + w` and `y + h`, not just `x, y`. |
| Checking after removal | Don't filter dead entities mid-collision-loop. Mark first, filter after. |
| Off-by-one | Use `<` not `<=` for AABB overlap. |

### `render_game_to_text` Returns Stale Data

| Likely Cause | Fix |
|-------------|-----|
| Reading before render | Call `render()` after `update()` but before reading state. |
| Stale closure | Ensure the function reads from the live `state` object, not a snapshot. |
| Missing fields | Add new state properties to the JSON return — tests can't validate what isn't exposed. |

### `advanceTime` Not Advancing

| Likely Cause | Fix |
|-------------|-----|
| Function not on window | Verify `window.advanceTime = ...` is defined. Check for typos. |
| Update gated on mode | If `state.mode !== 'playing'`, update does nothing. Send `Enter` key first to start. |
| Render not called | `advanceTime` must call both `update(dt)` and `render()`. |

### Screenshots Show Previous State

| Likely Cause | Fix |
|-------------|-----|
| Browser caching | Clear screenshots directory before re-running tests. |
| No render after advance | Ensure `advanceTime` calls `render()` after update loop. |
| Async timing | Add small sleep (100ms) between `advanceTime` call and screenshot capture. |

## Playwright-Specific Issues

| Symptom | Fix |
|---------|-----|
| "playwright not found" | `pip install playwright --break-system-packages && playwright install chromium` |
| Headless renders blank | Some canvas operations need `--headed` flag for debugging. |
| Keyboard input ignored | Canvas must be focused. `page.click('canvas')` before `keyboard.down()`/`keyboard.up()` events. Playwright dispatches keyboard events to the focused element — if no element has focus, events go nowhere. |
| Screenshot non-deterministic | Use `page.screenshot(animations="disabled")` to freeze CSS/Web animations. Canvas RAF loops aren't affected, but CSS transitions and animated overlays are. |
| Screenshot cropped | Viewport size in test script must be >= canvas size. Set via `browser.new_page(viewport={"width": W, "height": H})`. |
| `page.evaluate()` returns None | The JS expression may not return a value. Use `page.evaluate("(() => { return ... })()")` for complex expressions. |
| Key names wrong | Playwright uses `KeyboardEvent.key` values: `ArrowLeft`, `ArrowRight`, `ArrowUp`, `ArrowDown`, `Enter`, `Escape`, ` ` (space). Single chars are lowercase: `a`, `b`, `1`. Not `Space`, not `ENTER`. |
| Modifier keys stuck | `keyboard.down('Shift')` stays held until `keyboard.up('Shift')`. Always pair down/up calls. |

## General Strategy

When stuck:
1. Add `console.log` at entry points: `update()`, `render()`, key handlers.
2. Run test with `--headed` to watch the game live.
3. Reduce to minimal reproduction — comment out everything except the failing system.
4. Compare state JSON at step N vs step N+1 — find where the delta goes wrong.

## Development Action Patterns

Standard rhythms for different types of game work. Each pattern follows the validation loop.

### Feature Implementation
1. Identify the exact behavior change
2. Find the source file and function
3. Make the minimal change
4. Build and verify no compilation errors
5. Test via integration hooks
6. Screenshot for visual verification
7. Fix any issues, repeat

### Physics Tuning
1. Identify the constant or formula to adjust
2. Create a test case with known expected output
3. Adjust the value
4. Verify via `render_game_to_text()`
5. Visual check via screenshot
6. Compare multiple runs for consistency

### Animation Polish
1. Record current behavior (screenshot/GIF)
2. Identify the timing/easing to adjust
3. Make the change
4. Side-by-side comparison
5. Check FPS impact

### Bug Fix
1. Reproduce via integration hooks
2. Capture game state at failure point
3. Identify root cause in code
4. Fix and verify state is correct
5. Regression test: run full cycle

### Anti-Patterns
- Don't test by playing the game manually — use hooks
- Don't tune by feel alone — measure with `render_game_to_text`
- Don't skip the build step — TypeScript catches real bugs
- Don't fix multiple things at once — isolate changes
