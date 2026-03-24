/**
 * Shared ESPN boxscore types used by CFB, NBA, and NFL BoxScoreClient components.
 *
 * ESPN game summary shape:
 * {
 *   teams: [{ team: {displayName, abbreviation}, statistics: [{name, displayValue}] }],
 *   players: [{ team: {displayName, abbreviation}, statistics: [{
 *     name, type, labels, names, athletes: [{ athlete: {...}, stats: string[], didNotPlay, reason }]
 *   }] }]
 * }
 *
 * The `statistics` array under `players` contains multiple stat groups (e.g., passing,
 * rushing, receiving for football). Each group has its own column headers and athlete list.
 */

export interface BoxscoreTeamStat {
  name?: string;
  displayValue?: string;
  label?: string;
}

export interface BoxscoreTeam {
  team?: { displayName?: string; abbreviation?: string; logo?: string };
  statistics?: BoxscoreTeamStat[];
}

export interface BoxscorePlayerAthlete {
  athlete?: {
    displayName?: string;
    shortName?: string;
    position?: { abbreviation?: string };
    starter?: boolean;
  };
  stats?: string[];
  didNotPlay?: boolean;
  reason?: string;
}

export interface BoxscoreStatGroup {
  names?: string[];
  labels?: string[];
  athletes?: BoxscorePlayerAthlete[];
  name?: string;
  type?: string;
}

export interface BoxscorePlayerGroup {
  team?: { displayName?: string; abbreviation?: string };
  statistics?: Array<BoxscoreStatGroup | null | undefined>;
}

export interface EspnBoxscore {
  teams?: BoxscoreTeam[];
  players?: BoxscorePlayerGroup[];
}
