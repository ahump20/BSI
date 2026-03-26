# Source Priority Hierarchy

When building BSI visual work, conflicts are resolved top-down.
Higher priority always wins.

## Priority Stack

### 1. User Brief (Highest)
Austin's explicit instructions override everything. If he says "make this blue,"
it's blue — even though Heritage doesn't use blue as a primary.

### 2. CLAUDE.md
Project-level Heritage token definitions and conventions. This is the operational
contract for the codebase.

### 3. Heritage Tokens (bsi-brand.css)
The single source of truth for all design tokens. Every color, surface, font,
spacing, and motion value must trace to this file.

### 4. Component Patterns (this skill)
The pattern library in `component-patterns.md`. Defines how Heritage tokens
compose into reusable surface types.

### 5. Figma Exports
Figma designs are references, not specifications. Adapt to Heritage constraints:
- Map Figma colors to nearest Heritage token
- Replace Figma border-radius with Heritage 2px
- Substitute Figma fonts with Heritage font stack
- Convert Figma spacing to BSI space scale

### 6. Generic Design Principles (Lowest)
The `frontend-design` skill provides general web design guidance. Use only
when Heritage and component patterns don't cover the specific need.

## Conflict Examples

| Conflict | Resolution |
|----------|-----------|
| Figma shows `border-radius: 12px` | Use 2px (Heritage rule) |
| Figma uses Inter font | Use Oswald/Cormorant/Plex (Heritage fonts) |
| Generic skill says "pick a direction" | Direction is Heritage — already decided |
| Austin says "drop the trust cues here" | Drop them (user brief wins) |
| Component pattern says Oswald for header, Figma says Montserrat | Oswald (Heritage wins over Figma) |
| No Heritage pattern exists for this component | Fall back to generic design principles, but use Heritage tokens |

## When to Deviate

Deviation from Heritage is allowed only when:
1. Austin explicitly requests it
2. The component is for Labs (labs.blazesportsintel.com), which has its own glass system
3. A third-party embed requires its own styling (e.g., Stripe checkout)

Document all deviations with a comment explaining why.
