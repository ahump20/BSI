"""College baseball analytics utilities for Diamond Pro insights."""

from __future__ import annotations

import json
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path
from typing import Any, Dict, Iterable, List

from datetime import datetime

ROOT_DIR = Path(__file__).resolve().parents[1]
SNAPSHOT_PATH = ROOT_DIR / "data" / "college-baseball" / "analytics" / "diamond_insights_snapshot.json"


@dataclass(frozen=True)
class RawTeamSnapshot:
    team_slug: str
    team_name: str
    bullpen_ip_last3: float
    high_leverage_pitches: int
    rest_days: int
    starter_times_through: float
    starter_pitch_count: int
    starter_pitch_efficiency: int
    late_inning_ops_allowed: float
    win_probability_added: float
    leverage_index: float
    last_update: str
    notes: List[str]

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "RawTeamSnapshot":
        return cls(
            team_slug=data["team_slug"],
            team_name=data["team_name"],
            bullpen_ip_last3=float(data["bullpen_ip_last3"]),
            high_leverage_pitches=int(data["high_leverage_pitches"]),
            rest_days=int(data["rest_days"]),
            starter_times_through=float(data["starter_times_through"]),
            starter_pitch_count=int(data["starter_pitch_count"]),
            starter_pitch_efficiency=int(data["starter_pitch_efficiency"]),
            late_inning_ops_allowed=float(data["late_inning_ops_allowed"]),
            win_probability_added=float(data["win_probability_added"]),
            leverage_index=float(data["leverage_index"]),
            last_update=data["last_update"],
            notes=list(data.get("notes", [])),
        )


@dataclass(frozen=True)
class RawGameSnapshot:
    game_id: str
    status: str
    venue: str
    conference: str
    teams: List[RawTeamSnapshot]

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "RawGameSnapshot":
        return cls(
            game_id=data["game_id"],
            status=data.get("status", "unknown"),
            venue=data.get("venue", ""),
            conference=data.get("conference", ""),
            teams=[RawTeamSnapshot.from_dict(team) for team in data.get("teams", [])],
        )


def _load_snapshot() -> Dict[str, Any]:
    if not SNAPSHOT_PATH.exists():
        raise FileNotFoundError(
            f"College baseball analytics snapshot missing at {SNAPSHOT_PATH}."
        )
    with SNAPSHOT_PATH.open("r", encoding="utf-8") as fh:
        return json.load(fh)


@lru_cache(maxsize=1)
def load_snapshot() -> Dict[str, Any]:
    """Load the cached Diamond Pro analytics snapshot from disk."""

    return _load_snapshot()


def refresh_snapshot() -> Dict[str, Any]:
    """Clear the cache and reload the analytics snapshot."""

    load_snapshot.cache_clear()
    return load_snapshot()


@dataclass(frozen=True)
class TeamAnalytics:
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
    pitching_plan: Dict[str, Any]
    updated_at: datetime
    raw: RawTeamSnapshot


@dataclass(frozen=True)
class GameAnalytics:
    game_id: str
    status: str
    venue: str
    conference: str
    generated_at: datetime
    teams: List[TeamAnalytics]


def _compute_bullpen_fatigue(raw: RawTeamSnapshot) -> float:
    workload_score = raw.bullpen_ip_last3 * 7.5 + raw.high_leverage_pitches * 0.45
    rest_modifier = max(0.0, 18 - raw.rest_days * 6)
    fatigue = workload_score + rest_modifier - 20
    return max(0.0, min(100.0, round(fatigue, 1)))


def _compute_bullpen_readiness(fatigue: float, raw: RawTeamSnapshot) -> float:
    readiness = 100 - fatigue + raw.rest_days * 4 + raw.starter_pitch_efficiency * 0.1
    return max(0.0, min(100.0, round(readiness, 1)))


def _compute_tto_penalty(raw: RawTeamSnapshot) -> float:
    over_threshold = max(0.0, raw.starter_times_through - 2.0)
    pitch_penalty = max(0.0, raw.starter_pitch_count - 85) * 0.015
    efficiency_bonus = (70 - raw.starter_pitch_efficiency) * 0.02
    penalty = (over_threshold * 0.45 + pitch_penalty + efficiency_bonus)
    return round(max(0.0, penalty), 2)


def _compute_leverage_pressure(raw: RawTeamSnapshot) -> float:
    leverage = (raw.leverage_index - 1.0) * 28
    high_leverage_load = raw.high_leverage_pitches * 0.2
    return max(0.0, min(100.0, round(leverage + high_leverage_load, 1)))


def _compute_contact_quality(raw: RawTeamSnapshot) -> float:
    late_ops = raw.late_inning_ops_allowed
    contact = (1 - late_ops) * 120
    return max(0.0, min(100.0, round(contact, 1)))


def _recommend_pitching_plan(raw: RawTeamSnapshot, fatigue: float, tto_penalty: float) -> Dict[str, Any]:
    hook_inning = "6th inning"
    if tto_penalty >= 0.6 or raw.starter_pitch_count >= 100:
        hook_inning = "5th inning"
    elif raw.starter_pitch_count <= 80 and fatigue < 45:
        hook_inning = "7th inning"

    leverage_focus = "Use leverage pairings in 7th-9th"
    if fatigue > 70:
        leverage_focus = "Shorten game with matchup specialists"
    elif fatigue < 40:
        leverage_focus = "Can extend starter; save closer"

    matchup_flags: List[str] = []
    if raw.win_probability_added < 0:
        matchup_flags.append("Chasing leverage after negative WPA stretch")
    if raw.rest_days == 0:
        matchup_flags.append("No rest - monitor velo and command")
    if raw.high_leverage_pitches > 85:
        matchup_flags.append("Limit back-end reliever usage >20 pitches")

    relief_queue = [
        "Matchup RHP", "Bridge Lefty", "Closer"
    ]
    if fatigue > 75:
        relief_queue = ["Freshman swingman", "Matchup RHP", "Closer (if <20 pitches)"]
    elif fatigue < 35:
        relief_queue = ["Setup RHP", "Closer", "Matchup lefty for pocket"]

    return {
        "hook_window": hook_inning,
        "leverage_focus": leverage_focus,
        "matchup_flags": matchup_flags,
        "relief_queue": relief_queue,
    }


def _craft_recommendation(fatigue: float, tto_penalty: float, leverage: float) -> str:
    if fatigue > 80:
        return "Emergency mode: stack fresh arms and keep starter on short leash."
    if tto_penalty > 1.0:
        return "Yank starter before third time through and leverage platoon bullpen."
    if leverage > 60:
        return "Expect high-stress innings; map matchups by pocket."
    if fatigue < 35 and tto_penalty < 0.4:
        return "Green light: extend starter and roll standard bullpen script."
    return "Monitor command and be ready with matchup reliever by 6th."


def _build_team_analytics(raw: RawTeamSnapshot) -> TeamAnalytics:
    fatigue = _compute_bullpen_fatigue(raw)
    readiness = _compute_bullpen_readiness(fatigue, raw)
    tto_penalty = _compute_tto_penalty(raw)
    leverage = _compute_leverage_pressure(raw)
    contact = _compute_contact_quality(raw)
    plan = _recommend_pitching_plan(raw, fatigue, tto_penalty)
    recommendation = _craft_recommendation(fatigue, tto_penalty, leverage)
    updated_at = datetime.fromisoformat(raw.last_update.replace("Z", "+00:00"))

    return TeamAnalytics(
        team_slug=raw.team_slug,
        team_name=raw.team_name,
        bullpen_fatigue_index=fatigue,
        bullpen_readiness=readiness,
        times_through_order_penalty=tto_penalty,
        leverage_pressure=leverage,
        contact_quality_index=contact,
        win_probability_added=round(raw.win_probability_added, 3),
        recommendation=recommendation,
        notes=raw.notes,
        pitching_plan=plan,
        updated_at=updated_at,
        raw=raw,
    )


def list_games() -> List[str]:
    snapshot = load_snapshot()
    games: Iterable[Dict[str, Any]] = snapshot.get("games", [])
    return [game.get("game_id") for game in games]


def load_game(game_id: str, refresh: bool = False) -> GameAnalytics | None:
    snapshot = refresh_snapshot() if refresh else load_snapshot()
    games: Iterable[Dict[str, Any]] = snapshot.get("games", [])
    for game_dict in games:
        if game_dict.get("game_id") == game_id:
            raw_game = RawGameSnapshot.from_dict(game_dict)
            teams = [_build_team_analytics(team) for team in raw_game.teams]
            generated_at = datetime.fromisoformat(
                snapshot.get("generated_at", datetime.utcnow().isoformat() + "Z").replace("Z", "+00:00")
            )
            return GameAnalytics(
                game_id=raw_game.game_id,
                status=raw_game.status,
                venue=raw_game.venue,
                conference=raw_game.conference,
                generated_at=generated_at,
                teams=teams,
            )
    return None


def load_team(team_slug: str, refresh: bool = False) -> TeamAnalytics | None:
    snapshot = refresh_snapshot() if refresh else load_snapshot()
    games: Iterable[Dict[str, Any]] = snapshot.get("games", [])
    for game_dict in games:
        raw_game = RawGameSnapshot.from_dict(game_dict)
        for team in raw_game.teams:
            if team.team_slug == team_slug:
                return _build_team_analytics(team)
    return None
