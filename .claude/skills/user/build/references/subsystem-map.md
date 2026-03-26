# Build Subsystem Map

Quick reference for all subsystems orchestrated by `/build`.

## 1. frontend-design (Plugin Skill)

**What:** Bold aesthetic direction, anti-AI-slop rules, typography/color/motion/spatial composition guidelines.
**Invoke:** `Skill tool → frontend-design:frontend-design`
**Location:** `~/.claude/plugins/cache/claude-plugins-official/frontend-design/*/skills/frontend-design/SKILL.md`

## 2. blaze-platform-visual-design (User Skill)

**What:** BSI-specific Heritage Design System v2.1 tokens, component patterns, surface design, visual critique rubric. Use alongside frontend-design for BSI pages.
**Invoke:** `Skill tool → blaze-platform-visual-design`
**Location:** `~/.claude/skills/user/blaze-platform-visual-design/SKILL.md`
**References:** `~/.claude/skills/user/blaze-platform-visual-design/references/` (heritage tokens, component patterns, route patterns, output templates, visual critique rubric)

## 3. game-dev-master (User Skill)

**What:** Engine selection decision tree, architecture patterns (ECS, game loop, state machine), scope assessment, platform-specific optimization. Covers Unity, Unreal 5, Godot, Phaser, Babylon.js, pygame, Canvas.
**Invoke:** `Skill tool → game-dev-master`
**Location:** `~/.claude/skills/game-dev-master/SKILL.md`
**References:** `~/.claude/skills/game-dev-master/references/` (7 docs: web-game-patterns, unity-patterns, unreal-patterns, godot-patterns, multiplayer-netcode, procedural-generation, mobile-optimization)

## 4. web-artifacts-builder (Scripts)

**What:** Scaffolds React 18 + TypeScript + Vite + Tailwind + shadcn/ui projects, then bundles into single self-contained HTML files.
**Init:** `bash ~/.claude/skills/user/build/scripts/init-artifact.sh <project-name> [target-dir]`
**Bundle:** `bash ~/.claude/skills/user/build/scripts/bundle-artifact.sh [project-dir]`
**Output:** `<project-dir>/bundle.html` — opens directly in browser, zero dependencies.

## 5. backend-design (Agent)

**What:** Cloudflare Workers architecture, API endpoint design, D1/KV/R2 schema and caching, data pipeline design, rate limiting, auth. Final quality gate on all backend work.
**Invoke:** `Agent tool → subagent_type: backend-design`
**Location:** `~/.claude/agents/backend-design.md`
