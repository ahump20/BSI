import { describe, expect, it } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Verify the HAV-F leaderboard handler includes a minimum PA filter
 * to prevent small-sample players from dominating the leaderboard.
 *
 * This is a code-level test that reads the handler source and asserts
 * the SQL query includes the PA subquery filter.
 */
describe('HAV-F leaderboard handler', () => {
  const handlerPath = path.resolve(__dirname, '../../workers/handlers/analytics.ts');
  const handlerSource = fs.readFileSync(handlerPath, 'utf-8');

  it('includes a minimum PA filter via subquery', () => {
    // The handler should filter havf_scores by players who have
    // sufficient plate appearances in cbb_batting_advanced
    expect(handlerSource).toContain('cbb_batting_advanced');
    expect(handlerSource).toContain('pa >=');
  });

  it('defaults min_pa to 50 when not specified', () => {
    // The handler should parse min_pa from query params with default 50
    expect(handlerSource).toContain("min_pa");
    expect(handlerSource).toContain("'50'");
  });

  it('uses player_name column (matches production D1 schema)', () => {
    // The production D1 havf_scores table uses 'player_name' not 'name'
    // This test prevents the column mismatch bug from recurring
    const cronPath = path.resolve(__dirname, '../../workers/handlers/cron/havf.ts');
    const cronSource = fs.readFileSync(cronPath, 'utf-8');

    // The INSERT statement should use player_name to match the table schema
    expect(cronSource).toContain('player_id, player_name, team, league, season');
  });

  it('orders results by havf_composite DESC', () => {
    expect(handlerSource).toContain('ORDER BY havf_composite DESC');
  });
});
