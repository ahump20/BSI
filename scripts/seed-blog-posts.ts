/**
 * Seed Blog Post Feed
 *
 * Inserts article metadata into D1 (blog_posts table) and
 * uploads full markdown content to R2 (blog-posts/{slug}.md).
 *
 * Reads the actual writing archive content where available;
 * uses formatted versions for Full Sail pieces.
 *
 * Usage:
 *   npx wrangler d1 execute bsi-prod-db --remote --file=migrations/038_blog_posts.sql
 *   npx tsx scripts/seed-blog-posts.ts
 *
 * Prerequisites:
 *   - CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN in environment
 *   - D1 database ID: 6921617f-5351-4df3-aeab-07425e72ec6b
 *   - R2 bucket: bsi-game-assets
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ---------------------------------------------------------------------------
// Config (from env / hardcoded for seed)
// ---------------------------------------------------------------------------

const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const D1_DATABASE_ID = '6921617f-5351-4df3-aeab-07425e72ec6b';
const R2_BUCKET = 'bsi-game-assets';

if (!ACCOUNT_ID || !API_TOKEN) {
  console.error('ERROR: CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN must be set.');
  process.exit(1);
}

const CF_API = `https://api.cloudflare.com/client/v4`;

// ---------------------------------------------------------------------------
// Article definitions
// ---------------------------------------------------------------------------

interface ArticleMeta {
  slug: string;
  title: string;
  subtitle: string | null;
  description: string;
  author: string;
  category: string;
  tags: string[];
  featured: boolean;
  published_at: string;
  read_time_mins: number;
  word_count: number;
  source_context: string | null;
  contentPath?: string; // path to local md file, relative to repo root
  content?: string;     // inline content (for archive pieces without a local file)
}

// ---------------------------------------------------------------------------
// Article content — inline for pieces from the Full Sail archive
// ---------------------------------------------------------------------------

const CARDINALS_CONTENT = `# Cardinals Strategic Intelligence Framework

## Organizational Overview

The St. Louis Cardinals operate as one of Major League Baseball's most structurally coherent franchises — a mid-market organization that consistently competes above its payroll tier through systematic player development, organizational culture, and disciplined roster construction.

This analysis examines the Cardinals' strategic intelligence framework: how they make decisions, where they generate competitive advantage, and what structural constraints shape their ceiling.

---

## Decision-Making Architecture

The Cardinals' front office operates through layered consensus rather than top-down directive. The general manager function integrates scouting, analytics, and baseball operations through a unified process — reducing the friction that plagues organizations where departments operate in silos.

**Key structural elements:**
- Multi-department input on draft and international signing decisions
- Analytics embedded within player development, not separate from it
- Long-term cultural continuity: organizational norms persist across personnel changes

The Cardinals have retained organizational identity through three different manager-GM combinations since 2012. That continuity is not accidental — it reflects a values-first hiring philosophy that prioritizes fit with organizational culture before evaluating technical credentials.

---

## Player Development as Competitive Advantage

The Cardinals' primary edge is converting mid-round draft picks and international signings into MLB contributors at an above-average rate. The mechanism is consistent: structured development environments, clear organizational hitting and pitching philosophies, and early specialization identification.

**The system produces at volume:**
- 2020–2024: Cardinals developed 12 players who debuted at MLB level from internal pipeline
- Hit tool development: system graduates post above-average contact rates relative to draft slot expectations
- Pitching philosophy: four-seam command + secondary development sequencing applied system-wide

The Cardinals do not draft for ceiling alone. They draft for organizational fit — players who respond to structure, accept role definition, and internalize process-based improvement. That screening filters for durability, not just talent.

---

## Payroll Positioning and Resource Constraints

Mid-market economics create a ceiling problem. The Cardinals cannot sustain a $250M payroll — which means retaining all internally developed stars simultaneously is structurally impossible.

The Cardinals' response is sequencing. They extend controllable players early (pre-arbitration), accept some attrition at peak salary years, and backfill through continued development pipeline output.

**The three-layer roster model:**
1. **Core (extensions):** 3–5 foundational players on long-term deals
2. **Bridge (arbitration):** 6–8 players in controllable years, tracked for extension or trade value
3. **Depth (development):** System contributors and organizational players cycling through

---

## Competitive Positioning: 2024–2025 Context

The Cardinals entered 2024 in a known transition cycle — bridging from the Molina-Wainwright-Goldschmidt generation to the next roster iteration. That transition creates short-term competitive drag while preserving long-term structural health.

**Risk factors:**
- Peak salary commitments to aging cores creating limited flexibility
- NL Central competitive environment elevated by Cubs and Brewers rebuild completion
- Draft positioning disadvantage from historical competitiveness (no lottery picks)

**Structural advantages:**
- Development pipeline remains among the NL's deepest
- Busch Stadium revenue stability insulates from worst-case economic scenarios
- Ownership patience for multi-year rebuild cycles (demonstrated historically)

---

## Conclusion: The Cardinals Framework

The St. Louis Cardinals are a systematic organization in the truest sense: decisions compound over time, cultural continuity reduces organizational drag, and player development creates options that pure market spending cannot replicate. Their ceiling is structurally capped by market size — but their floor is higher than most mid-market peers because the process works.

The strategic intelligence here is not about the roster you see today. It is about the pipeline you cannot see — and the Cardinals have been building theirs for two decades.

*Source: Full Sail University — MAN6224 Sports Management and Operations. Graduate-level strategic analysis.*
`;

const TEXAS_SEC_CONTENT = `# Texas Longhorns Revenue Transformation in the SEC Era

## The Conference Move as a Financial Event

When Texas officially joined the SEC in August 2024, most coverage focused on competitive implications — schedule difficulty, recruiting battles, the end of Big 12 dominance. The financial story got less attention. It should not have.

Texas's move to the SEC represents a revenue step-change that reshapes the athletic department's operating model, its ability to sustain facilities investment, and its competitive ceiling across all sports.

---

## Revenue Architecture Before the Move

The Big 12's media deal structure distributed approximately $31–35 million per school annually in conference revenue during Texas's final years of membership. Texas supplemented this with the Longhorn Network (ESPN, $15M/year) — a deal that was itself a consequence of Texas's market power within the conference.

Total athletic department revenue: **$~230–240M** in FY2023, ranking Texas among the top 5 programs nationally even before the conference switch.

---

## The SEC Revenue Differential

The SEC's current media rights deal — running through 2034 with ESPN — generates approximately **$50–55 million per school annually** in media revenue, with projections toward **$60–65M** as digital streaming components of the deal scale.

That differential — roughly $15–20M more per year than the Big 12 deal — compounds dramatically over a 10-year horizon:
- Year 1 difference: ~$17M
- 10-year cumulative advantage: **$170M+** (before growth adjustments)

Texas also retained the Longhorn Network deal through 2031, creating a period of overlap where both revenue streams are active. The effective total conference + LHN media revenue during this window exceeds any comparable arrangement in college athletics.

---

## Facilities Investment Capacity

The revenue differential directly translates to facilities spending power. Texas has already committed to:
- **Darrell K Royal–Texas Memorial Stadium renovation:** $200M+ project, capacity maintained
- **Baseball facility upgrades:** UFCU Disch-Falk renovations
- **Basketball, soccer, and Olympic sports facilities:** Prioritized in the capital campaign

These investments are funded through a combination of: donor commitments, athletic department reserves, and debt capacity supported by the new revenue baseline. The SEC revenue floor makes debt structuring for major capital projects materially safer than under the Big 12 arrangement.

---

## Recruiting Implications

Revenue → facilities → recruiting is the cascade model. Texas's ability to compete for the top 5 recruiting classes annually depends on:

1. **NIL pool size:** Texas now operates one of the largest collective ecosystems in college athletics. Estimated collective capacity: $30–40M/year
2. **Staff salaries:** SEC competitive norms require coordinator and position coach salaries well above Big 12 levels. Texas's revenue baseline supports this
3. **Facilities as recruiting tool:** Major facility investments become recruiting assets within 12–24 months of completion

The SEC move legitimizes Texas's pitch to recruits who previously questioned whether Texas would "compete for championships" — not just in football, but in baseball, softball, and men's and women's basketball.

---

## Risk Factors and Structural Constraints

**Competitive difficulty:** SEC football creates more 1-loss seasons even for elite programs. Alabama, Georgia, and LSU do not vacate the schedule. Texas's CFP access path is narrower per year but arguably more prestigious when achieved.

**Cost escalation:** SEC norms create upward pressure on football staff costs. Texas's head coach salary ($8.75M base for Steve Sarkisian) will face market pressure from SEC peers over time.

**Olympic sports cross-subsidy:** Football and men's basketball revenue funds 18+ other sports. SEC travel costs (longer flights, more road trips) increase operating expenses across the non-revenue portfolio.

---

## Bottom Line

Texas's SEC transition is a financial event as much as a competitive one. The revenue step-change creates a sustainable edge in facilities, NIL, and staff investment — while also creating cost pressures that require disciplined management. Programs that manage this transition well will separate from the new mid-tier of the SEC within 5 years. Texas has the resources to be in that top group.

*Source: Full Sail University — MAN6224 Sports Management and Operations. Graduate-level revenue analysis.*
`;

const SABAN_CONTENT = `# Championship Leadership Through Systems: Nick Saban

## The Question Most People Ask Wrong

Most leadership analysis of Nick Saban starts with "what does Saban do?" The more useful question is: "what does Saban build?"

The answer is a self-reinforcing system — one where every element (culture, process, personnel, evaluation) strengthens every other element, and where the head coach functions primarily as the system's chief architect rather than its most important individual operator.

---

## The Process as Organizational Logic

Saban's "Process" is widely discussed and poorly understood. It is not a motivational slogan. It is an organizational philosophy about where to direct human attention.

**The core principle:** Elite performance is produced by consistent execution of the right actions over time. The score, the outcome, and the external recognition are lagging indicators. The leading indicators are behavioral: preparation quality, technique execution, decision-making discipline.

**The organizational implication:** If you manage the leading indicators systematically, the lagging indicators (wins, championships, recruiting rankings) follow reliably — not always on any given day, but over a sufficient number of repetitions.

This is not a new idea in management science. It is, however, exceptionally rare to see it applied with this level of institutional consistency at the highest levels of competitive sports.

---

## Culture as Infrastructure

Saban does not treat culture as a value statement. He treats it as infrastructure — a system that produces predictable behaviors at scale, across roster turnover, coaching staff changes, and varying external conditions.

**How Alabama's culture functions:**
- **Standards are defined precisely:** not "work hard" but specific behavioral expectations for preparation, practice, meetings, and competition
- **Standards are enforced consistently:** by coaches, by team leaders, and through peer accountability structures
- **Standards persist through personnel change:** the culture does not depend on any specific player or coordinator

The evidence: Alabama maintained elite performance through offensive coordinator changes (Lane Kiffin → Steve Sarkisian → Bill O'Brien and others), defensive coordinator changes, and annual roster turnover of 20–25 players. The system outlasted the individuals.

---

## Recruiting as System Input, Not Output

Most programs treat recruiting as the primary variable — if you recruit well, you win. Saban inverts this: he uses the system to recruit, not recruiting to build the system.

**The mechanism:**
Alabama's culture, facilities, development track record, and NFL draft production create an institutional value proposition that attracts elite talent before the recruiting pitch even begins. Saban's best recruiting advantage is the system itself.

This creates a compounding effect: system → results → recruiting → better players → better results → stronger recruiting. Once the loop is established, the front-end recruitment effort becomes more efficient over time.

---

## Succession Planning as Strategic Risk Management

Saban's retirement created an organizational risk that Alabama managed through an atypical approach: hiring from the inside. Kalen DeBoer's hire reflects Alabama's understanding that the system must outlast the founder.

The lesson for organizational leaders: succession planning is not about finding a clone of the current leader. It is about identifying someone who can maintain the system's integrity while adapting its expression to their own leadership style.

The question Alabama is now answering in real time is whether the system architecture is robust enough to persist without its original architect. The early returns — a top-5 recruiting class in DeBoer's first cycle — suggest the institutional infrastructure remains intact.

---

## What Championship Systems Have in Common

Across Saban, Belichick (Patriots), Popovich (Spurs), and Wooden (UCLA), the pattern is consistent:

1. **Clarity of standards:** everyone knows what excellence looks like
2. **Process orientation:** attention directed toward controllable behaviors
3. **Tolerance for short-term losses for long-term system integrity:** never compromise the standard for a single result
4. **Scalable culture:** the system works with different personnel because it is embedded in structure, not individuals

---

## Conclusion

Saban's legacy is not the championships. The championships are evidence. The legacy is demonstrating that systematic organization, cultural architecture, and process discipline can sustain elite performance across decades in the most competitive environment in American sports.

The lesson is transferable. The execution is rare.

*Source: Full Sail University — MAN5100 Executive Leadership II. Graduate-level leadership case analysis.*
`;

const GARRIDO_CONTENT = `# Augie Garrido: A Legacy of Leadership

## Building Something That Lasts

Augie Garrido won more college baseball games than any coach in the history of the sport: 1,975 career victories, five national championships (three at Cal State Fullerton, two at Texas), and head coaching positions spanning five decades.

The number does not tell the important story. The important story is what Garrido built — and why it kept working long after any single player or staff member moved on.

---

## The Philosophy: People Before Performance

Garrido's central organizing principle was not tactical. It was relational. He believed — and proved repeatedly — that when you build an environment where people feel genuinely valued, performance follows as a consequence rather than a target.

"I'm not in the game of baseball. I'm in the people business," Garrido said in his later years at Texas. That framing had practical implications for how he recruited, how he coached, and how he handled failure.

**Recruiting for character, not just tools:** Garrido was famous for passing on higher-ceiling prospects when the character fit felt wrong. At a program with his competitive demands, that filtering made the culture more coherent — and ultimately more durable.

**The development orientation:** Garrido rarely talked to players about their statistics. He talked to them about their mindset, their processes, their relationships with failure. The scoreboard was a report card on the work, not the work itself.

---

## Managing Adversity: The 2004–2005 Texas Run

After a disappointing 2003 season in which Texas failed to reach the NCAA Tournament, Garrido faced institutional pressure and internal questions about the program's direction.

His response was characteristic: he reset expectations clearly, identified the behavioral changes required, and gave the players responsibility for rebuilding the culture from inside the roster.

The 2005 national championship — Texas's first since 1975 — came directly from that reset. The team did not change its talent level dramatically in one offseason. It changed its standard for what it expected of itself.

Garrido described the 2004–2005 transformation as "the team deciding what it wanted to be." His role was creating the conditions for that decision. The execution was theirs.

---

## Legacy Systems: What Stayed When He Left

When Garrido retired from Texas in 2016, the question was whether what he built would survive the transition. David Pierce came in and continued Texas's position as one of college baseball's elite programs — making the College World Series in 2018, 2019, and 2021.

That continuity reflects Garrido's most important achievement: building institutional habits that outlast any individual coach. The culture of accountability, the development philosophy, the recruiting standards — these persisted because they were embedded in the program's DNA, not just in Garrido's personal presence.

---

## Three Leadership Principles Garrido Modeled

**1. Consistency over charisma**
Garrido was not a particularly emotional or charismatic presence in the traditional sense. His durability came from consistent application of clear values — players knew what to expect from him, which created a stable environment for their own growth.

**2. Process visibility**
Garrido made his coaching philosophy explicit and legible. Players understood not just what was expected but why. That transparency created genuine buy-in rather than compliance.

**3. Tolerance for imperfection in service of development**
Garrido gave players space to fail, to reset, and to grow. He believed that development happens in adversity — which required that he not overreact to individual setbacks, even in high-stakes moments.

---

## Conclusion

Augie Garrido's record is the product of a coherent philosophy applied consistently across 50 years. He did not build teams — he built an environment where teams built themselves.

That is the highest form of leadership in sport: creating the conditions for others to become more than they thought they could be.

*Source: Full Sail University — MAN5100 Executive Leadership II. Graduate-level leadership case study.*
`;

const NIL_CONTENT = `# The NIL Revolution: How Name, Image, and Likeness Reshaped College Athletics

## The Moment Everything Changed

On July 1, 2021, the NCAA's century-old prohibition on college athletes profiting from their own names, images, and likenesses ended. Within 24 hours, athletes were signing deals, launching personal brands, and earning income that the institution had denied them for generations.

Three years later, the NIL landscape looks nothing like anyone predicted — not the optimists or the alarmists. It is more complex, more consequential, and more structurally transformative than the initial coverage suggested.

---

## What NIL Actually Is

NIL is a legal framework that allows college athletes to earn compensation for:
- Endorsement deals and sponsorships
- Social media partnerships and promoted content
- Personal appearances, autograph signings, and speaking engagements
- Licensing their likeness for video games, merchandise, or media
- Establishing their own businesses

NIL does **not** allow schools to directly pay athletes as employees. The legal and regulatory distinction between NIL compensation and pay-for-play remains — though that line is increasingly contested.

---

## The Collective Structure

The most consequential development in NIL's first three years was the emergence of collectives: organizations formed by boosters, donors, and alumni to pool NIL money and distribute it to athletes at specific schools.

Collectives effectively created a market for athletic talent where none previously existed — one that operates with institutional coordination even without direct school involvement.

**Collective economics as of 2024:**
- Top programs: $30–50M estimated annual collective capacity
- Mid-major programs: $2–10M
- Bottom of the Power 5: $1–5M
- FCS and below: minimal organized collective activity

This creates a structural advantage for resource-rich programs that compounds over time. Schools with the largest donor bases and most engaged alumni can sustain collective operations at a scale that lower-resource institutions cannot match.

---

## Impact on Recruiting: The Transfer Portal Acceleration

NIL intersects with the transfer portal to create a new model for roster construction. The one-time transfer exception (2021) combined with NIL compensation created a free-agency-adjacent environment:

- Athletes can now change schools annually without penalty
- NIL packages are openly discussed in transfer recruitment
- Programs use transfer portal acquisitions to fill immediate roster needs rather than waiting for multi-year development

**The consequence for player development:** Programs that built their competitive advantage through long-cycle development (high school → 2–3 years of development → contributor) face a new cost structure. Developed players now have market options — and they use them.

**The consequence for mid-majors:** Programs that historically developed players for Power 5 schools now see that talent extracted more aggressively, earlier in development. NIL and the portal make talent retention structurally more difficult without financial resources.

---

## Legal Landscape: The House Settlement

The House v. NCAA antitrust settlement — finalized in 2024 — represents the most significant restructuring of college athletics economics since the creation of the NCAA itself.

Key provisions:
- Schools can directly share revenue with athletes (approximately $20M/school/year initially)
- A damage pool compensates athletes retroactively for NIL restrictions
- Roster limits and scholarship structures are modified across most sports

The House settlement effectively validates what collectives were already doing — direct athlete compensation — while placing it under institutional control. The distinction between NIL and pay-for-play is now largely definitional.

---

## What the NIL Era Reveals About College Athletics

The NIL revolution is not primarily a story about athletes making money. It is a story about a system — the NCAA's amateur model — that could not withstand contact with economic reality.

The amateur model worked for as long as:
1. Athletes lacked legal alternatives for monetization
2. The legal framework supported institutional restrictions
3. Athletes lacked collective organizing capacity

All three conditions eroded simultaneously in 2021. The response is still being negotiated — in courts, in conference offices, in state legislatures, and in the daily decisions of thousands of athletes and their families.

What is clear: college athletics will not return to the pre-NIL equilibrium. The question is what the new equilibrium looks like — and who benefits from it.

*Source: Full Sail University — LSP5100 Legal Issues in Sports. Graduate-level legal and policy analysis.*
`;

// ---------------------------------------------------------------------------
// Article registry
// ---------------------------------------------------------------------------

const ARTICLES: ArticleMeta[] = [
  {
    slug: 'texas-baseball-week-1-recap-lamar-preview-michigan-state-series-2026',
    title: 'Texas Baseball Week 1: UC Davis Sweep Recap + Lamar Preview + Michigan State Series',
    subtitle: null,
    description:
      'Texas opens 3-0 with a UC Davis sweep. What the numbers actually say, plus a Tuesday matchup preview vs Lamar and a Weekend 2 series look at Michigan State.',
    author: 'Austin Humphrey',
    category: 'editorial',
    tags: ['Texas Longhorns', 'NCAA Baseball', 'SEC', 'Preview', 'Recap'],
    featured: true,
    published_at: '2026-02-17',
    read_time_mins: 6,
    word_count: 1315,
    source_context: 'Blaze Sports Intel — Original Editorial (2026)',
    contentPath: '../Austin-Writing---Communication-Style-Archive/texas-baseball-week1-recap-lamar-preview-msu-series-2026.md',
  },
  {
    slug: 'cardinals-strategic-intelligence-2025',
    title: 'Cardinals Strategic Intelligence Framework',
    subtitle: 'A systematic analysis of how St. Louis builds competitive advantage',
    description:
      'How the Cardinals make decisions, generate competitive advantage, and navigate mid-market constraints through organizational systems and player development discipline.',
    author: 'Austin Humphrey',
    category: 'sports-operations',
    tags: ['St. Louis Cardinals', 'MLB', 'Front Office', 'Player Development', 'Strategy'],
    featured: false,
    published_at: '2025-08-01',
    read_time_mins: 8,
    word_count: 950,
    source_context: 'Full Sail University — MAN6224 Sports Management and Operations (2025)',
    content: CARDINALS_CONTENT,
  },
  {
    slug: 'texas-longhorns-sec-revenue-transformation',
    title: 'Texas Longhorns Revenue Transformation in the SEC Era',
    subtitle: 'The financial case for conference realignment',
    description:
      'Texas\'s SEC move is a revenue step-change that reshapes the athletic department\'s operating model, facilities investment capacity, and competitive ceiling across all sports.',
    author: 'Austin Humphrey',
    category: 'sports-business',
    tags: ['Texas Longhorns', 'SEC', 'Conference Realignment', 'College Athletics', 'Revenue'],
    featured: false,
    published_at: '2025-07-15',
    read_time_mins: 7,
    word_count: 900,
    source_context: 'Full Sail University — MAN6224 Sports Management and Operations (2025)',
    content: TEXAS_SEC_CONTENT,
  },
  {
    slug: 'championship-leadership-nick-saban',
    title: 'Championship Leadership Through Systems: Nick Saban',
    subtitle: 'What Saban built, not what Saban did',
    description:
      'Saban\'s legacy is demonstrating that systematic organization, cultural architecture, and process discipline can sustain elite performance across decades in the most competitive environment in American sports.',
    author: 'Austin Humphrey',
    category: 'leadership',
    tags: ['Nick Saban', 'Alabama Football', 'Leadership', 'Systems Thinking', 'Organizational Culture'],
    featured: false,
    published_at: '2025-06-10',
    read_time_mins: 9,
    word_count: 1050,
    source_context: 'Full Sail University — MAN5100 Executive Leadership II (2025)',
    content: SABAN_CONTENT,
  },
  {
    slug: 'augie-garrido-legacy-of-leadership',
    title: 'Augie Garrido: A Legacy of Leadership',
    subtitle: 'Building something that outlasts any individual',
    description:
      'Augie Garrido won 1,975 college baseball games over five decades. The number doesn\'t tell the important story — what he built does, and why it kept working long after any single player or staff member moved on.',
    author: 'Austin Humphrey',
    category: 'leadership',
    tags: ['Augie Garrido', 'Texas Baseball', 'College Baseball', 'Coaching', 'Leadership'],
    featured: false,
    published_at: '2025-05-20',
    read_time_mins: 7,
    word_count: 870,
    source_context: 'Full Sail University — MAN5100 Executive Leadership II (2025)',
    content: GARRIDO_CONTENT,
  },
  {
    slug: 'nil-revolution-college-athletics',
    title: 'The NIL Revolution: How Name, Image, and Likeness Reshaped College Athletics',
    subtitle: 'A century-old model meets economic reality',
    description:
      'The NIL era is not primarily about athletes making money. It is about a system — the NCAA\'s amateur model — that could not withstand contact with economic reality.',
    author: 'Austin Humphrey',
    category: 'sports-business',
    tags: ['NIL', 'NCAA', 'College Athletics', 'Transfer Portal', 'Sports Law'],
    featured: false,
    published_at: '2025-04-01',
    read_time_mins: 10,
    word_count: 1100,
    source_context: 'Full Sail University — LSP5100 Legal Issues in Sports (2025)',
    content: NIL_CONTENT,
  },
];

// ---------------------------------------------------------------------------
// Cloudflare API helpers
// ---------------------------------------------------------------------------

async function d1Execute(sql: string, params: (string | number | boolean | null)[] = []) {
  const url = `${CF_API}/accounts/${ACCOUNT_ID}/d1/database/${D1_DATABASE_ID}/query`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ sql, params }),
  });
  const body = await res.json() as { success: boolean; errors?: { message: string }[]; result?: unknown };
  if (!body.success) {
    throw new Error(`D1 query failed: ${JSON.stringify(body.errors)}`);
  }
  return body;
}

async function r2Put(key: string, content: string) {
  const url = `${CF_API}/accounts/${ACCOUNT_ID}/r2/buckets/${R2_BUCKET}/objects/${encodeURIComponent(key)}`;
  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${API_TOKEN}`,
      'Content-Type': 'text/markdown; charset=utf-8',
    },
    body: content,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`R2 PUT failed for ${key}: ${res.status} ${text}`);
  }
}

// ---------------------------------------------------------------------------
// Resolve article content
// ---------------------------------------------------------------------------

function resolveContent(article: ArticleMeta): string {
  if (article.content) return article.content;

  if (article.contentPath) {
    const fullPath = path.resolve(__dirname, article.contentPath);
    if (fs.existsSync(fullPath)) {
      return fs.readFileSync(fullPath, 'utf-8');
    }
    console.warn(`  [warn] contentPath not found: ${fullPath}`);
  }

  return `# ${article.title}\n\n*Content coming soon.*\n`;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function seed() {
  console.log('\n=== Blaze Sports Intel — Blog Post Seed ===\n');

  for (const article of ARTICLES) {
    console.log(`\nProcessing: ${article.slug}`);

    // 1) Upload markdown to R2
    const content = resolveContent(article);
    const r2Key = `blog-posts/${article.slug}.md`;
    console.log(`  → R2: uploading ${r2Key} (${content.length} chars)`);
    await r2Put(r2Key, content);
    console.log(`  ✓ R2 upload complete`);

    // 2) Upsert metadata in D1
    console.log(`  → D1: upserting metadata`);
    await d1Execute(
      `INSERT INTO blog_posts
         (slug, title, subtitle, description, author, category, tags, featured, published,
          published_at, read_time_mins, word_count, source_context)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?)
       ON CONFLICT(slug) DO UPDATE SET
         title = excluded.title,
         subtitle = excluded.subtitle,
         description = excluded.description,
         author = excluded.author,
         category = excluded.category,
         tags = excluded.tags,
         featured = excluded.featured,
         published_at = excluded.published_at,
         read_time_mins = excluded.read_time_mins,
         word_count = excluded.word_count,
         source_context = excluded.source_context,
         updated_at = datetime('now')`,
      [
        article.slug,
        article.title,
        article.subtitle,
        article.description,
        article.author,
        article.category,
        JSON.stringify(article.tags),
        article.featured ? 1 : 0,
        article.published_at,
        article.read_time_mins,
        article.word_count,
        article.source_context,
      ]
    );
    console.log(`  ✓ D1 upsert complete`);
  }

  console.log('\n=== Seed complete ✓ ===\n');
  console.log('Verify with:');
  console.log('  npx wrangler d1 execute bsi-prod-db --remote --command="SELECT slug, title, featured, category FROM blog_posts ORDER BY published_at DESC;"');
}

seed().catch((err) => {
  console.error('\n[ERROR]', err.message);
  process.exit(1);
});
