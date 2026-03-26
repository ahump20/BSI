#!/usr/bin/env python3
"""
Test a web game: serve -> simulate input -> capture screenshots + state -> validate -> report.

This is the core validation loop for the game-dev-master skill.
Every test run produces a definitive PASS or FAIL.

Usage:
    python3 test_game.py <path/to/index.html> [options]

Options:
    --steps N          Number of advanceTime steps to run (default: 5)
    --step-ms N        Milliseconds per advanceTime call (default: 500)
    --actions JSON     JSON string of keyboard actions to simulate
    --screenshot-dir   Where to save screenshots (default: ./screenshots)
    --port N           HTTP server port (default: auto)
    --headed           Run browser visibly (for debugging)
    --expect-mode M    Expected game mode in final state (menu|playing|paused|gameover)
    --expect-moving    Verify player position changed between first and last step
    --expect-no-errors Fail if any console errors (default: true)

Exit codes:
    0  All validations passed
    1  Validation failed (screenshot captured but state wrong)
    2  Infrastructure error (server, playwright, file not found)

Requires: playwright (auto-installed if missing)
"""

import argparse
import http.server
import json
import os
import shutil
import subprocess
import sys
import textwrap
import threading
import time
from pathlib import Path


def find_free_port():
    import socket
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.bind(('', 0))
        return s.getsockname()[1]


def start_server(directory, port):
    """Start a simple HTTP server in a background thread."""
    handler = http.server.SimpleHTTPRequestHandler

    class QuietHandler(handler):
        def __init__(self, *args, **kwargs):
            super().__init__(*args, directory=directory, **kwargs)
        def log_message(self, format, *args):
            pass

    server = http.server.HTTPServer(('127.0.0.1', port), QuietHandler)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    return server


def ensure_playwright():
    """Check if Playwright is available, install if not."""
    try:
        result = subprocess.run(
            [sys.executable, "-c", "from playwright.sync_api import sync_playwright"],
            capture_output=True, timeout=10
        )
        if result.returncode == 0:
            return True
    except Exception:
        pass

    print("Installing playwright...")
    subprocess.run(
        [sys.executable, "-m", "pip", "install", "playwright", "--break-system-packages", "-q"],
        capture_output=True
    )
    subprocess.run(
        [sys.executable, "-m", "playwright", "install", "chromium"],
        capture_output=True
    )
    return True


# Key mapping: game-friendly names -> Playwright key names
KEY_MAP = {
    "left": "ArrowLeft", "right": "ArrowRight",
    "up": "ArrowUp", "down": "ArrowDown",
    "space": " ", "enter": "Enter", "escape": "Escape",
    "shift": "Shift", "ctrl": "Control", "alt": "Alt",
}
# Add single-char keys
for c in "abcdefghijklmnopqrstuvwxyz0123456789":
    KEY_MAP[c] = c


def _map_key(key):
    return KEY_MAP.get(key.lower(), key)


def run_test(html_path, args):
    """Run the full validation loop: serve -> open -> step -> capture -> validate -> report."""
    from playwright.sync_api import sync_playwright

    html_path = Path(html_path).resolve()
    if not html_path.exists():
        print(f"ERROR: File not found: {html_path}")
        return 2  # infrastructure error

    game_dir = html_path.parent
    filename = html_path.name

    ss_dir = Path(args.screenshot_dir) if args.screenshot_dir else game_dir / "screenshots"
    ss_dir.mkdir(parents=True, exist_ok=True)

    port = args.port or find_free_port()
    server = start_server(str(game_dir), port)
    url = f"http://127.0.0.1:{port}/{filename}"

    console_errors = []
    console_logs = []
    states = []
    validations = []  # list of (name, passed, detail)

    print(f"Serving: {url}")
    print(f"Screenshots: {ss_dir}")
    print(f"Steps: {args.steps} x {args.step_ms}ms")
    print()

    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=not args.headed)
            page = browser.new_page(viewport={"width": 820, "height": 620})

            page.on("console", lambda msg: (
                console_errors.append(f"[{msg.type}] {msg.text}")
                if msg.type in ("error", "warning")
                else console_logs.append(f"[{msg.type}] {msg.text}")
            ))

            page.goto(url, wait_until="networkidle")
            time.sleep(0.3)

            # Focus canvas for keyboard events (Playwright requires element focus
            # before keyboard.down/keyboard.up dispatch correctly).
            try:
                page.click("canvas", timeout=2000)
            except Exception:
                pass  # No canvas element -- engine game or custom setup

            # --- Initial capture ---
            # animations="disabled" freezes CSS/Web animations for deterministic screenshots.
            ss_path = ss_dir / "step_000_initial.png"
            page.screenshot(path=str(ss_path), animations="disabled")
            print(f"  [screenshot] {ss_path.name}")

            try:
                state_json = page.evaluate("window.render_game_to_text ? window.render_game_to_text() : 'NO_HOOK'")
                states.append({"step": 0, "label": "initial", "state": state_json})
                print(f"  [state] {state_json[:120]}...")
            except Exception as e:
                states.append({"step": 0, "label": "initial", "state": f"ERROR: {e}"})
                print(f"  [state] ERROR: {e}")

            # --- Validate hook exists ---
            hook_exists = states[0]["state"] != "NO_HOOK" and not states[0]["state"].startswith("ERROR")
            validations.append(("render_game_to_text hook", hook_exists,
                                "Hook present" if hook_exists else "Missing window.render_game_to_text()"))

            # --- Simulate actions ---
            if args.actions:
                try:
                    actions = json.loads(args.actions)
                    if isinstance(actions, dict) and "steps" in actions:
                        actions = actions["steps"]
                    for i, action in enumerate(actions):
                        keys = action.get("buttons", action.get("keys", []))
                        frames = action.get("frames", 1)
                        for key in keys:
                            mapped = _map_key(key)
                            if mapped:
                                page.keyboard.down(mapped)
                        ms = frames * (1000 / 60)
                        page.evaluate(f"window.advanceTime && window.advanceTime({ms})")
                        time.sleep(0.05)
                        for key in keys:
                            mapped = _map_key(key)
                            if mapped:
                                page.keyboard.up(mapped)
                        print(f"  [action {i}] keys={keys} frames={frames}")
                except json.JSONDecodeError as e:
                    print(f"  [actions] Invalid JSON: {e}")

            # --- Step loop ---
            for step in range(1, args.steps + 1):
                try:
                    page.evaluate(f"window.advanceTime && window.advanceTime({args.step_ms})")
                except Exception as e:
                    print(f"  [step {step}] advanceTime error: {e}")

                time.sleep(0.1)

                ss_path = ss_dir / f"step_{step:03d}.png"
                page.screenshot(path=str(ss_path), animations="disabled")

                try:
                    state_json = page.evaluate("window.render_game_to_text ? window.render_game_to_text() : 'NO_HOOK'")
                    states.append({"step": step, "state": state_json})
                except Exception as e:
                    states.append({"step": step, "state": f"ERROR: {e}"})

                print(f"  [step {step}/{args.steps}] screenshot saved")

            # Copy last screenshot as latest.png
            latest = ss_dir / "latest.png"
            last_step = ss_dir / f"step_{args.steps:03d}.png"
            if last_step.exists():
                shutil.copy2(str(last_step), str(latest))

            browser.close()

    except Exception as e:
        print(f"\nINFRASTRUCTURE ERROR: {e}")
        server.shutdown()
        return 2

    server.shutdown()

    # ============================================================
    # VALIDATION
    # ============================================================

    # Parse final state
    final_state = None
    initial_state = None
    if states:
        try:
            final_state = json.loads(states[-1]["state"])
        except (json.JSONDecodeError, TypeError):
            pass
        try:
            initial_state = json.loads(states[0]["state"])
        except (json.JSONDecodeError, TypeError):
            pass

    # V1: Console errors
    no_errors = len(console_errors) == 0
    if args.expect_no_errors:
        validations.append(("no console errors", no_errors,
                            "Clean" if no_errors else f"{len(console_errors)} error(s): {console_errors[0][:80]}"))

    # V2: Expected mode
    if args.expect_mode and final_state:
        mode_match = final_state.get("mode") == args.expect_mode
        validations.append(("expected mode", mode_match,
                            f"Got '{final_state.get('mode')}', expected '{args.expect_mode}'"))

    # V3: Player moved
    if args.expect_moving and initial_state and final_state:
        try:
            ix, iy = initial_state["player"]["x"], initial_state["player"]["y"]
            fx, fy = final_state["player"]["x"], final_state["player"]["y"]
            moved = (ix != fx) or (iy != fy)
            validations.append(("player moved", moved,
                                f"({ix},{iy}) -> ({fx},{fy})" if moved else f"Stuck at ({ix},{iy})"))
        except (KeyError, TypeError):
            validations.append(("player moved", False, "Could not read player position from state"))

    # V4: State parseable
    state_parseable = final_state is not None
    validations.append(("state JSON parseable", state_parseable,
                        "Valid JSON" if state_parseable else "Failed to parse final state"))

    # ============================================================
    # REPORT
    # ============================================================

    print()
    print("=" * 60)
    print("VALIDATION RESULTS")
    print("=" * 60)

    all_passed = True
    for name, passed, detail in validations:
        icon = "PASS" if passed else "FAIL"
        print(f"  [{icon}] {name}: {detail}")
        if not passed:
            all_passed = False

    # State summary
    print(f"\n--- Final Game State ---")
    if final_state:
        print(json.dumps(final_state, indent=2))
    elif states:
        print(states[-1]["state"])
    else:
        print("No state captured")

    # Console errors
    if console_errors:
        print(f"\n--- Console Errors ({len(console_errors)}) ---")
        for err in console_errors[:10]:
            print(f"  {err}")
    else:
        print(f"\n--- Console Errors: None ---")

    # Write state log
    state_path = ss_dir / "state_log.json"
    with open(state_path, "w") as f:
        json.dump(states, f, indent=2)

    # Write validation summary
    validation_path = ss_dir / "validation.json"
    with open(validation_path, "w") as f:
        json.dump({
            "passed": all_passed,
            "checks": [{"name": n, "passed": p, "detail": d} for n, p, d in validations],
            "console_errors": len(console_errors),
            "steps": len(states),
        }, f, indent=2)

    print(f"\nState log: {state_path}")
    print(f"Validation: {validation_path}")
    print(f"Latest screenshot: {ss_dir / 'latest.png'}")

    verdict = "PASS" if all_passed else "FAIL"
    print(f"\n{'=' * 60}")
    print(f"VERDICT: {verdict}")
    print(f"{'=' * 60}")

    return 0 if all_passed else 1


def main():
    parser = argparse.ArgumentParser(description="Test a web game with deterministic validation")
    parser.add_argument("html", help="Path to index.html")
    parser.add_argument("--steps", type=int, default=5, help="Number of advanceTime steps")
    parser.add_argument("--step-ms", type=int, default=500, help="Milliseconds per step")
    parser.add_argument("--actions", type=str, default=None, help="JSON actions to simulate")
    parser.add_argument("--screenshot-dir", type=str, default=None, help="Screenshot output directory")
    parser.add_argument("--port", type=int, default=None, help="HTTP server port")
    parser.add_argument("--headed", action="store_true", help="Run browser visibly")
    parser.add_argument("--expect-mode", type=str, default=None, help="Expected final game mode")
    parser.add_argument("--expect-moving", action="store_true", help="Verify player position changed")
    parser.add_argument("--expect-no-errors", action="store_true", default=True, help="Fail on console errors")
    parser.add_argument("--no-expect-errors", dest="expect_no_errors", action="store_false",
                        help="Allow console errors without failing")
    args = parser.parse_args()

    ensure_playwright()
    exit_code = run_test(args.html, args)
    sys.exit(exit_code)


if __name__ == "__main__":
    main()
