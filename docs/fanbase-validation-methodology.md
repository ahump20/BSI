# Fanbase Sentiment Validation Methodology

## Overview

This document defines how BSI validates fanbase sentiment accuracy and establishes confidence scoring for the Fan Sentiment Barometer.

## What "Accurate Sentiment" Means

Sentiment accuracy is measured by **correlation with observable fan behavior signals**. A sentiment reading is accurate when:

1. **Directional Alignment**: Sentiment trends match behavioral indicators (rising optimism correlates with increased engagement)
2. **Magnitude Calibration**: Extreme sentiment readings reflect extreme behavioral signals
3. **Temporal Consistency**: Sentiment changes follow expected patterns after major events

## Ground Truth Sources

### Primary Signals (Weighted 60%)

**Social Engagement** - Fastest signal, highest volume

| Signal | Source | Update Frequency | Weight |
|--------|--------|-----------------|--------|
| Post volume | X/Twitter | Real-time | 25% |
| Sentiment polarity | Forum threads | Daily | 20% |
| Engagement rate | Instagram/TikTok | Daily | 15% |

### Secondary Signals (Weighted 30%)

**Behavioral Indicators** - Slower but more reliable for baseline calibration

| Signal | Source | Update Frequency | Weight |
|--------|--------|-----------------|--------|
| Game attendance | School athletic dept | Weekly | 10% |
| TV viewership | Nielsen/ESPN | Weekly | 10% |
| Merchandise trends | Fanatics/school stores | Monthly | 5% |
| Recruiting interest | 247/Rivals | Weekly | 5% |

### Tertiary Signals (Weighted 10%)

**Economic Indicators** - Long-term validation

| Signal | Source | Update Frequency | Weight |
|--------|--------|-----------------|--------|
| NIL deal activity | On3 NIL Database | Monthly | 5% |
| Donation trends | Athletic foundation | Quarterly | 3% |
| Season ticket renewal | School athletic dept | Annual | 2% |

## Confidence Scoring

### Score Calculation

Confidence scores range from 0.0 to 1.0 and are calculated based on:

```
confidence = (recency_score * 0.4) + (source_diversity * 0.3) + (consistency_score * 0.3)
```

**Recency Score (40%)**
- Last 7 days: 1.0
- 8-14 days: 0.8
- 15-30 days: 0.6
- 31-60 days: 0.4
- 61-90 days: 0.2
- 90+ days: 0.1

**Source Diversity Score (30%)**
- 4+ source types used: 1.0
- 3 source types: 0.75
- 2 source types: 0.5
- 1 source type: 0.25

**Consistency Score (30%)**
- All signals agree directionally: 1.0
- 75%+ signals agree: 0.75
- 50-75% signals agree: 0.5
- <50% signals agree: 0.25

### Confidence Thresholds

| Level | Score Range | Display | Action |
|-------|-------------|---------|--------|
| High | 0.8 - 1.0 | Green badge | No action needed |
| Medium | 0.5 - 0.79 | Yellow badge | Review within 2 weeks |
| Low | 0.25 - 0.49 | Orange badge | Priority review needed |
| Stale | < 0.25 | Red badge | Data refresh required |

## Review Workflow

### Post-Season Deep Review (Annual)

Conducted after bowl season for all profiles:

1. Cross-reference final sentiment with season outcomes
2. Validate personality traits against observed behaviors
3. Update rivalry intensity based on game results
4. Refresh demographic data if available
5. Document confidence and sources for each data point

### Monthly In-Season Spot Checks

During CFB season (Aug-Jan), monthly reviews include:

1. Verify sentiment aligns with recent game results
2. Check for major roster/coaching changes
3. Update trending context (injuries, scandals, milestones)
4. Flag any profiles with confidence < 0.5

### Event-Triggered Reviews

Immediate review required when:

- Coach firing/hiring
- Major scandal or NCAA investigation
- Significant injury to key player
- Unexpected bowl outcome
- Conference realignment news

## Data Source Citations

Every profile maintains source metadata:

```typescript
interface ProfileSourceMeta {
  lastReviewDate: string;      // ISO 8601
  reviewerNotes: string;       // Manual observations
  primarySources: string[];    // ["burnt-orange-nation", "x-hashtag-hornsup"]
  sampleSize: number;          // Posts/threads analyzed
  confidenceScore: number;     // 0.0 - 1.0
  nextReviewDate: string;      // Scheduled review
}
```

## Forum Sources by School (SEC)

| School | Primary Forum | X Hashtag | Secondary |
|--------|---------------|-----------|-----------|
| Texas | Burnt Orange Nation | #HookEm | Inside Texas |
| Texas A&M | TexAgs | #GigEm | Good Bull Hunting |
| Alabama | Roll Bama Roll | #RollTide | BamaInsider |
| Georgia | Dawg Sports | #GoDawgs | DawgNation |
| LSU | And The Valley Shook | #GeauxTigers | TigerDroppings |
| Tennessee | Rocky Top Talk | #GBO | VolQuest |
| Florida | Alligator Army | #GoGators | Swamp247 |
| Auburn | College and Magnolia | #WarEagle | AuburnSportsIllustrated |
| Ole Miss | Red Cup Rebellion | #HottyToddy | RebelGrove |
| Arkansas | Arkansas Fight | #WPS | HawgBeat |
| Kentucky | A Sea of Blue | #BBN | KSR |
| South Carolina | Garnet and Black Attack | #Gamecocks | GamecockCentral |
| Missouri | Rock M Nation | #MIZ | PowerMizzou |
| Mississippi State | For Whom The Cowbell Tolls | #HailState | Bulldawg Illustrated |
| Vanderbilt | Anchor of Gold | #AnchorDown | VandySports |
| Oklahoma | Crimson and Cream Machine | #BoomerSooner | OUInsider |

## Validation Checklist Template

Use this checklist for manual reviews:

```markdown
## [School Name] Validation Review - [Date]

### Sentiment Check
- [ ] Overall sentiment matches recent 3-game stretch
- [ ] Coach confidence reflects current trajectory
- [ ] Playoff hope aligned with standings/rankings

### Behavioral Correlation
- [ ] Social volume directionally matches sentiment
- [ ] Attendance trends support engagement score
- [ ] Recruiting interest aligns with program health

### Profile Accuracy
- [ ] Personality traits still accurate
- [ ] Rivalry intensities current
- [ ] Key triggers still relevant

### Data Quality
- [ ] Sources cited and accessible
- [ ] Sample size adequate (>50 posts/threads)
- [ ] No contradictory signals unresolved

### Confidence Assessment
- Recency: [1-7 days / 8-14 days / 15-30 days / 30+ days]
- Sources used: [List]
- Signal agreement: [High / Medium / Low]
- **Final Confidence Score**: [0.0 - 1.0]

### Notes
[Observations, anomalies, action items]
```

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-01-28 | Initial methodology |
