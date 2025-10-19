# Accessibility Audit Playbook

**Updated:** 2025-10-18

## Scope

- `/` (College Baseball live scoreboard)
- `/football` (College Football live scores)
- `/basketball` (NCAA basketball intelligence hub)

## Automated Checks

1. Run `npm run test:a11y` locally before opening a PR.
2. CI executes the same suite via Playwright + axe-core for every pull request.
3. Fail the build on any axe violation with `impact` **serious** or **critical**.

## Manual Checklist (WCAG 2.2 AA)

| Category | Checks | Status |
| --- | --- | --- |
| Color & Contrast | Verify contrast ≥ 4.5:1 for text, ≥ 3:1 for large text. Check dark-mode backgrounds vs. gold/crimson accents. | ✅ Baseline verified 2025-10-18 |
| Keyboard Support | Tab through primary nav, sport switcher FAB, and scoreboard cards. Ensure focus outlines visible and actions trigger with <kbd>Enter</kbd>/<kbd>Space</kbd>. | ✅ |
| Screen Readers | Use NVDA/VoiceOver to confirm headings hierarchy (H1 → H2). Live score updates announce via `aria-live` regions without duplicate noise. | ⚠️ Monitor — confirm after API integration ships |
| Motion/Flashing | No auto-playing video or flashing content over 3 Hz. | ✅ |
| Forms/Inputs | None in scope. Document once filters/search ship. | N/A |

## Regression Protocol

- Capture screenshots with `npm run test:playwright -- --update-snapshots` after legitimate UI changes.
- Log any manual audit gaps as GitHub issues tagged `a11y` + `phase-4`.
- Schedule quarterly audits with the design lead; record findings in `/docs/accessibility/audit-log-<YYYY>.md`.

## Owner

- **Accessibility Champion:** Platform Engineer on rotation (Oct 2025 — @diamond-ops).

## References

- [WCAG 2.2 AA Quick Reference](https://www.w3.org/WAI/WCAG22/quickref/)
- [Deque axe-core ruleset](https://dequeuniversity.com/rules/axe/)
