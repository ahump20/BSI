# Visual Critique Rubric

Checkable quality dimensions for reviewing BSI visual output.
Score each dimension PASS/FAIL. Any FAIL blocks shipping.

## Critical (Must Pass)

### 1. Surface Compliance
- [ ] All card/container backgrounds use Heritage surface tokens
- [ ] No raw hex colors used for backgrounds (except token values)
- [ ] No `backdrop-filter: blur()` on content cards (glass is Labs-only)
- [ ] No white or light backgrounds anywhere
- [ ] Page background is `#0D0D0D` (--bsi-midnight)

### 2. Color Fidelity
- [ ] All colors traceable to `bsi-brand.css` tokens
- [ ] No startup gradients (purple, teal, neon blue)
- [ ] Burnt-orange used as primary accent throughout
- [ ] Status colors use semantic tokens (error/warning/success/info)
- [ ] Sport-specific pages use correct `data-sport` accent

### 3. Trust Cues
- [ ] Every data surface shows source attribution
- [ ] Freshness timestamp present on live/recent data
- [ ] Game state indicator present (LIVE/FINAL/Scheduled)
- [ ] All timestamps in Central Time (America/Chicago)
- [ ] Stale data flagged with `.stale-warning` when > TTL

### 4. Accessibility
- [ ] Text contrast meets WCAG AA (4.5:1 minimum)
- [ ] Touch targets 44px minimum on mobile
- [ ] Focus rings visible (burnt-orange outline)
- [ ] Skip link present
- [ ] `prefers-reduced-motion` respected for all animations
- [ ] Images have alt text, decorative images have `alt=""`

## Important (Should Pass)

### 5. Typography
- [ ] Bebas Neue for hero headings only
- [ ] Oswald for section headings, stamps, nav (always uppercase)
- [ ] Cormorant Garamond for body/editorial text
- [ ] IBM Plex Mono / JetBrains Mono for data/code
- [ ] `clamp()` used for fluid heading sizes
- [ ] Body line-height 1.5-1.7
- [ ] Line length capped at 65-75 characters

### 6. Border Radius
- [ ] Heritage cards use 2px radius
- [ ] Heritage stamps/buttons use 1px radius
- [ ] No 0.75rem radius on content cards
- [ ] Glass system (Labs overlay only) allowed 0.75rem

### 7. Spacing
- [ ] Spacing values from BSI space scale (4px base increments)
- [ ] Section padding uses `clamp(3rem, 8vw, 6rem)`
- [ ] Container padding uses `clamp(1rem, 4vw, 2rem)`
- [ ] No arbitrary pixel values outside the scale

### 8. Responsive
- [ ] No horizontal scroll at 375px
- [ ] Tables horizontally scrollable on mobile
- [ ] Grain/scanlines disabled below 768px
- [ ] Bottom nav visible and usable on mobile
- [ ] Buttons enlarged on mobile (min 44px height)
- [ ] Font sizes readable on small screens (16px min body)

## Nice to Have (Aspirational)

### 9. Motion
- [ ] Micro-interactions use `--bsi-duration-fast` (200ms)
- [ ] Transitions use `--bsi-duration-normal` (300ms)
- [ ] Hero animations use `--bsi-duration-slow` (500ms)
- [ ] Easing uses BSI ease tokens
- [ ] Data updates use `.data-update-flash`
- [ ] Loading states use `.skeleton` or `.bsi-shimmer`

### 10. Atmosphere
- [ ] Corner marks present on hero/featured sections
- [ ] Section breaks use diamond dividers
- [ ] Heritage dividers between content blocks
- [ ] Warm glow accents on key surfaces
- [ ] Grain overlay on desktop hero sections

## Scoring

| Rating | Criteria |
|--------|----------|
| **Ship** | All Critical pass, all Important pass |
| **Ship with notes** | All Critical pass, 1-2 Important items noted |
| **Block** | Any Critical failure |
| **Redesign** | 3+ Critical failures or fundamental Heritage violation |

## Common Failures

| Pattern | What's wrong | Fix |
|---------|-------------|-----|
| `backdrop-filter: blur(16px)` on cards | Glass on content | Use `.heritage-card` solid surface |
| `border-radius: 0.75rem` on cards | Wrong radius | Change to `2px` |
| `bg-white` or `bg-gray-100` | Light background | Use Heritage surface token |
| Missing "Source:" on stats | No trust cue | Add `.heritage-stamp` with source name |
| `font-family: Inter` | Wrong font | Use Heritage font token |
| `purple-500` / `teal-400` | Non-brand color | Use `--bsi-primary` or Heritage accent |
| Fixed widths breaking mobile | Not responsive | Use fluid sizing, clamp(), or percentage |
| No `alt` on team logos | Accessibility gap | Add descriptive alt text |
