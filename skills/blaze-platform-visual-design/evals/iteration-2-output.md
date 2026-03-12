# Iteration 2 sample output (after tightening skill)

Direction: disciplined editorial intelligence surface for serious sports operators. Prioritize scanning: score state first, then matchup context, then deeper analytics. This hierarchy defines priority at every breakpoint.

## Purpose + Audience

Serve power users (analysts, bettors, editorial leads) who need game-state and trend clarity in under five seconds.

## Layout Blueprint

1. sticky competition/date filter bar
2. live score strip
3. primary game cards (status, score, leverage)
4. expandable analytics rows
5. side rail with editorial notes and alerts

## Typography Ladder

- H1/H2: Oswald, compressed tracking, high contrast
- Body + captions: Cormorant Garamond with Inter fallback for dense tables

## Color/Token Mapping

Primary accent #BF5700 (burnt orange) only for critical signals and selected chart series. Base surfaces sit on midnight #0B0F14 and charcoal #131A22 with warm neutral support.

## Component State Matrix

- default, hover, active, focus, disabled, loading defined per card and tab
- keyboard focus ring visible on filters, tabs, and row expand controls

## Responsive Behavior

- mobile: score-first compact cards, collapsible analytics details
- tablet: dual-column game + insights
- desktop: tri-rail (scores, analytics, editorial)

## Implementation Notes

- Tailwind tokens map to brand variables; avoid raw hex scatter
- Recharts uses #BF5700 as primary metric series
- Framer Motion reserved for orientation transitions, not decorative loops

Accessibility sanity: maintain contrast targets on dark surfaces; all hover affordances have keyboard parity; avoid motion-only state communication.
