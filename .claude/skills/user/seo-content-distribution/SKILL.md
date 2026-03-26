---
name: seo-content-distribution
description: |
  Generate SEO metadata, structured data, and distribution assets from BSI editorial
  content. Produces meta descriptions, Open Graph/Twitter Card tags, JSON-LD structured
  data, URL slugs, internal linking suggestions, newsletter excerpts, and social copy.

  Use when: (1) BSI content needs SEO/meta assets, (2) "social copy", "meta tags",
  "SEO", (3) building page templates with structured data, (4) auditing SEO gaps.

  Triggers: "SEO", "meta tags", "structured data", "Open Graph", "social copy",
  "newsletter excerpt", "distribute this", "make this findable", "schema markup",
  "slug", "internal links", "content distribution", "social media post".
  Not for writing editorial content — use bsi-gameday-ops or austin-voice for that.
---

# SEO & Content Distribution

BSI's editorial pipeline produces the content. This skill handles the last mile — making
it findable and distributable. College baseball content is a long-tail SEO goldmine
because nobody else is writing it. The content exists. The gap is between "published"
and "discovered."

## Core Principle: Distribution Is a Product Decision

Every piece of BSI content serves multiple surfaces: the article page, search results,
social feeds, newsletters, and the content graph (internal links between related
coverage). Each surface has its own format constraints and discovery mechanics. One
article should produce 6-8 distribution assets without additional editorial effort.

---

## Output Spec: What This Skill Generates

For any BSI article or editorial output, produce:

### 1. SEO Metadata

```html
<title>{Headline} | Blaze Sports Intel</title>
<meta name="description" content="{150-160 char summary with primary keyword front-loaded}">
<link rel="canonical" href="https://blazesportsintel.com/{sport}/{slug}">
```

**Slug rules:** Lowercase, hyphens only, 3-6 words, include team names and sport.
Good: `rice-sam-houston-cws-regional-preview`. Bad: `article-12847` or `tuesday-game-recap`.

### 2. Open Graph + Twitter Cards

```html
<meta property="og:title" content="{Headline — max 60 chars}">
<meta property="og:description" content="{Same as meta description or shortened variant}">
<meta property="og:type" content="article">
<meta property="og:url" content="{canonical URL}">
<meta property="og:image" content="{hero image or BSI default card}">
<meta property="og:site_name" content="Blaze Sports Intel">
<meta property="article:published_time" content="{ISO 8601}">
<meta property="article:section" content="{Sport category}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:site" content="@BlazeSportsInte">
```

### 3. JSON-LD Structured Data

Match content type to schema:

| Content Type | Schema | Key Properties |
|-------------|--------|----------------|
| Game preview/recap | SportsEvent | homeTeam, awayTeam, startDate, location, sport |
| Player analysis | Person + Article | name, team, sport, position + headline, author |
| Team analysis | SportsTeam + Article | name, sport, conference + headline, author |
| General article | Article | headline, author, datePublished, publisher |

```json
{
  "@context": "https://schema.org",
  "@type": "SportsEvent",
  "name": "{Away} at {Home}",
  "startDate": "{ISO 8601}",
  "homeTeam": { "@type": "SportsTeam", "name": "{Home}" },
  "awayTeam": { "@type": "SportsTeam", "name": "{Away}" },
  "location": { "@type": "Place", "name": "{Venue}" },
  "sport": "{Sport}",
  "description": "{BSI's preview/recap summary}"
}
```

Always wrap in `<script type="application/ld+json">`.

### 4. Internal Linking Suggestions

Scan the article for entities (teams, players, conferences, matchups) and suggest
links to existing BSI coverage:

```
Suggested internal links:
- "Rice" → /college-baseball/teams/rice
- "Conference USA standings" → /college-baseball/standings/conference-usa
- "Sam Houston" → /college-baseball/teams/sam-houston
```

Use BSI's nav taxonomy: SCORES | COLLEGE BASEBALL | MLB | COLLEGE FOOTBALL | NFL | NBA | CBB (M) | CBB (W) | INTEL

### 5. Newsletter Excerpt (3 variants)

- **Short (50 words):** One-sentence hook + key stat or finding. For email subject preview text.
- **Medium (120 words):** Hook + core argument + one data point. For newsletter body.
- **Long (250 words):** Full excerpt with context. For standalone newsletter features.

All variants end with a clear CTA to the full article.

### 6. Social Media Copy

- **X/Twitter (280 chars):** Lead with the finding, not the matchup. Include one stat. No hashtags unless Austin uses them first.
- **LinkedIn (150 words):** Reframe as an insight about the sport/industry, not just the game. Position BSI's coverage angle.
- **Reddit (title + 2-3 sentence body):** Match the subreddit's voice. r/collegebaseball is casual and knowledgeable. No self-promotion language.

---

## Decision Tree

```
Content ready for distribution?
  → Game preview/recap → SportsEvent schema + all 6 outputs
  → Player/team analysis → Person/SportsTeam schema + all 6 outputs
  → BSI editorial/opinion → Article schema + all 6 outputs
  → Page template work → Schema + meta tags only (no social/newsletter)
  → SEO audit request → Audit existing pages → report gaps
```

## Quality Checks

Before delivering:
- [ ] Meta description is 150-160 characters
- [ ] OG title is under 60 characters
- [ ] Slug is 3-6 words, lowercase, hyphenated
- [ ] JSON-LD validates (test at schema.org/validator)
- [ ] Newsletter excerpts don't duplicate article opening verbatim
- [ ] Social copy leads with finding, not announcement
- [ ] Internal links point to real BSI URL patterns
