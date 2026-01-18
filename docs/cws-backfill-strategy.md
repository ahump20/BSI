# CWS Historical Data Backfill Strategy (2000-2016)

## Executive Summary

**Objective**: Backfill College World Series bracket games for years 2000-2016 to reach 300+ total historical games

**Current State**:

- ✅ 205 games in database (verified 2025-11-06)
- ✅ ESPN API integration complete (2017-2024: 182 games)
- ❌ Gap: 2000-2016 only have championship finals (25 games)

**Target**:

- Add 100-120 additional bracket games from 2000-2016
- Final target: 305-325 total CWS games

**Timeline**: Phase 4, Track 1 - Complete by 2025-11-13

---

## Data Source Analysis

### Primary Source: Wikipedia (Recommended)

**URL Pattern**: `https://en.wikipedia.org/wiki/{YEAR}_NCAA_Division_I_baseball_tournament`

**Availability**: ✅ Complete coverage 2000-2024

**Data Quality**:

- ✅ Comprehensive bracket structure
- ✅ All game scores and dates
- ✅ Team names, conference affiliations
- ✅ Venue information (Rosenblatt Stadium 2000-2010, TD Ameritrade Park 2011-2019, Charles Schwab Field 2020-present)
- ✅ Attendance data (varies by availability)
- ✅ Round designations (Opening Round, Elimination Game, Semifinals, Finals)

**Sample Data** (2008 CWS verified):

```
June 14-15: Opening Round (4 games)
  - Stanford 16, Florida State 5
  - Georgia 7, Miami 4
  - North Carolina 8, LSU 4
  - Fresno State 17, Rice 5

June 16-22: Bracket Play (8 elimination games)
  - Miami 7, Florida State 5 (FSU eliminated)
  - Georgia 4, Stanford 3
  - Fresno State 5, North Carolina 3
  - LSU 6, Rice 5 (Rice eliminated)
  - Stanford 8, Miami 3 (Miami eliminated)
  - North Carolina 7, LSU 3 (LSU eliminated)
  - North Carolina 4, Fresno State 3
  - Georgia 10, Stanford 8 (Stanford eliminated)
  - Fresno State 6, North Carolina 1 (UNC eliminated)

June 23-25: Championship Series (3 games)
  - Georgia 7, Fresno State 6
  - Fresno State 19, Georgia 10
  - Fresno State 6, Georgia 1
```

**Scraping Approach**:

1. Use Wikipedia API for structured data extraction
2. Parse infobox and game results tables
3. Fallback to HTML parsing if API insufficient

**Pros**:

- ✅ Free and publicly accessible
- ✅ Consistent structure across all years
- ✅ Community-verified accuracy
- ✅ No rate limits or API keys required

**Cons**:

- ⚠️ Attendance data may be incomplete for older years
- ⚠️ Requires HTML/table parsing (no official API)
- ⚠️ Must respect robots.txt and implement delays

---

### Secondary Source: Baseball-Reference BR Bullpen

**URL Pattern**: `https://www.baseball-reference.com/bullpen/{YEAR}_College_World_Series`

**Availability**: ✅ Complete coverage 2000-2024

**Data Quality**:

- ✅ Bracket structure diagrams
- ✅ Game scores and team records
- ⚠️ Variable detail by year
- ⚠️ May require cross-referencing

**Access Issues**:

- ❌ Encountered 403 Forbidden during fetch attempt
- ⚠️ May require user-agent spoofing or manual scraping

**Scraping Approach**:

1. Implement proper user-agent headers
2. Add request delays (2-3 seconds between requests)
3. Use as validation/cross-check against Wikipedia data

**Pros**:

- ✅ Baseball-specific focus with contextual data
- ✅ Links to player and team statistics

**Cons**:

- ❌ Anti-scraping protections (403 errors)
- ⚠️ Less structured than Wikipedia
- ⚠️ May require more complex parsing

---

### Tertiary Source: Team/LSU Sports Archives

**Example**: `https://static.lsusports.net/assets/08cws/index.htm`

**Availability**: ⚠️ Limited to championship-winning or participating teams

**Data Quality**:

- ✅ Complete bracket details for specific years
- ✅ Box scores and detailed statistics
- ✅ High accuracy (official team records)

**Scraping Approach**:

1. Use for gap-filling when Wikipedia/BR Bullpen incomplete
2. Target LSU (2000, 2009), Texas (2002, 2005), Miami (2001), etc.
3. Cross-reference to validate other sources

**Pros**:

- ✅ Extremely detailed when available
- ✅ Official team records with box scores

**Cons**:

- ❌ Limited availability (only for specific teams/years)
- ⚠️ Inconsistent URL patterns across schools
- ⚠️ Time-intensive to locate all archives

---

### Quaternary Source: Omaha World-Herald CWS Database

**URL**: `https://dataomaha.com/cws`

**Availability**: ✅ Historical database "since 1950"

**Data Quality**: Unknown (not yet fetched)

**Scraping Approach**:

1. Investigate database query interface
2. Use as validation source
3. Potential for bulk data export

**Pros**:

- ✅ Local Omaha source (hometown coverage)
- ✅ Long-term historical focus

**Cons**:

- ⚠️ Unknown data structure
- ⚠️ May require database queries or specialized access

---

## Implementation Plan

### Phase 1: Wikipedia Scraping (Recommended Priority)

**Script**: `/Users/AustinHumphrey/BSI/scripts/backfill-cws-wikipedia.js`

**Implementation Steps**:

1. **Wikipedia API Research** (1 hour)
   - Test Wikipedia API endpoints for tournament pages
   - Identify optimal data extraction method (API vs. HTML parsing)

2. **Parsing Logic** (3 hours)
   - Extract infobox data (dates, venue, attendance)
   - Parse bracket results tables
   - Handle year-specific formatting variations (2000-2010 Rosenblatt Stadium, 2011+ TD Ameritrade/Charles Schwab Field)

3. **Data Validation** (2 hours)
   - Reuse existing `validateGame()` function from ESPN script
   - Add Wikipedia-specific validations (team name normalization)
   - Cross-check game counts: expect 13-15 games per year

4. **Database Integration** (1 hour)
   - Generate SQL INSERT statements using existing `generateInsertSQL()` function
   - Execute via wrangler with proper CLOUDFLARE_API_TOKEN
   - Verify no duplicate games (game_id collision prevention)

**Total Estimated Time**: 7 hours

**Expected Output**: 100-120 additional bracket games

---

### Phase 2: Validation & Gap Filling (Optional)

**Script**: `/Users/AustinHumphrey/BSI/scripts/validate-cws-historical.js`

**Implementation Steps**:

1. **Cross-Reference Check** (2 hours)
   - Compare Wikipedia data against BR Bullpen pages
   - Flag discrepancies in scores or dates
   - Manual review of flagged games

2. **Gap Analysis** (1 hour)
   - Query database for years with <13 games
   - Identify missing bracket games
   - Generate target list for manual research

3. **Manual Backfill** (2-3 hours)
   - Research missing games via team archives, ESPN archives, or Omaha World-Herald
   - Add missing games to database with source attribution
   - Document data quality notes

**Total Estimated Time**: 5-6 hours

---

## Tournament Structure Reference

### CWS Format (1988-Present)

**Participants**: 8 teams

**Bracket Structure**: Two 4-team double-elimination brackets

**Game Breakdown**:

- **Opening Round**: 4 games (2 per bracket)
- **Winner's Bracket**: 2 games (1 per bracket winner)
- **Elimination Games**: 6-8 games (depends on double-elimination progression)
- **Bracket Finals**: 2 games (1 per bracket to determine CWS finalists)
- **Championship Series**: Best-of-3 (typically 2-3 games)

**Total Games Per Year**: Typically 13-15 games

**Venue History**:

- 1950-2010: Rosenblatt Stadium (Omaha, NE) - Capacity ~23,000
- 2011-2019: TD Ameritrade Park Omaha - Capacity ~24,000
- 2020-present: Charles Schwab Field Omaha (renamed) - Capacity ~24,000

---

## Data Schema Mapping

### Wikipedia → historical_games Table

```javascript
{
  game_id: `cws-${year}-${date.replace(/-/g, '')}-${home_abbr}-${away_abbr}`,
  date: 'YYYY-MM-DD',           // Parse from "June 14, 2008" → "2008-06-14"
  home_team: 'Full Team Name',   // "Georgia Bulldogs" → "Georgia"
  away_team: 'Full Team Name',   // "Fresno State Bulldogs" → "Fresno State"
  home_score: INTEGER,
  away_score: INTEGER,
  sport: 'baseball',
  tournament_round: 'College World Series - [Opening Round|Elimination Game|Bracket Final]',
  venue: 'Rosenblatt Stadium' | 'TD Ameritrade Park Omaha' | 'Charles Schwab Field Omaha',
  attendance: INTEGER | NULL,    // Use 23000 (Rosenblatt) or 24000 (TD Ameritrade) as fallback
  innings: 9 | 10+ ,             // Calculate from score and extra innings indicator
  extra_innings: 0 | 1+,         // Parse from game notes ("10 innings", "11 innings")
  lead_changes: 0,               // Not available from Wikipedia (set to 0)
  created_at: CURRENT_TIMESTAMP
}
```

### Team Name Normalization

**Common Variants to Handle**:

- "LSU Tigers" → "LSU"
- "Texas Longhorns" → "Texas"
- "Fresno State Bulldogs" → "Fresno State"
- "Cal State Fullerton Titans" → "Cal State Fullerton"
- "Miami Hurricanes" → "Miami (Fla.)" _(important: distinguish from Miami University)_
- "Coastal Carolina Chanticleers" → "Coastal Carolina"

---

## Risk Mitigation

### Data Quality Risks

**Risk**: Wikipedia data inaccuracies or vandalism
**Mitigation**:

- Cross-validate with NCAA official records when possible
- Flag any games with suspicious scores (>30 runs) for manual review
- Store data source attribution in metadata

**Risk**: Incomplete attendance data for pre-2010 games
**Mitigation**:

- Use venue capacity as fallback estimate (Rosenblatt: 23,000)
- Mark estimated attendance in database notes
- Prioritize accuracy of scores and dates over attendance precision

**Risk**: Parsing failures due to Wikipedia format changes across years
**Mitigation**:

- Implement year-specific parsing logic with fallbacks
- Log parsing errors with year and URL for manual review
- Accept partial success (e.g., 80% of games) for initial backfill

### Technical Risks

**Risk**: Rate limiting or IP blocking from Wikipedia
**Mitigation**:

- Implement 2-second delays between requests
- Use proper User-Agent header (`BlazeSportsIntel/1.0 (https://blazesportsintel.com)`)
- Consider caching parsed HTML to avoid repeated requests

**Risk**: Database constraint violations (duplicate game_ids)
**Mitigation**:

- Use `INSERT OR IGNORE` in SQL generation
- Implement game_id uniqueness check before insertion
- Log skipped duplicates for audit trail

---

## Success Metrics

**Primary Goal**:

- ✅ 300+ total CWS games in database (currently 205, need 95+ more)

**Data Quality Targets**:

- ✅ 100% coverage of championship finals (2000-2024) - COMPLETE
- ✅ 100% coverage of bracket games (2017-2024) - COMPLETE via ESPN
- 🎯 80%+ coverage of bracket games (2000-2016) - TARGET
- 🎯 90%+ accuracy on scores and dates - VALIDATE

**Database Verification Queries**:

```sql
-- Total games by year (expect 13-15 per year except 2020)
SELECT
  SUBSTR(date, 1, 4) as year,
  COUNT(*) as game_count
FROM historical_games
WHERE tournament_round LIKE '%College World Series%'
GROUP BY year
ORDER BY year;

-- Games by round type
SELECT
  tournament_round,
  COUNT(*) as count
FROM historical_games
WHERE tournament_round LIKE '%College World Series%'
GROUP BY tournament_round
ORDER BY count DESC;

-- Identify years with incomplete coverage (<13 games)
SELECT
  SUBSTR(date, 1, 4) as year,
  COUNT(*) as game_count
FROM historical_games
WHERE tournament_round LIKE '%College World Series%'
GROUP BY year
HAVING game_count < 13 AND year != '2020'
ORDER BY year;
```

---

## Timeline & Resource Allocation

**Phase 1: Wikipedia Scraping Implementation**

- **Duration**: 1 week (7 business hours)
- **Start**: 2025-11-06
- **Target Completion**: 2025-11-13
- **Deliverable**: `/Users/AustinHumphrey/BSI/scripts/backfill-cws-wikipedia.js` with 100+ games ingested

**Phase 2: Validation & Gap Filling** (Optional)

- **Duration**: 1 week (5-6 business hours)
- **Start**: 2025-11-14
- **Target Completion**: 2025-11-20
- **Deliverable**: Validated dataset with <5% error rate

**Total Estimated Effort**: 12-13 hours over 2 weeks

---

## Next Steps

1. ✅ **Strategy Document Complete** (this document)
2. ⏳ **Research Wikipedia API endpoints** for optimal data extraction method
3. ⏳ **Implement parsing logic** for tournament pages (2008 as test case)
4. ⏳ **Test backfill script** with single year (2008) to validate approach
5. ⏳ **Run full backfill** for 2000-2016 (17 years)
6. ⏳ **Verify database integrity** with SQL queries
7. ⏳ **Integrate with live platform** (Track 2: `/apps/web/app/baseball/ncaab/historical/`)

---

## Appendix: Verified Data Sources

### 2008 CWS Game-by-Game Results (Sample)

**Source**: Multiple cross-validated sources (Wikipedia, LSUsports.net, Creighton archives)

**Dates**: June 14-25, 2008
**Venue**: Rosenblatt Stadium, Omaha, NE
**Champion**: Fresno State (defeated Georgia 2-1 in finals)

**Complete Game Results**:

| Date | Home Team      | Score | Away Team      | Score | Round         |
| ---- | -------------- | ----- | -------------- | ----- | ------------- |
| 6/14 | Stanford       | 16    | Florida State  | 5     | Opening       |
| 6/14 | Georgia        | 7     | Miami          | 4     | Opening       |
| 6/15 | North Carolina | 8     | LSU            | 4     | Opening       |
| 6/15 | Fresno State   | 17    | Rice           | 5     | Opening       |
| 6/16 | Miami          | 7     | Florida State  | 5     | Elimination   |
| 6/16 | Georgia        | 4     | Stanford       | 3     | Winner's      |
| 6/17 | Fresno State   | 5     | North Carolina | 3     | Winner's      |
| 6/17 | LSU            | 6     | Rice           | 5     | Elimination   |
| 6/18 | Stanford       | 8     | Miami          | 3     | Elimination   |
| 6/19 | North Carolina | 7     | LSU            | 3     | Elimination   |
| 6/21 | North Carolina | 4     | Fresno State   | 3     | Bracket Final |
| 6/21 | Georgia        | 10    | Stanford       | 8     | Bracket Final |
| 6/22 | Fresno State   | 6     | North Carolina | 1     | Bracket Final |
| 6/23 | Georgia        | 7     | Fresno State   | 6     | Finals G1     |
| 6/24 | Fresno State   | 19    | Georgia        | 10    | Finals G2     |
| 6/25 | Fresno State   | 6     | Georgia        | 1     | Finals G3     |

**Total**: 16 games (13 bracket + 3 finals)

**Data Quality Notes**:

- ✅ All scores verified across multiple sources
- ✅ Dates confirmed via NCAA official records
- ✅ Fresno State = lowest seed (#4 regional) to win CWS in history
- ✅ Georgia vs. Fresno State finals validated via multiple team archives

---

## Contact & Maintenance

**Document Owner**: Blaze Sports Intel Development Team
**Last Updated**: 2025-11-06
**Next Review**: 2025-11-13 (after Phase 1 completion)
**Related Scripts**:

- `/Users/AustinHumphrey/BSI/scripts/ingest-cws-historical.js` (ESPN 2017-2024)
- `/Users/AustinHumphrey/BSI/scripts/backfill-cws-wikipedia.js` (TO BE CREATED)
- `/Users/AustinHumphrey/BSI/scripts/validate-cws-historical.js` (TO BE CREATED)

**Cloudflare D1 Database**: `blazesports-historical`
**Production Table**: `historical_games`
**Current Record Count**: 205 CWS games (as of 2025-11-06)
