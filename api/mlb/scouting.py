"""Scouting report generation for MLB players."""

from typing import Dict, Any, List, Optional
from datetime import datetime
import pandas as pd
import logging

from api.mlb.client import MLBDataClient

logger = logging.getLogger(__name__)


class ScoutingReportGenerator:
    """Generate automated scouting reports for MLB players."""

    def __init__(self, client: MLBDataClient):
        self.client = client

    def generate_batter_report(
        self,
        player_id: int,
        season: int = datetime.now().year
    ) -> Dict[str, Any]:
        """
        Generate scouting report for a batter.

        Args:
            player_id: MLB player ID
            season: Season year

        Returns:
            Scouting report dict
        """
        try:
            # Get player and stats
            player = self.client.get_player(mlbam_id=player_id)
            if not player:
                return {"error": "Player not found"}

            player.load_stats_for_season(season)

            # Get Statcast data
            start_date = f"{season}-03-01"
            end_date = f"{season}-11-30"
            player.load_statcast_data(start_date, end_date)

            # Generate report sections
            report = {
                "player_id": player_id,
                "player_name": player.player_bio.full_name,
                "position": player.player_info.primary_position,
                "team": player.current_team.name if player.current_team else None,
                "season": season,
                "generated_at": datetime.now().isoformat(),
                "overall_grade": self._calculate_overall_grade_batter(player),
                "tool_grades": self._grade_batter_tools(player),
                "strengths": self._identify_batter_strengths(player),
                "weaknesses": self._identify_batter_weaknesses(player),
                "summary": self._generate_batter_summary(player),
                "recommendations": self._generate_batter_recommendations(player),
                "comparable_players": [],  # TODO: Implement player comparisons
            }

            return report

        except Exception as e:
            logger.error(f"Error generating batter report: {e}")
            return {"error": str(e)}

    def generate_pitcher_report(
        self,
        player_id: int,
        season: int = datetime.now().year
    ) -> Dict[str, Any]:
        """
        Generate scouting report for a pitcher.

        Args:
            player_id: MLB player ID
            season: Season year

        Returns:
            Scouting report dict
        """
        try:
            # Get player and stats
            player = self.client.get_player(mlbam_id=player_id)
            if not player:
                return {"error": "Player not found"}

            player.load_stats_for_season(season)

            # Get Statcast data
            start_date = f"{season}-03-01"
            end_date = f"{season}-11-30"
            player.load_statcast_data(start_date, end_date)

            # Generate report sections
            report = {
                "player_id": player_id,
                "player_name": player.player_bio.full_name,
                "position": "P",
                "team": player.current_team.name if player.current_team else None,
                "season": season,
                "generated_at": datetime.now().isoformat(),
                "overall_grade": self._calculate_overall_grade_pitcher(player),
                "pitch_grades": self._grade_pitcher_pitches(player),
                "strengths": self._identify_pitcher_strengths(player),
                "weaknesses": self._identify_pitcher_weaknesses(player),
                "summary": self._generate_pitcher_summary(player),
                "recommendations": self._generate_pitcher_recommendations(player),
                "comparable_players": [],  # TODO: Implement player comparisons
            }

            return report

        except Exception as e:
            logger.error(f"Error generating pitcher report: {e}")
            return {"error": str(e)}

    def _calculate_overall_grade_batter(self, player: Any) -> float:
        """Calculate overall scouting grade for batter (20-80 scale)."""
        if player.player_stats is None or player.player_stats.empty:
            return 50.0

        stats = player.player_stats.iloc[0]

        # Use wRC+ as primary indicator (100 = league average = 50 grade)
        wrc_plus = stats.get('wRC+', 100)
        base_grade = 30 + (wrc_plus / 100) * 20  # Maps 0-200 wRC+ to 30-70 grade

        # Adjust for other factors
        war = stats.get('WAR', 0)
        if war > 5:
            base_grade += 5
        elif war > 3:
            base_grade += 3
        elif war < 0:
            base_grade -= 5

        # Cap at 80, floor at 20
        return max(20, min(80, base_grade))

    def _calculate_overall_grade_pitcher(self, player: Any) -> float:
        """Calculate overall scouting grade for pitcher (20-80 scale)."""
        if player.player_stats is None or player.player_stats.empty:
            return 50.0

        stats = player.player_stats.iloc[0]

        # Use FIP- as primary indicator (100 = league average = 50 grade)
        fip_minus = stats.get('FIP-', 100)
        # Lower FIP- is better, so invert
        base_grade = 30 + (200 - fip_minus) / 100 * 20

        # Adjust for WAR
        war = stats.get('WAR', 0)
        if war > 5:
            base_grade += 5
        elif war > 3:
            base_grade += 3
        elif war < 0:
            base_grade -= 5

        # Cap at 80, floor at 20
        return max(20, min(80, base_grade))

    def _grade_batter_tools(self, player: Any) -> Dict[str, float]:
        """Grade batter's 5 tools (20-80 scale)."""
        if player.player_stats is None or player.player_stats.empty:
            return {}

        stats = player.player_stats.iloc[0]
        statcast = player.statcast_data

        tools = {}

        # Hit Tool (AVG, K%)
        avg = stats.get('AVG', 0.250)
        k_pct = stats.get('K%', 20)
        tools['hit'] = max(20, min(80, 50 + (avg - 0.250) * 200 - (k_pct - 20)))

        # Power Tool (HR, ISO)
        hr = stats.get('HR', 0)
        iso = stats.get('ISO', 0.150)
        tools['power'] = max(20, min(80, 40 + hr + (iso - 0.150) * 100))

        # Speed Tool (SB, Sprint Speed from Statcast)
        sb = stats.get('SB', 0)
        tools['speed'] = max(20, min(80, 40 + sb * 2))

        # Fielding Tool (position-dependent, use UZR if available)
        tools['fielding'] = 50  # Default to average

        # Arm Tool (position-dependent)
        position = player.player_info.primary_position
        if position in ['C', 'SS', '3B', 'RF']:
            tools['arm'] = 55  # Positions requiring strong arm
        else:
            tools['arm'] = 50

        return tools

    def _grade_pitcher_pitches(self, player: Any) -> Dict[str, float]:
        """Grade pitcher's individual pitches (20-80 scale)."""
        # This would require Statcast pitch data
        # For now, return empty dict
        return {}

    def _identify_batter_strengths(self, player: Any) -> List[str]:
        """Identify batter's strengths."""
        if player.player_stats is None or player.player_stats.empty:
            return ["Insufficient data"]

        stats = player.player_stats.iloc[0]
        strengths = []

        # Power
        if stats.get('ISO', 0) > 0.200:
            strengths.append("Elite power hitter with high isolated power")
        if stats.get('HR', 0) > 30:
            strengths.append("Consistent home run threat")

        # Plate discipline
        if stats.get('BB%', 0) > 12:
            strengths.append("Excellent plate discipline and walk rate")
        if stats.get('K%', 0) < 18:
            strengths.append("Exceptional contact skills with low strikeout rate")

        # Overall hitting
        if stats.get('wRC+', 100) > 130:
            strengths.append("Well-above-average overall offensive production")
        if stats.get('OBP', 0) > 0.360:
            strengths.append("Strong on-base ability")

        # Speed
        if stats.get('SB', 0) > 20:
            strengths.append("Above-average speed and base-stealing threat")

        # Advanced metrics
        if stats.get('WAR', 0) > 5:
            strengths.append("Elite overall value and production")

        return strengths if strengths else ["Solid fundamentals across all areas"]

    def _identify_batter_weaknesses(self, player: Any) -> List[str]:
        """Identify batter's weaknesses."""
        if player.player_stats is None or player.player_stats.empty:
            return ["Insufficient data"]

        stats = player.player_stats.iloc[0]
        weaknesses = []

        # Strikeouts
        if stats.get('K%', 0) > 28:
            weaknesses.append("High strikeout rate limits offensive ceiling")

        # Contact
        if stats.get('AVG', 0) < 0.230:
            weaknesses.append("Low batting average indicates contact issues")

        # Power
        if stats.get('ISO', 0) < 0.120:
            weaknesses.append("Limited power production")

        # Plate discipline
        if stats.get('BB%', 0) < 6:
            weaknesses.append("Lack of plate discipline, rarely walks")

        # Overall production
        if stats.get('wRC+', 100) < 85:
            weaknesses.append("Below-average overall offensive contribution")

        # Check splits for platoon weakness
        if player.player_splits_stats:
            # TODO: Parse split stats and identify platoon issues
            pass

        return weaknesses if weaknesses else ["No significant weaknesses identified"]

    def _identify_pitcher_strengths(self, player: Any) -> List[str]:
        """Identify pitcher's strengths."""
        if player.player_stats is None or player.player_stats.empty:
            return ["Insufficient data"]

        stats = player.player_stats.iloc[0]
        strengths = []

        # Strikeouts
        if stats.get('K%', 0) > 28:
            strengths.append("Elite strikeout ability, misses bats consistently")
        if stats.get('K/9', 0) > 10:
            strengths.append("High strikeout rate per nine innings")

        # Control
        if stats.get('BB%', 0) < 6:
            strengths.append("Excellent command and control")
        if stats.get('BB/9', 0) < 2.0:
            strengths.append("Rarely walks batters")

        # Results
        if stats.get('ERA', 5.00) < 3.00:
            strengths.append("Outstanding earned run average")
        if stats.get('FIP', 5.00) < 3.20:
            strengths.append("Elite peripheral statistics")

        # Efficiency
        if stats.get('WHIP', 1.50) < 1.10:
            strengths.append("Limits baserunners effectively")

        # Overall
        if stats.get('WAR', 0) > 4:
            strengths.append("Elite overall value and impact")

        return strengths if strengths else ["Solid fundamentals across all areas"]

    def _identify_pitcher_weaknesses(self, player: Any) -> List[str]:
        """Identify pitcher's weaknesses."""
        if player.player_stats is None or player.player_stats.empty:
            return ["Insufficient data"]

        stats = player.player_stats.iloc[0]
        weaknesses = []

        # Control issues
        if stats.get('BB%', 0) > 10:
            weaknesses.append("Control issues lead to too many walks")
        if stats.get('BB/9', 0) > 4.0:
            weaknesses.append("High walk rate per nine innings")

        # Home runs
        if stats.get('HR/9', 0) > 1.5:
            weaknesses.append("Susceptible to home runs")

        # Lack of strikeouts
        if stats.get('K%', 0) < 18:
            weaknesses.append("Below-average strikeout rate")

        # Results
        if stats.get('ERA', 3.00) > 5.00:
            weaknesses.append("High earned run average")
        if stats.get('FIP', 3.00) > 5.00:
            weaknesses.append("Poor peripheral statistics")

        return weaknesses if weaknesses else ["No significant weaknesses identified"]

    def _generate_batter_summary(self, player: Any) -> str:
        """Generate executive summary for batter."""
        name = player.player_bio.full_name
        position = player.player_info.primary_position
        team = player.current_team.name if player.current_team else "Free Agent"

        if player.player_stats is None or player.player_stats.empty:
            return f"{name} is a {position} for the {team}. Insufficient data for detailed analysis."

        stats = player.player_stats.iloc[0]
        wrc_plus = stats.get('wRC+', 100)
        war = stats.get('WAR', 0)

        if wrc_plus > 130:
            tier = "elite"
        elif wrc_plus > 110:
            tier = "above-average"
        elif wrc_plus > 90:
            tier = "average"
        else:
            tier = "below-average"

        summary = f"{name} is a {tier} {position} for the {team}. "

        if war > 5:
            summary += f"With {war:.1f} WAR, he has been one of the most valuable players in baseball. "
        elif war > 3:
            summary += f"With {war:.1f} WAR, he has provided solid value. "

        summary += f"His {wrc_plus} wRC+ indicates {tier} offensive production. "

        # Add key stat highlights
        hr = stats.get('HR', 0)
        if hr > 30:
            summary += f"Hit {hr} home runs, showcasing significant power. "

        return summary

    def _generate_pitcher_summary(self, player: Any) -> str:
        """Generate executive summary for pitcher."""
        name = player.player_bio.full_name
        team = player.current_team.name if player.current_team else "Free Agent"

        if player.player_stats is None or player.player_stats.empty:
            return f"{name} is a pitcher for the {team}. Insufficient data for detailed analysis."

        stats = player.player_stats.iloc[0]
        era = stats.get('ERA', 5.00)
        fip = stats.get('FIP', 5.00)
        war = stats.get('WAR', 0)

        if era < 3.00:
            tier = "elite"
        elif era < 4.00:
            tier = "above-average"
        elif era < 4.50:
            tier = "average"
        else:
            tier = "below-average"

        summary = f"{name} is a {tier} pitcher for the {team}. "

        if war > 4:
            summary += f"With {war:.1f} WAR, he has been one of the most valuable pitchers. "

        summary += f"Posted a {era:.2f} ERA and {fip:.2f} FIP, indicating {tier} performance. "

        # Strikeout rate
        k_pct = stats.get('K%', 20)
        if k_pct > 28:
            summary += f"Misses bats at an elite {k_pct:.1f}% rate. "
        elif k_pct > 23:
            summary += f"Above-average strikeout rate at {k_pct:.1f}%. "

        return summary

    def _generate_batter_recommendations(self, player: Any) -> List[str]:
        """Generate recommendations for utilizing batter."""
        if player.player_stats is None or player.player_stats.empty:
            return ["Insufficient data for recommendations"]

        stats = player.player_stats.iloc[0]
        recommendations = []

        # Lineup placement
        obp = stats.get('OBP', 0.320)
        power = stats.get('ISO', 0.150)

        if obp > 0.360:
            recommendations.append("Best utilized at top of lineup to maximize plate appearances")
        if power > 0.220 and obp > 0.340:
            recommendations.append("Ideal for cleanup hitter role")

        # Platoon considerations
        wrc_plus = stats.get('wRC+', 100)
        if wrc_plus > 120:
            recommendations.append("Should be in lineup daily regardless of matchup")

        return recommendations if recommendations else ["Standard deployment based on team needs"]

    def _generate_pitcher_recommendations(self, player: Any) -> List[str]:
        """Generate recommendations for utilizing pitcher."""
        if player.player_stats is None or player.player_stats.empty:
            return ["Insufficient data for recommendations"]

        stats = player.player_stats.iloc[0]
        recommendations = []

        # Role determination
        ip = stats.get('IP', 0)
        if ip > 150:
            recommendations.append("Established as rotation anchor, can handle heavy workload")
        elif ip < 80:
            recommendations.append("Best suited for bullpen role or spot starting")

        # Usage patterns
        k_pct = stats.get('K%', 20)
        if k_pct > 28:
            recommendations.append("High-leverage situations due to strikeout ability")

        return recommendations if recommendations else ["Standard usage patterns apply"]


# Helper function
def generate_scouting_report(
    player_id: int,
    season: int = datetime.now().year,
    client: Optional[MLBDataClient] = None
) -> Dict[str, Any]:
    """
    Generate a scouting report for a player.

    Args:
        player_id: MLB player ID
        season: Season year
        client: Optional MLBDataClient instance

    Returns:
        Scouting report dict
    """
    if client is None:
        from api.mlb.client import get_mlb_client
        client = get_mlb_client()

    generator = ScoutingReportGenerator(client)

    # Determine if batter or pitcher
    player = client.get_player(mlbam_id=player_id)
    if not player:
        return {"error": "Player not found"}

    if player.player_info.primary_position == "P":
        return generator.generate_pitcher_report(player_id, season)
    else:
        return generator.generate_batter_report(player_id, season)
