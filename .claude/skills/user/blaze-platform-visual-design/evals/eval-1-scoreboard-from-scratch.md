# Eval 1: Scoreboard / Rankings Page from Scratch

## Scenario
"Build a college baseball rankings page showing the top 25 teams with
their record, RPI, and conference."

## Expected Behavior

### Heritage Enforcement
- [ ] Page background uses `--surface-scoreboard` or `--bsi-midnight`
- [ ] Table uses `.stat-table` class
- [ ] Table header uses `--surface-press-box` background
- [ ] Table header has 2px `--bsi-primary` bottom border
- [ ] Column headers are 9px uppercase in `--bsi-dust`
- [ ] Data font is `--bsi-font-data` (IBM Plex Mono)
- [ ] Text color is `--bsi-bone`
- [ ] Row hover uses `rgba(191,87,0,0.04)`
- [ ] Row borders use `rgba(140,98,57,0.12)`
- [ ] Rank numbers for top 10 use `--bsi-primary`
- [ ] Movement arrows use `--heritage-columbia-blue` (up) and `--heritage-oiler-red` (down)

### Trust Layer
- [ ] Source attribution present (e.g., "Source: D1Baseball")
- [ ] Freshness timestamp present (e.g., "Updated: Mar 10, 2026 2:30 PM CT")
- [ ] Timezone shown as CT

### Non-Heritage Failures
- [ ] NO glass cards or backdrop-blur
- [ ] NO border-radius: 0.75rem on table container
- [ ] NO Inter, Roboto, or Arial fonts
- [ ] NO purple, teal, or neon gradients
- [ ] NO white or light backgrounds

### Technical Compliance
- [ ] Uses `'use client'` directive
- [ ] Uses `data-sport="college-baseball"` for sport theming
- [ ] Responsive — table scrolls horizontally on mobile
- [ ] Loading state uses `.skeleton` shimmer
- [ ] `prefers-reduced-motion` respected

## Scoring

| Criteria | Weight |
|----------|--------|
| Heritage surface tokens | 25% |
| Correct typography | 20% |
| Trust cues present | 20% |
| No Heritage violations | 20% |
| Responsive + accessible | 15% |

**Pass threshold:** 85%+
