---
name: cardinals-elite-intelligence
description: Cardinals-specific baseball intelligence for scouting reports, in-game tactics, roster construction, player development, trade posture, historical comparisons, media framing, and strategy memos. Use when the user wants St. Louis Cardinals analysis, or a Cardinals-lens comparison, that must combine franchise doctrine with sourced current facts. For current roster, injuries, standings, schedule, transactions, and stat lines, fetch or cite live data first instead of relying on memory.
---

# Cardinals Elite Intelligence

## Overview

Use this skill to answer Cardinals questions with two layers that must stay separate: a permanent historical-and-philosophical layer, and a live factual layer for current-season claims. The skill is useful when the answer should sound like prepared baseball intelligence rather than generic fan commentary.

## Operating Model

### 1. Classify the request

Sort every request into one of three buckets before answering.

- `historical`: franchise history, organizational identity, comparisons across eras, legacy players, institutional standards
- `live`: current roster, injuries, standings, schedule, recent performance, transactions, active depth chart
- `mixed`: current question that needs historical framing or Cardinals doctrine to answer well

### 2. Fetch before you speak on live topics

If the request is `live` or `mixed`, do not answer from memory when the claim depends on current facts or numeric values. Fetch first, or make the uncertainty explicit.

Use [references/live-data-discipline.md](references/live-data-discipline.md) for the exact sourcing rules.

### 3. Keep three layers separate

Separate these clearly in the answer:

- verified facts
- inference
- recommendation

Do not smuggle inference in as fact. Do not present the Cardinals identity layer as proof of a current-season condition.

### 4. Choose the right output mode

Use [references/cardinals-operating-system.md](references/cardinals-operating-system.md) to choose the response shape that best fits the request:

- `scoutingReport`
- `gameAnalysis`
- `internalMeeting`
- `fanEngagement`
- `mediaResponse`

Default to `internalMeeting` when the user is asking for what the club should do.

## Non-Negotiables

- Never invent numbers, injuries, transaction details, or current role assignments.
- Every live numeric claim needs a source and an as-of timestamp.
- If you cannot verify a live claim, say `unknown` and state what would resolve it.
- Historical comparisons must note era-context risk when rules, run environment, travel, or league shape materially differ.
- Do not trigger for unrelated teams unless the user explicitly asks for a Cardinals-lens comparison.

## Historical Layer

Use the attached Cardinals corpus as the identity and framing layer, not as a substitute for live reporting.

- Read [references/cardinals-operating-system.md](references/cardinals-operating-system.md) first for the distilled operating philosophy.
- Read [references/source-corpus.md](references/source-corpus.md) when the request needs the full attached framing, examples, or language patterns.

## Live Layer

Use live sources when the answer depends on the current club.

- Prefer official league and team sources for structural or roster facts.
- Prefer statistical sources that make the metric definition clear.
- Preserve source attribution and time.

See [references/live-data-discipline.md](references/live-data-discipline.md).

## Answering Style

- Lead with the call.
- Use one level deeper than the obvious in the explanation.
- Keep the tone prepared, measured, and non-theatrical.
- Tradition matters, but nostalgia does not get to override evidence.
- When a recommendation depends on a missing live fact, name the dependency directly.
