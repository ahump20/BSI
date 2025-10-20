"""FastAPI service exposing NIL valuations."""

from __future__ import annotations

from datetime import UTC, datetime
from typing import List

from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException

from api.cache import CacheClient
from api.schemas import AthleteValuationResponse, LeaderboardEntry, LeaderboardResponse, ValuationDriver
from bsi_nil.config import load_config
from models import repository

@asynccontextmanager
async def lifespan(_: FastAPI):
    """Ensure the backing database is ready before serving traffic."""
    repository.initialize_database()
    yield


app = FastAPI(title="Blaze Sports Intel NIL Valuations", version="1.0.0", lifespan=lifespan)
cache = CacheClient()
config = load_config()


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
