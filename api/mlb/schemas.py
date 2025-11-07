"""Pydantic schemas for MLB API."""

from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


# Player Schemas
class PlayerBio(BaseModel):
    """Player biographical information."""
    mlbam_id: int
    full_name: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    birth_date: Optional[str] = None
    height: Optional[str] = None
    weight: Optional[int] = None
    position: Optional[str] = None
    bat_side: Optional[str] = None
    throw_arm: Optional[str] = None
    team_name: Optional[str] = None
    team_id: Optional[int] = None
    headshot_url: Optional[str] = None


class PlayerStats(BaseModel):
    """Player statistics."""
    player_id: int
    player_name: str
    season: int
    team: Optional[str] = None
    games: int = 0
    stats: Dict[str, Any] = Field(default_factory=dict)


class PlayerProfile(BaseModel):
    """Complete player profile."""
    bio: PlayerBio
    season_stats: Optional[PlayerStats] = None
    advanced_metrics: Optional[Dict[str, Any]] = None
    splits: Optional[Dict[str, Any]] = None


class StatcastMetrics(BaseModel):
    """Statcast metrics."""
    player_id: int
    player_name: str
    season: int
    exit_velocity_avg: Optional[float] = None
    launch_angle_avg: Optional[float] = None
    barrel_rate: Optional[float] = None
    hard_hit_rate: Optional[float] = None
    whiff_rate: Optional[float] = None
    chase_rate: Optional[float] = None
    metrics: Dict[str, Any] = Field(default_factory=dict)


# Leaderboard Schemas
class LeaderboardEntry(BaseModel):
    """Single leaderboard entry."""
    rank: int
    player_id: int
    player_name: str
    team: Optional[str] = None
    position: Optional[str] = None
    stats: Dict[str, Any]


class LeaderboardResponse(BaseModel):
    """Leaderboard response."""
    stat_type: str  # "batting" or "pitching"
    season: int
    generated_at: datetime
    entries: List[LeaderboardEntry]
    total_count: int


# Team Schemas
class TeamRoster(BaseModel):
    """Team roster."""
    team_id: int
    team_name: str
    season: int
    players: List[Dict[str, Any]]


class TeamStats(BaseModel):
    """Team statistics."""
    team_id: int
    team_name: str
    season: int
    record: Optional[Dict[str, int]] = None
    stats: Dict[str, Any] = Field(default_factory=dict)


class StandingsEntry(BaseModel):
    """Single standings entry."""
    team_id: int
    team_name: str
    wins: int
    losses: int
    win_pct: float
    games_back: Optional[float] = None
    division: Optional[str] = None
    league: Optional[str] = None


class StandingsResponse(BaseModel):
    """Standings response."""
    season: int
    generated_at: datetime
    standings: List[StandingsEntry]


# Schedule/Game Schemas
class GameInfo(BaseModel):
    """Game information."""
    game_pk: int
    game_date: str
    game_time: Optional[str] = None
    status: str
    home_team: str
    away_team: str
    home_team_id: int
    away_team_id: int
    venue: Optional[str] = None
    home_score: Optional[int] = None
    away_score: Optional[int] = None


class ScheduleResponse(BaseModel):
    """Schedule response."""
    start_date: str
    end_date: str
    games: List[GameInfo]


class GameBoxscore(BaseModel):
    """Game boxscore."""
    game_pk: int
    game_date: str
    home_team: str
    away_team: str
    home_score: int
    away_score: int
    inning: Optional[int] = None
    status: str
    batting_stats: Optional[Dict[str, Any]] = None
    pitching_stats: Optional[Dict[str, Any]] = None


# Visualization Schemas
class SprayChartData(BaseModel):
    """Spray chart data point."""
    hit_x: float
    hit_y: float
    exit_velocity: Optional[float] = None
    launch_angle: Optional[float] = None
    hit_type: Optional[str] = None
    outcome: Optional[str] = None


class PitchBreakPlot(BaseModel):
    """Pitch break plot data."""
    pitch_type: str
    horizontal_break: float
    induced_vertical_break: float
    velocity: float
    spin_rate: Optional[float] = None


class VelocityDistribution(BaseModel):
    """Velocity distribution data."""
    pitch_type: str
    velocities: List[float]
    avg_velocity: float
    max_velocity: float
    min_velocity: float


# Scouting Report Schemas
class ScoutingGrade(BaseModel):
    """Scouting grade."""
    category: str
    grade: float  # 20-80 scale
    description: Optional[str] = None


class ScoutingReport(BaseModel):
    """Player scouting report."""
    player_id: int
    player_name: str
    position: str
    season: int
    generated_at: datetime
    overall_grade: float
    grades: List[ScoutingGrade]
    strengths: List[str]
    weaknesses: List[str]
    summary: str


# Search Schemas
class PlayerSearchResult(BaseModel):
    """Player search result."""
    mlbam_id: int
    name: str
    birth_date: Optional[str] = None
    position: Optional[str] = None
    team: Optional[str] = None
    active: bool = True


class PlayerSearchResponse(BaseModel):
    """Player search response."""
    query: str
    results: List[PlayerSearchResult]
    total_count: int


# Advanced Analytics Schemas
class AdvancedMetrics(BaseModel):
    """Advanced player metrics."""
    player_id: int
    player_name: str
    season: int
    # Batting
    wOBA: Optional[float] = None
    wRC_plus: Optional[int] = None
    WAR: Optional[float] = None
    xwOBA: Optional[float] = None
    # Pitching
    FIP: Optional[float] = None
    xFIP: Optional[float] = None
    SIERA: Optional[float] = None
    K_pct: Optional[float] = None
    BB_pct: Optional[float] = None
    # Statcast
    avg_exit_velocity: Optional[float] = None
    avg_launch_angle: Optional[float] = None
    barrel_rate: Optional[float] = None
    hard_hit_rate: Optional[float] = None


class PlayerComparison(BaseModel):
    """Player comparison data."""
    player1: PlayerProfile
    player2: PlayerProfile
    comparison_metrics: Dict[str, Any]


# API Response Wrappers
class APIResponse(BaseModel):
    """Generic API response wrapper."""
    success: bool
    message: Optional[str] = None
    data: Optional[Any] = None
    timestamp: datetime = Field(default_factory=datetime.now)


class ErrorResponse(BaseModel):
    """Error response."""
    error: str
    detail: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.now)
