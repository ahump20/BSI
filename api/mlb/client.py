"""MLB Data Client wrapper for UnifiedDataClient."""

from typing import Optional, Dict, Any, List
import logging
from datetime import datetime, timedelta
import pandas as pd

from api.mlb_data_lab.apis.unified_data_client import UnifiedDataClient
from api.mlb_data_lab.player.player import Player
from api.mlb_data_lab.summary_sheets.batter_summary_sheet import BatterSummarySheet
from api.mlb_data_lab.summary_sheets.pitcher_summary_sheet import PitcherSummarySheet

logger = logging.getLogger(__name__)


class MLBDataClient:
    """Wrapper client for MLB data operations."""

    def __init__(self):
        """Initialize the MLB data client."""
        self.unified_client = UnifiedDataClient()

    # Player Operations
    def get_player(self, player_name: Optional[str] = None, mlbam_id: Optional[int] = None) -> Optional[Player]:
        """
        Get player object by name or MLBAM ID.

        Args:
            player_name: Full player name
            mlbam_id: MLB Advanced Media ID

        Returns:
            Player object or None
        """
        try:
            return Player.create_from_mlb(
                player_name=player_name,
                mlbam_id=mlbam_id,
                data_client=self.unified_client
            )
        except Exception as e:
            logger.error(f"Error getting player: {e}")
            return None

    def get_player_stats(
        self,
        mlbam_id: int,
        season: int,
        stat_type: str = "batting"
    ) -> Optional[pd.DataFrame]:
        """
        Get player stats for a season.

        Args:
            mlbam_id: MLB Advanced Media ID
            season: Season year
            stat_type: "batting" or "pitching"

        Returns:
            DataFrame with stats or None
        """
        try:
            return self.unified_client.fetch_player_stats(
                mlbam_id=mlbam_id,
                season=season,
                stat_type=stat_type
            )
        except Exception as e:
            logger.error(f"Error getting player stats: {e}")
            return None

    def get_player_splits(
        self,
        mlbam_id: int,
        season: int,
        is_pitcher: bool = False
    ) -> Optional[Dict[str, Any]]:
        """
        Get player split stats.

        Args:
            mlbam_id: MLB Advanced Media ID
            season: Season year
            is_pitcher: Whether player is a pitcher

        Returns:
            Dict with split stats or None
        """
        try:
            if is_pitcher:
                return self.unified_client.fetch_pitching_splits(
                    mlbam_id, season, sit_codes=['vr', 'vl', 'h', 'a']
                )
            else:
                return self.unified_client.fetch_batting_splits(
                    mlbam_id, season, sit_codes=['vr', 'vl', 'h', 'a']
                )
        except Exception as e:
            logger.error(f"Error getting player splits: {e}")
            return None

    def get_statcast_data(
        self,
        player_id: int,
        start_date: str,
        end_date: str,
        is_pitcher: bool = False
    ) -> Optional[pd.DataFrame]:
        """
        Get Statcast data for a player.

        Args:
            player_id: MLB player ID
            start_date: Start date (YYYY-MM-DD)
            end_date: End date (YYYY-MM-DD)
            is_pitcher: Whether player is a pitcher

        Returns:
            DataFrame with Statcast data or None
        """
        try:
            if is_pitcher:
                return self.unified_client.fetch_statcast_pitcher_data(
                    player_id, start_date, end_date
                )
            else:
                return self.unified_client.fetch_statcast_batter_data(
                    player_id, start_date, end_date
                )
        except Exception as e:
            logger.error(f"Error getting Statcast data: {e}")
            return None

    # Leaderboard Operations
    def get_batting_leaderboard(self, season: int, as_json: bool = True) -> Optional[Any]:
        """
        Get batting leaderboard for a season.

        Args:
            season: Season year
            as_json: Return as JSON instead of DataFrame

        Returns:
            Leaderboard data or None
        """
        try:
            return self.unified_client.fetch_batting_leaderboards(season, as_json=as_json)
        except Exception as e:
            logger.error(f"Error getting batting leaderboard: {e}")
            return None

    def get_pitching_leaderboard(self, season: int, as_json: bool = True) -> Optional[Any]:
        """
        Get pitching leaderboard for a season.

        Args:
            season: Season year
            as_json: Return as JSON instead of DataFrame

        Returns:
            Leaderboard data or None
        """
        try:
            return self.unified_client.fetch_pitching_leaderboards(season, as_json=as_json)
        except Exception as e:
            logger.error(f"Error getting pitching leaderboard: {e}")
            return None

    # Team Operations
    def get_team_roster(self, team_id: int, season: int) -> Optional[List[Dict[str, Any]]]:
        """
        Get team roster for a season.

        Args:
            team_id: MLB team ID
            season: Season year

        Returns:
            List of player dicts or None
        """
        try:
            return self.unified_client.fetch_full_season_roster(team_id, season)
        except Exception as e:
            logger.error(f"Error getting team roster: {e}")
            return None

    def get_team_stats(
        self,
        team_id: int,
        season: int,
        stat_type: str = "batting"
    ) -> Optional[pd.DataFrame]:
        """
        Get team stats for a season.

        Args:
            team_id: FanGraphs team ID
            season: Season year
            stat_type: "batting" or "pitching"

        Returns:
            DataFrame with stats or None
        """
        try:
            return self.unified_client.fetch_team_players(team_id, season)
        except Exception as e:
            logger.error(f"Error getting team stats: {e}")
            return None

    def get_standings(self, season: int, league_ids: str = "103,104") -> Optional[pd.DataFrame]:
        """
        Get MLB standings.

        Args:
            season: Season year
            league_ids: League IDs (103=AL, 104=NL)

        Returns:
            DataFrame with standings or None
        """
        try:
            return self.unified_client.fetch_standings_data(season, league_ids)
        except Exception as e:
            logger.error(f"Error getting standings: {e}")
            return None

    # Schedule Operations
    def get_schedule(
        self,
        start_date: str,
        end_date: str
    ) -> Optional[pd.DataFrame]:
        """
        Get schedule for a date range.

        Args:
            start_date: Start date (YYYY-MM-DD)
            end_date: End date (YYYY-MM-DD)

        Returns:
            DataFrame with schedule or None
        """
        try:
            return self.unified_client.fetch_schedule_for_date_range(start_date, end_date)
        except Exception as e:
            logger.error(f"Error getting schedule: {e}")
            return None

    def get_team_schedule(self, team_abbrev: str, season: int) -> Optional[pd.DataFrame]:
        """
        Get team schedule and record.

        Args:
            team_abbrev: Team abbreviation (e.g., 'NYY')
            season: Season year

        Returns:
            DataFrame with schedule and record or None
        """
        try:
            return self.unified_client.fetch_team_schedule_and_record(team_abbrev, season)
        except Exception as e:
            logger.error(f"Error getting team schedule: {e}")
            return None

    # Game Operations
    def get_game_data(self, game_pk: int) -> Optional[Dict[str, Any]]:
        """
        Get game data.

        Args:
            game_pk: Game primary key

        Returns:
            Game data dict or None
        """
        try:
            return self.unified_client.fetch_game_data(game_pk)
        except Exception as e:
            logger.error(f"Error getting game data: {e}")
            return None

    def get_game_boxscore(self, game_pk: int) -> Optional[Dict[str, Any]]:
        """
        Get game boxscore.

        Args:
            game_pk: Game primary key

        Returns:
            Boxscore data dict or None
        """
        try:
            return self.unified_client.fetch_game_boxscore_data(game_pk)
        except Exception as e:
            logger.error(f"Error getting game boxscore: {e}")
            return None

    # Summary Sheet Operations
    def generate_batter_summary(
        self,
        player_name: Optional[str] = None,
        mlbam_id: Optional[int] = None,
        season: int = datetime.now().year
    ) -> Optional[bytes]:
        """
        Generate batter summary sheet as PNG.

        Args:
            player_name: Full player name
            mlbam_id: MLB Advanced Media ID
            season: Season year

        Returns:
            PNG image bytes or None
        """
        try:
            player = self.get_player(player_name=player_name, mlbam_id=mlbam_id)
            if not player:
                return None

            player.load_stats_for_season(season)

            # Get date range for Statcast
            start_date = f"{season}-03-01"
            end_date = f"{season}-11-30"
            player.load_statcast_data(start_date, end_date)

            sheet = BatterSummarySheet(player, season)
            # Generate and return image bytes
            # Note: This would need implementation in the summary sheet class
            return None  # Placeholder
        except Exception as e:
            logger.error(f"Error generating batter summary: {e}")
            return None

    def generate_pitcher_summary(
        self,
        player_name: Optional[str] = None,
        mlbam_id: Optional[int] = None,
        season: int = datetime.now().year
    ) -> Optional[bytes]:
        """
        Generate pitcher summary sheet as PNG.

        Args:
            player_name: Full player name
            mlbam_id: MLB Advanced Media ID
            season: Season year

        Returns:
            PNG image bytes or None
        """
        try:
            player = self.get_player(player_name=player_name, mlbam_id=mlbam_id)
            if not player:
                return None

            player.load_stats_for_season(season)

            # Get date range for Statcast
            start_date = f"{season}-03-01"
            end_date = f"{season}-11-30"
            player.load_statcast_data(start_date, end_date)

            sheet = PitcherSummarySheet(player, season)
            # Generate and return image bytes
            # Note: This would need implementation in the summary sheet class
            return None  # Placeholder
        except Exception as e:
            logger.error(f"Error generating pitcher summary: {e}")
            return None

    # Search Operations
    def search_player(
        self,
        last_name: str,
        first_name: str,
        fuzzy: bool = False
    ) -> Optional[List[Dict[str, Any]]]:
        """
        Search for a player.

        Args:
            last_name: Player last name
            first_name: Player first name
            fuzzy: Use fuzzy matching

        Returns:
            List of matching players or None
        """
        try:
            return self.unified_client.lookup_player(last_name, first_name, fuzzy=fuzzy)
        except Exception as e:
            logger.error(f"Error searching player: {e}")
            return None

    def get_player_by_id(self, player_id: int) -> Optional[Dict[str, Any]]:
        """
        Get player info by ID.

        Args:
            player_id: MLB player ID

        Returns:
            Player info dict or None
        """
        try:
            return self.unified_client.lookup_player_by_id(player_id)
        except Exception as e:
            logger.error(f"Error getting player by ID: {e}")
            return None


# Singleton instance
_mlb_client = None


def get_mlb_client() -> MLBDataClient:
    """Get or create the singleton MLB client instance."""
    global _mlb_client
    if _mlb_client is None:
        _mlb_client = MLBDataClient()
    return _mlb_client
