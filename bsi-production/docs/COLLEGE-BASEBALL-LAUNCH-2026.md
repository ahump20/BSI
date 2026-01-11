# College Baseball Season Launch Plan 2026

> **The season that proves BSI's value proposition**

*Created: January 9, 2026*

---

## Executive Summary

College baseball season runs February 14 – June 30, 2026. This is BSI's primary revenue window (60%+ annual target). The launch plan focuses on three pillars:

1. **Content readiness** — Preseason rankings, team previews, and data infrastructure live before first pitch
2. **Feature completeness** — All college baseball tools functional and tested
3. **Audience building** — Organic growth through quality coverage that fills the ESPN gap

---

## Key Dates

| Date | Event | BSI Action |
|------|-------|------------|
| **Jan 20** | Preseason rankings drop | Publish BSI Power Rankings + Conference Previews |
| **Feb 1** | 2 weeks to Opening Day | Feature freeze, content push |
| **Feb 14** | Opening Day (NCAA) | Full coverage begins |
| **Feb 21-23** | First weekend series | Prove real-time capability |
| **Mar 14-16** | Conference play begins | Conference-specific features live |
| **May 23-26** | Conference Tournaments | Tournament bracket coverage |
| **Jun 6-11** | NCAA Regionals | Regional coverage + bracket tracker |
| **Jun 13-22** | Super Regionals | Deep analytics for 8-team field |
| **Jun 20-30** | College World Series | Peak coverage, maximum engagement |

---

## Content Calendar: Pre-Season (Jan 10 – Feb 13)

### Week 1-2 (Jan 10-24): Foundation Content

| Content Piece | Publish Date | Owner |
|---------------|--------------|-------|
| 2026 D1 Power Rankings (Top 50) | Jan 20 | Editorial |
| SEC Preview: "The Conference to Beat" | Jan 21 | Editorial |
| Big 12 Preview | Jan 22 | Editorial |
| ACC Preview | Jan 23 | Editorial |
| Pac-12 Preview | Jan 24 | Editorial |

### Week 3-4 (Jan 25 – Feb 7): Deep Dives

| Content Piece | Publish Date | Owner |
|---------------|--------------|-------|
| Texas Longhorns Season Preview | Jan 27 | Editorial |
| Top 25 Freshmen to Watch | Jan 28 | Editorial |
| Transfer Portal Impact Rankings | Jan 29 | Editorial |
| Coach of the Year Candidates | Jan 30 | Editorial |
| Remaining Conference Previews (6) | Jan 31 – Feb 5 | Editorial |

### Week 5 (Feb 7-13): Launch Week

| Content Piece | Publish Date | Owner |
|---------------|--------------|-------|
| Opening Weekend Schedule Guide | Feb 10 | Editorial |
| Live Scoring System Test | Feb 12 | Engineering |
| "Welcome to the Season" Homepage Update | Feb 13 | Design |
| Social Launch Campaign | Feb 14 | Marketing |

---

## Feature Checklist: Must-Have for Feb 14

### Live Data (Critical Path)

- [ ] **Live Scores** — All D1 games with box scores
- [ ] **Standings** — Conference standings auto-updating
- [ ] **Rankings** — D1Baseball/Baseball America integration
- [ ] **Schedules** — Filterable by conference, team, date
- [ ] **Box Scores** — Complete batting/pitching lines

### Analytics Tools

- [ ] **Team Comparison Tool** — Side-by-side stats
- [ ] **Player Lookup** — Search by name, school, position
- [ ] **Conference Standings Calculator** — Playoff implications

### Nice-to-Have (Can Launch Later)

- [ ] **Draft Tracker** — Top prospects with scouting grades
- [ ] **Transfer Portal Tracker** — Live portal entries
- [ ] **Monte Carlo Tournament Odds** — CWS probability calculator

---

## Technical Requirements

### Data Pipeline

| Source | Data Type | Update Frequency | Status |
|--------|-----------|------------------|--------|
| D1Baseball | Scores, standings | Real-time | ✅ Live |
| NCAA Stats | Official stats | Daily | ⚠️ Needs testing |
| Baseball Reference | Historical | Weekly | ✅ Live |
| Perfect Game | Recruiting | Weekly | ⏳ Not integrated |

### Infrastructure

- **Cloudflare Workers**: bsi-baseball-ingest (active)
- **D1 Database**: bsi-game-db (active)
- **R2 Storage**: blazesports-assets (active)
- **KV Cache**: BSI_BASEBALL_CACHE (active)

### Performance Targets

- Page load: <2s on 4G mobile
- Score updates: <30s latency
- Search results: <500ms

---

## Marketing & Growth

### Organic Strategy (No Paid Ads)

**Week of Jan 20 (Rankings Drop):**
- Publish BSI Power Rankings before anyone else
- Thread on Twitter/X with methodology
- Reddit posts in r/collegebaseball (no spam, genuine engagement)

**Week of Feb 14 (Opening Day):**
- Live-tweet games with real insights
- Quick takes on surprising results
- Feature best performances of the weekend

**Ongoing:**
- Respond to questions on social
- Share specific stats that showcase depth
- Let the coverage speak—no hype marketing

### Target Metrics (Feb-Mar)

| Metric | Target | Tracking |
|--------|--------|----------|
| Monthly Active Users | 5,000 | GA4 |
| College Baseball Page Views | 50,000 | GA4 |
| Free Trial Signups | 200 | Stripe |
| Pro Conversions | 50 | Stripe |
| Time on Site (avg) | 4+ min | GA4 |

---

## Risk Mitigation

### Data Reliability

**Risk:** Live score API outage during high-traffic game  
**Mitigation:** Fallback to manual entry, cached data display with "Last updated" timestamp

### Traffic Spikes

**Risk:** CWS traffic overwhelms infrastructure  
**Mitigation:** Cloudflare auto-scaling, pre-warming cache for predictable high-traffic events

### Content Quality

**Risk:** Rushing content leads to errors  
**Mitigation:** Fact-check all stats against primary sources, correction policy visible on site

---

## Resource Allocation

### January Focus (Weeks 1-4)

- 70% — Content creation (previews, rankings)
- 20% — Technical testing (data pipelines, live scoring)
- 10% — Marketing prep (social assets, launch messaging)

### February-March Focus (Weeks 5-12)

- 60% — Live coverage (games, recaps, analysis)
- 30% — Feature polish (based on user feedback)
- 10% — Growth (social engagement, Reddit)

### April-June Focus (Weeks 13-24)

- 70% — Tournament coverage (conference, regionals, CWS)
- 20% — Conversion optimization (trial → paid)
- 10% — Post-season content planning

---

## Success Criteria

### By Feb 28 (2 weeks in):

- [ ] Live scores functional for all D1 games
- [ ] 100+ users returning daily
- [ ] Zero major data errors reported

### By Mar 31 (6 weeks in):

- [ ] 1,000+ MAU on college baseball pages
- [ ] 25+ Pro conversions from college baseball fans
- [ ] Positive feedback on coverage depth

### By Jun 30 (Season End):

- [ ] 5,000+ MAU total
- [ ] 100+ Pro subscriptions
- [ ] Brand recognition as "the college baseball site"

---

## Next Actions (This Week)

1. **Jan 10-12:** Verify live scoring pipeline with test data
2. **Jan 13-15:** Draft Top 50 Power Rankings
3. **Jan 16-17:** Create SEC Preview content
4. **Jan 18-19:** Test all college baseball pages on mobile
5. **Jan 20:** PUBLISH Power Rankings

---

*The season that proves the model. Coverage that matches their commitment.*
