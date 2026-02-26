# 30-Day Memo — BSI Strategic Plan v2

**Date:** February 25, 2026
**Period:** Days 1-30 (condensed execution — infrastructure + content built in weeks 1-4)
**Author:** BSI (automated summary from D1 event data + deployment records)

---

## Executive Summary

Infrastructure is fully operational. Content pipeline is ahead of schedule. Distribution hasn't started. All 5 strategic queries run correctly against the D1 schema. The data to answer them doesn't exist yet because there are no real users — every event in D1 is from deployment verification on Day 1. This memo is an honest baseline, not a progress report.

---

## Infrastructure Status: Complete

| Component | Status | Notes |
|-----------|--------|-------|
| `bsi-analytics-events` Worker | Live | D1-backed, accepting POST /api/events |
| D1 schema (`bsi-events-db`) | Deployed | 5 indexes, all 5 queries verified against schema |
| Client tracker (`lib/analytics/tracker.ts`) | Wired | Page views, content reads, sport switches, email signups, paywall events |
| PageTracker component | Root layout | Fires on every route change, scroll-depth observer at 60% |
| ContentEmailGate | Built | `gated={false}` default — ready for Day 75 experiment |
| Google Search Console | Submitted | Sitemap with 161 URLs live at blazesportsintel.com/sitemap.xml |

**Assessment:** The instrumentation layer is production-grade. When traffic arrives, data will flow. The gap is traffic, not infrastructure.

---

## Content Pipeline: Ahead of Schedule

| Piece | Type | URL |
|-------|------|-----|
| Roch Cholowsky draft profile | Draft Profile | /college-baseball/editorial/roch-cholowsky-2026-draft-profile |
| Dylan Volantis draft profile | Draft Profile | /college-baseball/editorial/dylan-volantis-2026-draft-profile |
| Jackson Flora draft profile | Draft Profile | /college-baseball/editorial/jackson-flora-2026-draft-profile |
| Tyce Armstrong draft profile | Draft Profile | /college-baseball/editorial/tyce-armstrong-2026-draft-profile |
| Liam Peterson draft profile | Draft Profile | /college-baseball/editorial/liam-peterson-2026-draft-profile |
| What Two Weekends Told Us | Analysis | /college-baseball/editorial/what-two-weekends-told-us |
| Week 1 Recap | Recap | /college-baseball/editorial/week-1-recap |
| Weekend 2 Recap | Recap | /college-baseball/editorial/weekend-2-recap |

**8 editorial pieces published.** The plan called for 8 by Day 30. Cadence met.

---

## D1 Event Data Snapshot

| Metric | Value |
|--------|-------|
| Total events | 28 |
| Unique visitors | 2 (both likely Austin) |
| Sessions | 7 |
| Page views | 15 |
| Content reads | 6 |
| Sport switches | 3 |
| Email signups | 0 |
| Paywall hits | 0 |
| Paywall conversions | 0 |
| Date range | Feb 25, 2026 (single day) |

**Assessment:** Pipeline is healthy. Data is meaningless — it's deploy-day verification traffic, not real users. Cannot draw any conclusions from n=2, single-day data.

---

## Strategic Query Results (Baseline — Not Actionable)

| Query | Result | Assessment |
|-------|--------|------------|
| Q1: Cross-sport demand | 50% (1 of 2 visitors) | Meaningless at n=2 |
| Q2: Sport transitions | college_baseball ↔ mlb (1 each) | Meaningless — likely Austin testing |
| Q3: Email signup paths | Empty | Zero signups |
| Q4: Return visit rate | 0% | All events on single day |
| Q5: Paywall funnel | Empty | Paywall not yet live |

---

## Keyword Research: Assumption A1 Partially Confirmed

Full findings in `docs/keyword-research-week1.md`.

**Key result:** Player-specific long-tail terms have low-to-medium competition for analytical content. BSI's differentiation (scouting grades, game logs, statistical frameworks) is real — major outlets produce rankings but not this kind of deep analytical profile.

**Best opportunities identified:**
- "dylan volantis 2026" — low competition, only local coverage exists
- "roch cholowsky scouting grades" — zero competition
- "college baseball signal noise early season" — BSI owns this concept
- Player name + analytical framework terms (e.g., "closer to starter conversion") — zero competition

**Generic terms are not viable:** "college baseball analytics," "college baseball draft prospects 2026" — dominated by BA, ESPN, D1Baseball. BSI cannot compete without domain authority.

---

## What's Missing (Honest Gaps)

1. **Search Console data:** Submitted, but no impressions data yet. Need 2-4 weeks for Google to index new pages and report positions. Cannot evaluate SEO thesis until ~Day 45-60.

2. **Reddit post:** Drafted (`docs/reddit-post-draft.md`), not posted. This is the single highest-leverage action for generating traffic and testing whether the content resonates. Manual task.

3. **Coach outreach:** Zero emails sent. Manual task for Austin.

4. **Email list:** Zero subscribers. IntelSignup is wired into all draft profiles but no traffic means no signups.

5. **Real user data:** Every event in D1 is from Austin's own browsing during deployment verification. Until the Reddit post goes live or Search Console starts showing impressions, there's no signal to read.

---

## Decision: Is the Strategy Working?

**Cannot answer yet.** The infrastructure works. The content exists. The question — does anyone outside of Austin's immediate network care? — hasn't been tested. The plan's instrumentation was designed to answer that question; the instrumentation is ready; the question hasn't been asked yet because there's no traffic to ask it of.

**What changes the equation:**
1. Post the Reddit draft → first real referral traffic within 48 hours
2. Wait for Search Console impressions → first organic signal at Day 45-60
3. Share profiles on Twitter/X → additional referral path

**What doesn't change the equation:**
- Publishing more content without distribution
- Running queries on empty data
- Optimizing infrastructure that works

---

## Next 30 Days (Days 31-60) Priorities

1. **Post Reddit draft immediately** — r/collegebaseball, weekday afternoon
2. **Publish 2/week** — continue cadence with new profiles and Weekend 3-4 recaps
3. **Internal linking pass** — cross-link all 5 draft profiles to each other
4. **Check Search Console at Day 45** — first read on impressions/positions
5. **Re-run full query batch at Day 60** — with real data if Reddit drives traffic
6. **Send first email newsletter** — even if list is small, open/click data matters
7. **60-day decision checkpoint** — 1-page memo with numbers, not feelings

---

*This memo was generated from D1 query results and deployment records. No speculation, no inflation. The data says what the data says.*
