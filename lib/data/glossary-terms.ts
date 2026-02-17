/**
 * Glossary terms — maps MLB/pro metrics to college equivalents.
 * Each entry explains what the metric is, what college data exists, and where BSI uses it.
 */

export interface GlossaryTerm {
  term: string;
  category: 'baseball' | 'football' | 'basketball' | 'general';
  sport: string[];
  mlbDefinition: string;
  mlbSource: string;
  ncaaEquivalent: string;
  availableData: string;
  limitations: string;
  bsiLink?: string;
  bsiLinkLabel?: string;
}

export const GLOSSARY_TERMS: GlossaryTerm[] = [
  // Baseball
  {
    term: 'xwOBA',
    category: 'baseball',
    sport: ['MLB'],
    mlbDefinition: 'Expected Weighted On-Base Average. Uses exit velocity and launch angle to estimate the expected value of a batted ball, removing defense and luck from the outcome.',
    mlbSource: 'MLB Statcast (Baseball Savant)',
    ncaaEquivalent: 'No direct NCAA equivalent — college baseball lacks Statcast tracking at most venues. TrackMan data exists at some programs but is not publicly available.',
    availableData: 'MLB xwOBA is fully available via Statcast. College proxy: use wOBA from traditional stats (hits, walks, HBP weighted by run value).',
    limitations: 'Without exit velocity data, college xwOBA cannot be calculated. BSI uses traditional wOBA as the best available approximation.',
  },
  {
    term: 'Barrel Rate',
    category: 'baseball',
    sport: ['MLB'],
    mlbDefinition: 'Percentage of batted balls meeting specific exit velocity (≥98 mph) and launch angle (26–30° range, expanding with higher EV) thresholds. A barreled ball has a minimum .500 batting average and 1.500 slugging percentage historically.',
    mlbSource: 'MLB Statcast (Baseball Savant)',
    ncaaEquivalent: 'Not available in college. TrackMan data at select venues captures exit velocity but isn\'t aggregated publicly.',
    availableData: 'MLB barrel rate is available per batter and pitcher. College proxy: ISO (isolated power) and HR/FB ratio serve as rough power indicators.',
    limitations: 'Barrel rate requires pitch-level tracking infrastructure. College venues that lack TrackMan or Hawk-Eye cannot generate this metric.',
  },
  {
    term: 'Pitch Model',
    category: 'baseball',
    sport: ['MLB', 'College Baseball'],
    mlbDefinition: 'A statistical model that evaluates pitch quality based on velocity, movement (horizontal/vertical break), release point, spin rate, and location. Often expressed as Stuff+, Location+, or Pitching+.',
    mlbSource: 'MLB Statcast, various model providers (FanGraphs Stuff+)',
    ncaaEquivalent: 'Limited. Programs with TrackMan have internal pitch models, but no public standard exists. Rapsodo data is sometimes shared by individual pitchers.',
    availableData: 'MLB pitch models are fully public. College: BSI tracks K/9, BB/9, HR/9, and WHIP as proxy metrics for pitch quality.',
    limitations: 'Without movement data, college pitch models rely on outcome-based metrics rather than stuff-based ones. This conflates pitcher ability with defensive support and park effects.',
    bsiLink: '/models/win-probability',
    bsiLinkLabel: 'BSI Win Probability Model',
  },
  {
    term: 'Release Point',
    category: 'baseball',
    sport: ['MLB'],
    mlbDefinition: 'The x, y, z coordinates where a pitcher releases the ball. Consistency of release point correlates with deception and command. Measured by Hawk-Eye or TrackMan cameras.',
    mlbSource: 'MLB Statcast (Baseball Savant)',
    ncaaEquivalent: 'Available only at venues with TrackMan/Rapsodo. Not publicly aggregated for college pitchers.',
    availableData: 'MLB: full release point data per pitch. College: not available through public sources.',
    limitations: 'Scouting reports from college coaches reference release point qualitatively, but quantitative data stays internal to programs.',
  },
  {
    term: 'Spin Rate',
    category: 'baseball',
    sport: ['MLB', 'College Baseball'],
    mlbDefinition: 'Revolutions per minute (RPM) of a pitched ball. Higher spin on fastballs creates "rise" effect; higher spin on breaking balls creates sharper break. Context-dependent — spin axis matters as much as raw RPM.',
    mlbSource: 'MLB Statcast (Baseball Savant)',
    ncaaEquivalent: 'Available at TrackMan-equipped college venues but not publicly aggregated. Some programs share spin data in recruiting materials.',
    availableData: 'MLB: full spin data per pitch. College: sporadic. BSI does not currently ingest college spin data.',
    limitations: 'Spin rate without spin axis and movement data is misleading. A 2,500 RPM fastball with bad spin axis performs worse than a 2,200 RPM ball with efficient spin.',
  },
  // Football
  {
    term: 'CPOE',
    category: 'football',
    sport: ['NFL', 'CFB'],
    mlbDefinition: 'Completion Percentage Over Expected. Measures how often a quarterback completes passes above or below what the model expects given the difficulty of each throw (distance, coverage, pressure).',
    mlbSource: 'NFL Next Gen Stats (AWS)',
    ncaaEquivalent: 'PFF provides college CPOE via their grading system. Limited public availability — requires PFF subscription.',
    availableData: 'NFL: available via Next Gen Stats. CFB: PFF grades include adjusted completion metrics but raw CPOE is behind a paywall.',
    limitations: 'College CPOE models use different tracking data (All-22 film grading vs. NFL\'s player-tracking chips). Direct NFL-to-CFB CPOE comparisons are not valid.',
  },
  {
    term: 'EPA',
    category: 'football',
    sport: ['NFL', 'CFB'],
    mlbDefinition: 'Expected Points Added. Measures how much each play increases or decreases a team\'s expected points, based on down, distance, yard line, and score. A 3rd-and-1 conversion from the 50 adds more expected points than a 1st-and-10 run for 3 yards.',
    mlbSource: 'NFL play-by-play data (nflfastR, ESPN)',
    ncaaEquivalent: 'Available via cfbfastR and collegefootballdata.com. Same methodology applied to college play-by-play data.',
    availableData: 'Both NFL and CFB EPA are publicly available. BSI uses EPA/play for team and player evaluation in football content.',
    limitations: 'EPA doesn\'t account for personnel, scheme, or defensive alignment. Garbage-time plays inflate offensive EPA and deflate defensive EPA.',
    bsiLink: '/models/win-probability',
    bsiLinkLabel: 'BSI Win Probability Model',
  },
  {
    term: 'Win Probability Model',
    category: 'football',
    sport: ['NFL', 'CFB', 'MLB', 'College Baseball'],
    mlbDefinition: 'A model that estimates each team\'s probability of winning at any point during a game, given the current game state (score, time, possession, field position, etc.).',
    mlbSource: 'ESPN, FiveThirtyEight (historical), various implementations',
    ncaaEquivalent: 'Same concept applies across sports. College-specific models must account for wider talent gaps and higher variance than professional leagues.',
    availableData: 'BSI is building a win probability model documented in the Models hub. See the methodology page for inputs, assumptions, and validation status.',
    limitations: 'Win probability models assume teams play at their average level for the remainder of the game. They don\'t account for in-game adjustments, coaching decisions, or momentum.',
    bsiLink: '/models/win-probability',
    bsiLinkLabel: 'BSI Win Probability Model',
  },
  {
    term: 'Expected Points',
    category: 'football',
    sport: ['NFL', 'CFB'],
    mlbDefinition: 'The average number of points a team would score from a given game state (down, distance, yard line) based on historical play-by-play data. First-and-10 from the opponent\'s 20 has higher expected points than first-and-10 from your own 20.',
    mlbSource: 'NFL play-by-play models',
    ncaaEquivalent: 'Same methodology, different calibration data. College expected points tables are built from college play-by-play, not NFL data.',
    availableData: 'Publicly available via nflfastR (NFL) and cfbfastR (CFB).',
    limitations: 'Expected points assumes league-average teams. A first-and-goal from the 1 for Alabama is worth more expected points than the same situation for a bottom-tier program, but the model treats them equally.',
  },
  {
    term: 'Passing Score',
    category: 'football',
    sport: ['NFL', 'CFB'],
    mlbDefinition: 'A composite metric (typically from PFF) that grades quarterback passing performance on a 0-100 scale. Incorporates accuracy, decision-making, pocket presence, and throw difficulty.',
    mlbSource: 'PFF (Pro Football Focus)',
    ncaaEquivalent: 'PFF grades college quarterbacks on the same scale. Available behind PFF\'s paywall.',
    availableData: 'PFF grades are available for NFL and CFB. BSI uses publicly available stats (completion %, yards/attempt, TD/INT ratio) as proxies when PFF data is not accessible.',
    limitations: 'PFF grades involve subjective film evaluation. Two graders can disagree on the same play. The grades are useful directionally but shouldn\'t be treated as objective measurements.',
  },
];

/** Get all unique first letters for alphabetical navigation. */
export function getGlossaryLetters(): string[] {
  const letters = new Set(GLOSSARY_TERMS.map((t) => t.term[0].toUpperCase()));
  return Array.from(letters).sort();
}

/** Get terms grouped by first letter. */
export function getTermsByLetter(): Map<string, GlossaryTerm[]> {
  const map = new Map<string, GlossaryTerm[]>();
  for (const term of GLOSSARY_TERMS) {
    const letter = term.term[0].toUpperCase();
    const existing = map.get(letter) || [];
    existing.push(term);
    map.set(letter, existing);
  }
  return map;
}
