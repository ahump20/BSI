"""Persistence helpers for loading data into the warehouse."""

from __future__ import annotations

from datetime import datetime
from typing import Iterable, Sequence

import pandas as pd
from sqlalchemy import delete, tuple_

from .database import get_engine, session_scope
from .schema import (
    Athlete,
    AthleteFeature,
    AthleteValuation,
    Base,
    BoxScore,
    SearchInterest,
    SocialStat,
)


def initialize_database() -> None:
    """Create database tables if they do not yet exist."""

    engine = get_engine()
    Base.metadata.create_all(engine)


def upsert_athletes(df: pd.DataFrame) -> None:
    records = df.to_dict(orient="records")
    with session_scope() as session:
        for record in records:
            athlete = session.get(Athlete, record["athlete_id"])
            if athlete is None:
                athlete = Athlete(**record)
                session.add(athlete)
            else:
                for key, value in record.items():
                    setattr(athlete, key, value)


def _bulk_replace(
    session,
    model: type[Base],
    frame: pd.DataFrame,
    key_fields: Sequence[str],
) -> None:
    """Replace rows matching the provided keys with the given frame."""

    if frame.empty:
        return

    keys = tuple(key_fields)
    key_columns = frame.loc[:, keys]
    if key_columns.empty:
        return

    values = list(dict.fromkeys(key_columns.itertuples(index=False, name=None)))
    if values:
        stmt = delete(model).where(
            tuple_(*(getattr(model, key) for key in keys)).in_(values)
        )
        session.execute(stmt)

    session.bulk_insert_mappings(model, frame.to_dict(orient="records"))


def load_box_scores(df: pd.DataFrame) -> None:
    with session_scope() as session:
        _bulk_replace(session, BoxScore, df, ("athlete_id", "game_date", "opponent"))


def load_social_stats(df: pd.DataFrame) -> None:
    with session_scope() as session:
        payload = df.rename(columns={"date": "stat_date"})
        _bulk_replace(
            session,
            SocialStat,
            payload,
            ("athlete_id", "channel", "stat_date"),
        )


def load_search_interest(df: pd.DataFrame) -> None:
    with session_scope() as session:
        payload = df.rename(columns={"date": "stat_date"})
        _bulk_replace(
            session,
            SearchInterest,
            payload,
            ("athlete_id", "stat_date"),
        )


def store_features(df: pd.DataFrame) -> None:
    with session_scope() as session:
        _bulk_replace(
            session,
            AthleteFeature,
            df,
            ("athlete_id", "as_of"),
        )


def store_valuations(df: pd.DataFrame) -> None:
    with session_scope() as session:
        _bulk_replace(
            session,
            AthleteValuation,
            df,
            ("athlete_id", "as_of"),
        )


def fetch_leaderboard(limit: int = 100) -> list[dict]:
    with session_scope() as session:
        rows = (
            session.query(AthleteValuation, Athlete)
            .join(Athlete, AthleteValuation.athlete_id == Athlete.athlete_id)
            .order_by(AthleteValuation.nil_value.desc())
            .limit(limit)
            .all()
        )
        results: list[dict] = []
        for valuation, athlete in rows:
            results.append(
                {
                    "athlete_id": athlete.athlete_id,
                    "name": athlete.name,
                    "sport": athlete.sport,
                    "school": athlete.school,
                    "nil_value": float(valuation.nil_value),
                    "as_of": valuation.as_of,
                    "attention_score": valuation.attention_score,
                    "performance_index": valuation.performance_index,
                }
            )
        return results


def fetch_athlete_valuation(athlete_id: str) -> dict | None:
    with session_scope() as session:
        row = (
            session.query(AthleteValuation, Athlete)
            .join(Athlete, AthleteValuation.athlete_id == Athlete.athlete_id)
            .filter(AthleteValuation.athlete_id == athlete_id)
            .order_by(AthleteValuation.as_of.desc())
            .first()
        )
        if row is None:
            return None
        valuation, athlete = row
        return {
            "athlete_id": athlete.athlete_id,
            "name": athlete.name,
            "sport": athlete.sport,
            "school": athlete.school,
            "as_of": valuation.as_of,
            "nil_value": float(valuation.nil_value),
            "confidence_lower": float(valuation.confidence_lower),
            "confidence_upper": float(valuation.confidence_upper),
            "attention_score": valuation.attention_score,
            "performance_index": valuation.performance_index,
        }


def fetch_athlete_features(athlete_id: str) -> list[dict]:
    with session_scope() as session:
        rows = (
            session.query(AthleteFeature)
            .filter(AthleteFeature.athlete_id == athlete_id)
            .order_by(AthleteFeature.as_of.desc())
            .all()
        )
        return [
            {
                "athlete_id": row.athlete_id,
                "as_of": row.as_of,
                "attention_score": row.attention_score,
                "performance_index": row.performance_index,
            }
            for row in rows
        ]
