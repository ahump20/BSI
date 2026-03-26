# Eval 3: Design-to-Code from Figma Export

## Scenario
"I have a Figma export for a player stats card. It uses Inter font,
12px border-radius, a white background with subtle shadow, and teal
accent colors. Adapt it for BSI."

## Input (Figma specifications)
- Background: `#FFFFFF` with `box-shadow: 0 4px 6px rgba(0,0,0,0.1)`
- Border: `1px solid #E5E7EB` (gray-200)
- Border radius: `12px`
- Header font: `Inter, 18px, semibold, #111827` (gray-900)
- Body font: `Inter, 14px, regular, #6B7280` (gray-500)
- Stat value font: `Inter, 24px, bold, #111827`
- Accent color: `#14B8A6` (teal-500)
- Accent border-left: `4px solid #14B8A6`
- Padding: `24px`
- Label: `Inter, 12px, medium, uppercase, #9CA3AF` (gray-400)

## Expected Adaptation

The skill should produce an adaptation report AND Heritage code.

### Adaptation Decisions

| Figma Value | Heritage Equivalent | Reason |
|-------------|-------------------|--------|
| `#FFFFFF` bg | `--surface-dugout` (#161616) | BSI is dark-mode only |
| `box-shadow` | Remove or use `--glow-primary-subtle` | Heritage uses glow, not drop shadow |
| `#E5E7EB` border | `--border-vintage` | Heritage warm border |
| `12px` radius | `2px` | Heritage sharp radius |
| Inter header | `--bsi-font-display` (Oswald) | Heritage display font |
| Inter body | `--bsi-font-body` (Cormorant Garamond) | Heritage body font |
| Inter stats | `--bsi-font-data` (IBM Plex Mono) | Heritage data font |
| `#111827` text | `--bsi-bone` (#F5F2EB) | Dark-mode primary text |
| `#6B7280` body | `--bsi-dust` (#C4B8A5) | Heritage secondary text |
| `#14B8A6` accent | `--bsi-primary` (#BF5700) | Heritage brand accent |
| `4px` accent line | `3px` + `.section-rule` | Heritage accent bar |
| `24px` padding | `var(--bsi-space-6)` (1.5rem) | BSI space scale |
| `12px` label | `--font-size-label` (10px) | Heritage label size |

### Heritage Code Output

```tsx
'use client';

interface PlayerStatsCardProps {
  player: {
    name: string;
    position: string;
    stats: { label: string; value: string | number }[];
  };
  meta?: {
    source: string;
    fetched_at: string;
  };
}

export function PlayerStatsCard({ player, meta }: PlayerStatsCardProps) {
  return (
    <div className="heritage-card">
      {/* Accent bar */}
      <div className="section-rule-thick" />

      <div className="p-6" style={{ padding: 'var(--bsi-space-6)' }}>
        {/* Header */}
        <h3 style={{
          fontFamily: 'var(--bsi-font-display)',
          fontSize: '1.125rem',
          fontWeight: 600,
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
          color: 'var(--bsi-bone)',
        }}>
          {player.name}
        </h3>
        <span style={{
          fontFamily: 'var(--bsi-font-mono)',
          fontSize: 'var(--font-size-label)',
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          color: 'var(--bsi-dust)',
        }}>
          {player.position}
        </span>

        {/* Stats grid */}
        <div className="mt-4 grid grid-cols-3 gap-4">
          {player.stats.map(stat => (
            <div key={stat.label}>
              <div style={{
                fontFamily: 'var(--bsi-font-data)',
                fontSize: 'var(--font-size-stat)',
                fontWeight: 700,
                color: 'var(--bsi-bone)',
              }}>
                {stat.value}
              </div>
              <div style={{
                fontFamily: 'var(--bsi-font-mono)',
                fontSize: 'var(--font-size-label)',
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                color: 'var(--bsi-dust)',
              }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Trust cues */}
        {meta && (
          <div className="mt-4 flex items-center justify-between">
            <span className="heritage-stamp">
              Source: {meta.source}
            </span>
            <span style={{
              fontFamily: 'var(--bsi-font-mono)',
              fontSize: 'var(--font-size-micro)',
              color: 'var(--bsi-text-dim)',
            }}>
              Updated {meta.fetched_at} CT
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
```

## Scoring

| Criteria | Weight |
|----------|--------|
| All Figma values mapped to Heritage tokens | 25% |
| No Figma values passed through unchanged | 20% |
| Dark-mode adaptation correct | 15% |
| Trust cues included | 15% |
| BSI stack constraints respected (use client, typed props) | 15% |
| Adaptation decisions documented | 10% |

**Pass threshold:** 85%+

## Anti-Patterns to Check

The output must NOT contain:
- [ ] Any Inter font reference
- [ ] Any teal/cyan color
- [ ] Any white or light background
- [ ] Border-radius > 2px
- [ ] Drop shadows (use glow tokens instead)
- [ ] Raw hex colors not from Heritage palette
- [ ] Missing `'use client'` directive
- [ ] Untyped props
