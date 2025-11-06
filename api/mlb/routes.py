"""MLB API routes for FastAPI."""

from datetime import datetime
from typing import Optional, List, Any, Dict
from fastapi import APIRouter, HTTPException, Query
import logging

from api.mlb.client import get_mlb_client
from api.mlb.schemas import (
    PlayerProfile,
    PlayerBio,
    PlayerStats,
    StatcastMetrics,
    LeaderboardResponse,
    LeaderboardEntry,
    TeamRoster,
    TeamStats,
    StandingsResponse,
    StandingsEntry,
    ScheduleResponse,
    GameInfo,
    GameBoxscore,
    PlayerSearchResponse,
    PlayerSearchResult,
    AdvancedMetrics,
    APIResponse,
    ErrorResponse,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/mlb", tags=["MLB Analytics"])


# Player Endpoints
@router.get("/players/search", response_model=PlayerSearchResponse)
async def search_players(
    first_name: Optional[str] = Query(None),
    last_name: Optional[str] = Query(None),
    fuzzy: bool = Query(False)
):
    """Search for players by name."""
    if not first_name and not last_name:
        raise HTTPException(status_code=400, detail="Must provide first_name or last_name")

    client = get_mlb_client()
    results = client.search_player(
        last_name=last_name or "",
        first_name=first_name or "",
        fuzzy=fuzzy
    )

    if not results:
        return PlayerSearchResponse(
            query=f"{first_name} {last_name}".strip(),
            results=[],
            total_count=0
        )

    # Convert results to PlayerSearchResult objects
    search_results = []
    if isinstance(results, dict):
        search_results.append(PlayerSearchResult(
            mlbam_id=results.get("key_mlbam", 0),
            name=f"{results.get('name_first', '')} {results.get('name_last', '')}".strip(),
            birth_date=results.get("birth_date"),
            position=results.get("mlb_pos"),
            active=True
        ))
    elif isinstance(results, list):
        for result in results:
            search_results.append(PlayerSearchResult(
                mlbam_id=result.get("key_mlbam", 0),
                name=f"{result.get('name_first', '')} {result.get('name_last', '')}".strip(),
                birth_date=result.get("birth_date"),
                position=result.get("mlb_pos"),
                active=True
            ))

    return PlayerSearchResponse(
        query=f"{first_name} {last_name}".strip(),
        results=search_results,
        total_count=len(search_results)
    )


@router.get("/players/{player_id}", response_model=PlayerProfile)
async def get_player_profile(
    player_id: int,
    season: int = Query(datetime.now().year)
):
    """Get complete player profile."""
    client = get_mlb_client()

    # Get player info
    player = client.get_player(mlbam_id=player_id)
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")

    # Load stats
    player.load_stats_for_season(season)

    # Build bio
    bio = PlayerBio(
        mlbam_id=player.mlbam_id,
        full_name=player.player_bio.full_name,
        first_name=player.player_bio.first_name,
        last_name=player.player_bio.last_name,
        birth_date=player.player_bio.birth_date,
        height=player.player_bio.height,
        weight=player.player_bio.weight,
        position=player.player_info.primary_position,
        bat_side=player.player_info.bat_side,
        throw_arm=player.player_info.throw_arm,
        team_name=player.current_team.name if player.current_team else None,
        team_id=player.current_team.mlb_id if player.current_team else None,
    )

    # Build stats
    stats_data = {}
    if player.player_stats is not None and not player.player_stats.empty:
        stats_data = player.player_stats.to_dict('records')[0] if len(player.player_stats) > 0 else {}

    season_stats = PlayerStats(
        player_id=player.mlbam_id,
        player_name=player.player_bio.full_name,
        season=season,
        team=player.current_team.name if player.current_team else None,
        games=stats_data.get('G', 0),
        stats=stats_data
    )

    return PlayerProfile(
        bio=bio,
        season_stats=season_stats,
        advanced_metrics={},
        splits=player.player_splits_stats if player.player_splits_stats else {}
    )


@router.get("/players/{player_id}/stats", response_model=PlayerStats)
async def get_player_stats(
    player_id: int,
    season: int = Query(datetime.now().year),
    stat_type: str = Query("batting", regex="^(batting|pitching)$")
):
    """Get player stats for a season."""
    client = get_mlb_client()

    stats_df = client.get_player_stats(player_id, season, stat_type)
    if stats_df is None or stats_df.empty:
        raise HTTPException(status_code=404, detail="Stats not found")

    # Get player info for name
    player = client.get_player(mlbam_id=player_id)
    player_name = player.player_bio.full_name if player else f"Player {player_id}"

    stats_data = stats_df.to_dict('records')[0] if len(stats_df) > 0 else {}

    return PlayerStats(
        player_id=player_id,
        player_name=player_name,
        season=season,
        team=stats_data.get('Team'),
        games=stats_data.get('G', 0),
        stats=stats_data
    )


@router.get("/players/{player_id}/statcast", response_model=StatcastMetrics)
async def get_player_statcast(
    player_id: int,
    start_date: str = Query(..., description="YYYY-MM-DD"),
    end_date: str = Query(..., description="YYYY-MM-DD"),
    is_pitcher: bool = Query(False)
):
    """Get Statcast metrics for a player."""
    client = get_mlb_client()

    statcast_df = client.get_statcast_data(player_id, start_date, end_date, is_pitcher)
    if statcast_df is None or statcast_df.empty:
        raise HTTPException(status_code=404, detail="Statcast data not found")

    # Get player info for name
    player = client.get_player(mlbam_id=player_id)
    player_name = player.player_bio.full_name if player else f"Player {player_id}"

    # Calculate aggregated metrics
    metrics_data = {}
    if not statcast_df.empty:
        if 'launch_speed' in statcast_df.columns:
            metrics_data['exit_velocity_avg'] = float(statcast_df['launch_speed'].mean())
        if 'launch_angle' in statcast_df.columns:
            metrics_data['launch_angle_avg'] = float(statcast_df['launch_angle'].mean())

    return StatcastMetrics(
        player_id=player_id,
        player_name=player_name,
        season=datetime.now().year,
        exit_velocity_avg=metrics_data.get('exit_velocity_avg'),
        launch_angle_avg=metrics_data.get('launch_angle_avg'),
        metrics=statcast_df.to_dict('records')
    )


# Leaderboard Endpoints
@router.get("/leaderboards/batting", response_model=LeaderboardResponse)
async def get_batting_leaderboard(
    season: int = Query(datetime.now().year),
    limit: int = Query(50, ge=1, le=500)
):
    """Get batting leaderboard."""
    client = get_mlb_client()

    leaderboard_data = client.get_batting_leaderboard(season, as_json=False)
    if leaderboard_data is None or leaderboard_data.empty:
        raise HTTPException(status_code=404, detail="Leaderboard not found")

    # Limit results
    leaderboard_df = leaderboard_data.head(limit)

    entries = []
    for idx, row in leaderboard_df.iterrows():
        entries.append(LeaderboardEntry(
            rank=idx + 1,
            player_id=int(row.get('mlbamid', 0)) if 'mlbamid' in row else 0,
            player_name=row.get('Name', ''),
            team=row.get('Team', ''),
            position=row.get('Pos', ''),
            stats=row.to_dict()
        ))

    return LeaderboardResponse(
        stat_type="batting",
        season=season,
        generated_at=datetime.now(),
        entries=entries,
        total_count=len(leaderboard_df)
    )


@router.get("/leaderboards/pitching", response_model=LeaderboardResponse)
async def get_pitching_leaderboard(
    season: int = Query(datetime.now().year),
    limit: int = Query(50, ge=1, le=500)
):
    """Get pitching leaderboard."""
    client = get_mlb_client()

    leaderboard_data = client.get_pitching_leaderboard(season, as_json=False)
    if leaderboard_data is None or leaderboard_data.empty:
        raise HTTPException(status_code=404, detail="Leaderboard not found")

    # Limit results
    leaderboard_df = leaderboard_data.head(limit)

    entries = []
    for idx, row in leaderboard_df.iterrows():
        entries.append(LeaderboardEntry(
            rank=idx + 1,
            player_id=int(row.get('mlbamid', 0)) if 'mlbamid' in row else 0,
            player_name=row.get('Name', ''),
            team=row.get('Team', ''),
            position='P',
            stats=row.to_dict()
        ))

    return LeaderboardResponse(
        stat_type="pitching",
        season=season,
        generated_at=datetime.now(),
        entries=entries,
        total_count=len(leaderboard_df)
    )


# Team Endpoints
@router.get("/teams/{team_id}/roster", response_model=TeamRoster)
async def get_team_roster(
    team_id: int,
    season: int = Query(datetime.now().year)
):
    """Get team roster."""
    client = get_mlb_client()

    roster_data = client.get_team_roster(team_id, season)
    if not roster_data:
        raise HTTPException(status_code=404, detail="Roster not found")

    return TeamRoster(
        team_id=team_id,
        team_name=f"Team {team_id}",  # TODO: Get actual team name
        season=season,
        players=roster_data
    )


@router.get("/standings", response_model=StandingsResponse)
async def get_standings(
    season: int = Query(datetime.now().year),
    league_ids: str = Query("103,104", description="103=AL, 104=NL")
):
    """Get MLB standings."""
    client = get_mlb_client()

    standings_df = client.get_standings(season, league_ids)
    if standings_df is None or standings_df.empty:
        raise HTTPException(status_code=404, detail="Standings not found")

    entries = []
    for _, row in standings_df.iterrows():
        entries.append(StandingsEntry(
            team_id=int(row.get('team_id', 0)),
            team_name=row.get('name', ''),
            wins=int(row.get('w', 0)),
            losses=int(row.get('l', 0)),
            win_pct=float(row.get('w_l_pct', 0.0)),
            games_back=float(row.get('gb', 0.0)) if 'gb' in row else None,
            division=row.get('division_name'),
            league=row.get('league_name')
        ))

    return StandingsResponse(
        season=season,
        generated_at=datetime.now(),
        standings=entries
    )


# Schedule Endpoints
@router.get("/schedule", response_model=ScheduleResponse)
async def get_schedule(
    start_date: str = Query(..., description="YYYY-MM-DD"),
    end_date: str = Query(..., description="YYYY-MM-DD")
):
    """Get game schedule for date range."""
    client = get_mlb_client()

    schedule_df = client.get_schedule(start_date, end_date)
    if schedule_df is None or schedule_df.empty:
        raise HTTPException(status_code=404, detail="Schedule not found")

    games = []
    for _, row in schedule_df.iterrows():
        games.append(GameInfo(
            game_pk=int(row.get('game_id', 0)),
            game_date=str(row.get('game_date', '')),
            game_time=str(row.get('game_time', '')),
            status=row.get('status', 'Unknown'),
            home_team=row.get('home_name', ''),
            away_team=row.get('away_name', ''),
            home_team_id=int(row.get('home_id', 0)),
            away_team_id=int(row.get('away_id', 0)),
            venue=row.get('venue_name'),
            home_score=int(row.get('home_score')) if 'home_score' in row and row.get('home_score') else None,
            away_score=int(row.get('away_score')) if 'away_score' in row and row.get('away_score') else None
        ))

    return ScheduleResponse(
        start_date=start_date,
        end_date=end_date,
        games=games
    )


@router.get("/games/{game_pk}/boxscore", response_model=GameBoxscore)
async def get_game_boxscore(game_pk: int):
    """Get game boxscore."""
    client = get_mlb_client()

    boxscore_data = client.get_game_boxscore(game_pk)
    if not boxscore_data:
        raise HTTPException(status_code=404, detail="Boxscore not found")

    return GameBoxscore(
        game_pk=game_pk,
        game_date=boxscore_data.get('gameDate', ''),
        home_team=boxscore_data.get('teams', {}).get('home', {}).get('team', {}).get('name', ''),
        away_team=boxscore_data.get('teams', {}).get('away', {}).get('team', {}).get('name', ''),
        home_score=boxscore_data.get('teams', {}).get('home', {}).get('teamStats', {}).get('batting', {}).get('runs', 0),
        away_score=boxscore_data.get('teams', {}).get('away', {}).get('teamStats', {}).get('batting', {}).get('runs', 0),
        inning=boxscore_data.get('linescore', {}).get('currentInning'),
        status=boxscore_data.get('status', {}).get('detailedState', 'Unknown'),
        batting_stats=boxscore_data.get('teams', {}).get('home', {}).get('teamStats', {}).get('batting'),
        pitching_stats=boxscore_data.get('teams', {}).get('home', {}).get('teamStats', {}).get('pitching')
    )


# Health check
@router.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "service": "MLB Analytics API", "timestamp": datetime.now()}
