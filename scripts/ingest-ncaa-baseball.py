#!/usr/bin/env python3
"""
NCAA Baseball Data Ingestion
Fetches from ESPN API and stores in D1 + R2
"""

import json
import sys
import time
from datetime import datetime, timezone
from typing import Dict, List, Optional
import requests
from dataclasses import dataclass
import sqlite3

# ESPN API endpoints
ESPN_BASE = "https://site.api.espn.com/apis/site/v2/sports/baseball/college-baseball"

@dataclass
class Team:
    team_id: str
    sport: str = "baseball"
    league: str = "ncaa"
    name: str = ""
    school: str = ""
    conference: str = ""
    division: str = ""
    city: str = ""
    state: str = ""
    metadata: Dict = None

@dataclass
class Player:
    player_id: str
    team_id: str
    first_name: str
    last_name: str
    jersey_number: Optional[int] = None
    position: str = ""
    height_cm: Optional[int] = None
    weight_kg: Optional[int] = None
    throws: Optional[str] = None
    bats: Optional[str] = None

@dataclass
class Game:
    game_id: str
    sport: str
    league: str
    season: int
    game_date: str
    home_team_id: str
    away_team_id: str
    home_score: Optional[int] = None
    away_score: Optional[int] = None
    status: str = "scheduled"
    venue_name: str = ""
    weather_temp_f: Optional[int] = None
    is_playoff: bool = False

class ESPNClient:
    """ESPN College Baseball API client"""

    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'BlazeSportsIntel/1.0',
            'Accept': 'application/json'
        })

    def get_teams(self, limit: int = 100) -> List[Team]:
        """Fetch all NCAA baseball teams"""
        url = f"{ESPN_BASE}/teams"
        params = {'limit': limit}

        try:
            resp = self.session.get(url, params=params, timeout=10)
            resp.raise_for_status()
            data = resp.json()

            teams = []
            for team_data in data.get('sports', [{}])[0].get('leagues', [{}])[0].get('teams', []):
                team_info = team_data.get('team', {})

                # Extract location
                location = team_info.get('location', '')
                city, state = '', ''
                if ',' in location:
                    parts = location.split(',')
                    city = parts[0].strip()
                    state = parts[1].strip() if len(parts) > 1 else ''

                team = Team(
                    team_id=f"baseball:ncaa:{team_info.get('id')}",
                    name=team_info.get('displayName', ''),
                    school=team_info.get('name', ''),
                    conference=team_data.get('groups', {}).get('name', ''),
                    division=team_data.get('groups', {}).get('abbreviation', ''),
                    city=city,
                    state=state,
                    metadata=team_info
                )
                teams.append(team)

            print(f"✅ Fetched {len(teams)} teams")
            return teams

        except Exception as e:
            print(f"❌ Error fetching teams: {e}")
            return []

    def get_team_roster(self, team_id: str) -> List[Player]:
        """Fetch team roster"""
        # Extract ESPN team ID
        espn_id = team_id.split(':')[-1]
        url = f"{ESPN_BASE}/teams/{espn_id}/roster"

        try:
            resp = self.session.get(url, timeout=10)
            resp.raise_for_status()
            data = resp.json()

            players = []
            for athlete_data in data.get('athletes', []):
                athlete = athlete_data.get('athlete', {}) or athlete_data

                # Parse height
                height_cm = None
                if athlete.get('height'):
                    try:
                        feet, inches = map(int, athlete['height'].split('-'))
                        height_cm = int((feet * 12 + inches) * 2.54)
                    except:
                        pass

                # Parse weight
                weight_kg = None
                if athlete.get('weight'):
                    try:
                        weight_kg = int(int(athlete['weight']) * 0.453592)
                    except:
                        pass

                player = Player(
                    player_id=f"baseball:ncaa:{athlete.get('id')}",
                    team_id=team_id,
                    first_name=athlete.get('firstName', ''),
                    last_name=athlete.get('lastName', ''),
                    jersey_number=athlete.get('jersey'),
                    position=athlete.get('position', {}).get('abbreviation', ''),
                    height_cm=height_cm,
                    weight_kg=weight_kg,
                    throws=None,  # Not in ESPN API
                    bats=None
                )
                players.append(player)

            print(f"✅ Fetched {len(players)} players for {team_id}")
            return players

        except Exception as e:
            print(f"❌ Error fetching roster for {team_id}: {e}")
            return []

    def get_scoreboard(self, season: int, week: Optional[int] = None) -> List[Game]:
        """Fetch games for a season/week"""
        url = f"{ESPN_BASE}/scoreboard"
        params = {'limit': 300}
        if week:
            params['week'] = week

        try:
            resp = self.session.get(url, params=params, timeout=10)
            resp.raise_for_status()
            data = resp.json()

            games = []
            for event in data.get('events', []):
                competition = event.get('competitions', [{}])[0]

                # Extract teams
                competitors = competition.get('competitors', [])
                home_team = next((c for c in competitors if c.get('homeAway') == 'home'), None)
                away_team = next((c for c in competitors if c.get('homeAway') == 'away'), None)

                if not home_team or not away_team:
                    continue

                # Parse status
                status_type = event.get('status', {}).get('type', {}).get('name', 'scheduled')
                status_map = {
                    'STATUS_SCHEDULED': 'scheduled',
                    'STATUS_IN_PROGRESS': 'in_progress',
                    'STATUS_FINAL': 'final',
                    'STATUS_POSTPONED': 'postponed'
                }
                status = status_map.get(status_type, 'scheduled')

                game = Game(
                    game_id=f"baseball:ncaa:{event.get('id')}",
                    sport="baseball",
                    league="ncaa",
                    season=season,
                    game_date=event.get('date', '').split('T')[0],
                    home_team_id=f"baseball:ncaa:{home_team.get('team', {}).get('id')}",
                    away_team_id=f"baseball:ncaa:{away_team.get('team', {}).get('id')}",
                    home_score=int(home_team.get('score', 0)) if status == 'final' else None,
                    away_score=int(away_team.get('score', 0)) if status == 'final' else None,
                    status=status,
                    venue_name=competition.get('venue', {}).get('fullName', ''),
                    is_playoff=event.get('season', {}).get('slug') == 'post-season'
                )
                games.append(game)

            print(f"✅ Fetched {len(games)} games")
            return games

        except Exception as e:
            print(f"❌ Error fetching scoreboard: {e}")
            return []


class D1Writer:
    """Write data to D1 database"""

    def __init__(self, db_path: str = "bsi.db"):
        self.conn = sqlite3.connect(db_path)
        self.cursor = self.conn.cursor()
        self._init_schema()

    def _init_schema(self):
        """Initialize database schema"""
        with open('/Users/AustinHumphrey/BSI/functions/api/db/schema.sql') as f:
            self.cursor.executescript(f.read())
        self.conn.commit()

    def write_teams(self, teams: List[Team]):
        """Insert/update teams"""
        for team in teams:
            self.cursor.execute("""
                INSERT INTO teams (
                    team_id, sport, league, name, school, conference,
                    division, city, state, metadata
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(team_id) DO UPDATE SET
                    name = excluded.name,
                    school = excluded.school,
                    conference = excluded.conference,
                    division = excluded.division,
                    city = excluded.city,
                    state = excluded.state,
                    metadata = excluded.metadata
            """, (
                team.team_id, team.sport, team.league, team.name,
                team.school, team.conference, team.division,
                team.city, team.state, json.dumps(team.metadata)
            ))

        self.conn.commit()
        print(f"✅ Wrote {len(teams)} teams to D1")

    def write_players(self, players: List[Player]):
        """Insert/update players"""
        for player in players:
            self.cursor.execute("""
                INSERT INTO players (
                    player_id, team_id, first_name, last_name, jersey_number,
                    position, height_cm, weight_kg, throws, bats
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(player_id) DO UPDATE SET
                    team_id = excluded.team_id,
                    first_name = excluded.first_name,
                    last_name = excluded.last_name,
                    jersey_number = excluded.jersey_number,
                    position = excluded.position,
                    height_cm = excluded.height_cm,
                    weight_kg = excluded.weight_kg,
                    throws = excluded.throws,
                    bats = excluded.bats
            """, (
                player.player_id, player.team_id, player.first_name,
                player.last_name, player.jersey_number, player.position,
                player.height_cm, player.weight_kg, player.throws, player.bats
            ))

        self.conn.commit()
        print(f"✅ Wrote {len(players)} players to D1")

    def write_games(self, games: List[Game]):
        """Insert/update games"""
        for game in games:
            self.cursor.execute("""
                INSERT INTO games (
                    game_id, sport, league, season, game_date, home_team_id,
                    away_team_id, home_score, away_score, status, venue_name,
                    weather_temp_f, is_playoff
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(game_id) DO UPDATE SET
                    home_score = excluded.home_score,
                    away_score = excluded.away_score,
                    status = excluded.status
            """, (
                game.game_id, game.sport, game.league, game.season,
                game.game_date, game.home_team_id, game.away_team_id,
                game.home_score, game.away_score, game.status,
                game.venue_name, game.weather_temp_f, game.is_playoff
            ))

        self.conn.commit()
        print(f"✅ Wrote {len(games)} games to D1")

    def close(self):
        self.conn.close()


def main():
    print("🔥 Blaze Sports Intel - NCAA Baseball Data Ingestion")
    print("=" * 60)

    # Initialize clients
    espn = ESPNClient()
    db = D1Writer()

    try:
        # 1. Fetch teams
        print("\n📊 Fetching teams...")
        teams = espn.get_teams(limit=300)
        if teams:
            db.write_teams(teams)

        # 2. Fetch rosters for top conferences
        print("\n👥 Fetching rosters for Power 5 conferences...")
        power5_conferences = ['SEC', 'ACC', 'Big 12', 'Pac-12', 'Big Ten']
        power5_teams = [t for t in teams if t.conference in power5_conferences][:50]  # Limit for speed

        all_players = []
        for i, team in enumerate(power5_teams, 1):
            print(f"[{i}/{len(power5_teams)}] {team.school}...")
            players = espn.get_team_roster(team.team_id)
            all_players.extend(players)
            time.sleep(0.5)  # Rate limiting

        if all_players:
            db.write_players(all_players)

        # 3. Fetch current season games
        print("\n📅 Fetching 2025 season games...")
        games = espn.get_scoreboard(season=2025)
        if games:
            db.write_games(games)

        print("\n✅ Data ingestion complete!")
        print(f"   Teams: {len(teams)}")
        print(f"   Players: {len(all_players)}")
        print(f"   Games: {len(games)}")

    except Exception as e:
        print(f"\n❌ Fatal error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

    finally:
        db.close()


if __name__ == '__main__':
    main()
