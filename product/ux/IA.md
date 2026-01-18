# Diamond Insights - Information Architecture

**Version**: 1.0.0
**Date**: 2025-10-13
**Author**: Austin Humphrey
**Status**: Design Phase

---

## Vision

**Diamond Insights** is the definitive college baseball intelligence platform, delivering:

- Live game tracking with pitch-by-pitch precision
- Win Probability Added (WPA) analytics
- Auto-generated previews and recaps
- Comprehensive team and player profiles
- Mobile-first, accessible design

**Focus**: NCAA Division I Baseball exclusively. Other sports may be considered for future expansion but are explicitly OUT OF SCOPE for launch.

---

## Site Map

```
blazesportsintel.com/
│
├── / (Home)
│   └── D1 Baseball scoreboard, top games, featured content
│
├── /baseball/
│   │
│   └── /ncaab/ (D1 Baseball Hub)
│       ├── Index: Scoreboard, filters (date, conference, top-25)
│       │
│       ├── /game/[gameId] (Game Center)
│       │   ├── Live pitch-by-pitch tracking
│       │   ├── Diamond visualization with runners
│       │   ├── WPA sparkline chart
│       │   ├── Sortable box score
│       │   └── Feed precision badge (EVENT | PITCH)
│       │
│       ├── /team/[slug] (Team Hub)
│       │   ├── Overview (record, schedule, leaders)
│       │   ├── /roster (full roster with stats)
│       │   ├── /schedule (calendar + results)
│       │   ├── /stats (team batting/pitching splits)
│       │   └── /history (past seasons, records)
│       │
│       ├── /player/[playerId] (Player Profile)
│       │   ├── Bio (position, year, hometown)
│       │   ├── Season stats
│       │   ├── Game logs (sortable)
│       │   └── Trend charts
│       │
│       ├── /standings (Conference Standings)
│       │   ├── All conferences view
│       │   ├── Filter by conference
│       │   ├── Overall and conference records
│       │   └── RPI integration
│       │
│       ├── /rankings (Polls & Rankings)
│       │   ├── D1Baseball Top 25
│       │   ├── Baseball America Top 25
│       │   ├── Collegiate Baseball Top 30
│       │   ├── RPI rankings
│       │   └── Strength metrics
│       │
│       └── /bracketology (Off-season feature)
│           ├── Tournament projections
│           ├── At-large bid tracker
│           └── Regional seeding predictions
│
├── /news/ (Content)
│   ├── Auto-generated previews (6hr pre-game)
│   ├── Auto-generated recaps (15min post-game)
│   ├── Analysis pieces (optional)
│   └── Filter by team, conference, date
│
├── /about (Mission & Team)
│   ├── Platform mission
│   ├── Team bios
│   ├── Contact information
│   └── Press kit
│
├── /methodology (Transparency)
│   ├── Data sources
│   ├── Analytics explanations (WPA, Pythag, RPI)
│   ├── Content generation process
│   └── Quality standards
│
└── /legal/
    ├── /privacy (Privacy Policy)
    ├── /terms (Terms of Service)
    ├── /accessibility (WCAG 2.2 AA compliance)
    ├── /copyright (DMCA notice)
    └── /ai-transparency (AI disclosure)
```

---

## Navigation Structure

### Primary Navigation (Desktop & Mobile)

```
[Logo] Diamond Insights

Nav:
- Scores (link to /baseball/ncaab)
- Teams (dropdown/mega-menu by conference)
- Standings (link to /baseball/ncaab/standings)
- Rankings (link to /baseball/ncaab/rankings)
- News (link to /news)

Utility:
- Search (team, player, game)
- Account (sign in / user menu)
```

### Mobile Navigation (Hamburger Menu)

```
☰ Menu

- Scores
- Teams
  - SEC
  - ACC
  - Big 12
  - [All conferences...]
- Standings
- Rankings
- News
---
- About
- Methodology
---
- Privacy
- Terms
```

### Breadcrumbs (Dynamic)

```
Home > Baseball > D1 Baseball > [Team Name] > Schedule
Home > Baseball > D1 Baseball > Game Center > [Team A] vs [Team B]
Home > News > [Article Title]
```

---

## Page-Level Details

### Home (`/`)

**Purpose**: Entry point showcasing live college baseball action

**Sections**:

1. **Hero**: Today's featured game (if live) or top matchup
2. **Live Scoreboard**: All games in progress
3. **Upcoming Games**: Next 24 hours
4. **Top 25 Ticker**: Current rankings
5. **Recent News**: Latest previews/recaps (3 articles)
6. **Featured Team**: Rotating spotlight

**Mobile Optimizations**:

- Collapsible scoreboard sections
- Swipeable game cards
- Sticky "View All Games" CTA

---

### D1 Baseball Hub (`/baseball/ncaab`)

**Purpose**: Comprehensive scoreboard with filters

**Filters**:

- Date picker (default: today)
- Conference selector (All, SEC, ACC, Big 12, etc.)
- Rank filter (Top 25 only)
- Status filter (Live, Scheduled, Final)

**Game Cards**:

```
┌─────────────────────────────────────────┐
│ [LIVE] 🔴 Top 7th                       │
│                                         │
│ #3 Texas      5  ██████░░░░  60% WP    │
│ Oklahoma      3  ░░░░░░░░░░  40% WP    │
│                                         │
│ 📍 UFCU Disch-Falk Field                │
│ 📺 ESPN+ • Feed: EVENT-LEVEL            │
│                                         │
│ [View Game Center]                      │
└─────────────────────────────────────────┘
```

**Data Requirements**:

- Real-time scores (60s refresh)
- Win probability (if game live)
- Feed precision badge
- Venue and broadcast info

---

### Game Center (`/baseball/ncaab/game/[gameId]`)

**Purpose**: Immersive live game experience

**Layout** (Desktop 2-column, Mobile stacked):

**Left Column**:

1. **Header**: Teams, score, inning, outs
2. **Diamond Visualization**:
   - Animated runners on base
   - Ball/strike count
   - Batter/pitcher matchup
3. **WPA Sparkline**: Win probability over time
4. **Plays Feed**: Scrollable event-by-event log

**Right Column**:

1. **Box Score Tabs**:
   - Batting (sortable by AB, R, H, RBI)
   - Pitching (sortable by IP, H, ER, SO)
   - Team Stats (R, H, E, LOB)
2. **Game Info**:
   - Venue, attendance, weather
   - Umpires
   - Duration

**Mobile Stacked**:

- Header (fixed)
- Diamond viz (collapsible)
- Tabs: Plays | WPA | Box Score

**Data Requirements**:

- WebSocket or SSE for live updates
- Pitch-by-pitch events (if precision: PITCH)
- WPA calculations per event
- Player stats aggregated in real-time

---

### Team Hub (`/baseball/ncaab/team/[slug]`)

**Purpose**: Comprehensive team profile

**Tabs**:

1. **Overview**:
   - Current record (overall, conference, home, away)
   - Next game
   - Last game result
   - Team leaders (batting avg, HR, RBI, ERA, SO)

2. **Roster**:
   - Sortable table (Name, Pos, Year, Hometown, Stats)
   - Filter by position

3. **Schedule**:
   - Calendar view (default)
   - List view (toggle)
   - Filter: All | Conference | Non-conference

4. **Stats**:
   - Team batting splits (vs LHP/RHP, home/away)
   - Team pitching splits
   - Advanced metrics (Pythag, RPI, SOS)

5. **History** (Off-season feature):
   - Past season records
   - Championship appearances
   - Notable alumni

**Data Requirements**:

- Team aggregate stats (season)
- Player roster with stats
- Full schedule with results
- Historical records

---

### Player Profile (`/baseball/ncaab/player/[playerId]`)

**Purpose**: Individual player showcase

**Sections**:

1. **Header**:
   - Photo (if available)
   - Name, #, Position, Year
   - Team (link to Team Hub)
   - Hometown, High School

2. **Season Stats**:
   - Batting or Pitching table
   - Advanced metrics (OPS, WHIP)

3. **Game Logs**:
   - Sortable table by date
   - Click row → link to Game Center

4. **Trend Charts** (if >10 games):
   - Batting avg over time
   - Home runs per week
   - ERA progression (pitchers)

**Data Requirements**:

- Player bio and stats
- Game-by-game logs
- Season trends

---

### Standings (`/baseball/ncaab/standings`)

**Purpose**: Conference standings with RPI integration

**Sections**:

1. **Conference Filter**: Dropdown (All, SEC, ACC, etc.)
2. **Standings Table** (per conference):
   - Rank, Team, Conf Record, Overall Record, Win %, GB, RPI

**Sorting**:

- Default: Conf Win %
- Allow sort by any column

**Data Requirements**:

- Real-time standings (4hr refresh)
- RPI rankings
- Conference records

---

### Rankings (`/baseball/ncaab/rankings`)

**Purpose**: Aggregate poll tracker

**Tabs**:

1. **D1Baseball Top 25**
2. **Baseball America Top 25**
3. **Collegiate Baseball Top 30**
4. **RPI Top 50**
5. **Strength of Schedule**

**Display**:

- Rank, Team (link to Team Hub), Record, Points, Trend (↑↓)

**Data Requirements**:

- Weekly poll updates
- Historical rankings (to show trend)

---

### News (`/news`)

**Purpose**: Content hub for previews/recaps

**Filters**:

- Date range
- Conference
- Team
- Article type (Preview | Recap)

**Article Cards**:

```
┌─────────────────────────────────────────┐
│ [RECAP]                                 │
│ Texas Outlasts Oklahoma in Extra Innings│
│                                         │
│ Longhorns rally in 11th inning to win  │
│ 7-6 in Austin. [Read more...]          │
│                                         │
│ 2025-10-12 • By Blaze AI                │
└─────────────────────────────────────────┘
```

**Data Requirements**:

- Article metadata (type, date, teams)
- Auto-generated content
- Fact-fencing validation

---

## URL Patterns

| Path                                   | Description                |
| -------------------------------------- | -------------------------- |
| `/`                                    | Home                       |
| `/baseball/ncaab`                      | D1 Baseball Hub            |
| `/baseball/ncaab/game/{gameId}`        | Game Center                |
| `/baseball/ncaab/team/{slug}`          | Team Hub                   |
| `/baseball/ncaab/team/{slug}/roster`   | Team Roster                |
| `/baseball/ncaab/team/{slug}/schedule` | Team Schedule              |
| `/baseball/ncaab/team/{slug}/stats`    | Team Stats                 |
| `/baseball/ncaab/player/{playerId}`    | Player Profile             |
| `/baseball/ncaab/standings`            | Conference Standings       |
| `/baseball/ncaab/rankings`             | Polls & Rankings           |
| `/baseball/ncaab/bracketology`         | Tournament Projections     |
| `/news`                                | News Hub                   |
| `/news/{slug}`                         | Article Detail             |
| `/about`                               | About Page                 |
| `/methodology`                         | Methodology & Transparency |
| `/legal/privacy`                       | Privacy Policy             |
| `/legal/terms`                         | Terms of Service           |
| `/legal/accessibility`                 | Accessibility Statement    |

**API Routes** (`/api/v1`):

- `GET /api/v1/games` - List games (filter: date, status, conference)
- `GET /api/v1/games/{id}` - Game detail + events + box
- `GET /api/v1/teams` - List teams
- `GET /api/v1/teams/{slug}` - Team detail + roster + stats
- `GET /api/v1/players/{id}` - Player profile + game logs
- `GET /api/v1/conferences/{slug}/standings` - Conference standings
- `GET /api/v1/rankings` - Polls + RPI
- `POST /api/stripe/webhook` - Payment processing

---

## Content Strategy

### Auto-Generated Previews

**Trigger**: 6 hours before scheduled game
**Update**: 1 hour before if lineups change

**Structure**:

- Headline: "[Team A] vs [Team B]: Preview"
- Intro: Matchup context (records, rankings, conference standings)
- Key Players: Probable starting pitchers, hot hitters
- Historical: Head-to-head results (last 5 meetings)
- Prediction: Win probability estimate
- Logistics: Time, venue, broadcast

**Fact-Fencing**:

- All stats cross-referenced with structured data
- No speculation beyond model predictions
- Source citations for all claims

### Auto-Generated Recaps

**Trigger**: 15 minutes after game status = FINAL

**Structure**:

- Headline: "[Winner] Defeats [Loser], [Score]"
- Lede: Game summary (location, key moment)
- Turning Point: Highest WPA swing event
- Standout Performers: Batting/pitching stars (stats)
- Context: Impact on standings, rankings
- Next Up: Both teams' next games

**Quality Control**:

- Manual review for championship games
- Automated fact-checking vs. box score
- No generative errors published

---

## Accessibility Requirements

**Standard**: WCAG 2.2 AA

**Critical Features**:

- Keyboard navigation for all interactive elements
- Screen reader labels for WPA charts, diamond viz
- Color contrast ≥ 4.5:1 for text
- Focus indicators visible on all controls
- Alt text for logos, images
- Closed captions for video (if available)
- Semantic HTML (proper heading hierarchy)

**Testing**:

- Automated: axe DevTools, Lighthouse
- Manual: NVDA, VoiceOver, JAWS

---

## Performance Budgets

| Metric        | Target  | Critical Routes                  |
| ------------- | ------- | -------------------------------- |
| LCP           | ≤ 2.5s  | Home, Hub, Game Center           |
| CLS           | < 0.1   | All pages                        |
| TBT           | ≤ 200ms | Game Center (live updates)       |
| FID           | ≤ 100ms | All interactive pages            |
| API p99       | ≤ 200ms | /api/v1/games, /api/v1/teams     |
| Ingest→UI p99 | < 3s    | Event → WPA → Broadcast → Render |

**Test Conditions**:

- Device: Moto G Power (mobile)
- Network: 4G (Fast 3G throttled)
- Browser: Chrome mobile

---

## Mobile-First Design Principles

1. **Collapsible Sections**: Reduce vertical scroll
2. **Swipeable Cards**: Horizontal game browsing
3. **Bottom Navigation**: Thumb-friendly nav bar
4. **Lazy Loading**: Images, charts load on scroll
5. **Offline Support**: Service worker caching for scores
6. **Dark Mode**: System preference detection

---

## Off-Season Content Strategy

**Recruiting** (feature flag):

- Commit tracker (top 100 recruits)
- Transfer portal monitoring
- Class rankings

**Draft** (feature flag):

- MLB Draft prospect lists
- Pro signings tracker

**Historical Browser** (Pro tier):

- Access past seasons (2015-2024)
- Legacy box scores
- Record books

---

## Monetization (Soft Paywall)

**Free Tier**:

- Home, Hub, Team Hub, Player Profile (basic)
- Standings, Rankings
- News (previews/recaps)
- Final scores and box scores

**Pro Tier** ($9.99/month):

- Live Game Center (pitch-by-pitch + WPA)
- Advanced stats (exit velo, spin rate, if available)
- Historical seasons browser
- Ad-free experience
- Early access to bracketology

**Stripe Integration**:

- Checkout session: `/api/stripe/checkout`
- Customer portal: `/api/stripe/portal`
- Webhook: `/api/stripe/webhook`

---

## Analytics & Observability

**Track**:

- Page views (GA4)
- User flows (conversion to Pro)
- API performance (Honeycomb)
- Error rates (Sentry)
- Real-time game viewers (WebSocket connections)

**Dashboards**:

- Grafana: API latency, cache hit rates
- Cloudflare Analytics: CDN performance
- Mixpanel: User engagement, retention

---

## Next Steps

1. ✅ Create route map (completed)
2. ✅ Design IA and URL structure (completed)
3. ✅ Create redirect map (completed)
4. ⏳ Implement Prisma schema (in progress)
5. ⏳ Build Next.js pages for each route
6. ⏳ Implement API layer (`/api/v1`)
7. ⏳ Create ingest worker (Cloudflare)
8. ⏳ Build Game Center UI (React + WebSockets)
9. ⏳ Integrate NLG content generation
10. ⏳ QA testing (Lighthouse, Playwright, axe)
11. ⏳ Staged rollout (preview → staging → canary → full)

---

**Document Version**: 1.0.0
**Last Updated**: 2025-10-13
**Approved By**: Austin Humphrey
