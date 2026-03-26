# Output Modes

Eight output templates for Texas Longhorns intelligence. Choose the mode that fits the request. Default to `opsBriefing` when Austin is the audience and the question is operational.

## 1. scoutingReport

Use for: player evaluations, prospect breakdowns, role projections, draft analysis.

**Sections:**
- **Summary** — one paragraph, lead with the call (start/bench/watch/develop)
- **HAV-F Breakdown** — composite score and component analysis via `cbb_havf_player`
- **Evidence** — specific stats, tendencies, and tool data that support the call
- **Role Projection** — where this player fits in the Texas lineup/rotation, short and long term
- **Development Plan** — what needs to improve, realistic timeline
- **Ceiling vs Floor** — best and worst reasonable outcomes

## 2. gameAnalysis

Use for: postgame breakdowns, in-game tactical questions, series recaps.

**Sections:**
- **Situation Snapshot** — score, context, what was at stake
- **MMI Highlights** — momentum timeline via `cbb_mmi_game`, key inflection points
- **Leverage Decisions** — managerial choices at high-WP-shift moments, were they right?
- **Assessment** — what worked, what didn't, who stepped up, who didn't
- **Series Implications** — what this game means for the weekend, the SEC standings, or the season

## 3. internalMeeting

Use for: roster construction, strategic questions, "what should Texas do about X," program assessment.

**Sections:**
- **Problem Definition** — what's the question, stated clearly in one sentence
- **Root Causes** — MCP data supporting what's actually happening (not vibes)
- **Options** — 2-3 realistic paths, each with tradeoffs
- **Recommendation** — pick one, commit, explain why
- **Risks** — what could go wrong with the recommendation
- **Near-term Execution** — first concrete step

## 4. editorialPiece

Use for: BSI-published content. Follows `/bsi-editorial-voice` standards.

**Structure:**
- **Lede** — specific moment or stat that hooks the reader
- **Evidence build** — MCP data woven into narrative, not dumped as a table
- **Counterintuitive finding** — the thing that challenges the obvious read
- **Forward close** — implication, not summary; what this means going forward

**Rules:** Must pass HWI audit gate. Mobile-first brevity. No fabricated quotes. Vision over grievance.

## 5. socialClip

Use for: social media posts, quick takes, shareable stats.

**Format:** One point + one stat + one implication. Under 280 characters.

**Examples:**
- "Texas's team K% is 3rd-lowest in the SEC. Pierce's plate discipline philosophy is showing up in the numbers, not just the rhetoric."
- "Jared Thomas's HAV-F: 78. That's an Omaha-caliber bat. The approach score (88) is what separates him."

**Rules:** No hedging. One claim. Make it count.

## 6. weeklyRecap

Use for: weekend series summaries, weekly program updates, BSI weekly content.

**Sections:**
- **Headline** — one sentence, the biggest story from the week
- **Takeaways** — 3-5 numbered observations, each backed by at least one MCP stat
- **Standings Implications** — where Texas sits in the SEC after this week
- **What's Next** — upcoming series, what to watch, key matchups

## 7. mediaResponse

Use for: public-facing statements, sensitive topics, anything that could be quoted.

**Rules:**
- No inside information or speculation beyond public reporting
- No injury projections or portal rumors presented as fact
- Short, polished, measured
- Would survive being quoted out of context

## 8. opsBriefing

Use for: briefing Austin directly. This is the most common mode when Austin asks a Texas baseball question.

**Rules:**
- Plain English only. No stat abbreviations without definition. No tool names, no file paths, no engineering terms.
- Structure: What happened → What it means → What to watch
- One page max. If it takes longer, the thinking isn't tight enough.
- Commit to a position. Austin doesn't need options — he needs your best read and why.

**Example structure:**
> Texas swept Missouri this weekend. The pitching staff held them to 2 runs per game, which is the second-best weekend ERA in SEC play so far. The lineup is still inconsistent with runners on base — they left 24 runners on across three games, which is above the SEC average. The rotation is carrying the team right now. If the bats don't wake up, the margin for error shrinks against LSU next weekend.

## 9. hubContent

Use for: generating structured content blocks for the Texas Intelligence hub page (`/college-baseball/texas-intelligence/`). Each block maps to a section of the hub.

**Sections:**
- **dashboardStrip** — current record, SEC standing, national rank, next game. JSON object.
- **programExcerpt** — 2-3 sentence program history pull for the hub page.
- **editorialLinks** — 3-4 relevant Texas articles from the editorial system.
- **digestSummary** — daily brief: 3-5 short paragraphs on current state, recent performance, upcoming schedule.

**Rules:** Factual only. Every number must come from MCP tools or verified API data. No projections unless clearly labeled. Format as JSON-serializable blocks that the hub client can render directly.

## 10. weeklyDigest

Use for: automated weekly digest generation (powers the `/api/college-baseball/texas-intelligence/digest` endpoint).

**Template:**
```json
{
  "title": "Texas Longhorns Weekly Intel — Week N",
  "date": "YYYY-MM-DD",
  "sections": [
    { "heading": "Record & Rankings", "content": "..." },
    { "heading": "Series Recap", "content": "..." },
    { "heading": "Player Spotlight", "content": "..." },
    { "heading": "Looking Ahead", "content": "..." }
  ]
}
```

**Rules:** Under 500 words total. Each section is 2-3 sentences. Lead with the most important development. Stats must be current — fetch MCP tools before generating.

## Mode Selection Heuristics

| Request type | Default mode |
|-------------|-------------|
| "How's Texas doing?" | opsBriefing |
| "Tell me about [player]" | scoutingReport |
| "What happened in the [game]?" | gameAnalysis |
| "What should Texas do about [X]?" | internalMeeting |
| "Write something about [topic]" | editorialPiece |
| "Tweet about [X]" | socialClip |
| "Weekend recap" | weeklyRecap |
| Sensitive or public-facing | mediaResponse |
| "Generate hub content" | hubContent |
| "Weekly digest" | weeklyDigest |
