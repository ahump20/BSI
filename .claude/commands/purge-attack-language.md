# Purge Attack Language - One-Shot Brand Narrative Fix

## MISSION

You are executing a CRITICAL brand narrative overhaul for blazesportsintel.com. This is a ONE-SHOT operation that must be completed without breaking any features.

**THE PROBLEM:** The codebase contains:
1. Negative, attack-oriented language that positions BSI against ESPN/mainstream media
2. Overly college-baseball-focused messaging that ignores our FULL sports coverage

**THE SOLUTION:** Replace ALL attack language with positive differentiation based on:
1. Austin's authentic story (Memphis → Texas heritage)
2. Core values: Courage, Grit, Leadership
3. What BSI does well—forward-looking, not backward-attacking
4. Tagline: "Born to Blaze the Path Less Beaten"
5. **MULTI-SPORT PLATFORM**: MLB, NFL, NBA, College Baseball, NCAA Football

---

## CRITICAL: MULTI-SPORT POSITIONING

**BSI is NOT just a college baseball platform.** BSI covers:
- **MLB** (Cardinals focus, all 30 teams)
- **NFL** (Titans focus, all 32 teams)
- **NBA** (Grizzlies focus, all 30 teams)
- **College Baseball** (all 300+ D1 programs)
- **NCAA Football** (FBS, FCS, all conferences)

### Language Rules for Multi-Sport

| WRONG | RIGHT |
|-------|-------|
| "college baseball platform" | "sports intelligence platform" |
| "college baseball analytics" | "sports analytics" |
| "complete college baseball coverage" | "complete sports coverage" |
| "for college baseball fans" | "for sports fans who care" |
| "Primary Focus: College Baseball" | Remove or balance with other sports |

### When Discussing Sports Coverage:
- Always list multiple sports: "MLB, NFL, NBA, College Baseball, NCAA Football"
- Lead with professional sports when speaking generally
- Only focus on college baseball on `/college-baseball/*` routes
- Hero sections should highlight ALL sports, not just one

---

## PHASE 1: IDENTIFY ALL ATTACK LANGUAGE

Search and flag these EXACT patterns across ALL files (*.html, *.tsx, *.jsx, *.ts, *.js):

### MUST PURGE (Attack/Complaint Framing)
| Pattern | Type |
|---------|------|
| `ESPN's coverage void` | Direct attack |
| `fills ESPN's` | Direct attack |
| `mainstream sites ignore` | Direct attack |
| `mainstream outlets` | Passive attack |
| `network-driven coverage` | Attack framing |
| `coverage gaps` | Complaint framing |
| `coverage void` | Complaint framing |
| `deserve better` | Victim framing |
| `deserves better` | Victim framing |
| `underserved` | Victim framing |
| `overlooked` | Victim framing |
| `neglected` | Victim framing |
| `finally` (in context of coverage) | Implies waiting/victim |
| `addressing gaps` | Complaint framing |
| `should already exist` | Complaint framing |

---

## PHASE 2: REPLACEMENT MAPPING

Replace with POSITIVE, FORWARD-LOOKING language:

### Direct Replacements
| PURGE | REPLACE WITH |
|-------|--------------|
| "fills ESPN's coverage void" | "delivers complete digital coverage" |
| "that fills ESPN's coverage void" | "with real-time analytics for every game" |
| "mainstream sites ignore" | "with comprehensive coverage for every program" |
| "addressing mainstream coverage gaps" | "delivering professional-grade sports analytics" |
| "network-driven coverage" | "passive scoreboard updates" |
| "deserve better than network-driven coverage" | "want real analytics—and that's what we built" |
| "deserve better" | "want complete coverage" |
| "deserves better" | "gets the coverage it earns" |
| "the sports that deserve better" | "the sports that matter" |
| "underserved" | "passionate" |
| "underserved despite" | "passionate, and" |
| "coverage gaps in college sports" | "college sports analytics" |
| "coverage gaps" | "analytics infrastructure" |
| "coverage void" | "analytics platform" |
| "should already exist" | "fans have always wanted" |
| "before mainstream outlets even notice" | "in real time" |

### Voice Transformation Examples

**BEFORE (Attack):**
> "Blaze Sports Intel exists because sports fans deserve better than network-driven coverage."

**AFTER (Positive):**
> "Blaze Sports Intel exists because I wanted real analytics for the sports I love—so I built them."

**BEFORE (Attack):**
> "Comprehensive game tracking that fills ESPN's coverage void."

**AFTER (Positive):**
> "Complete game tracking with real-time play-by-play and advanced metrics for every D1 program."

**BEFORE (Complaint):**
> "addressing mainstream coverage gaps in college sports analytics"

**AFTER (Positive):**
> "delivering professional-grade college sports analytics"

---

## PHASE 3: AUSTIN'S AUTHENTIC STORY (USE THESE)

When rewriting About/Origin sections, use these authentic elements:

**Birth Story:**
- Born August 17, 1995—same day as Davy Crockett
- Born in Memphis, but on Texas soil his father placed beneath the hospital bed
- Doctor said: "You know you ain't the first to do this—but they've ALL been from Texas."

**Heritage:**
- 127+ years of Humphreys born on Texas soil
- Grandfather Bill built banks in El Campo after growing up with nothing in west Texas
- 40+ years of family Longhorn season tickets
- Drove Memphis to Austin every Thanksgiving

**Athletic:**
- Pitched a perfect game

**Professional:**
- UT Austin (International Relations; European Studies, Polisci, Econ minors)
- Full Sail (Entertainment Business MS)
- Top 10% nationally at Northwestern Mutual

**Core Values:**
- Courage • Grit • Leadership

**Tagline:**
- "Born to Blaze the Path Less Beaten"

**Philosophy:**
- Texas isn't just a place—it's a covenant
- Authenticity over polish
- Grit over flash
- Substance over style

---

## PHASE 4: FILES TO UPDATE (EXECUTE IN ORDER)

### Priority 1: Main Site Pages
1. `bsi-production/index.html` (lines 895-932)
2. `bsi-production/public/index.html` (lines 635, 900, 932)
3. `public/index.html` (line 1119)
4. `public/about.html` (lines 306, 334)
5. `public/company.html` (lines 427-477, 533)
6. `public/coverage.html` (lines 515, 678)
7. `public/pricing.html` (line 441)

### Priority 2: Tools/Features
8. `src/tools/ToolsShowcase.jsx` (lines 10-11, 59, 96-97, 134, 144, 152)

### Priority 3: College Baseball
9. `college-baseball/index.html` (lines 496, 512)
10. `public/college-baseball/index.html` (lines 268, 454)

### Priority 4: Other Pages
11. `public/for-coaches.html` (lines 486, 608)
12. `public/live-scoreboards.html` (line 371)
13. `public/dashboards/*.html` (footer taglines)

---

## PHASE 5: SPECIFIC EDITS

### Edit 1: src/tools/ToolsShowcase.jsx

**Line 10-11 (college-baseball description):**
```javascript
// PURGE
"Comprehensive game tracking that fills ESPN's coverage void. Real-time play-by-play, advanced metrics (OPS, WHIP, K/9, BB%), pitch counts, and lineup cards. The only source for complete digital coverage of college baseball."

// REPLACE
"Complete game tracking with real-time play-by-play, advanced metrics (OPS, WHIP, K/9, BB%), pitch counts, and lineup cards. Professional-grade analytics for every D1 program, every game."
```

**Line 59 (recruiting-tracker description):**
```javascript
// PURGE
"Aggregated recruiting intelligence across football, baseball, and basketball. Live class rankings, transfer portal activity, composite ratings, and commits by date. Filterable by sport, position, rating, and geography—with emphasis on Group of Five and FCS programs mainstream sites ignore."

// REPLACE
"Aggregated recruiting intelligence across football, baseball, and basketball. Live class rankings, transfer portal activity, composite ratings, and commits by date. Filterable by sport, position, rating, and geography—with comprehensive coverage for Group of Five and FCS programs."
```

**Lines 96-97 (hero subtitle):**
```javascript
// PURGE
"Five production-ready tools built on Cloudflare Workers/D1/KV/R2, addressing mainstream coverage gaps in college sports analytics."

// REPLACE
"Five production-ready tools built on Cloudflare Workers/D1/KV/R2, delivering professional-grade college sports analytics."
```

**Line 152 (Real-Time Intelligence gap card):**
```javascript
// PURGE
"Our Breaking News Push Alerts (#5) connects to the Trend and Highlights Analyzer for automated, editorially-voiced content generation—delivering insights before mainstream outlets even notice the story."

// REPLACE
"Our Breaking News Push Alerts (#5) connects to the Trend and Highlights Analyzer for automated, editorially-voiced content generation—delivering real-time insights with our editorial voice."
```

**Section header line 129:**
```javascript
// PURGE
"Addressing Coverage Gaps"

// REPLACE
"Built for Real Fans"
```

### Edit 2: bsi-production/public/index.html & bsi-production/index.html

**About section (around line 900):**
```html
<!-- PURGE -->
<p>Blaze Sports Intel exists because sports fans deserve better than network-driven coverage. I built what should already exist—live scores, complete box scores, and real analytics for the sports that matter: MLB, NFL, NBA, College Baseball, NCAA Football.</p>

<!-- REPLACE -->
<p>Blaze Sports Intel exists because I wanted real analytics for the sports I love—so I built them. Live scores, complete box scores, and professional-grade analytics for MLB, NFL, NBA, College Baseball, and NCAA Football.</p>
```

**Footer tagline (around line 932):**
```html
<!-- PURGE -->
<p>Born in Memphis. Rooted in Texas soil. Covering the sports that deserve better.</p>

<!-- REPLACE -->
<p>Born in Memphis. Rooted in Texas soil. Built for fans who care.</p>
```

### Edit 3: public/company.html

**Hero subtitle (line 429):**
```html
<!-- PURGE -->
MLB has 1,200+ data points per game. College baseball has a spreadsheet. BSI brings professional-grade analytics to the 300+ D1 programs and devoted fanbases that deserve better coverage.

<!-- REPLACE -->
MLB has 1,200+ data points per game. College baseball has a spreadsheet. BSI brings professional-grade analytics to 300+ D1 programs and their passionate fanbases.
```

**Market context (lines 474-478):**
```html
<!-- PURGE -->
BSI targets this gap: bringing professional-grade analytics to college baseball's passionate fanbase. Our goal is 10,000 paying subscribers within three years—approximately $1 million in annual recurring revenue serving an audience that's been underserved despite clear demand.

<!-- REPLACE -->
BSI brings professional-grade analytics to college baseball's passionate fanbase. Our goal: 10,000 paying subscribers within three years—approximately $1 million in annual recurring revenue serving fans who've been waiting for exactly this.
```

**Founder bio (line 533):**
```html
<!-- PURGE -->
...he built BSI to deliver the complete sports intelligence platform that fans deserve—

<!-- REPLACE -->
...he built BSI to deliver the complete sports intelligence platform fans have always wanted—
```

### Edit 4: public/coverage.html

**Line 515:**
```html
<!-- PURGE -->
BSI provides the complete coverage college baseball deserves: full box scores, real standings...

<!-- REPLACE -->
BSI provides complete college baseball coverage: full box scores, real standings...
```

**Line 678:**
```html
<!-- PURGE -->
generate real passion and real revenue—they deserve real analytics.

<!-- REPLACE -->
generate real passion and real revenue—they get real analytics.
```

### Edit 5: public/for-coaches.html

**Line 608:**
```html
<!-- PURGE -->
"BSI delivers the complete coverage college baseball has always deserved. <span class="accent">Finally, someone's building for us.</span>"

<!-- REPLACE -->
"BSI delivers the analytics infrastructure college baseball has always needed. <span class="accent">Built by someone who gets it.</span>"
```

---

## PHASE 6: VALIDATION

After ALL edits, run these checks:

```bash
# Verify no attack language remains
grep -rn "ESPN's coverage void\|mainstream sites ignore\|network-driven coverage\|deserve better\|deserves better\|underserved\|coverage gaps\|coverage void" --include="*.html" --include="*.tsx" --include="*.jsx" --include="*.ts" --include="*.js" .

# Verify positive language is present
grep -rn "Courage.*Grit.*Leadership\|Born to Blaze\|fans who care\|professional-grade" --include="*.html" .

# Build check
npm run build
```

---

## PHASE 7: COMMIT

```bash
git add -A
git commit -m "refactor(branding): Purge attack language, embrace positive differentiation

PURGED:
- ESPN attack language ('fills ESPN void', 'mainstream sites ignore')
- Victim framing ('deserve better', 'underserved', 'coverage gaps')
- Complaint language ('should already exist', 'finally')

REPLACED WITH:
- Positive differentiation (professional-grade analytics, complete coverage)
- Austin's authentic story (Memphis → Texas, Courage/Grit/Leadership)
- Forward-looking language (built for fans who care)

Brand voice now stands on its own merits, not against competitors."
```

---

## CRITICAL RULES

1. **DO NOT** break any functionality—this is copy/content only
2. **DO NOT** change any JavaScript logic, API calls, or data fetching
3. **DO NOT** modify CSS, layouts, or component structure
4. **DO NOT** touch files in `scripts/`, `workers/`, `functions/`, `lib/` (those ESPN references are technical/API, not marketing)
5. **PRESERVE** all existing features, routes, and navigation
6. **TEST** the build after changes: `npm run build`

---

## SUCCESS CRITERIA

✅ Zero instances of "ESPN's coverage void" or "fills ESPN's"
✅ Zero instances of "mainstream sites ignore" or "mainstream outlets"
✅ Zero instances of "deserve better" or "deserves better" in marketing copy
✅ Zero instances of "underserved" in marketing copy
✅ Zero instances of "coverage gaps" in marketing copy
✅ "Courage • Grit • Leadership" present in footer
✅ "Born to Blaze the Path Less Beaten" present
✅ Build passes without errors
✅ All pages render correctly

---

Execute this prompt in full. No partial execution. No stopping early. Complete the brand narrative fix.
