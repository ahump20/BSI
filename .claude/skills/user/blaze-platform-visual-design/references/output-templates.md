# Output Templates

Structured output formats for BSI visual design work. Use the spec template
for ambiguous tasks; proceed directly to implementation for clear tasks.

## 1. Design Spec Template

Use when the task is ambiguous or complex enough to warrant alignment before code.

```
# Design Spec: [Component/Page Name]

## Purpose
[What this solves and who uses it]

## Surface Map
| Area | Heritage Surface | Token |
|------|-----------------|-------|
| Background | [name] | [token] |
| Cards | [name] | [token] |
| Headers | [name] | [token] |

## Token Plan
- Primary: [color tokens used]
- Typography: [font tokens per element]
- Spacing: [space tokens applied]
- Motion: [animation tokens]

## Component Inventory
- [Heritage class] — [what it's used for]
- [Heritage class] — [what it's used for]

## Trust Cue Placement
| Data Surface | Source | Freshness | State | Timezone |
|-------------|--------|-----------|-------|----------|
| [surface] | [where] | [where] | [where] | [where] |

## Responsive Notes
- 375px: [changes]
- 768px: [changes]
- 1024px: [changes]

## Sport Theming
- [ ] Uses `data-sport` attribute
- [ ] Sport accent colors applied to: [list]
```

## 2. Visual Audit Report

Use when reviewing existing BSI components for Heritage compliance.

```
# Visual Audit: [Component/File Name]

## Compliance Score: [Ship / Ship with notes / Block / Redesign]

## Critical Issues
| # | Issue | Location | Fix |
|---|-------|----------|-----|
| 1 | [violation] | [line/element] | [specific fix] |

## Important Issues
| # | Issue | Location | Fix |
|---|-------|----------|-----|
| 1 | [issue] | [line/element] | [fix] |

## Token Alignment
| Current | Should Be | Reason |
|---------|-----------|--------|
| [current value] | [correct token] | [why] |

## Trust Cue Status
- [ ] Source attribution: [present/missing]
- [ ] Freshness timestamp: [present/missing]
- [ ] Game state: [present/missing/N/A]
- [ ] Timezone: [CT/wrong/missing]

## Recommendation
[1-2 sentences: what to do and why]
```

## 3. Component Implementation

Use when building a new Heritage component.

```tsx
// Component: [Name]
// Heritage pattern: [scoreboard/dashboard-card/standings/editorial-hero/etc.]
// Surface: [token name] (#hex)
// Trust cues: [what's included]

'use client';

import { /* dependencies */ } from '...';

interface [Name]Props {
  // typed props
}

export function [Name]({ /* props */ }: [Name]Props) {
  return (
    <div className="heritage-card">
      {/* Heritage-compliant implementation */}
      {/* Trust cues included */}
    </div>
  );
}
```

## 4. Design-to-Code Adaptation

Use when converting Figma exports to BSI code.

```
# Figma → Heritage Adaptation: [Component Name]

## Figma Source
- File: [Figma file name]
- Node: [node description]

## Adaptation Decisions
| Figma Value | Heritage Equivalent | Reason |
|-------------|-------------------|--------|
| [figma color] | [token] | [why this mapping] |
| [figma font] | [token] | [why this mapping] |
| [figma radius] | [heritage value] | [constraint note] |

## Deviations from Figma
| Change | Reason |
|--------|--------|
| [what changed] | [Heritage constraint or BSI convention] |

## Implementation Notes
[Any special handling for static export, responsive, sport theming]
```

## 5. Quick Fix Prescription

Use for targeted off-brand corrections.

```
# Fix: [Brief description]

## Violation
[What's wrong and why it's off-brand]

## Current
[Current code/class/value]

## Corrected
[Heritage-compliant replacement]

## Token Reference
[Which token from bsi-brand.css this maps to]
```
