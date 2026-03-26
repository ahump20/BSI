---
name: ux-writing
description: |
  Write interface microcopy — button labels, error messages, empty states, confirmation
  dialogs, tooltips, onboarding copy, form labels, loading states, success messages, and
  notification text. Use when crafting or reviewing any text that lives inside a UI rather
  than in editorial content or long-form prose. Outputs production-ready copy strings.
  Triggers: "what should this button say", "error message for", "empty state copy",
  "write copy for", "help with UX copy", "tooltip text", "confirmation dialog",
  "placeholder text", "loading message", "onboarding copy", "notification copy",
  "form label", "CTA text", "microcopy".
  Not for: visual design or styling (frontend-design), prose polish (communication-polish),
  editorial articles (bsi-editorial-voice).
---

# UX Writing

Interface text is the product talking. Every string a user reads — button label, error message, empty state, tooltip — either builds trust or erodes it. The words are small; the stakes are not.

## Principles

1. **Clarity over cleverness.** The user is mid-task. They need to understand instantly, not appreciate wordplay. If a 12-year-old can't parse it on first read, rewrite.

2. **Active voice, present tense.** "Save changes" not "Changes will be saved." "File deleted" not "The file has been deleted." The interface acts; passive voice hides the actor.

3. **Front-load the action.** The verb comes first in buttons and CTAs. "Export CSV" not "CSV Export." "Add to watchlist" not "Watchlist addition." Users scan from the left — put the decision word there.

4. **Brevity is respect.** Every extra word is a tax on attention. Cut filler: "please," "simply," "just," "in order to." If the meaning survives without the word, the word goes.

5. **Consistent terminology.** Pick one word for each concept and use it everywhere. If it's "remove" in one place, it's not "delete" in another and "clear" in a third. Build a vocabulary the user can predict.

## Copy Patterns

### Buttons and CTAs

- Verb-first, 2-4 words: "Save draft," "Start free trial," "Export report"
- Destructive actions get specific: "Delete account" not "Delete," "Remove player" not "Remove"
- Paired actions use parallel structure: "Save / Discard," "Confirm / Cancel"
- Primary action is assertive; secondary is neutral: "Upgrade now" / "Maybe later"

### Error Messages

Structure: **What happened** + **Why** (if useful) + **What to do next**

- Bad: "Error 403"
- Bad: "Something went wrong. Please try again."
- Good: "Couldn't load standings. The data source is temporarily unavailable — try refreshing in a minute."
- Good: "That email is already registered. Sign in instead?"

Never blame the user. "Invalid input" is accusatory. "We didn't recognize that format — try MM/DD/YYYY" is helpful.

### Empty States

Empty states are onboarding moments, not dead ends. Every empty state needs:
- What this space is for (one sentence)
- How to populate it (one clear CTA)

- Bad: "No data available."
- Good: "No games on the schedule today. Check back tomorrow or browse recent scores."
- Good: "Your watchlist is empty. Search for players to start tracking."

### Confirmation Dialogs

The user is about to do something consequential. Respect the moment:
- Title states the action: "Delete this scouting report?"
- Body states the consequence: "This can't be undone. The report and all notes will be permanently removed."
- Confirm button matches the title verb: "Delete report" (not "OK" or "Yes")
- Cancel is always available and always safe

### Tooltips

- One sentence max. If you need more, the feature needs better labeling.
- Explain what it does, not what it is: "Shows how this player ranks against all D1 hitters" not "Percentile ranking metric"
- No periods on fragments. Period on full sentences.

### Form Labels and Placeholders

- Labels say what to enter: "Email address," "Team name"
- Placeholders show format or example: "you@example.com," "e.g., Texas Longhorns"
- Never use placeholder as the only label — it disappears on focus
- Required fields: mark the optional ones instead (fewer markers = less noise)

### Loading States

- Under 2 seconds: spinner or skeleton, no text needed
- 2-5 seconds: "Loading scores..." (specific noun, not "Loading...")
- 5+ seconds: "Pulling live data — this may take a moment"
- Failed load: transition to error pattern, never spin forever

### Success Messages

- Brief and specific: "Draft saved" not "Your draft has been successfully saved!"
- Auto-dismiss after 3-5 seconds unless the user needs to act on it
- For consequential actions, confirm what happened: "Account upgraded to Pro. You now have access to advanced analytics."

### Notification Copy

- Lead with the news, not the source: "Texas plays at 7pm CT tonight" not "Schedule notification: Texas game today"
- Actionable when possible: "New scouting report available — view now"
- Time-sensitive notifications include the time window

### Onboarding Copy

- One concept per step. No walls of text in modals.
- Show, don't lecture: pair each instruction with the UI element it references
- Progress indicators reduce anxiety: "Step 2 of 4"
- Skip option always visible — forced tours breed resentment

## Voice and Tone

The voice is consistent; the tone shifts with context.

| Context | Tone | Example |
|---------|------|---------|
| Neutral action | Direct, calm | "Save changes" |
| Success | Confident, brief | "Report exported" |
| Error | Honest, helpful | "Couldn't connect. Check your network and try again." |
| Destructive | Clear, careful | "This will permanently delete all game data." |
| Onboarding | Welcoming, concise | "Track the stats that matter to you." |
| Empty state | Encouraging, actionable | "Add your first player to get started." |

## Common Mistakes

1. **Vague CTAs.** "Submit" and "OK" tell the user nothing about what happens next. Use the specific verb: "Create account," "Send message," "Apply filters."

2. **Blame-the-user errors.** "Invalid input," "Incorrect format," "Bad request" — these read as accusations. Reframe around the system: "We need a valid email address" or "Try a date in MM/DD format."

3. **Walls of text in modals.** If a modal needs more than 3 sentences, the information belongs on a page, not in a popup. Modals are interruptions — respect the user's flow.

4. **Inconsistent capitalization.** Pick sentence case or title case for UI elements and stick with it. Sentence case is the modern default and reads more naturally.

5. **Technical jargon leaking into UI.** "Null response," "timeout error," "rate limited" — users don't think in system terms. Translate: "No results found," "Taking longer than expected," "Too many requests — wait a moment."

6. **Generic placeholder text shipping to production.** "Lorem ipsum," "TODO," "Coming soon" with no date — all trust killers. Every string that faces a user must be intentional.
