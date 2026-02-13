/**
 * SportsDataIO API response types and constants.
 *
 * Field shapes derived from the SportsDataIO v3 API.
 * All fields are optional to handle partial API responses gracefully.
 */

// ---------------------------------------------------------------------------
// Sport identifiers
// ---------------------------------------------------------------------------

export type SDIOSport = 'mlb' | 'nfl' | 'nba' | 'cfb' | 'cbb';

/** Maps SDIOSport to the URL path segment used by the SportsDataIO API. */
export const SDIO_SPORT_PATHS: Record<SDIOSport, string> = {
  mlb: 'mlb',
  nfl: 'nfl',
  nba: 'nba',
  cfb: 'cfb',
  cbb: 'cbb',
};

// ---------------------------------------------------------------------------
// MLB
// ---------------------------------------------------------------------------

export interface SDIOMLBGame {
  GameID?: number;
  Season?: number;
  SeasonType?: number;
  Status?: string;
  Day?: string;
  DateTime?: string;
  AwayTeam?: string;
  HomeTeam?: string;
  AwayTeamID?: number;
  HomeTeamID?: number;
  AwayTeamRuns?: number;
  HomeTeamRuns?: number;
  Inning?: number;
  InningHalf?: string;
  IsClosed?: boolean;
  Channel?: string;
  PointSpread?: number;
  OverUnder?: number;
  StadiumID?: number;
}

export interface SDIOMLBStanding {
  Season?: number;
  TeamID?: number;
  Key?: string;
  City?: string;
  Name?: string;
  League?: string;
  Division?: string;
  Wins?: number;
  Losses?: number;
  Percentage?: number;
  GamesBack?: number;
  RunsScored?: number;
  RunsAgainst?: number;
  Streak?: string;
  HomeWins?: number;
  HomeLosses?: number;
  AwayWins?: number;
  AwayLosses?: number;
  LastTenGamesWins?: number;
  LastTenGamesLosses?: number;
}

export interface SDIOMLBTeam {
  TeamID?: number;
  Key?: string;
  Name?: string;
  City?: string;
  FullName?: string;
  PrimaryColor?: string;
  SecondaryColor?: string;
  WikipediaLogoUrl?: string;
  TeamLogoUrl?: string;
  ShortDisplayName?: string;
  StadiumID?: number;
  League?: string;
  Division?: string;
}

export interface SDIOMLBPlayer {
  PlayerID?: number;
  FirstName?: string;
  LastName?: string;
  Jersey?: number;
  Number?: number;
  Position?: string;
  Height?: number | string;
  Weight?: number;
  PhotoUrl?: string;
  BirthDate?: string;
  BirthCity?: string;
  BirthState?: string;
  BirthCountry?: string;
  Team?: string;
  TeamID?: number;
  Status?: string;
}

export interface SDIOMLBBoxScore {
  Game?: SDIOMLBGame;
  TeamGames?: SDIOMLBTeamGame[];
  Innings?: SDIOMLBInning[];
  PlayerGames?: SDIOMLBPlayerGame[];
}

export interface SDIOMLBTeamGame {
  HomeOrAway?: string;
  Team?: string;
  Runs?: number;
  Hits?: number;
  Errors?: number;
}

export interface SDIOMLBInning {
  InningNumber?: number;
  AwayTeamRuns?: number;
  HomeTeamRuns?: number;
}

export interface SDIOMLBPlayerGame {
  PlayerID?: number;
  Name?: string;
  Team?: string;
  Position?: string;
  [key: string]: unknown;
}

export interface SDIOMLBNews {
  NewsID?: number;
  Title?: string;
  Content?: string;
  Url?: string;
  Updated?: string;
  OriginalSource?: string;
  Source?: string;
  PlayerID?: number;
  TeamID?: number;
}

// ---------------------------------------------------------------------------
// NFL
// ---------------------------------------------------------------------------

export interface SDIONFLGame {
  GameID?: number;
  GameKey?: string;
  Season?: number;
  SeasonType?: number;
  Week?: number;
  Status?: string;
  Day?: string;
  DateTime?: string;
  AwayTeam?: string;
  HomeTeam?: string;
  AwayTeamID?: number;
  HomeTeamID?: number;
  AwayScore?: number;
  HomeScore?: number;
  Quarter?: string;
  TimeRemaining?: string;
  IsClosed?: boolean;
  Channel?: string;
  PointSpread?: number;
  OverUnder?: number;
  StadiumID?: number;
}

export interface SDIONFLStanding {
  Season?: number;
  TeamID?: number;
  Key?: string;
  City?: string;
  Name?: string;
  Conference?: string;
  Division?: string;
  Wins?: number;
  Losses?: number;
  Ties?: number;
  Percentage?: number;
  PointsFor?: number;
  PointsAgainst?: number;
  NetPoints?: number;
  StreakDescription?: string;
  DivisionWins?: number;
  DivisionLosses?: number;
  ConferenceWins?: number;
  ConferenceLosses?: number;
}

export interface SDIONFLTeam {
  TeamID?: number;
  Key?: string;
  Name?: string;
  City?: string;
  FullName?: string;
  PrimaryColor?: string;
  SecondaryColor?: string;
  WikipediaLogoUrl?: string;
  TeamLogoUrl?: string;
  ShortDisplayName?: string;
  Conference?: string;
  Division?: string;
  StadiumID?: number;
}

export interface SDIONFLPlayer {
  PlayerID?: number;
  FirstName?: string;
  LastName?: string;
  Jersey?: number;
  Number?: number;
  Position?: string;
  Height?: number | string;
  Weight?: number;
  PhotoUrl?: string;
  BirthDate?: string;
  BirthCity?: string;
  BirthState?: string;
  BirthCountry?: string;
  Team?: string;
  TeamID?: number;
  Status?: string;
}

export interface SDIONFLBoxScore {
  Game?: SDIONFLGame;
  TeamGames?: SDIONFLTeamGame[];
  PlayerGames?: SDIONFLPlayerGame[];
  Quarters?: SDIONFLQuarter[];
}

export interface SDIONFLTeamGame {
  HomeOrAway?: string;
  Team?: string;
  Score?: number;
  [key: string]: unknown;
}

export interface SDIONFLPlayerGame {
  PlayerID?: number;
  Name?: string;
  Team?: string;
  Position?: string;
  [key: string]: unknown;
}

export interface SDIONFLQuarter {
  QuarterID?: number;
  Number?: number;
  AwayScore?: number;
  HomeScore?: number;
}

export interface SDIONFLNews {
  NewsID?: number;
  Title?: string;
  Content?: string;
  Url?: string;
  Updated?: string;
  OriginalSource?: string;
  Source?: string;
  PlayerID?: number;
  TeamID?: number;
}

// ---------------------------------------------------------------------------
// NBA
// ---------------------------------------------------------------------------

export interface SDIONBAGame {
  GameID?: number;
  Season?: number;
  SeasonType?: number;
  Status?: string;
  Day?: string;
  DateTime?: string;
  AwayTeam?: string;
  HomeTeam?: string;
  AwayTeamID?: number;
  HomeTeamID?: number;
  AwayTeamScore?: number;
  HomeTeamScore?: number;
  Quarter?: string;
  IsClosed?: boolean;
  Channel?: string;
  PointSpread?: number;
  OverUnder?: number;
  StadiumID?: number;
}

export interface SDIONBAStanding {
  Season?: number;
  TeamID?: number;
  Key?: string;
  City?: string;
  Name?: string;
  Conference?: string;
  Division?: string;
  Wins?: number;
  Losses?: number;
  Percentage?: number;
  GamesBack?: number;
  HomeWins?: number;
  HomeLosses?: number;
  AwayWins?: number;
  AwayLosses?: number;
  LastTenWins?: number;
  LastTenLosses?: number;
  StreakDescription?: string;
}

export interface SDIONBATeam {
  TeamID?: number;
  Key?: string;
  Name?: string;
  City?: string;
  FullName?: string;
  PrimaryColor?: string;
  SecondaryColor?: string;
  WikipediaLogoUrl?: string;
  TeamLogoUrl?: string;
  ShortDisplayName?: string;
  Conference?: string;
  Division?: string;
  StadiumID?: number;
}

export interface SDIONBAPlayer {
  PlayerID?: number;
  FirstName?: string;
  LastName?: string;
  Jersey?: number;
  Number?: number;
  Position?: string;
  Height?: number | string;
  Weight?: number;
  PhotoUrl?: string;
  BirthDate?: string;
  BirthCity?: string;
  BirthState?: string;
  BirthCountry?: string;
  Team?: string;
  TeamID?: number;
  Status?: string;
}

export interface SDIONBABoxScore {
  Game?: SDIONBAGame;
  TeamGames?: SDIONBATeamGame[];
  PlayerGames?: SDIONBAPlayerGame[];
  Quarters?: SDIONBAQuarter[];
}

export interface SDIONBATeamGame {
  HomeOrAway?: string;
  Team?: string;
  Score?: number;
  [key: string]: unknown;
}

export interface SDIONBAPlayerGame {
  PlayerID?: number;
  Name?: string;
  Team?: string;
  Position?: string;
  [key: string]: unknown;
}

export interface SDIONBAQuarter {
  QuarterID?: number;
  Number?: number;
  AwayScore?: number;
  HomeScore?: number;
}

export interface SDIONBANews {
  NewsID?: number;
  Title?: string;
  Content?: string;
  Url?: string;
  Updated?: string;
  OriginalSource?: string;
  Source?: string;
  PlayerID?: number;
  TeamID?: number;
}

// ---------------------------------------------------------------------------
// CFB (College Football)
// ---------------------------------------------------------------------------

export interface SDIOCFBGame {
  GameID?: number;
  Season?: number;
  SeasonType?: number;
  Week?: number;
  Status?: string;
  Day?: string;
  DateTime?: string;
  Title?: string;
  AwayTeam?: string;
  HomeTeam?: string;
  AwayTeamID?: number;
  HomeTeamID?: number;
  AwayTeamScore?: number;
  HomeTeamScore?: number;
  Period?: string;
  IsClosed?: boolean;
  StadiumID?: number;
}

export interface SDIOCFBStanding {
  Season?: number;
  TeamID?: number;
  Key?: string;
  Name?: string;
  Conference?: string;
  Wins?: number;
  Losses?: number;
  Percentage?: number;
  PointsFor?: number;
  PointsAgainst?: number;
  ConferenceWins?: number;
  ConferenceLosses?: number;
}

export interface SDIOCFBTeam {
  TeamID?: number;
  Key?: string;
  Name?: string;
  School?: string;
  FullName?: string;
  PrimaryColor?: string;
  SecondaryColor?: string;
  WikipediaLogoUrl?: string;
  TeamLogoUrl?: string;
  ShortDisplayName?: string;
  Conference?: string;
  StadiumID?: number;
}

export interface SDIOCFBConference {
  ConferenceID?: number;
  Name?: string;
  Teams?: SDIOCFBTeam[];
}

// ---------------------------------------------------------------------------
// CBB (College Basketball)
// ---------------------------------------------------------------------------

export interface SDIOCBBGame {
  GameID?: number;
  Season?: number;
  SeasonType?: number;
  Status?: string;
  Day?: string;
  DateTime?: string;
  AwayTeam?: string;
  HomeTeam?: string;
  AwayTeamID?: number;
  HomeTeamID?: number;
  AwayTeamScore?: number;
  HomeTeamScore?: number;
  Period?: string;
  IsClosed?: boolean;
  Channel?: string;
  PointSpread?: number;
  OverUnder?: number;
  StadiumID?: number;
}

export interface SDIOCBBStanding {
  Season?: number;
  TeamID?: number;
  Key?: string;
  Name?: string;
  Conference?: string;
  Wins?: number;
  Losses?: number;
  Percentage?: number;
  ConferenceWins?: number;
  ConferenceLosses?: number;
  GamesBack?: number;
}

export interface SDIOCBBTeam {
  TeamID?: number;
  Key?: string;
  Name?: string;
  School?: string;
  FullName?: string;
  PrimaryColor?: string;
  SecondaryColor?: string;
  WikipediaLogoUrl?: string;
  TeamLogoUrl?: string;
  ShortDisplayName?: string;
  Conference?: string;
  StadiumID?: number;
}
