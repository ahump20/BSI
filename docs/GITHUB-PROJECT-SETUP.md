# GitHub Project Board Setup

**Project:** Blaze Sports Intel Platform Enhancement
**Repository:** ahump20/BSI
**Created:** January 11, 2025
**Purpose:** Systematic tracking of 14-section improvement plan implementation

## Table of Contents

- [Milestones](#milestones)
- [Labels](#labels)
- [Issues by Phase](#issues-by-phase)
- [Implementation Instructions](#implementation-instructions)
- [Issue Template](#issue-template)

## Milestones

### Milestone 1: Foundation & SEO ✅

**Status:** Complete
**Due Date:** January 11, 2025
**Description:** Establish foundational documentation, SEO infrastructure, and canonical URLs.
**Issues:** #1-6

### Milestone 2: Page Enhancements ✅

**Status:** Complete
**Due Date:** January 11, 2025
**Description:** Improve key user-facing pages with enhanced CTAs, interactive widgets, and competitive analysis.
**Issues:** #7-9

### Milestone 3: Technical Infrastructure ✅

**Status:** Complete
**Due Date:** January 11, 2025
**Description:** Implement performance monitoring, accessibility testing, and design system.
**Issues:** #10-12

### Milestone 4: Governance & Process

**Status:** In Progress
**Due Date:** January 18, 2025
**Description:** Establish project management workflows, CI/CD enhancements, and comprehensive documentation.
**Issues:** #13-15

## Labels

### Priority Labels

- `priority: critical` - Must be addressed immediately
- `priority: high` - Should be completed in current sprint
- `priority: medium` - Should be completed within month
- `priority: low` - Nice-to-have enhancement

### Type Labels

- `type: documentation` - Documentation improvements
- `type: feature` - New feature or enhancement
- `type: bug` - Bug fix
- `type: infrastructure` - CI/CD, tooling, DevOps
- `type: refactor` - Code refactoring without feature changes

### Domain Labels

- `ui-change` - Impacts user interface or UX
- `performance` - Performance optimization or monitoring
- `a11y` - Accessibility improvements
- `legal` - Legal/compliance related
- `api` - Backend API changes
- `seo` - Search engine optimization
- `design-system` - Design system/tokens/components

### Status Labels

- `status: blocked` - Blocked by external dependency
- `status: in-progress` - Currently being worked on
- `status: needs-review` - Awaiting code review
- `status: ready-to-test` - Ready for QA testing

## Issues by Phase

### Phase 1: Foundation & SEO (Complete ✅)

---

#### Issue #1: Create Site Inventory and Information Architecture

**Milestone:** Foundation & SEO
**Labels:** `type: documentation`, `priority: high`, `seo`
**Status:** ✅ Closed

**Description:**
Create comprehensive documentation of all site routes and visual information architecture to serve as single source of truth for development.

**Tasks:**

- [x] Create `/docs/site-inventory.csv` with all 49 routes
- [x] Document metadata: type, purpose, status, data source, last updated
- [x] Create `/docs/ia-sitemap.mmd` Mermaid diagram showing site hierarchy
- [x] Color-code diagram by section (sports, legal, API, legacy)
- [x] Identify consolidation opportunities

**Acceptance Criteria:**

- Site inventory CSV exists with complete route listing
- IA diagram renders properly in GitHub and Mermaid Live Editor
- All sport hubs documented with sub-pages
- Legacy URLs clearly marked for redirect handling

**Files Changed:**

- `/docs/site-inventory.csv` (49 rows)
- `/docs/ia-sitemap.mmd` (visual hierarchy)

---

#### Issue #2: Implement Legal URL Canonicalization

**Milestone:** Foundation & SEO
**Labels:** `type: infrastructure`, `priority: high`, `seo`, `legal`
**Status:** ✅ Closed

**Description:**
Establish canonical URLs for legal pages using 301 redirects to consolidate SEO authority and prevent duplicate content penalties.

**Tasks:**

- [x] Create `/public/_redirects` file for Cloudflare Pages
- [x] Add redirect: `/privacy` → `/legal/privacy` (301)
- [x] Add redirect: `/terms` → `/legal/terms` (301)
- [x] Add redirect: `/analytics-original.html` → `/analytics` (301)
- [x] Add redirect: `/sports-analytics-dashboard` → `/analytics` (301)
- [x] Document redirects in `/docs/redirects.csv`

**Acceptance Criteria:**

- `_redirects` file created with proper syntax
- All 4 redirects return HTTP 301 status code
- Old URLs redirect to canonical destinations
- No 404 errors for legacy bookmarks
- Test with: `curl -I https://blazesportsintel.com/privacy`

**Files Changed:**

- `/public/_redirects` (4 rules)
- `/docs/redirects.csv` (tracking document)

---

#### Issue #3: Build Coverage Matrix API Endpoint

**Milestone:** Foundation & SEO
**Labels:** `type: feature`, `priority: high`, `api`
**Status:** ✅ Closed

**Description:**
Create API endpoint that returns season-by-season data coverage information for all sports, enabling transparent Historical Data page widget.

**Tasks:**

- [x] Create `/functions/api/coverage-matrix.js`
- [x] Integrate with D1 database for CWS historical data
- [x] Query game counts per year (2000-2007)
- [x] Classify status: complete (14+ games), partial, minimal
- [x] Add date range reporting (first game, last game)
- [x] Implement 1-hour caching (Cache-Control: 3600s)
- [x] Add placeholders for NCAA Football, NFL, NBA

**Acceptance Criteria:**

- Endpoint returns valid JSON: `GET /api/coverage-matrix`
- CWS data shows years 2000-2007 with game counts
- Each year includes: games, status, dateRange, lastUpdated
- Response cached for 1 hour
- Graceful degradation if D1 unavailable
- America/Chicago timezone in timestamps

**Example Response:**

```json
{
  "success": true,
  "sports": {
    "baseball": {
      "cws": {
        "2007": {
          "games": 17,
          "status": "complete",
          "dateRange": { "first": "2007-06-15", "last": "2007-06-24" },
          "lastUpdated": "2025-01-11T..."
        }
      }
    }
  },
  "timezone": "America/Chicago"
}
```

**Files Changed:**

- `/functions/api/coverage-matrix.js` (new endpoint)

---

#### Issue #4: Generate Sitemap and Robots.txt

**Milestone:** Foundation & SEO
**Labels:** `type: feature`, `priority: high`, `seo`
**Status:** ✅ Closed

**Description:**
Create XML sitemap and robots.txt to improve search engine discoverability and control crawling behavior.

**Tasks:**

- [x] Generate `/public/sitemap.xml` with 40+ URLs
- [x] Set lastmod date: 2025-01-11 (ISO 8601)
- [x] Configure changefreq: hourly → monthly based on page type
- [x] Set priority: 1.0 (homepage, college baseball) → 0.5 (utility)
- [x] Create `/public/robots.txt`
- [x] Allow all bots: `User-agent: *`, `Allow: /`
- [x] Disallow: `/api/`, `/_redirects`, `/.well-known/`
- [x] Reference sitemap: `Sitemap: https://blazesportsintel.com/sitemap.xml`

**Acceptance Criteria:**

- sitemap.xml validates against XML Sitemap Protocol 0.9
- All URLs use HTTPS and absolute paths
- Priority reflects business value (College Baseball = 1.0)
- robots.txt allows crawler access
- sitemap.xml accessible at root: `https://blazesportsintel.com/sitemap.xml`
- Submit to Google Search Console after deployment

**Priority Strategy:**

- 1.0: Homepage, College Baseball hub
- 0.9: Sport hubs, Copilot, HistoricalData
- 0.8: Standings, games, scores
- 0.7: Teams, players, methodology
- 0.5-0.6: Legal, utility pages

**Files Changed:**

- `/public/sitemap.xml` (40+ URLs)
- `/public/robots.txt` (crawler directives)

---

#### Issue #5: Verify Legal Page Canonical Tags

**Milestone:** Foundation & SEO
**Labels:** `type: documentation`, `priority: medium`, `seo`, `legal`
**Status:** ✅ Closed

**Description:**
Audit all legal pages to ensure proper canonical link tags are present for SEO.

**Tasks:**

- [x] Check `/legal/privacy/index.html` for canonical tag
- [x] Check `/legal/terms/index.html` for canonical tag
- [x] Check `/legal/cookie-policy/index.html` for canonical tag
- [x] Check `/legal/ai-disclosure/index.html` for canonical tag
- [x] Check `/legal/copyright/index.html` for canonical tag
- [x] Document findings

**Acceptance Criteria:**

- All legal pages have `<link rel="canonical">` in `<head>`
- Canonical URLs match production domain
- No duplicate or conflicting canonical tags
- Document existing implementation (no changes needed)

**Findings:**
✅ All legal pages already have proper canonical tags:

```html
<link rel="canonical" href="https://blazesportsintel.com/legal/privacy" />
```

**Files Changed:**

- None (verification only)

---

#### Issue #6: Create Phase 1 Execution Summary

**Milestone:** Foundation & SEO
**Labels:** `type: documentation`, `priority: high`
**Status:** ✅ Closed

**Description:**
Document Phase 1 completion with technical details, deployment instructions, and next steps roadmap.

**Tasks:**

- [x] Create `/docs/SITE-IMPROVEMENT-EXECUTION-SUMMARY.md`
- [x] Document all completed tasks (#1-5)
- [x] Include code examples and SQL patterns
- [x] Add deployment verification commands
- [x] Define acceptance criteria for Phase 1
- [x] Outline Phase 2, 3, 4 roadmap
- [x] Document risks and mitigations

**Acceptance Criteria:**

- Summary document exists with executive summary
- All 6 tasks documented with technical details
- Deployment instructions included
- Next steps clearly defined
- Performance metrics baseline established

**Files Changed:**

- `/docs/SITE-IMPROVEMENT-EXECUTION-SUMMARY.md` (comprehensive documentation)

---

### Phase 2: Page Enhancements (Complete ✅)

---

#### Issue #7: Enhance Homepage with Dual-CTA Hero

**Milestone:** Page Enhancements
**Labels:** `type: feature`, `priority: high`, `ui-change`
**Status:** ✅ Closed

**Description:**
Upgrade homepage hero section with dual call-to-action buttons and social proof elements to improve conversion and engagement.

**Tasks:**

- [x] Add "View Analytics" primary CTA button
- [x] Add "Launch AI Copilot" secondary CTA button
- [x] Include 3 proof elements (data badges):
  - "4 Major Sports Covered"
  - "Real-Time Updates"
  - "Comprehensive Coverage"
- [x] Use design system Button component
- [x] Optimize for mobile (portrait mode)
- [x] Add hover effects and transitions

**Acceptance Criteria:**

- Two CTA buttons visible above fold
- Primary CTA links to `/analytics`
- Secondary CTA links to `/copilot`
- Proof badges display with icons
- Responsive design (mobile-first)
- Lighthouse accessibility score maintained
- No layout shift (CLS < 0.1)

**Files Changed:**

- `/index.html` or `/public/index.html` (hero section)

---

#### Issue #8: Build Historical Data Coverage Matrix Widget

**Milestone:** Page Enhancements
**Labels:** `type: feature`, `priority: high`, `ui-change`, `api`
**Status:** ✅ Closed

**Description:**
Create interactive widget on Historical Data page that visualizes data coverage using the `/api/coverage-matrix` endpoint.

**Tasks:**

- [x] Fetch data from `/api/coverage-matrix`
- [x] Render grid showing years 2000-2024 for each sport
- [x] Color-code year boxes:
  - Complete (14+ games): Green
  - Partial (1-13 games): Yellow
  - Missing (0 games): Red
- [x] Add tooltip on hover: "17 games available"
- [x] Add click handler: "View games for 2007"
- [x] Include legend explaining color codes
- [x] Handle API errors gracefully
- [x] Show loading skeleton during fetch

**Acceptance Criteria:**

- Widget fetches and renders coverage data
- Color coding matches game count thresholds
- Tooltips show accurate game counts
- Legend clearly explains color system
- Loading state displays before data arrives
- Error message shown if API fails
- Responsive design (grid wraps on mobile)

**Files Changed:**

- `/HistoricalData/index.html` or `/historicalcomparisons/index.html`
- JavaScript for widget logic

---

#### Issue #9: Create Features Comparison Page

**Milestone:** Page Enhancements
**Labels:** `type: feature`, `priority: medium`, `ui-change`, `seo`
**Status:** ✅ Closed

**Description:**
Build `/features` page with competitive analysis table highlighting Blaze's advantages over ESPN.

**Tasks:**

- [x] Create `/features/index.html`
- [x] Build comparison table: Blaze vs ESPN
- [x] Highlight features:
  - ✅ Blaze: Full college baseball box scores
  - ❌ ESPN: Score + inning only
  - ✅ Blaze: Historical CWS data (2000-2007)
  - ❌ ESPN: Current season only
  - ✅ Blaze: Complete player statistics
  - ❌ ESPN: Limited stats display
- [x] Add trust signals (data source citations)
- [x] Include navigation back to homepage
- [x] Use design system Table component

**Acceptance Criteria:**

- Features page accessible at `/features`
- Table compares Blaze vs ESPN across 6+ dimensions
- Visual indicators (✅ ❌) for feature availability
- Citations link to data sources
- Mobile-responsive table (horizontal scroll)
- Proper meta tags for SEO
- Sitemap updated with /features URL

**Files Changed:**

- `/features/index.html` (new page)
- `/public/sitemap.xml` (add /features entry)

---

### Phase 3: Technical Infrastructure (Complete ✅)

---

#### Issue #10: Implement Core Web Vitals Monitoring

**Milestone:** Technical Infrastructure
**Labels:** `type: infrastructure`, `priority: high`, `performance`
**Status:** ✅ Closed

**Description:**
Add real-time performance monitoring for Core Web Vitals (LCP, INP, CLS) using web-vitals library and establish performance budgets.

**Tasks:**

- [x] Add Lighthouse CI to GitHub Actions workflow
- [x] Install web-vitals library for Real User Monitoring (RUM)
- [x] Create `/public/js/vitals-tracker.js`
- [x] Track metrics: LCP, INP, CLS, FCP, TTFB
- [x] Send metrics to `/api/analytics/vitals` endpoint
- [x] Set performance budgets:
  - LCP < 2.5s
  - INP < 200ms
  - CLS < 0.1
- [x] Block GitHub PRs if budgets exceeded
- [x] Add performance badge to README

**Acceptance Criteria:**

- web-vitals library installed and configured
- Vitals tracked on all major pages
- Analytics endpoint receives metric data
- GitHub Actions fails if LCP > 2.5s
- Performance dashboard shows trend over time
- Documentation includes debugging guide

**Files Changed:**

- `.github/workflows/lighthouse-ci.yml` (new workflow)
- `/public/js/vitals-tracker.js` (RUM script)
- `/functions/api/analytics/vitals.js` (analytics endpoint)
- `/docs/PERFORMANCE.md` (budget guidelines)

---

#### Issue #11: Add Accessibility Quality Gates

**Milestone:** Technical Infrastructure
**Labels:** `type: infrastructure`, `priority: high`, `a11y`
**Status:** ✅ Closed

**Description:**
Integrate axe-core accessibility testing into E2E test suite to enforce WCAG 2.2 AA compliance.

**Tasks:**

- [x] Install @axe-core/playwright package
- [x] Create Playwright config: `playwright.config.js`
- [x] Write accessibility test suite:
  - `/tests/accessibility/copilot.spec.js`
  - `/tests/accessibility/live-tables.spec.js`
- [x] Scan for violations: color contrast, keyboard navigation, ARIA
- [x] Add "Pause live updates" toggle for motion sensitivity
- [x] Fix identified keyboard navigation issues
- [x] Add GitHub Actions workflow: `a11y-tests.yml`
- [x] Block PRs if critical violations found

**Acceptance Criteria:**

- Playwright tests run on every PR
- axe-core scans Copilot and Analytics pages
- Zero critical or serious accessibility violations
- Keyboard navigation fully functional (Tab, Enter, Esc)
- Screen reader announcements tested
- Motion control toggle implemented
- GitHub Actions workflow succeeds

**Files Changed:**

- `playwright.config.js` (new config)
- `/tests/accessibility/*.spec.js` (2 test files)
- `.github/workflows/a11y-tests.yml` (new workflow)
- UI files with "Pause updates" toggle

---

#### Issue #12: Implement Design System with Component Library

**Milestone:** Technical Infrastructure
**Labels:** `type: feature`, `priority: high`, `design-system`, `ui-change`
**Status:** ✅ Closed

**Description:**
Create centralized design system with design tokens and reusable component library to ensure UI consistency across the platform.

**Tasks:**

- [x] Create `/styles/tokens.json` with design tokens:
  - Brand colors (Blaze orange #BF5700)
  - Typography (font families, sizes, weights)
  - Spacing (4px base unit system)
  - Border radius, shadows, transitions
- [x] Generate `/styles/tokens.css` (CSS custom properties)
- [x] Build component library:
  - [x] `/components/Button.js` (4 variants, 3 sizes, loading state)
  - [x] `/components/Card.js` (glassmorphism, 3 variants)
  - [x] `/components/Table.js` (sortable, sticky headers)
  - [x] `/components/Modal.js` (focus trap, scroll lock)
- [x] Document usage in `/docs/DESIGN-SYSTEM.md`
- [x] Implement WCAG AA compliance in all components
- [x] Add accessibility features (keyboard nav, ARIA, focus management)

**Acceptance Criteria:**

- tokens.json uses Design Tokens Community Group schema
- tokens.css auto-generated from JSON
- All 4 components export factory functions + styles
- Each component includes:
  - Full ARIA support
  - Keyboard navigation
  - Focus indicators
  - Responsive design
  - prefers-reduced-motion support
- Comprehensive documentation with usage examples
- Components follow vanilla JS pattern (no framework dependency)

**Files Changed:**

- `/styles/tokens.json` (244 lines)
- `/styles/tokens.css` (203 lines)
- `/components/Button.js` (365 lines)
- `/components/Card.js` (295 lines)
- `/components/Table.js` (437 lines)
- `/components/Modal.js` (536 lines)
- `/docs/DESIGN-SYSTEM.md` (734 lines)

**Component API Examples:**

```javascript
// Button
const button = Button({
  text: 'Submit',
  variant: 'primary',
  onClick: handleSubmit,
});

// Card
const card = Card({
  title: 'MLB Standings',
  content: '<p>Content</p>',
  variant: 'glass',
});

// Table
const table = Table({
  caption: 'Team Standings',
  columns: [{ key: 'team', label: 'Team', sortable: true }],
  data: [{ team: 'Cardinals', wins: 92 }],
});

// Modal
const modal = Modal({
  title: 'Confirm Action',
  content: '<p>Are you sure?</p>',
  size: 'md',
});
modal.open();
```

---

### Phase 4: Governance & Process (In Progress ⏳)

---

#### Issue #13: Setup GitHub Project Board

**Milestone:** Governance & Process
**Labels:** `type: infrastructure`, `priority: high`
**Status:** 🔄 Open

**Description:**
Create GitHub Project Board to track all improvement plan tasks with proper organization using milestones, labels, and acceptance criteria.

**Tasks:**

- [ ] Create this document: `/docs/GITHUB-PROJECT-SETUP.md`
- [ ] Create 4 GitHub milestones:
  - Milestone 1: Foundation & SEO (Complete)
  - Milestone 2: Page Enhancements (Complete)
  - Milestone 3: Technical Infrastructure (Complete)
  - Milestone 4: Governance & Process (In Progress)
- [ ] Create GitHub labels:
  - Priority: critical, high, medium, low
  - Type: documentation, feature, bug, infrastructure, refactor
  - Domain: ui-change, performance, a11y, legal, api, seo, design-system
  - Status: blocked, in-progress, needs-review, ready-to-test
- [ ] Create 15 GitHub issues (Issues #1-15) with:
  - Descriptive title
  - Full description with context
  - Task checklist
  - Acceptance criteria
  - Files changed
  - Example code/output
- [ ] Assign issues to milestones
- [ ] Apply appropriate labels to each issue
- [ ] Link related issues (dependencies)
- [ ] Create GitHub Project Board view with columns:
  - Backlog
  - To Do (current sprint)
  - In Progress
  - Review
  - Done

**Acceptance Criteria:**

- All 15 issues created from this document
- Each issue has milestone, labels, acceptance criteria
- Project board shows all issues organized by status
- Completed issues (1-12) marked as closed
- In-progress issues (13-15) assigned to team
- Board accessible from repository homepage
- README links to project board

**Implementation Instructions:**

1. **Create Milestones:**

   ```bash
   # Via GitHub UI: Repository → Issues → Milestones → New Milestone
   # Or via GitHub CLI:
   gh api repos/ahump20/BSI/milestones -f title="Foundation & SEO" -f state="closed" -f due_on="2025-01-11T23:59:59Z"
   gh api repos/ahump20/BSI/milestones -f title="Page Enhancements" -f state="closed" -f due_on="2025-01-11T23:59:59Z"
   gh api repos/ahump20/BSI/milestones -f title="Technical Infrastructure" -f state="closed" -f due_on="2025-01-11T23:59:59Z"
   gh api repos/ahump20/BSI/milestones -f title="Governance & Process" -f state="open" -f due_on="2025-01-18T23:59:59Z"
   ```

2. **Create Labels:**

   ```bash
   # Priority labels
   gh label create "priority: critical" --color "d73a4a" --description "Must be addressed immediately"
   gh label create "priority: high" --color "ff6b6b" --description "Should be completed in current sprint"
   gh label create "priority: medium" --color "fbca04" --description "Should be completed within month"
   gh label create "priority: low" --color "0e8a16" --description "Nice-to-have enhancement"

   # Type labels
   gh label create "type: documentation" --color "0075ca" --description "Documentation improvements"
   gh label create "type: feature" --color "a2eeef" --description "New feature or enhancement"
   gh label create "type: bug" --color "d73a4a" --description "Bug fix"
   gh label create "type: infrastructure" --color "5319e7" --description "CI/CD, tooling, DevOps"
   gh label create "type: refactor" --color "c5def5" --description "Code refactoring"

   # Domain labels
   gh label create "ui-change" --color "d4c5f9" --description "Impacts user interface or UX"
   gh label create "performance" --color "fbca04" --description "Performance optimization"
   gh label create "a11y" --color "0e8a16" --description "Accessibility improvements"
   gh label create "legal" --color "5319e7" --description "Legal/compliance related"
   gh label create "api" --color "0075ca" --description "Backend API changes"
   gh label create "seo" --color "a2eeef" --description "Search engine optimization"
   gh label create "design-system" --color "d4c5f9" --description "Design system/tokens"

   # Status labels
   gh label create "status: blocked" --color "d73a4a" --description "Blocked by dependency"
   gh label create "status: in-progress" --color "fbca04" --description "Currently being worked on"
   gh label create "status: needs-review" --color "0075ca" --description "Awaiting code review"
   gh label create "status: ready-to-test" --color "0e8a16" --description "Ready for QA"
   ```

3. **Create Issues:**
   Use this document as reference. For each issue (#1-15):
   - Copy title, description, tasks, acceptance criteria from this document
   - Apply appropriate milestone (Foundation & SEO, Page Enhancements, etc.)
   - Apply labels (type, priority, domain)
   - Convert task list to GitHub checklist format
   - Add acceptance criteria in description
   - Issues 1-12: Close immediately with reference to completed work
   - Issues 13-15: Leave open for Phase 4 execution

4. **Create Project Board:**
   ```bash
   # Via GitHub UI: Repository → Projects → New Project
   # Choose: Board view
   # Columns: Backlog, To Do, In Progress, Review, Done
   # Add all issues to board
   # Drag completed issues to "Done" column
   ```

**Files Changed:**

- `/docs/GITHUB-PROJECT-SETUP.md` (this document)
- GitHub UI: milestones, labels, issues, project board

---

#### Issue #14: Enhance CI/CD Pipeline

**Milestone:** Governance & Process
**Labels:** `type: infrastructure`, `priority: high`, `performance`, `a11y`
**Status:** 🔄 Open

**Description:**
Strengthen CI/CD pipeline with pre-commit hooks, staging environment, visual regression testing, and stricter code review requirements.

**Tasks:**

- [ ] Add pre-commit hooks using Husky:
  - ESLint for JavaScript linting
  - Prettier for code formatting
  - TypeScript type checking (if applicable)
  - Block commits with errors
- [ ] Implement staging environment:
  - Configure Cloudflare Pages preview deploys
  - Create `staging` branch
  - Auto-deploy staging on PR creation
  - Preview URL in PR comments
- [ ] Add automated screenshot comparison:
  - Install Percy or similar visual testing tool
  - Capture screenshots of key pages
  - Compare against baseline
  - Flag visual regressions in PR
- [ ] Require 2 code reviews for production:
  - Update GitHub branch protection rules
  - Require 2 approvals before merge to `main`
  - Enforce status checks (tests, linting, a11y)
  - Require linear history

**Acceptance Criteria:**

- Husky pre-commit hooks installed and configured
- Commits blocked if linting/formatting fails
- Staging environment auto-deploys on PR
- Preview URL accessible for each PR
- Visual regression tests run on UI changes
- Percy (or similar) dashboard shows comparisons
- GitHub requires 2 approvals for main branch
- All status checks must pass before merge
- Documentation updated with CI/CD workflow

**Files Changed:**

- `.husky/pre-commit` (new hook)
- `package.json` (add husky, prettier, eslint)
- `.github/workflows/visual-regression.yml` (new workflow)
- `percy.config.js` (visual testing config)
- GitHub UI: branch protection rules

---

#### Issue #15: Expand Documentation Suite

**Milestone:** Governance & Process
**Labels:** `type: documentation`, `priority: medium`
**Status:** 🔄 Open

**Description:**
Create comprehensive documentation to support external contributors, API consumers, deployment processes, and performance optimization.

**Tasks:**

- [ ] Create `/docs/CONTRIBUTING.md`:
  - Code style guide
  - Branch naming conventions
  - PR template requirements
  - Code review process
  - How to run tests locally
  - How to submit issues
- [ ] Write `/docs/API.md`:
  - OpenAPI 3.1 specification
  - All endpoints documented with:
    - Method, path, parameters
    - Request/response schemas
    - Example curl commands
    - Authentication requirements
  - API versioning strategy
  - Rate limiting documentation
- [ ] Build `/docs/DEPLOYMENT.md`:
  - Step-by-step deployment runbook
  - Environment variables reference
  - Cloudflare Pages configuration
  - Database migration process
  - Rollback procedures
  - Health check verification
- [ ] Generate `/docs/PERFORMANCE.md`:
  - Performance budget guidelines
  - Core Web Vitals targets
  - Optimization techniques
  - Profiling tools and methods
  - Performance testing workflow
  - Regression prevention strategies

**Acceptance Criteria:**

- CONTRIBUTING.md covers all contributor workflows
- API.md documents all 20+ endpoints with examples
- OpenAPI spec validates and renders in Swagger UI
- DEPLOYMENT.md enables reproducible deployments
- PERFORMANCE.md defines measurable targets
- All docs linked from main README
- Internal links work correctly
- Code examples tested and verified

**Files Changed:**

- `/docs/CONTRIBUTING.md` (new)
- `/docs/API.md` (new, with OpenAPI spec)
- `/docs/DEPLOYMENT.md` (new)
- `/docs/PERFORMANCE.md` (new)
- `/README.md` (add links to new docs)

---

## Implementation Instructions

### Step 1: Create Milestones

Navigate to: `Repository → Issues → Milestones → New Milestone`

Create 4 milestones with the information from the [Milestones](#milestones) section above.

### Step 2: Create Labels

Use GitHub CLI or UI to create all labels from the [Labels](#labels) section above.

**GitHub CLI Method:**

```bash
# See label creation commands in Issue #13 task list
```

**GitHub UI Method:**
Navigate to: `Repository → Issues → Labels → New Label`

### Step 3: Create Issues

For each issue (#1-15) in this document:

1. Navigate to: `Repository → Issues → New Issue`
2. Copy the issue title
3. Copy the full description including:
   - Description paragraph
   - Tasks (convert to GitHub checkbox format)
   - Acceptance Criteria
   - Files Changed
   - Example code (if applicable)
4. Assign milestone (right sidebar)
5. Apply labels (right sidebar)
6. Click "Submit new issue"

**For Issues #1-12 (Already Complete):**

- Create issue with full details
- Immediately close with comment: "✅ Completed on January 11, 2025. See: `/docs/SITE-IMPROVEMENT-EXECUTION-SUMMARY.md`"
- This creates historical record while marking as done

**For Issues #13-15 (Current/Future Work):**

- Create issue and leave open
- Assign to current milestone (Governance & Process)
- Apply "status: in-progress" label if actively working

### Step 4: Create Project Board

1. Navigate to: `Repository → Projects → New Project`
2. Select: **Board** template
3. Name: "Platform Enhancement Tracker"
4. Create columns:
   - **Backlog** (for future work)
   - **To Do** (current sprint)
   - **In Progress** (actively worked on)
   - **Review** (awaiting PR review)
   - **Done** (completed)
5. Add all issues to board
6. Drag completed issues (#1-12) to "Done" column
7. Drag current issues (#13-15) to "In Progress" column

### Step 5: Link from README

Add section to main `README.md`:

```markdown
## Project Status

Track our progress on the [Platform Enhancement Project Board](https://github.com/ahump20/BSI/projects/1).

**Current Milestone:** Governance & Process (Phase 4)
**Completion:** 12/15 issues complete (80%)
```

## Issue Template

When creating new issues outside this plan, use this template:

````markdown
## Description

[Brief description of the issue or enhancement]

## Context

[Why is this needed? What problem does it solve?]

## Tasks

- [ ] Task 1
- [ ] Task 2
- [ ] Task 3

## Acceptance Criteria

- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3

## Files Changed

- `/path/to/file1.js` (description)
- `/path/to/file2.html` (description)

## Example Code/Output

```language
// Example code or expected output
```
````

## Related Issues

- Closes #XXX
- Depends on #YYY
- Related to #ZZZ

```

## Maintenance

### Adding New Issues
1. Follow issue template above
2. Assign appropriate milestone
3. Apply relevant labels
4. Add to project board
5. Link related issues

### Updating Milestones
When creating new phases:
1. Create milestone with due date
2. Update this document with milestone definition
3. Assign new issues to milestone

### Label Hygiene
- Apply labels consistently
- Update labels as issue status changes
- Remove "status: blocked" when unblocked
- Add "status: in-progress" when work starts
- Add "status: needs-review" when PR created

### Board Management
- Move issues to appropriate columns as work progresses
- Keep "In Progress" column limited to active work
- Close issues when all acceptance criteria met
- Archive completed milestones

## Change Log

| Date       | Version | Changes                              | Author |
|------------|---------|--------------------------------------|--------|
| 2025-01-11 | 1.0     | Initial GitHub project board setup   | Claude |

---

**Status:** 🔄 In Progress
**Current Task:** Creating GitHub issues from this document
**Next:** Implement CI/CD enhancements and documentation expansion
**Blockers:** None
```
