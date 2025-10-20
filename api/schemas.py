"""Pydantic schemas for FastAPI responses."""

from __future__ import annotations

from datetime import datetime
from typing import Dict, List, Union

from pydantic import BaseModel, Field


class ValuationDriver(BaseModel):
    attention_score: float = Field(..., description="Model attention score")
    performance_index: float = Field(..., description="Model performance index")


class AthleteValuationResponse(BaseModel):
    athlete_id: str
    name: str
    sport: str
    school: str
    as_of: datetime
    nil_value: float
    confidence_lower: float
    confidence_upper: float
    drivers: ValuationDriver
    disclaimer: str


class LeaderboardEntry(BaseModel):
    rank: int
    athlete_id: str
    name: str
    sport: str
    school: str
    nil_value: float
    trend: float


class LeaderboardResponse(BaseModel):
    generated_at: datetime
    results: List[LeaderboardEntry]
    disclaimer: str


class BaseballPitchingPlan(BaseModel):
    hook_window: str
    leverage_focus: str
    matchup_flags: List[str]
    relief_queue: List[str]


class BaseballTeamAnalytics(BaseModel):
    team_slug: str
    team_name: str
    bullpen_fatigue_index: float
    bullpen_readiness: float
    times_through_order_penalty: float
    leverage_pressure: float
    contact_quality_index: float
    win_probability_added: float
    recommendation: str
    notes: List[str]
    pitching_plan: BaseballPitchingPlan
    updated_at: datetime
    raw_metrics: Dict[str, Union[str, float, int, List[str]]]


class BaseballGameAnalyticsResponse(BaseModel):
    game_id: str
    status: str
    venue: str
    conference: str
    generated_at: datetime
    teams: List[BaseballTeamAnalytics]


class BaseballGameListEntry(BaseModel):
    game_id: str
    status: str
    venue: str
    conference: str


class BaseballGameListResponse(BaseModel):
    generated_at: datetime
    games: List[BaseballGameListEntry]
