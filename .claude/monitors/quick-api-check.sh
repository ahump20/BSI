#!/bin/bash
# Quick API Health Check for Blaze Sports Intel
# Tests critical endpoints and reports basic status

echo "========================================="
echo "API HEALTH CHECK - $(date '+%Y-%m-%d %H:%M:%S')"
echo "========================================="
echo ""

# Test MLB Stats API
echo "1. MLB Stats API..."
mlb_status=$(curl -s -o /dev/null -w "%{http_code}" "https://statsapi.mlb.com/api/v1/standings?leagueId=103&season=2024" --max-time 10)
mlb_time=$(curl -s -o /dev/null -w "%{time_total}" "https://statsapi.mlb.com/api/v1/standings?leagueId=103&season=2024" --max-time 10)
if [ "$mlb_status" = "200" ]; then
    echo "   ✅ Status: $mlb_status | Time: ${mlb_time}s"
else
    echo "   ❌ Status: $mlb_status | Time: ${mlb_time}s"
fi

# Test ESPN NFL API
echo "2. ESPN NFL API..."
nfl_status=$(curl -s -o /dev/null -w "%{http_code}" "https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams" --max-time 10)
nfl_time=$(curl -s -o /dev/null -w "%{time_total}" "https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams" --max-time 10)
if [ "$nfl_status" = "200" ]; then
    echo "   ✅ Status: $nfl_status | Time: ${nfl_time}s"
else
    echo "   ❌ Status: $nfl_status | Time: ${nfl_time}s"
fi

# Test ESPN CFB API
echo "3. ESPN CFB API..."
cfb_status=$(curl -s -o /dev/null -w "%{http_code}" "https://site.api.espn.com/apis/site/v2/sports/football/college-football/teams/251" --max-time 10)
cfb_time=$(curl -s -o /dev/null -w "%{time_total}" "https://site.api.espn.com/apis/site/v2/sports/football/college-football/teams/251" --max-time 10)
if [ "$cfb_status" = "200" ]; then
    echo "   ✅ Status: $cfb_status | Time: ${cfb_time}s"
else
    echo "   ❌ Status: $cfb_status | Time: ${cfb_time}s"
fi

# Test ESPN CBB API
echo "4. ESPN CBB API..."
cbb_status=$(curl -s -o /dev/null -w "%{http_code}" "https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/teams/251" --max-time 10)
cbb_time=$(curl -s -o /dev/null -w "%{time_total}" "https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/teams/251" --max-time 10)
if [ "$cbb_status" = "200" ]; then
    echo "   ✅ Status: $cbb_status | Time: ${cbb_time}s"
else
    echo "   ❌ Status: $cbb_status | Time: ${cbb_time}s"
fi

# Test BSI /api/mlb/standings
echo "5. BSI MLB API..."
bsi_mlb_status=$(curl -s -o /dev/null -w "%{http_code}" "https://blazesportsintel.com/api/mlb/standings" --max-time 10)
bsi_mlb_time=$(curl -s -o /dev/null -w "%{time_total}" "https://blazesportsintel.com/api/mlb/standings" --max-time 10)
if [ "$bsi_mlb_status" = "200" ]; then
    echo "   ✅ Status: $bsi_mlb_status | Time: ${bsi_mlb_time}s"
else
    echo "   ❌ Status: $bsi_mlb_status | Time: ${bsi_mlb_time}s"
fi

# Test BSI /api/nfl/standings
echo "6. BSI NFL API..."
bsi_nfl_status=$(curl -s -o /dev/null -w "%{http_code}" "https://blazesportsintel.com/api/nfl/standings" --max-time 10)
bsi_nfl_time=$(curl -s -o /dev/null -w "%{time_total}" "https://blazesportsintel.com/api/nfl/standings" --max-time 10)
if [ "$bsi_nfl_status" = "200" ]; then
    echo "   ✅ Status: $bsi_nfl_status | Time: ${bsi_nfl_time}s"
else
    echo "   ❌ Status: $bsi_nfl_status | Time: ${bsi_nfl_time}s"
fi

echo ""
echo "========================================="
echo "Health Check Complete"
echo "========================================="
