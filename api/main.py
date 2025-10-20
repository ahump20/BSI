"""FastAPI service exposing NIL valuations."""

from __future__ import annotations

from datetime import UTC, datetime
from typing import List

from fastapi import FastAPI, HTTPException

from api.cache import CacheClient
from api.schemas import (
    AthleteValuationResponse,
    BaseballGameAnalyticsResponse,
    BaseballGameListEntry,
    BaseballGameListResponse,
    BaseballPitchingPlan,
    BaseballTeamAnalytics,
    LeaderboardEntry,
    LeaderboardResponse,
    ValuationDriver,
)
from bsi_nil.config import load_config
from models import baseball_analytics, repository

app = FastAPI(title="Blaze Sports Intel NIL Valuations", version="1.0.0")
cache = CacheClient()
config = load_config()


@app.on_event("startup")
def on_startup() -> None:
    repository.initialize_database()


@app.get("/athlete/{athlete_id}/value", response_model=AthleteValuationResponse)
def get_athlete_value(athlete_id: str) -> AthleteValuationResponse:
    cache_key = f"athlete:{athlete_id}"
    cached = cache.get(cache_key)
    if cached:
        return AthleteValuationResponse(**cached)

    valuation = repository.fetch_athlete_valuation(athlete_id)
    if valuation is None:
        raise HTTPException(status_code=404, detail="Athlete not found")

    response = AthleteValuationResponse(
        athlete_id=valuation["athlete_id"],
        name=valuation["name"],
        sport=valuation["sport"],
        school=valuation["school"],
        as_of=valuation["as_of"],
        nil_value=valuation["nil_value"],
        confidence_lower=valuation["confidence_lower"],
        confidence_upper=valuation["confidence_upper"],
        drivers=ValuationDriver(
            attention_score=valuation["attention_score"],
            performance_index=valuation["performance_index"],
        ),
        disclaimer=config["project"]["disclaimer"],
    )
    cache.set(cache_key, response.model_dump())
    return response


def _serialize_pitching_plan(plan: dict) -> BaseballPitchingPlan:
    return BaseballPitchingPlan(
        hook_window=plan.get("hook_window", ""),
        leverage_focus=plan.get("leverage_focus", ""),
        matchup_flags=list(plan.get("matchup_flags", [])),
        relief_queue=list(plan.get("relief_queue", [])),
    )


def _serialize_team(team: baseball_analytics.TeamAnalytics) -> BaseballTeamAnalytics:
    raw = team.raw
    raw_metrics = {
        "bullpen_ip_last3": raw.bullpen_ip_last3,
        "high_leverage_pitches": raw.high_leverage_pitches,
        "rest_days": raw.rest_days,
        "starter_times_through": raw.starter_times_through,
        "starter_pitch_count": raw.starter_pitch_count,
        "starter_pitch_efficiency": raw.starter_pitch_efficiency,
        "late_inning_ops_allowed": raw.late_inning_ops_allowed,
        "win_probability_added": raw.win_probability_added,
        "leverage_index": raw.leverage_index,
        "notes": raw.notes,
    }
    return BaseballTeamAnalytics(
        team_slug=team.team_slug,
        team_name=team.team_name,
        bullpen_fatigue_index=team.bullpen_fatigue_index,
        bullpen_readiness=team.bullpen_readiness,
        times_through_order_penalty=team.times_through_order_penalty,
        leverage_pressure=team.leverage_pressure,
        contact_quality_index=team.contact_quality_index,
        win_probability_added=team.win_probability_added,
        recommendation=team.recommendation,
        notes=team.notes,
        pitching_plan=_serialize_pitching_plan(team.pitching_plan),
        updated_at=team.updated_at,
        raw_metrics=raw_metrics,
    )


def _serialize_game(game: baseball_analytics.GameAnalytics) -> BaseballGameAnalyticsResponse:
    return BaseballGameAnalyticsResponse(
        game_id=game.game_id,
        status=game.status,
        venue=game.venue,
        conference=game.conference,
        generated_at=game.generated_at,
        teams=[_serialize_team(team) for team in game.teams],
    )


@app.get("/analytics/baseball/games", response_model=BaseballGameListResponse)
def list_baseball_games() -> BaseballGameListResponse:
    cache_key = "baseball:games:list"
    cached = cache.get(cache_key)
    if cached:
        return BaseballGameListResponse(**cached)

    snapshot = baseball_analytics.load_snapshot()
    generated_at_raw = snapshot.get("generated_at", datetime.now(UTC).isoformat())
    generated_at = datetime.fromisoformat(generated_at_raw.replace("Z", "+00:00"))
    games = [
        BaseballGameListEntry(
            game_id=game.get("game_id", ""),
            status=game.get("status", "unknown"),
            venue=game.get("venue", ""),
            conference=game.get("conference", ""),
        )
        for game in snapshot.get("games", [])
        if game.get("game_id")
    ]

    response = BaseballGameListResponse(generated_at=generated_at, games=games)
    cache.set(cache_key, response.model_dump())
    return response


@app.get("/analytics/baseball/games/{game_id}", response_model=BaseballGameAnalyticsResponse)
def get_baseball_game(game_id: str, refresh: bool = False) -> BaseballGameAnalyticsResponse:
    cache_key = f"baseball:game:{game_id}:{int(refresh)}"
    cached = cache.get(cache_key)
    if cached and not refresh:
        return BaseballGameAnalyticsResponse(**cached)

    game = baseball_analytics.load_game(game_id, refresh=refresh)
    if game is None:
        raise HTTPException(status_code=404, detail="Game analytics not found")

    response = _serialize_game(game)
    cache.set(cache_key, response.model_dump())
    return response


@app.get("/analytics/baseball/teams/{team_slug}", response_model=BaseballTeamAnalytics)
def get_baseball_team(team_slug: str, refresh: bool = False) -> BaseballTeamAnalytics:
    cache_key = f"baseball:team:{team_slug}:{int(refresh)}"
    cached = cache.get(cache_key)
    if cached and not refresh:
        return BaseballTeamAnalytics(**cached)

    team = baseball_analytics.load_team(team_slug, refresh=refresh)
    if team is None:
        raise HTTPException(status_code=404, detail="Team analytics not found")

    response = _serialize_team(team)
    cache.set(cache_key, response.model_dump())
    return response


@app.get("/leaderboard", response_model=LeaderboardResponse)
def get_leaderboard(limit: int = 100) -> LeaderboardResponse:
    cache_key = f"leaderboard:{limit}"
    cached = cache.get(cache_key)
    if cached:
        return LeaderboardResponse(**cached)

    leaderboard_rows = repository.fetch_leaderboard(limit=limit)
    if not leaderboard_rows:
        raise HTTPException(status_code=404, detail="Leaderboard unavailable")

    results: List[LeaderboardEntry] = []
    baseline = leaderboard_rows[0]["nil_value"] if leaderboard_rows else 0
    for idx, row in enumerate(leaderboard_rows, start=1):
        trend = (row["nil_value"] - baseline) / baseline if baseline else 0.0
        results.append(
            LeaderboardEntry(
                rank=idx,
                athlete_id=row["athlete_id"],
                name=row["name"],
                sport=row["sport"],
                school=row["school"],
                nil_value=row["nil_value"],
                trend=trend,
            )
        )

    response = LeaderboardResponse(
        generated_at=datetime.now(UTC),
        results=results,
        disclaimer=config["project"]["disclaimer"],
    )
    cache.set(cache_key, response.model_dump())
    return response
