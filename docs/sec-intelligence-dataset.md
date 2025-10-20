# SEC Baseball Intelligence Dataset

## Scope
This dataset captures a **structure-first** view of every Southeastern Conference baseball program as the league moves into the 2025 season (Texas and Oklahoma included). Each team file is stored under `data/college-baseball/teams/sec/` and conforms to the JSON schema defined in `schema.json`.

The records blend public knowledge with placeholders for insider verification. They are intentionally flagged as `sparse` so a researcher can plug in verified roster, staff, and NIL intel gathered from local reporting.

## File Layout
- `index.json` lists every program and maps the slug to its data file.
- `schema.json` enforces the shared structure.
- `<team>.json` stores team-specific intel including:
  - Staff hierarchy (head coach, coordinators, ops, analytics).
  - NIL collective contacts and initiatives.
  - Roster segments (returners, departures, portal additions, recruits).
  - Front office touchpoints for fundraising and operations.
  - Historical context markers for quick benchmarking.
  - `intel_notes` log referencing the local source to be validated.
  - `data_quality` metadata with next steps for researchers.

## How to Use
1. **Validate quickly:** Run a JSON schema validator before ingesting to ensure files stay consistent.
2. **Research loop:** For each `intel_notes` entry, confirm the referenced local report (newspaper, radio hit, booster forum) and flip the status to `verified` with supporting detail.
3. **Roster sync:** Pair this dataset with portal and roster trackers. Use `returning_starters`/`incoming_transfers` as anchors for automation.
4. **NIL outreach:** The `nil_operations` block stores the relationship owner and contact channels. Verify before outreach—many contacts are placeholders from public directories.
5. **Versioning:** Update `data_quality.last_reviewed` plus `next_actions` with each manual pass. Treat the files as living scouting reports.

## Outstanding Work
- Populate full roster grids once fall 2024 rosters are public.
- Confirm NIL leadership changes for LSU, Texas A&M, and Alabama collectives.
- Add analytics/video staff names for programs that have not publicly announced them.
- Layer in health/injury notes once preseason availability updates surface.

**Standard over vibes. Clarity beats noise. Box scores over buzzwords.**
