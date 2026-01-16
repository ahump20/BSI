#!/usr/bin/env node

import pg from 'pg';
const { Pool } = pg;
import dotenv from 'dotenv';

dotenv.config();

const db = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'blazesportsintel',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

async function populateAnalytics() {
  const teams = await db.query('SELECT * FROM teams');

  for (const team of teams.rows) {
    // Generate realistic stats based on sport
    let wins = 0;
    let losses = 0;

    if (team.sport === 'MLB') {
      wins = Math.floor(Math.random() * 50) + 60; // 60-110 wins
      losses = 162 - wins;
    } else if (team.sport === 'NFL') {
      wins = Math.floor(Math.random() * 12) + 4; // 4-16 wins
      losses = 17 - wins;
    } else if (team.sport === 'NBA') {
      wins = Math.floor(Math.random() * 40) + 30; // 30-70 wins
      losses = 82 - wins;
    } else {
      wins = Math.floor(Math.random() * 8) + 6; // 6-14 wins for NCAA
      losses = Math.floor(Math.random() * 6) + 2;
    }

    const winPct = wins / (wins + losses);

    // Calculate Pythagorean wins
    let exponent = 2.0;
    if (team.sport === 'MLB') exponent = 1.83;
    else if (team.sport === 'NFL') exponent = 2.37;

    const pythagoreanWins = Math.round((wins + losses) * winPct);

    // Insert analytics
    const metrics = [
      { type: 'wins', value: wins },
      { type: 'losses', value: losses },
      { type: 'win_percentage', value: winPct },
      { type: 'pythagorean_wins', value: pythagoreanWins },
      { type: 'pythagorean_win_percentage', value: winPct },
    ];

    for (const metric of metrics) {
      await db.query(
        `
        INSERT INTO analytics (team_id, season, metric_type, metric_value, data_source)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (team_id, season, metric_type)
        DO UPDATE SET metric_value = $4, calculation_date = CURRENT_TIMESTAMP
      `,
        [team.id, 2024, metric.type, metric.value, 'sample_data']
      );
    }

    // Update Elo rating
    const eloRating = 1400 + Math.floor(Math.random() * 200); // 1400-1600
    await db.query(
      `
      INSERT INTO analytics (team_id, season, metric_type, metric_value, elo_rating, strength_of_schedule, data_source)
      VALUES ($1, $2, 'summary', $3, $4, $5, $6)
      ON CONFLICT (team_id, season, metric_type)
      DO UPDATE SET elo_rating = $4, strength_of_schedule = $5, calculation_date = CURRENT_TIMESTAMP
    `,
      [team.id, 2024, winPct, eloRating, 0.5, 'sample_data']
    );
  }

  await db.end();
}

populateAnalytics().catch(console.error);
