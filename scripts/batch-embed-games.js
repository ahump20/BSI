#!/usr/bin/env node
/**
 * Batch embed games into Vectorize
 * Fetches games from D1, generates content descriptions, and sends to ingest endpoint
 */

const API_BASE = 'https://blazesportsintel.com';

async function fetchGamesFromD1() {
  // We'll fetch via the copilot/games endpoint which already has team data
  const response = await fetch(`${API_BASE}/api/copilot/games?limit=500`);
  if (!response.ok) {
    throw new Error(`Failed to fetch games: ${response.status}`);
  }
  return response.json();
}

function generateGameContent(game) {
  const scoreDiff = Math.abs(game.home_score - game.away_score);
  const winner = game.home_score > game.away_score ? game.home_team : game.away_team;
  const loser = game.home_score > game.away_score ? game.away_team : game.home_team;
  const winScore = Math.max(game.home_score, game.away_score);
  const loseScore = Math.min(game.home_score, game.away_score);

  let gameType = 'competitive game';
  if (scoreDiff <= 2) gameType = 'close game. nail-biter. tight contest';
  else if (scoreDiff >= 7) gameType = 'blowout. dominant performance';

  const date = new Date(game.game_date);
  const dateStr = date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return `College Baseball 2024. ${game.away_team} at ${game.home_team}. Final score ${game.home_team} ${game.home_score} ${game.away_team} ${game.away_score}. ${winner} defeats ${loser} ${winScore}-${loseScore}. ${gameType}. ${dateStr}`;
}

async function ingestSingle(item) {
  const response = await fetch(`${API_BASE}/api/ai/ingest`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(item),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Ingest failed: ${response.status} - ${text}`);
  }

  return response.json();
}

async function ingestBatch(items) {
  // Process items sequentially to avoid rate limiting
  let succeeded = 0;
  let failed = 0;

  for (const item of items) {
    try {
      await ingestSingle(item);
      succeeded++;
    } catch (error) {
      console.log(`      Failed ${item.id}: ${error.message}`);
      failed++;
    }
    // Small delay between requests
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  return { succeeded, failed };
}

async function main() {
  console.log('🚀 Starting batch embedding of games...\n');

  try {
    // Fetch all games
    console.log('📥 Fetching games from database...');
    const gamesData = await fetchGamesFromD1();
    const games = gamesData.games || [];
    console.log(`   Found ${games.length} games\n`);

    // All games - the ingest endpoint handles duplicates gracefully
    // Run this periodically to index new games
    const toIndex = games.slice(0, 200); // Process up to 200 at a time
    console.log(`📊 ${toIndex.length} games to process\n`);

    if (toIndex.length === 0) {
      console.log('✅ All games already indexed!');
      return;
    }

    // Process in batches of 20
    const batchSize = 20;
    let totalSucceeded = 0;
    let totalFailed = 0;

    for (let i = 0; i < toIndex.length; i += batchSize) {
      const batch = toIndex.slice(i, i + batchSize);
      const batchNum = Math.floor(i / batchSize) + 1;
      const totalBatches = Math.ceil(toIndex.length / batchSize);

      console.log(`📦 Processing batch ${batchNum}/${totalBatches} (${batch.length} games)...`);

      // Prepare items for ingestion
      const items = batch.map((game) => ({
        id: `game-${game.game_id}`,
        title: `${game.away_team} at ${game.home_team}`,
        content: generateGameContent(game),
        sport: 'ncaa',
        category: 'college-baseball',
        team: game.home_team,
        date: game.game_date,
        metadata: {
          home_team: game.home_team,
          away_team: game.away_team,
          home_score: game.home_score,
          away_score: game.away_score,
          status: game.status,
        },
      }));

      try {
        const result = await ingestBatch(items);
        totalSucceeded += result.succeeded || 0;
        totalFailed += result.failed || 0;
        console.log(`   ✅ Batch complete: ${result.succeeded} succeeded, ${result.failed} failed`);
      } catch (error) {
        console.log(`   ❌ Batch failed: ${error.message}`);
        totalFailed += batch.length;
      }

      // Small delay between batches to avoid rate limiting
      if (i + batchSize < toIndex.length) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }

    console.log(`\n📊 Final Results:`);
    console.log(`   Total Succeeded: ${totalSucceeded}`);
    console.log(`   Total Failed: ${totalFailed}`);
    console.log(`\n✅ Batch embedding complete!`);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
