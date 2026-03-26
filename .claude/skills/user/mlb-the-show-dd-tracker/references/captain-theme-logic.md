# Captain Logic & Theme-Team Framework

## Captain System Overview

Captains are special card designations that grant squad-wide stat boosts when their activation conditions are met. A DD squad has one active captain slot. The boost applies to all 26-man roster cards that match the captain's requirement filter.

## Data Source Hierarchy

1. **Official `/apis/captains.json`** — ground truth for captain names, boost descriptions, and requirement text
2. **Derived analysis** — BSI worker layer parses requirement text into structured conditions
3. **Unknown/ambiguous** — if requirement text is vague or uses undefined terms, surface the raw text and mark as "unverified logic"

**Never invent thresholds, boost magnitudes, or activation conditions.** If the API says "Requires 5 Live Series Diamond players" and the current squad has 3, report 3/5 progress. Do not guess what happens at 4.

## Captain-Fit Analysis (Worker Layer)

The `mlb-the-show-store.ts` should compute captain fit per card:

```
For each card + each captain:
  1. Parse captain requirement type:
     - SERIES_COUNT: "N cards from {series}"
     - TEAM_COUNT: "N cards from {team}"
     - RARITY_COUNT: "N {rarity} cards"
     - POSITION_COUNT: "N {position} players"
     - ATTRIBUTE_THRESHOLD: "N cards with {attribute} >= X"
     - COMPOUND: multiple conditions (AND/OR)
     - UNKNOWN: raw text, no structured parse
  2. Determine if this card contributes to the requirement
  3. Return: { contributes: boolean, requirement_type: string, raw_text: string }
```

### Parsing Rules

- Match series names exactly against `meta_data.json` series list
- Match team names against official team list (not abbreviations)
- Rarity matching is case-insensitive: "Diamond" = "diamond"
- Position matching uses `display_position` field
- If requirement text contains terms not in meta_data, classify as UNKNOWN

### Captain Progress (Team Builder)

For a given squad + selected captain:
```
{
  captain_name: string,
  boost_description: string,      // Raw from API
  requirements: [
    {
      type: "SERIES_COUNT" | "TEAM_COUNT" | ... | "UNKNOWN",
      raw_text: string,           // Always include
      target: number | null,      // null if unparseable
      current: number | null,     // null if unparseable
      met: boolean | null,        // null if uncertain
      contributing_cards: uuid[]  // Cards that count toward this req
    }
  ],
  all_requirements_met: boolean | null,  // null if any req is UNKNOWN
  boost_active: boolean | null           // null if uncertain
}
```

## Theme-Team Accuracy

Theme teams are user-constructed squads built around a constraint: all-one-team, all-one-series, specific era, etc. BSI tracks theme-team fit for discoverability and team-builder suggestions.

### Theme Types

| Theme | Constraint | Verified From |
|-------|-----------|---------------|
| Franchise | All cards share `team` field | item.team |
| Series | All cards share `series` field | item.series |
| All-Diamond | All cards rarity = "Diamond" | item.rarity |
| Captain-Optimized | Squad maximizes one captain's boost | captain analysis |

### Theme Score

```
theme_score = matching_cards / total_roster_slots
```

Where `matching_cards` counts cards that satisfy the theme constraint. A 26/26 franchise team is a "pure" theme team. 22/26 is partial.

### What NOT To Assume

- Card "chemistry" or "synergy" bonuses that aren't in the API
- Hidden captain thresholds beyond what requirement text states
- Parallel/prestige effects on captain eligibility (these are local build states, not market data)
- Community-coined captain tier lists (S/A/B ranking) — surface raw boost descriptions and let the user evaluate
