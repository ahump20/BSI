# Implementation Rules

## Stack assumptions

- Framework: Next.js static export + React
- Styling: Tailwind CSS tokens/components
- Charts: Recharts
- Motion: Framer Motion (restrained)
- Deployment constraints: Cloudflare Pages/Workers

## Tailwind guidance

- Define color tokens in Tailwind config; avoid raw hex scatter.
- Keep semantic class names for reusable UI wrappers.
- Build card and table primitives before page-specific variants.

## Recharts guidance

- Burnt orange should identify primary metric line/series.
- Secondary series should use slate neutrals before introducing extra accents.
- Use readable axis/grid contrast on dark surfaces.

## Motion guidance

- Animate for orientation and emphasis, not decoration.
- Keep durations mostly 140-260ms; avoid long delayed sequences for data UIs.
- Apply stagger only to first meaningful paint sections.

## Accessibility sanity checks

- Keep body text and data labels at readable sizes.
- Ensure hover-only interactions have keyboard equivalents.
- Preserve visible focus rings on interactive controls.
