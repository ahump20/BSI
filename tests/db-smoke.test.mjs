import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const timestamp = Date.now();
  const season = new Date().getFullYear();
  const slugBase = `test-${timestamp}`;

  const conference = await prisma.conference.create({
    data: {
      name: `Test Conference ${timestamp}`,
      slug: `${slugBase}-conf`,
      division: 'D1',
      sport: 'BASEBALL'
    }
  });

  const homeTeam = await prisma.team.create({
    data: {
      name: `Home Team ${timestamp}`,
      slug: `${slugBase}-home`,
      school: 'Test University',
      abbreviation: 'HOM',
      division: 'D1',
      conferenceId: conference.id
    }
  });

  const awayTeam = await prisma.team.create({
    data: {
      name: `Away Team ${timestamp}`,
      slug: `${slugBase}-away`,
      school: 'Rival College',
      abbreviation: 'AWY',
      division: 'D1',
      conferenceId: conference.id
    }
  });

  const player = await prisma.player.create({
    data: {
      teamId: homeTeam.id,
      firstName: 'Test',
      lastName: 'Pitcher',
      slug: `${slugBase}-player`,
      jerseyNumber: '12',
      position: 'P',
      bats: 'R',
      throws: 'R',
      year: 'SENIOR',
      height: 74,
      weight: 205,
      hometown: 'Baton Rouge, LA'
    }
  });

  const game = await prisma.game.create({
    data: {
      externalId: `${slugBase}-game`,
      season,
      seasonType: 'REGULAR',
      sport: 'BASEBALL',
      division: 'D1',
      status: 'FINAL',
      scheduledAt: new Date(),
      homeTeamId: homeTeam.id,
      awayTeamId: awayTeam.id,
      homeScore: 7,
      awayScore: 3,
      providerName: 'TEST_PROVIDER',
      feedPrecision: 'EVENT'
    }
  });

  const event = await prisma.event.create({
    data: {
      gameId: game.id,
      sequence: 1,
      inning: 1,
      inningHalf: 'TOP',
      outs: 0,
      eventType: 'LEADOFF_SINGLE',
      description: 'Leadoff single to left field',
      homeWinProb: 0.52,
      wpaSwing: 0.01
    }
  });

  const boxLine = await prisma.gameBoxLine.create({
    data: {
      gameId: game.id,
      teamId: homeTeam.id,
      playerId: player.id,
      side: 'HOME',
      battingOrder: 1,
      ab: 4,
      r: 2,
      h: 2,
      rbi: 3,
      bb: 1,
      so: 0,
      doubles: 1,
      triples: 0,
      homeRuns: 0,
      stolenBases: 1,
      caughtStealing: 0,
      totalBases: 5,
      ip: 5.0,
      hitsAllowed: 3,
      runsAllowed: 1,
      earnedRuns: 1,
      bbAllowed: 1,
      soRecorded: 6,
      homeRunsAllowed: 0,
      decision: 'W'
    }
  });

  const teamStats = await prisma.teamStats.create({
    data: {
      teamId: homeTeam.id,
      season,
      wins: 10,
      losses: 2,
      confWins: 3,
      confLosses: 1,
      homeWins: 5,
      homeLosses: 1,
      awayWins: 5,
      awayLosses: 1,
      runsScored: 85,
      runsAllowed: 40,
      hitsTotal: 95,
      homeRuns: 12,
      stolenBases: 14,
      battingAvg: 0.312,
      onBasePct: 0.385,
      sluggingPct: 0.475,
      era: 3.21,
      fieldingPct: 0.986,
      earnedRuns: 32,
      hitsAllowed: 70,
      strikeouts: 112,
      walks: 35,
      rpi: 0.61,
      strengthOfSched: 0.55,
      pythagWins: 9.2
    }
  });

  const playerStats = await prisma.playerStats.create({
    data: {
      playerId: player.id,
      teamId: homeTeam.id,
      season,
      gamesPlayed: 8,
      gamesStarted: 8,
      atBats: 28,
      runs: 6,
      hits: 10,
      doubles: 2,
      triples: 0,
      homeRuns: 1,
      rbi: 8,
      walks: 4,
      strikeouts: 5,
      stolenBases: 2,
      caughtStealing: 0,
      battingAvg: 0.357,
      onBasePct: 0.429,
      sluggingPct: 0.536,
      ops: 0.965,
      gamesPitched: 4,
      wins: 3,
      losses: 0,
      saves: 1,
      inningsPitched: '21.30',
      runsAllowed: 4,
      earnedRuns: 3,
      hitsAllowed: 12,
      walksAllowed: 3,
      strikeouts: 28,
      homeRunsAllowed: 1,
      era: 1.27,
      whip: 0.70,
      strikeoutsPerNine: 11.8,
      walksPerNine: 1.3
    }
  });

  const ranking = await prisma.ranking.create({
    data: {
      teamId: homeTeam.id,
      pollType: 'COACHES',
      season,
      week: 1,
      rank: 8,
      previousRank: 9,
      points: 880,
      firstPlaceVotes: 2
    }
  });

  const article = await prisma.article.create({
    data: {
      slug: `${slugBase}-article`,
      title: 'Smoke Test Recap',
      summary: 'Automated validation of Prisma schema.',
      content: 'This is a generated recap validating the Prisma schema.',
      type: 'RECAP',
      status: 'DRAFT',
      teamId: homeTeam.id,
      gameId: game.id,
      publishedAt: null,
      author: 'Ingest Bot'
    }
  });

  const fetchedGame = await prisma.game.findUnique({
    where: { id: game.id },
    include: {
      events: true,
      boxLines: true,
      homeTeam: true,
      awayTeam: true
    }
  });

  if (!fetchedGame) {
    throw new Error('Game not found after creation');
  }

  if (fetchedGame.events.length !== 1 || fetchedGame.boxLines.length !== 1) {
    throw new Error('Expected one event and one box line for smoke test');
  }

  const fetchedTeamStats = await prisma.teamStats.findUnique({
    where: {
      teamId_season: {
        teamId: homeTeam.id,
        season
      }
    }
  });

  if (!fetchedTeamStats || fetchedTeamStats.wins !== 10) {
    throw new Error('Team stats validation failed');
  }

  const fetchedPlayerStats = await prisma.playerStats.findUnique({
    where: {
      playerId_season: {
        playerId: player.id,
        season
      }
    }
  });

  const inningsValue = Number(fetchedPlayerStats?.inningsPitched ?? NaN);

  if (!fetchedPlayerStats || Number.isNaN(inningsValue) || Math.abs(inningsValue - 21.3) > 1e-6) {
    throw new Error('Player stats validation failed');
  }

  const fetchedRanking = await prisma.ranking.findUnique({
    where: {
      pollType_season_week_teamId: {
        pollType: 'COACHES',
        season,
        week: 1,
        teamId: homeTeam.id
      }
    }
  });

  if (!fetchedRanking || fetchedRanking.rank !== 8) {
    throw new Error('Ranking validation failed');
  }

  const fetchedArticle = await prisma.article.findUnique({
    where: { slug: `${slugBase}-article` }
  });

  if (!fetchedArticle || fetchedArticle.teamId !== homeTeam.id) {
    throw new Error('Article validation failed');
  }

  console.log('✅ Prisma smoke test passed');

  return {
    articleId: article.id,
    rankingId: ranking.id,
    playerStatsId: playerStats.id,
    teamStatsId: teamStats.id,
    boxLineId: boxLine.id,
    eventId: event.id,
    gameId: game.id,
    playerId: player.id,
    teamIds: [homeTeam.id, awayTeam.id],
    conferenceId: conference.id
  };
}

let cleanupTargets = {};
let failed = false;

try {
  cleanupTargets = await main();
} catch (error) {
  failed = true;
  console.error('❌ Prisma smoke test failed:', error);
} finally {
  try {
    if (cleanupTargets.articleId) {
      await prisma.article.delete({ where: { id: cleanupTargets.articleId } });
    }
    if (cleanupTargets.rankingId) {
      await prisma.ranking.delete({ where: { id: cleanupTargets.rankingId } });
    }
    if (cleanupTargets.playerStatsId) {
      await prisma.playerStats.delete({ where: { id: cleanupTargets.playerStatsId } });
    }
    if (cleanupTargets.teamStatsId) {
      await prisma.teamStats.delete({ where: { id: cleanupTargets.teamStatsId } });
    }
    if (cleanupTargets.boxLineId) {
      await prisma.gameBoxLine.delete({ where: { id: cleanupTargets.boxLineId } });
    }
    if (cleanupTargets.eventId) {
      await prisma.event.delete({ where: { id: cleanupTargets.eventId } });
    }
    if (cleanupTargets.gameId) {
      await prisma.game.delete({ where: { id: cleanupTargets.gameId } });
    }
    if (cleanupTargets.playerId) {
      await prisma.player.delete({ where: { id: cleanupTargets.playerId } });
    }
    if (cleanupTargets.teamIds) {
      for (const teamId of cleanupTargets.teamIds) {
        await prisma.team.delete({ where: { id: teamId } });
      }
    }
    if (cleanupTargets.conferenceId) {
      await prisma.conference.delete({ where: { id: cleanupTargets.conferenceId } });
    }
  } catch (cleanupError) {
    failed = true;
    console.error('⚠️ Prisma smoke test cleanup error:', cleanupError);
  }

  await prisma.$disconnect();
  process.exit(failed ? 1 : 0);
}
