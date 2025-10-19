import { readFile } from 'node:fs/promises';
import {
  ArticleStatus,
  FeedPrecision,
  GameStatus,
  Prisma,
  PrismaClient,
  SeasonType,
  Sport,
  StatScope,
} from '@prisma/client';

type FixtureConference = {
  id: string;
  slug: string;
  name: string;
  sport: string;
  division?: string;
  shortName?: string;
  region?: string;
};

type FixtureTeam = {
  id: string;
  externalId?: string;
  slug: string;
  name: string;
  nickname?: string;
  sport: string;
  division?: string;
  school?: string;
  abbreviation?: string;
  city?: string;
  state?: string;
  primaryColor?: string;
  secondaryColor?: string;
  logoUrl?: string;
  conferenceId?: string;
};

type FixturePlayer = {
  id: string;
  externalId?: string;
  slug?: string;
  teamId?: string;
  firstName?: string;
  lastName?: string;
  fullName: string;
  position?: string;
  jerseyNumber?: number;
  bats?: string;
  throws?: string;
  height?: string;
  weight?: number;
  classYear?: string;
  hometown?: string;
  homeState?: string;
};

type FixtureGame = {
  id: string;
  externalId: string;
  sport: string;
  division: string;
  season: number;
  seasonType: string;
  scheduledAt: string;
  status: string;
  venue?: string;
  city?: string;
  state?: string;
  providerName: string;
  feedPrecision: string;
  homeTeamId: string;
  awayTeamId: string;
  homeScore?: number;
  awayScore?: number;
};

type FixtureTeamStats = {
  teamId: string;
  season: number;
  scope: string;
  wins: number;
  losses: number;
  confWins?: number;
  confLosses?: number;
  homeWins?: number;
  homeLosses?: number;
  awayWins?: number;
  awayLosses?: number;
  runsScored?: number;
  runsAllowed?: number;
  battingAvg?: number;
  era?: number;
  fieldingPct?: number;
  strengthOfSched?: number;
  rpi?: number;
  pythagWins?: number;
};

type FixturePlayerStats = {
  playerId: string;
  teamId: string;
  season: number;
  scope: string;
  gamesPlayed?: number;
  atBats?: number;
  runs?: number;
  hits?: number;
  doubles?: number;
  triples?: number;
  homeRuns?: number;
  rbis?: number;
  walks?: number;
  strikeouts?: number;
  stolenBases?: number;
  inningsPitched?: number;
  strikeoutsPitched?: number;
  era?: number;
  whip?: number;
  battingAvg?: number;
  obp?: number;
  slg?: number;
  ops?: number;
};

type FixtureRanking = {
  sport: string;
  poll: string;
  season: number;
  week: number;
  teamId: string;
  rank: number;
  points?: number;
  firstPlaceVotes?: number;
  conferenceId?: string;
};

type FixtureArticle = {
  slug: string;
  title: string;
  summary?: string;
  body: string;
  status: string;
  sport: string;
  teamId?: string;
  gameId?: string;
  author?: string;
  tags?: string[];
  publishedAt?: string;
};

type FixturePayload = {
  conferences: FixtureConference[];
  teams: FixtureTeam[];
  players: FixturePlayer[];
  games: FixtureGame[];
  teamStats: FixtureTeamStats[];
  playerStats: FixturePlayerStats[];
  rankings: FixtureRanking[];
  articles: FixtureArticle[];
};

const prisma = new PrismaClient();

const toSport = (value: string): Sport => value as Sport;
const toSeasonType = (value: string): SeasonType => value as SeasonType;
const toFeedPrecision = (value: string): FeedPrecision => value as FeedPrecision;
const toGameStatus = (value: string): GameStatus => value as GameStatus;
const toStatScope = (value: string): StatScope => value as StatScope;
const toArticleStatus = (value: string): ArticleStatus => value as ArticleStatus;

function decimal(value: number | null | undefined): Prisma.Decimal | undefined {
  if (value === null || value === undefined) {
    return undefined;
  }

  return new Prisma.Decimal(value);
}

async function seed(): Promise<void> {
  const raw = await readFile(new URL('./fixtures/baseball.json', import.meta.url));
  const data = JSON.parse(raw.toString()) as FixturePayload;

  for (const conference of data.conferences) {
    await prisma.conference.upsert({
      where: { id: conference.id },
      update: {
        name: conference.name,
        slug: conference.slug,
        sport: toSport(conference.sport),
        division: conference.division,
        shortName: conference.shortName,
        region: conference.region,
      },
      create: {
        id: conference.id,
        slug: conference.slug,
        name: conference.name,
        sport: toSport(conference.sport),
        division: conference.division,
        shortName: conference.shortName,
        region: conference.region,
      },
    });
  }

  for (const team of data.teams) {
    await prisma.team.upsert({
      where: { id: team.id },
      update: {
        externalId: team.externalId,
        name: team.name,
        slug: team.slug,
        nickname: team.nickname,
        sport: toSport(team.sport),
        division: team.division ?? 'D1',
        school: team.school,
        abbreviation: team.abbreviation,
        city: team.city,
        state: team.state,
        primaryColor: team.primaryColor,
        secondaryColor: team.secondaryColor,
        logoUrl: team.logoUrl,
        conferenceId: team.conferenceId ?? null,
      },
      create: {
        id: team.id,
        externalId: team.externalId,
        slug: team.slug,
        name: team.name,
        nickname: team.nickname,
        sport: toSport(team.sport),
        division: team.division ?? 'D1',
        school: team.school,
        abbreviation: team.abbreviation,
        city: team.city,
        state: team.state,
        primaryColor: team.primaryColor,
        secondaryColor: team.secondaryColor,
        logoUrl: team.logoUrl,
        conference: team.conferenceId ? { connect: { id: team.conferenceId } } : undefined,
      },
    });
  }

  for (const player of data.players) {
    await prisma.player.upsert({
      where: { id: player.id },
      update: {
        externalId: player.externalId,
        slug: player.slug,
        teamId: player.teamId ?? null,
        firstName: player.firstName,
        lastName: player.lastName,
        fullName: player.fullName,
        position: player.position,
        jerseyNumber: player.jerseyNumber,
        bats: player.bats,
        throws: player.throws,
        height: player.height,
        weight: player.weight,
        classYear: player.classYear,
        hometown: player.hometown,
        homeState: player.homeState,
      },
      create: {
        id: player.id,
        externalId: player.externalId,
        slug: player.slug,
        fullName: player.fullName,
        team: player.teamId ? { connect: { id: player.teamId } } : undefined,
        firstName: player.firstName,
        lastName: player.lastName,
        position: player.position,
        jerseyNumber: player.jerseyNumber,
        bats: player.bats,
        throws: player.throws,
        height: player.height,
        weight: player.weight,
        classYear: player.classYear,
        hometown: player.hometown,
        homeState: player.homeState,
      },
    });
  }

  for (const game of data.games) {
    await prisma.game.upsert({
      where: { id: game.id },
      update: {
        status: toGameStatus(game.status),
        homeScore: game.homeScore,
        awayScore: game.awayScore,
      },
      create: {
        id: game.id,
        externalId: game.externalId,
        sport: toSport(game.sport),
        division: game.division,
        season: game.season,
        seasonType: toSeasonType(game.seasonType),
        scheduledAt: new Date(game.scheduledAt),
        status: toGameStatus(game.status),
        venue: game.venue,
        city: game.city,
        state: game.state,
        providerName: game.providerName,
        feedPrecision: toFeedPrecision(game.feedPrecision),
        homeTeam: { connect: { id: game.homeTeamId } },
        awayTeam: { connect: { id: game.awayTeamId } },
        homeScore: game.homeScore,
        awayScore: game.awayScore,
      },
    });
  }

  for (const stat of data.teamStats) {
    await prisma.teamStats.upsert({
      where: {
        teamId_season_scope: {
          teamId: stat.teamId,
          season: stat.season,
          scope: toStatScope(stat.scope),
        },
      },
      update: {
        wins: stat.wins,
        losses: stat.losses,
        confWins: stat.confWins ?? 0,
        confLosses: stat.confLosses ?? 0,
        homeWins: stat.homeWins ?? 0,
        homeLosses: stat.homeLosses ?? 0,
        awayWins: stat.awayWins ?? 0,
        awayLosses: stat.awayLosses ?? 0,
        runsScored: stat.runsScored ?? 0,
        runsAllowed: stat.runsAllowed ?? 0,
        battingAvg: stat.battingAvg ?? 0,
        era: stat.era ?? 0,
        fieldingPct: stat.fieldingPct ?? 0,
        strengthOfSched: stat.strengthOfSched,
        rpi: stat.rpi,
        pythagWins: stat.pythagWins,
      },
      create: {
        team: { connect: { id: stat.teamId } },
        season: stat.season,
        scope: toStatScope(stat.scope),
        wins: stat.wins,
        losses: stat.losses,
        confWins: stat.confWins ?? 0,
        confLosses: stat.confLosses ?? 0,
        homeWins: stat.homeWins ?? 0,
        homeLosses: stat.homeLosses ?? 0,
        awayWins: stat.awayWins ?? 0,
        awayLosses: stat.awayLosses ?? 0,
        runsScored: stat.runsScored ?? 0,
        runsAllowed: stat.runsAllowed ?? 0,
        battingAvg: stat.battingAvg ?? 0,
        era: stat.era ?? 0,
        fieldingPct: stat.fieldingPct ?? 0,
        strengthOfSched: stat.strengthOfSched,
        rpi: stat.rpi,
        pythagWins: stat.pythagWins,
      },
    });
  }

  for (const stat of data.playerStats) {
    await prisma.playerStats.upsert({
      where: {
        playerId_season_scope: {
          playerId: stat.playerId,
          season: stat.season,
          scope: toStatScope(stat.scope),
        },
      },
      update: {
        gamesPlayed: stat.gamesPlayed ?? 0,
        atBats: stat.atBats ?? 0,
        runs: stat.runs ?? 0,
        hits: stat.hits ?? 0,
        doubles: stat.doubles ?? 0,
        triples: stat.triples ?? 0,
        homeRuns: stat.homeRuns ?? 0,
        rbis: stat.rbis ?? 0,
        walks: stat.walks ?? 0,
        strikeouts: stat.strikeouts ?? 0,
        stolenBases: stat.stolenBases ?? 0,
        inningsPitched: decimal(stat.inningsPitched),
        strikeoutsPitched: stat.strikeoutsPitched ?? 0,
        era: stat.era,
        whip: stat.whip,
        battingAvg: stat.battingAvg,
        obp: stat.obp,
        slg: stat.slg,
        ops: stat.ops,
      },
      create: {
        player: { connect: { id: stat.playerId } },
        team: { connect: { id: stat.teamId } },
        season: stat.season,
        scope: toStatScope(stat.scope),
        gamesPlayed: stat.gamesPlayed ?? 0,
        atBats: stat.atBats ?? 0,
        runs: stat.runs ?? 0,
        hits: stat.hits ?? 0,
        doubles: stat.doubles ?? 0,
        triples: stat.triples ?? 0,
        homeRuns: stat.homeRuns ?? 0,
        rbis: stat.rbis ?? 0,
        walks: stat.walks ?? 0,
        strikeouts: stat.strikeouts ?? 0,
        stolenBases: stat.stolenBases ?? 0,
        inningsPitched: decimal(stat.inningsPitched),
        strikeoutsPitched: stat.strikeoutsPitched ?? 0,
        era: stat.era,
        whip: stat.whip,
        battingAvg: stat.battingAvg,
        obp: stat.obp,
        slg: stat.slg,
        ops: stat.ops,
      },
    });
  }

  for (const ranking of data.rankings) {
    await prisma.ranking.upsert({
      where: {
        poll_season_week_teamId: {
          poll: ranking.poll,
          season: ranking.season,
          week: ranking.week,
          teamId: ranking.teamId,
        },
      },
      update: {
        rank: ranking.rank,
        points: ranking.points,
        firstPlaceVotes: ranking.firstPlaceVotes,
      },
      create: {
        poll: ranking.poll,
        season: ranking.season,
        week: ranking.week,
        sport: toSport(ranking.sport),
        rank: ranking.rank,
        points: ranking.points,
        firstPlaceVotes: ranking.firstPlaceVotes,
        team: { connect: { id: ranking.teamId } },
        conference: ranking.conferenceId ? { connect: { id: ranking.conferenceId } } : undefined,
      },
    });
  }

  for (const article of data.articles) {
    await prisma.article.upsert({
      where: { slug: article.slug },
      update: {
        title: article.title,
        summary: article.summary,
        body: article.body,
        status: toArticleStatus(article.status),
        sport: toSport(article.sport),
        teamId: article.teamId ?? null,
        gameId: article.gameId ?? null,
        author: article.author,
        tags: article.tags ?? [],
        publishedAt: article.publishedAt ? new Date(article.publishedAt) : null,
      },
      create: {
        slug: article.slug,
        title: article.title,
        summary: article.summary,
        body: article.body,
        status: toArticleStatus(article.status),
        sport: toSport(article.sport),
        team: article.teamId ? { connect: { id: article.teamId } } : undefined,
        game: article.gameId ? { connect: { id: article.gameId } } : undefined,
        author: article.author,
        tags: article.tags ?? [],
        publishedAt: article.publishedAt ? new Date(article.publishedAt) : undefined,
      },
    });
  }
}

seed()
  .then(() => {
    console.log('Seed data applied successfully.');
  })
  .catch((error) => {
    console.error('Failed to seed database', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
