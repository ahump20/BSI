# Eval 2: Off-Brand Component Fix

## Scenario
Given this off-brand component code, identify violations and prescribe
Heritage-compliant replacements.

```tsx
// Off-brand standings card
export function StandingsCard({ data }) {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6 backdrop-blur-md border border-gray-200">
      <h3 className="font-sans text-xl font-bold text-gray-900 mb-4">
        SEC Standings
      </h3>
      <table className="w-full">
        <thead className="bg-purple-50">
          <tr>
            <th className="text-left p-2 text-sm font-medium text-purple-700">Team</th>
            <th className="text-left p-2 text-sm font-medium text-purple-700">W</th>
            <th className="text-left p-2 text-sm font-medium text-purple-700">L</th>
          </tr>
        </thead>
        <tbody>
          {data.map(team => (
            <tr key={team.id} className="border-b border-gray-100 hover:bg-gray-50">
              <td className="p-2 font-medium">{team.name}</td>
              <td className="p-2">{team.wins}</td>
              <td className="p-2">{team.losses}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

## Expected Identification

The skill should identify these violations:

| # | Violation | Category | Severity |
|---|-----------|----------|----------|
| 1 | `bg-white` — light background | SURFACE | Error |
| 2 | `rounded-xl` — wrong radius | RADIUS | Error |
| 3 | `backdrop-blur-md` — glass on content | GLASS | Error |
| 4 | `border-gray-200` — non-Heritage border | COLOR | Error |
| 5 | `font-sans` — non-Heritage font | FONT | Error |
| 6 | `text-gray-900` — light-mode text | COLOR | Error |
| 7 | `bg-purple-50` — startup color | GRADIENT | Error |
| 8 | `text-purple-700` — startup color | COLOR | Error |
| 9 | `border-gray-100` — non-Heritage border | COLOR | Error |
| 10 | `hover:bg-gray-50` — light hover | COLOR | Error |
| 11 | Missing source attribution | TRUST | Warning |
| 12 | Missing freshness timestamp | TRUST | Warning |

## Expected Prescription

The skill should produce Heritage-compliant replacement:

```tsx
export function StandingsCard({ data, meta }) {
  return (
    <div className="heritage-card p-0">
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <h3 style={{ fontFamily: 'var(--bsi-font-display)' }}
            className="text-sm font-semibold uppercase tracking-[0.15em]"
            style={{ color: 'var(--bsi-dust)' }}>
          SEC Standings
        </h3>
        <span className="heritage-stamp">
          Source: {meta?.source ?? 'ESPN'}
        </span>
      </div>
      <table className="stat-table">
        <thead>
          <tr>
            <th>Team</th>
            <th>W</th>
            <th>L</th>
          </tr>
        </thead>
        <tbody>
          {data.map(team => (
            <tr key={team.id}>
              <td>{team.name}</td>
              <td>{team.wins}</td>
              <td>{team.losses}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {meta?.fetched_at && (
        <div className="px-4 py-2 text-right"
             style={{ fontFamily: 'var(--bsi-font-mono)', fontSize: '0.625rem', color: 'var(--bsi-text-dim)' }}>
          Updated {meta.fetched_at} CT
        </div>
      )}
    </div>
  );
}
```

## Scoring

| Criteria | Weight |
|----------|--------|
| All violations correctly identified | 30% |
| Correct severity classification | 15% |
| Heritage-compliant replacement provided | 30% |
| Trust cues added to replacement | 15% |
| Replacement uses Heritage classes (not inline) | 10% |

**Pass threshold:** 85%+
