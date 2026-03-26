---
name: austin-canonical-voice
description: Enforces verbatim use of Austin Humphrey's canonical quotes, slogans, and branded phrases across all BSI properties. Triggers when editing public-facing content, hero sections, about pages, taglines, slogans, mottos, headers, or when the austin-voice agent writes copy containing branded phrases. Also triggers on "use my words," "don't change the quote," "exact quote," "canonical," or any mention of BSI slogan/tagline/motto. For voice *style* guidance, use the `austin-voice` skill instead — this skill is about *exact words*, not style.
---

# Austin Canonical Voice — Quote Integrity Skill

## Purpose

Austin's exact words are non-negotiable. This skill ensures that when his verified quotes, slogans, or branded phrases appear in any output — code, copy, editorial, documentation — they are reproduced **verbatim**. No paraphrasing. No word-order changes. No "improvements."

The canonical source of truth is:
`~/.claude/projects/-Users-AustinHumphrey/memory/canonical-quotes.md`

---

## When This Skill Activates

1. **Any edit to public-facing content** across BSI properties (blazesportsintel.com, austinhumphrey.com, blazecraft.app, labs.blazesportsintel.com)
2. **Hero section, about page, or showcase edits** in any repo
3. **Mentions of:** slogan, tagline, motto, header text, branded phrase, "use my words," "don't change the quote," "exact quote," "canonical"
4. **When the austin-voice agent writes copy** that contains or references branded phrases
5. **Any content containing the words:** born, blaze, path, beaten, less (in proximity — triggers slogan verification)

---

## Enforcement Protocol

### On Write/Edit of Public Content

1. **Read** the canonical quotes registry
2. **Scan** the content being written for any phrase that matches or nearly matches a registry entry
3. **If exact match:** approve — the quote is being used correctly
4. **If near-match with altered wording:** STOP. Surface the correct canonical version. Do not proceed with the altered version.

### The BSI Slogan — Special Case

The canonical slogan is:

> **"Born to Blaze the Path Beaten Less"**

This is the ONLY correct word order. The most common drift is "the Path Less Beaten" — which is WRONG. The words "beaten" and "less" are deliberately inverted from the Robert Frost convention. This is intentional. It's Austin's phrase, not Frost's.

If you encounter "Path Less Beaten" anywhere, it must be corrected to "Path Beaten Less."

### Cross-Reference Check

Each registry entry has a `Used on` field listing where the quote appears in production. When correcting a quote in one location, check all other listed locations for the same drift.

---

## Passive Capture Protocol

During any conversation with Austin:

1. **Listen for quotable statements** — deeply human observations, structurally insightful claims, or phrases clearly suitable for public use
2. **Flag internally** — do not interrupt the conversation flow
3. **At conversation end** (or when Austin asks), surface flagged quotes:
   - Present the exact words
   - Suggest a category and short label
   - Ask: "Worth adding to the registry?"
4. **If Austin approves:** write the entry to the canonical quotes registry with:
   - `Source: conversation, [date]`
   - `Used on: internal` (until deployed somewhere)
   - `Public-facing: no` (until Austin says otherwise)
5. **Never auto-add.** The registry is Austin's curated collection, not a conversation log.

---

## Quote Lookup

When Austin or any process asks for a specific quote, search the registry by:
- Category (slogan, tagline, insight, philosophy, editorial, one-liner, founding)
- Keywords in the quote text
- Property where it's used (`Used on` field)
- Public-facing status

Return the exact quote with its full metadata.

---

## Integration with Other Skills

- **`austin-voice`** — covers *how* Austin writes (style, rhythm, vocabulary). This skill covers *what he has actually said* (exact words).
- **`bsi-editorial-voice`** — editorial content may reference canonical quotes. This skill ensures they're reproduced correctly.
- **`bsi-weekly-recap`** — recap articles may include branded phrases. Same enforcement applies.

---

## Registry Maintenance

- **Add entries:** Only with Austin's explicit approval
- **Update `Used on`:** When a canonical quote is deployed to a new location, update the registry entry
- **Remove entries:** Only with Austin's explicit instruction
- **Correct entries:** If Austin says "I actually said X, not Y" — update immediately, then propagate the correction to all listed locations

---

## Quick Reference — Public-Facing Canonicals

These are the quotes most likely to appear in code and copy. Memorize them:

| Label | Canonical Text |
|-------|---------------|
| BSI Slogan | "Born to Blaze the Path Beaten Less" |
| Coverage Philosophy | "We cover the Tuesday night game between Rice and Sam Houston the same way we cover the Saturday showcase between Tennessee and LSU." |
| Infrastructure Scale | "Fourteen Workers. Five databases. Eighteen buckets. Six sports. One person." |
| Storytelling Identity | "Strong storytelling is not marketing fluff." |
