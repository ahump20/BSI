export interface CollegeBaseballTeam {
  team?: {
    displayName?: string
  }
  homeAway?: 'home' | 'away'
  score?: string
}

export interface CollegeBaseballCompetitionStatus {
  type?: {
    completed?: boolean
    detail?: string
    shortDetail?: string
  }
}

export interface CollegeBaseballCompetition {
  competitors?: CollegeBaseballTeam[]
  status?: CollegeBaseballCompetitionStatus
  venue?: {
    fullName?: string
  }
}

export interface CollegeBaseballEvent {
  id: string
  competitions?: CollegeBaseballCompetition[]
}

export interface CollegeBaseballScoreboardResponse {
  events?: CollegeBaseballEvent[]
}

export interface FootballTeamInfo {
  rank?: number
  record?: string
  score?: number | string
  team: {
    name: string
  }
}

export interface FootballOdds {
  spread: string
  overUnder: string
}

export interface FootballGameStatus {
  completed: boolean
  shortDetail?: string
}

export interface FootballGame {
  id: string
  teams: {
    home: FootballTeamInfo
    away: FootballTeamInfo
  }
  status: FootballGameStatus
  venue?: {
    name?: string
  }
  broadcast?: string
  odds?: FootballOdds
}

export interface FootballScoreApiResponse {
  games?: FootballGame[]
}

export interface BasketballGameTeam {
  id: string
  name: string
  score: number
}

export interface BasketballGame {
  id: string
  home: BasketballGameTeam
  away: BasketballGameTeam
  status: string
  arena?: string
  network?: string
}

export interface BasketballScoreApiResponse {
  games?: BasketballGame[]
}
