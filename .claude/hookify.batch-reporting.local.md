# Batch Reporting Rule

**Trigger:** Before sending any response that reports completed work

**Rule:** Never report individual small changes one at a time. All work must be grouped into batches of 5 before reporting. If fewer than 5 items are complete, either:
- Continue working until 5 items are done, then report
- If the task is genuinely complete with fewer than 5 items, report them together in a single summary

**Blocked patterns:**
- "I fixed the [single thing]" followed by waiting for approval
- "Done. Want me to continue?" after each small change
- Reporting 1-2 items when more work clearly remains

**Allowed patterns:**
- "Shipped 5 improvements: [list]. Next batch would be [preview]."
- "Task complete (3 items — that's everything for this scope): [list]."
- Asking Austin for a product/UX decision that genuinely blocks the next step

**Rationale:** Austin wants to walk away and come back to a finished batch, not click-approve every 5 minutes.
