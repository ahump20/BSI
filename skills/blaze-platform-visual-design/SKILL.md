---
name: blaze-platform-visual-design
description: Deliver Blaze Sports Intel visual direction, UI specs, and frontend aesthetic guidance for web product surfaces with strict brand fidelity. Use this whenever a request involves BSI page design, component styling, dashboard/editorial layout, visual system decisions, or frontend polish across Next.js, React, Tailwind, Recharts, and Framer Motion. Always enforce sports-intelligence hierarchy, Oswald/Cormorant typography, burnt-orange token discipline, and anti-generic patterns; do not produce generic SaaS aesthetics.
---

Start from product intent before visuals. State audience, decision task, and the information that must scan in under five seconds.

## Execution protocol

1. Classify the surface: `home`, `scoreboard/live`, `analytics`, `editorial`, `team/player`, or `utility/settings`.
2. Commit to one direction in prose first: tone, hierarchy, density, and motion temperament.
3. If scope is ambiguous or high-stakes, write the design spec before code with these sections:
   - purpose + audience
   - layout blueprint by priority order
   - typography ladder (Oswald + Cormorant Garamond + fallbacks)
   - color/token mapping and contrast intent
   - component state matrix (default/hover/active/focus/disabled/loading)
   - responsive behavior (mobile/tablet/desktop)
   - implementation notes (Tailwind + Recharts + Framer Motion)
4. Run `python scripts/audit_design_spec.py <spec.md> --json` on completed specs.
5. If audit fails, fix spec issues before implementation.

## Hard constraints

- Keep primary accent at `#BF5700`; do not drift to alternative primaries.
- Keep surfaces in midnight/charcoal families with restrained support tones.
- Prefer editorial seriousness, dense signal, and disciplined hierarchy.
- Reject default glassmorphism/neumorphism/gradient-fad styling unless explicitly requested and still brand-safe.
- Preserve accessibility sanity (focus visibility, keyboard parity, readable contrast on dark surfaces).
- Do not generate generic SaaS UI patterns without explicit override from the user.

## References

See `references/` for:
- `brand-tokens.md` — color, type, spacing
- `surface-playbooks.md` — layout blueprints by surface type
- `implementation-rules.md` — Tailwind/Recharts/Motion constraints
- `quality-rubric.md` — pass/revise scoring for all outputs
