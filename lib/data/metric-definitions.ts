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
  wOBA: {
    abbr: 'wOBA',
    name: 'Weighted On-Base Average',
    description:
      'Values each way of reaching base by how much it\u2019s worth in runs. Better than batting average because a double is worth more than a single.',
    context: 'League avg ~.320. Elite >.400',
  },
  'wRC+': {
    abbr: 'wRC+',
    name: 'Weighted Runs Created Plus',
    description:
      'A player\u2019s total offensive value compared to league average. 100 is average; 150 means 50% better than average.',
    context: '100 = avg. 150 = 50% better',
  },
  FIP: {
    abbr: 'FIP',
    name: 'Fielding Independent Pitching',
    description:
      'Estimates what a pitcher\u2019s ERA should be based on strikeouts, walks, and home runs. Strips out defense and luck.',
    context: 'Scaled like ERA. League avg ~4.00',
  },
  'ERA-': {
    abbr: 'ERA-',
    name: 'ERA Minus',
    description:
      'ERA adjusted for park and league. 100 is average; lower is better. 80 means 20% better than average.',
    context: '100 = avg. 80 = 20% better',
  },
  ISO: {
    abbr: 'ISO',
    name: 'Isolated Power',
    description:
      'Measures raw power by subtracting batting average from slugging. Shows extra-base hit ability.',
    context: 'League avg ~.150. Power hitters >.200',
  },
  BABIP: {
    abbr: 'BABIP',
    name: 'Batting Average on Balls In Play',
    description:
      'How often batted balls (excluding homers) fall for hits. Helps identify luck vs. skill.',
    context: 'League avg ~.300',
  },
  'K%': {
    abbr: 'K%',
    name: 'Strikeout Rate',
    description:
      'Percentage of plate appearances ending in a strikeout.',
  },
  'BB%': {
    abbr: 'BB%',
    name: 'Walk Rate',
    description:
      'Percentage of plate appearances ending in a walk.',
  },
  OPS: {
    abbr: 'OPS',
    name: 'On-base Plus Slugging',
    description:
      'Quick measure of hitting ability combining on-base percentage and slugging.',
    context: 'League avg ~.730. Elite >.900',
  },
  'OPS+': {
    abbr: 'OPS+',
    name: 'OPS Plus',
    description:
      'OPS adjusted for park and league. 100 is average.',
    context: '100 = avg. 130 = very good',
  },
  'HAV-F': {
    abbr: 'HAV-F',
    name: 'Hitting, At-bat quality, Velocity, Fielding',
    description:
      'BSI\u2019s proprietary composite score evaluating hitters across four dimensions of player value.',
  },
  'Park Factor': {
    abbr: 'PF',
    name: 'Park Factor',
    description:
      'How much a ballpark inflates or deflates offense. 100 is neutral; above 100 is hitter-friendly.',
    context: '100 = neutral. 110 = 10% hitter-friendly',
  },
  RPI: {
    abbr: 'RPI',
    name: 'Rating Percentage Index',
    description:
      'NCAA\u2019s team ranking formula using winning percentage, opponents\u2019 winning percentage, and opponents\u2019 opponents\u2019 winning percentage.',
  },
  WAR: {
    abbr: 'WAR',
    name: 'Wins Above Replacement',
    description:
      'How many more wins a player gives a team compared to a freely available minor leaguer.',
    context: '0 = replacement level. 6+ = MVP caliber',
  },
  xFIP: {
    abbr: 'xFIP',
    name: 'Expected FIP',
    description:
      'Same as FIP but replaces actual HR with expected HR based on fly ball rate. Smooths home run luck.',
    context: 'Scaled like ERA. More stable than FIP',
  },
  'LOB%': {
    abbr: 'LOB%',
    name: 'Left On Base Percentage',
    description:
      'How well a pitcher strands baserunners. Very high LOB% tends to regress.',
    context: 'League avg ~72%',
  },
  'K/BB': {
    abbr: 'K/BB',
    name: 'Strikeout to Walk Ratio',
    description:
      'Measures a pitcher\u2019s command and ability to miss bats while avoiding free passes.',
    context: 'Good \u22653.0. Elite \u22654.0',
  },
  'K/9': {
    abbr: 'K/9',
    name: 'Strikeouts per Nine Innings',
    description:
      'How many batters a pitcher strikes out per nine innings pitched. Higher means more swing-and-miss stuff.',
    context: 'League avg ~7.5. Elite >10.0',
  },
  'BB/9': {
    abbr: 'BB/9',
    name: 'Walks per Nine Innings',
    description:
      'How many free passes a pitcher gives up per nine innings. Lower is better — shows control.',
    context: 'Good <3.0. Elite <2.0',
  },
  'HR/9': {
    abbr: 'HR/9',
    name: 'Home Runs per Nine Innings',
    description:
      'How many home runs a pitcher allows per nine innings. Lower means fewer big mistakes.',
    context: 'League avg ~1.2. Elite <0.8',
  },
};

/**
 * Look up a metric definition by key.
 * Falls back to null if the metric is not defined.
 */
export function getMetricDefinition(key: string): MetricDefinition | null {
  return METRIC_DEFINITIONS[key] ?? null;
}
