/**
 * Centralized metric definitions for tooltip/explainer components.
 * Single source of truth — all metric explanations pull from here.
 */

export interface MetricDefinition {
  /** Short label (e.g., "wOBA") */
  abbr: string;
  /** Full name */
  name: string;
  /** Plain-English explanation (1-2 sentences) */
  description: string;
  /** Typical range or scale context (e.g., "100 = avg") */
  context?: string;
}

export const METRIC_DEFINITIONS: Record<string, MetricDefinition> = {
  // ── Batting: Traditional ──────────────────────────────────────────────────
  AVG: {
    abbr: 'AVG',
    name: 'Batting Average',
    description:
      'Hits divided by at-bats. The most familiar hitting stat, but it treats all hits the same \u2014 a bloop single counts as much as a line drive double.',
    context: 'League avg ~.270. Elite >.330',
  },
  OBP: {
    abbr: 'OBP',
    name: 'On-Base Percentage',
    description:
      'How often a batter reaches base. Includes hits, walks, and hit-by-pitches. More valuable than batting average because not making outs is the most important thing a hitter can do.',
    context: 'League avg ~.340. Elite >.400',
  },
  SLG: {
    abbr: 'SLG',
    name: 'Slugging Percentage',
    description:
      'Measures power by weighting extra-base hits more heavily. A double counts twice as much as a single, a homer four times as much. Does not include walks.',
    context: 'League avg ~.420. Elite >.550',
  },
  OPS: {
    abbr: 'OPS',
    name: 'On-Base Plus Slugging',
    description:
      'Combines getting on base (OBP) with hitting for power (SLG) into one number. Quick and easy way to evaluate a hitter, though it slightly undervalues walks.',
    context: 'League avg ~.730. Elite >.900',
  },
  'K%': {
    abbr: 'K%',
    name: 'Strikeout Rate',
    description:
      'How often a batter strikes out per plate appearance. Lower is generally better \u2014 means the hitter is making contact and putting the ball in play.',
    context: 'League avg ~20%. Contact hitters <15%',
  },
  'BB%': {
    abbr: 'BB%',
    name: 'Walk Rate',
    description:
      'How often a batter draws a walk per plate appearance. Higher is better \u2014 shows plate discipline and the ability to lay off pitches outside the zone.',
    context: 'League avg ~10%. Patient hitters >14%',
  },

  // ── Batting: Advanced ─────────────────────────────────────────────────────
  wOBA: {
    abbr: 'wOBA',
    name: 'Weighted On-Base Average',
    description:
      'The best single number for evaluating a hitter. Weights each way of reaching base \u2014 walk, single, double, triple, homer \u2014 by how many runs it\u2019s actually worth. Unlike batting average, a homer counts way more than a single.',
    context: 'League avg ~.320. Star hitters >.400',
  },
  'wRC+': {
    abbr: 'wRC+',
    name: 'Weighted Runs Created Plus',
    description:
      'A hitter\u2019s total offensive value compared to everyone else, adjusted for ballpark. 100 is league average. If a guy has a 150 wRC+, he\u2019s creating 50% more runs than the average hitter.',
    context: '100 = league avg. 130+ = all-conference caliber',
  },
  'OPS+': {
    abbr: 'OPS+',
    name: 'OPS Plus',
    description:
      'OPS adjusted for the ballpark and overall scoring environment. 100 means exactly average. Makes it fair to compare a hitter at a bandbox like LSU\u2019s Alex Box Stadium to one at a pitcher\u2019s park.',
    context: '100 = avg. 130+ = elite',
  },
  ISO: {
    abbr: 'ISO',
    name: 'Isolated Power',
    description:
      'Pure extra-base hit ability. Calculated by subtracting batting average from slugging percentage. A guy with a high average but low ISO is a singles hitter. High ISO means doubles and homers.',
    context: 'League avg ~.150. Power hitters >.200',
  },
  BABIP: {
    abbr: 'BABIP',
    name: 'Batting Average on Balls In Play',
    description:
      'When a batter puts the ball in play (not a homer, not a strikeout), how often does it land for a hit? Useful for spotting luck \u2014 a hitter with a .400 BABIP is probably due to cool off, and one at .220 is probably better than the numbers show.',
    context: 'League avg ~.300. Very high or low suggests regression',
  },

  // ── Pitching: Traditional ─────────────────────────────────────────────────
  ERA: {
    abbr: 'ERA',
    name: 'Earned Run Average',
    description:
      'The classic pitching stat \u2014 how many earned runs a pitcher allows per nine innings. Lower is better. But it\u2019s heavily influenced by defense and luck on balls in play, so it doesn\u2019t always reflect how well a pitcher actually threw.',
    context: 'League avg ~4.50. Ace caliber <3.00',
  },
  WHIP: {
    abbr: 'WHIP',
    name: 'Walks + Hits per Inning Pitched',
    description:
      'How many baserunners a pitcher allows per inning. Simple way to see how clean a pitcher works. A WHIP under 1.00 means less than one baserunner per inning \u2014 that\u2019s dominant.',
    context: 'League avg ~1.35. Elite <1.00',
  },

  // ── Pitching: Advanced ────────────────────────────────────────────────────
  FIP: {
    abbr: 'FIP',
    name: 'Fielding Independent Pitching',
    description:
      'What a pitcher\u2019s ERA should look like based only on things the pitcher controls: strikeouts, walks, hit batters, and home runs. Ignores defense, luck on ground balls, and bloop hits. Reads like an ERA \u2014 lower is better.',
    context: 'Scaled like ERA. League avg ~4.00',
  },
  xFIP: {
    abbr: 'xFIP',
    name: 'Expected FIP',
    description:
      'Takes FIP one step further \u2014 replaces a pitcher\u2019s actual home runs with what you\u2019d expect based on league average rates. Smooths out home run luck. If a pitcher\u2019s FIP is 2.50 but xFIP is 3.80, some of those low HR numbers might just be good fortune.',
    context: 'Scaled like ERA. More predictive than FIP',
  },
  'ERA-': {
    abbr: 'ERA-',
    name: 'ERA Minus',
    description:
      'ERA adjusted for ballpark and league scoring environment. 100 is exactly average. Lower is better \u2014 an 80 ERA- means the pitcher was 20% better than average. Makes it fair to compare a pitcher at Coors-level altitude to one at a sea-level park.',
    context: '100 = avg. 80 = 20% better than avg',
  },
  'K/9': {
    abbr: 'K/9',
    name: 'Strikeouts per Nine Innings',
    description:
      'How many batters a pitcher punches out per nine innings. Higher means more swing-and-miss stuff. The best power arms in college are north of 12.',
    context: 'League avg ~7.5. Power arms >10.0',
  },
  'BB/9': {
    abbr: 'BB/9',
    name: 'Walks per Nine Innings',
    description:
      'How many free passes a pitcher gives up per nine innings. Lower is better. A guy under 2.0 has elite command \u2014 he almost never beats himself.',
    context: 'Good <3.0. Elite <2.0',
  },
  'HR/9': {
    abbr: 'HR/9',
    name: 'Home Runs per Nine Innings',
    description:
      'How often a pitcher gives up home runs. The fewer, the better \u2014 home runs are the most damaging play in baseball and the hardest to recover from.',
    context: 'League avg ~1.0. Lower is better',
  },
  'K/BB': {
    abbr: 'K/BB',
    name: 'Strikeout-to-Walk Ratio',
    description:
      'Strikeouts divided by walks. The best way to measure a pitcher\u2019s command at a glance. Elite pitchers strike out 4+ batters for every walk. Below 2.0 means control problems.',
    context: 'Good \u22653.0. Elite \u22654.0',
  },
  'LOB%': {
    abbr: 'LOB%',
    name: 'Left On Base Percentage',
    description:
      'When runners get on base, how often does the pitcher strand them there instead of letting them score? High LOB% looks great but tends to come back to earth \u2014 if a pitcher is stranding 85%+ of runners, some of that is luck.',
    context: 'League avg ~72%. Very high values regress',
  },

  // ── Composite / Special ───────────────────────────────────────────────────
  'HAV-F': {
    abbr: 'HAV-F',
    name: 'Hitting, At-bat quality, Velocity, Fielding',
    description:
      'BSI\u2019s own composite score that evaluates hitters across four dimensions of player value. Combines offensive production, plate approach quality, bat speed indicators, and defensive contribution into a single scouting number.',
  },
  'Park Factor': {
    abbr: 'PF',
    name: 'Park Factor',
    description:
      'How much a ballpark inflates or suppresses offense. 100 means neutral. Above 100 is a hitter\u2019s park (like Alex Box Stadium), below 100 favors pitchers. Stats adjusted for park factor give a fairer picture of true talent.',
    context: '100 = neutral. 110 = 10% hitter-friendly',
  },
  RPI: {
    abbr: 'RPI',
    name: 'Rating Percentage Index',
    description:
      'The NCAA\u2019s formula for ranking teams. Combines a team\u2019s own winning percentage with strength of schedule \u2014 who you beat matters as much as how often you win.',
  },
  WAR: {
    abbr: 'WAR',
    name: 'Wins Above Replacement',
    description:
      'How many extra wins a player gives his team compared to a readily available backup. Zero means you\u2019re replacement level. In college, even 2-3 WAR over a season is a major contributor.',
    context: '0 = bench guy. 3+ = All-American caliber',
  },
};

/**
 * Look up a metric definition by key.
 * Falls back to null if the metric is not defined.
 */
export function getMetricDefinition(key: string): MetricDefinition | null {
  return METRIC_DEFINITIONS[key] ?? null;
}
