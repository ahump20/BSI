# BSI Weekly Recap — Editorial Template

Structural skeleton extracted from canonical examples: `week-1-recap/page.tsx` (494 lines) and `weekend-2-recap/page.tsx` (419 lines).

---

## File Structure

```
BSI-local/app/college-baseball/editorial/weekend-{N}-recap/page.tsx
```

Server component. No `'use client'`. ~400-450 lines TSX.

---

## Component Architecture

```
1. Imports (8 lines)
2. Metadata export (title, description, openGraph)
3. RankingEntry interface + RANKINGS data (Top 25 array)
4. movementClass() helper (4 lines)
5. STATS array (4 stat cards)
6. Page component:
   a. Breadcrumb (College Baseball > Editorial > Weekend N Recap)
   b. Hero (Badge, date, read time, headline, subhead)
   c. Stat cards grid (2x2 mobile, 4-col desktop)
   d. Lede section (2 paragraphs)
   e. 3-4 narrative sections
   f. Rankings table (full Top 25)
   g. 1-2 additional sections (undefeateds, conference shape, quick hits)
   h. [Optional: Pull Quote blockquote]
   i. Weekend N+1 Preview (3-4 matchups)
   j. BSI Verdict (2-paragraph synthesis)
   k. Attribution (DataSourceBadge + nav links)
   l. Footer
```

---

## Section-by-Section Voice Patterns

### Metadata

Title format: `"Weekend N Recap: [Punchy Hook]. [Second Beat]. | Blaze Sports Intel"`

The hook is a specific detail that captures the weekend. Not generic ("Great Weekend of Baseball"). Concrete: "Three Grand Slams. One Record Book." / "The No. 1 Showed Up. The Rest Got Sorted."

### Hero

- Badge: `Weekend N Recap`
- Date: Monday publish date
- Read time: `~15-18 min read`
- Headline: 3-part, display font. First part is a stat or fact. Second is a gradient-text contrast. Third is the forward-looking frame.
  - Week 1: "Three Grand Slams. One Record Book. The Season Starts Now."
  - Weekend 2: "The No. 1 Showed Up. The Rest Got Sorted."
- Subhead: Italic font-serif. One sentence framing what the weekend revealed (not what happened).
  - Week 1: "Opening Weekend separated the teams that could win multiple ways from the teams that needed one script."
  - Weekend 2: "UCLA made a statement. TCU dropped 11 spots. Two players hit for the cycle."

### Stat Cards

4 cards. Each has: `label`, `value`, `helperText`.

Pattern: Pick the 4 most striking numbers from the weekend. At least one individual performance, one team performance, one context stat.

### Lede (Section background="charcoal")

**Two paragraphs.** This is where the weekend's thesis gets established.

**Paragraph 1:** Opens with a cascade of specific facts (sweep count, rankings movement, individual feat), then pivots to what Opening Weekend/the weekend actually revealed. Starts in motion — no warm-up. The lede names the mechanism, not just the result.

Voice pattern: "What we learned across [X] games is this: [thesis]."

**Paragraph 2:** Typically structured as "Three things separated X from Y." Each point is a sentence or two, building the case with evidence. This paragraph earns the thesis from paragraph 1 with specific supporting observations.

### Narrative Sections (3-4, alternating backgrounds)

Each section has:
- `h2` heading: `font-display text-2xl font-semibold uppercase tracking-wider text-burnt-orange`
- Content: 3-5 paragraphs of `font-serif text-lg leading-[1.78] text-white/80`

**Section patterns from canonical examples:**

1. **The Marquee Matchup** — "The Neutral Sites Told the Real Story" / "UCLA Did What No. 1 Teams Are Supposed to Do"
   - Cover the weekend's highest-profile matchups at neutral sites or ranked-vs-ranked
   - Multiple paragraphs, each covering a different matchup within the venue/theme
   - Stats woven into narrative — not front-loaded, placed at point of argument

2. **Performance of the Weekend** — Individual player feature
   - One player's historic performance narrated with context
   - Compare to historical precedent (e.g., "first since LaFountain in 1976")
   - End with the limitation or caveat that makes the performance honest

3. **The Risers / Upset Report** — Teams that moved the most in rankings
   - Each team gets a paragraph: what they did, what it means, what to watch
   - Bold team names: `<strong className="text-white font-semibold">`
   - Stats inline supporting the claim

4. **Quick Hits From the Margins** — Shorter items (2-3 sentences each)
   - Programs returning from cancellation
   - Program records broken
   - Quirky performances that deserve notice
   - Context stats for the season ahead

### Rankings Table

Full Top 25. Columns: Rank, Team, Record, Change, Prev, Headline.

Styling: `font-display` headers, `font-serif` body, `font-mono` records. Movement colors: green for up, red for down, ember for NEW, white/30 for unchanged.

### [Optional] Pull Quote

Blockquote between sections. `border-l-[3px] border-burnt-orange pl-6`. Typically synthesizes the weekend's thesis in one voice-matched sentence.

### Weekend N+1 Preview (background="charcoal")

3-4 matchups to watch. Each matchup gets its own paragraph.

**Voice pattern for previews:** Frame around the question the game answers, not just who plays whom.
- "This is the weekend's most revealing game. Tennessee needs a quality win to arrest a 7-spot slide..."
- "Tests whether [Team]'s [strength] can translate against [opponent's strength]."
- "This is the kind of late-February game that rewrites preseason projections."

End with a broader statement about what the weekend as a whole will clarify.

### BSI Verdict

Special styling: `bg-gradient-to-br from-burnt-orange/8 to-[#8B4513]/5 border border-burnt-orange/15`

Label: `BSI Verdict` positioned as a floating badge above the box.

**Two paragraphs:**

**Paragraph 1:** Synthesizes the weekend. Names 3 specific things that happened and what they mean together. This is not a summary — it's a reframe. Each detail is chosen because it represents a larger truth.

Voice patterns:
- "Weekend 2 separated the teams playing to a standard from the teams playing to a schedule."
- "Opening Weekend did what it always does — it separated preparation from prediction."

**Paragraph 2:** Forward-looking. States the question that the next weekend must answer. Ends with a conclusive reframe — the lens widens beyond this weekend into the season.

Voice patterns:
- "Weekend 3 brings the question that February can only ask but never fully answer..."
- "The story of the 2026 season won't be written for four more months. But the handwriting is already on the wall."

### Attribution

`DataSourceBadge` with sources and timestamp. Navigation links to editorial index and previous recap.

---

## Typography Rules

- `&mdash;` for em-dashes
- `&ndash;` for en-dashes (game scores: `10&ndash;2`, date ranges: `Feb 27&ndash;Mar 1`)
- `&rsquo;` for apostrophes
- `&amp;` for ampersands
- `&eacute;` for accented characters (résumé)

---

## Voice Reminders Specific to Recaps

- **Start in motion.** The lede's first sentence is already going somewhere.
- **Name the mechanism.** "The margin wasn't the story. The mechanism was."
- **Connect performance to identity.** Individual stats exist to illuminate what a team is, not just what a player did.
- **Use the upset to reveal something structural** about the losing team, not just to report the loss.
- **Frame previews around questions** the games will answer, not just matchups.
- **The Verdict reframes.** It never summarizes. It widens the lens and points forward.
- **Stats earn their place.** Woven into the argument, not front-loaded. "He threw 98 with late life on a 2-2 count in the seventh" > "his stats were impressive."
