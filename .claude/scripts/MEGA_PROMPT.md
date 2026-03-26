# Autonomous Execution Context

You are running in fully autonomous headless mode. No human is monitoring this session. You have one task to complete. Execute it fully, verify it, commit it, and exit.

## Autonomy Rules

- **Do not ask questions.** Every decision has been pre-made in the task description.
- **Do not stop to summarize.** Do the work and move on.
- **If you encounter ambiguity, choose the simpler option.** Do not exit to ask.
- **If a verification check fails, fix it yourself.** Loop until it passes or you've tried 3 times.
- **If you cannot complete the task after 3 attempts,** commit what works and exit with status 1.
- **Never wait for input.** There is no human to respond.

## Project: Blaze Sports Intel

- **Stack:** Next.js 16 (static export), React 19, TypeScript, Tailwind CSS 3, Cloudflare Pages/Workers (Hono)
- **Repo root:** `/Users/AustinHumphrey` (home directory IS the repo)
- **Static export:** Every dynamic route needs `generateStaticParams()`. No SSR. Client components need `'use client'`.
- **Path alias:** `@/*` maps to project root

## Key directories

- `app/` — Next.js App Router pages
- `components/` — Shared React components
- `lib/` — Core logic, utilities, hooks
- `workers/` — Cloudflare Workers (Hono), each with own wrangler.toml
- `workers/handlers/` — Handler functions by sport/domain
- `workers/shared/` — Types, helpers, constants, cors, rate-limit, auth
- `games/` — Browser arcade games (blaze-field is the main one)
- `public/` — Static assets
- `portfolio-website/` — Austin's portfolio site (separate Vite+React project)
- `scripts/` — Build/deploy/data scripts
- `tests/` — Vitest + Playwright tests

## Heritage Design System v2.1 (mandatory for all BSI pages)

**Surfaces:** `--surface-dugout` (#161616, cards) · `--surface-scoreboard` (#0A0A0A, hero bg) · `--surface-press-box` (#111111, table headers)

**Colors:** `--bsi-primary` (#BF5700, burnt-orange) · `--bsi-bone` (#F5F2EB, text) · `--bsi-dust` (#C4B8A5, secondary text) · `--heritage-columbia-blue` (#4B9CD3, links) · `--border-vintage` (rgba(140,98,57,0.3), borders)

**Typography:** Bebas Neue (hero headings) · Oswald (section headings, uppercase) · Cormorant Garamond (body) · JetBrains Mono (code)

**Classes:** `.heritage-stamp` · `.heritage-card` · `.btn-heritage` / `.btn-heritage-fill` · `.corner-marks` · `.grain-overlay`

## Rules

1. **No questions.** Every decision has been pre-made in the task description.
2. **No summaries.** Don't explain what you did. Just do it.
3. **Verify before committing.** Run the "Done when" check from the task.
4. **One commit per task.** Format: `fix(TASK-ID): brief description`
5. **Don't modify TASKS.md.** The runner handles task tracking.
6. **Production code only.** No placeholders, no fake data, no TODOs.
7. **Prefer reuse.** Search for existing patterns before creating new ones.
8. **Read before writing.** Always read a file before editing it.
9. **If you cannot complete the task,** exit with a non-zero status. Do not commit partial work.
10. **If a tool call fails,** try an alternative approach. Do not exit on the first failure.

## Tool access

You have full tool permissions via --dangerously-skip-permissions. You can read, write, search, edit files, and run any shell command. Use whatever tools you need to complete the task.

## Commands available

```bash
npm run dev                 # Next.js dev server
npm run build               # Static export
npm run typecheck:strict    # TypeScript strict check
npm run lint                # ESLint
npm run test:all            # Vitest (not Playwright)
```

## Session constraints

- **No session persistence:** This session is ephemeral and will not be saved.
- **If you cannot complete the task:** Exit cleanly. Do not commit partial work. The runner will retry once with a fresh session.
