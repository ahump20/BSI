-- CreateEnum
CREATE TYPE "Sport" AS ENUM ('BASEBALL', 'FOOTBALL', 'BASKETBALL');

-- CreateEnum
CREATE TYPE "League" AS ENUM ('NCAA_D1', 'NCAA_D2', 'NCAA_D3', 'JUCO', 'MLB');

-- CreateEnum
CREATE TYPE "SeasonType" AS ENUM ('REGULAR', 'POSTSEASON', 'PRESEASON');

-- CreateEnum
CREATE TYPE "GameStatus" AS ENUM ('SCHEDULED', 'LIVE', 'FINAL', 'POSTPONED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "InningHalf" AS ENUM ('TOP', 'BOTTOM');

-- CreateEnum
CREATE TYPE "DataFeedPrecision" AS ENUM ('EVENT', 'PITCH', 'PLAY');

-- CreateEnum
CREATE TYPE "PollType" AS ENUM ('COACHES', 'BASEBALL_AMERICA', 'D1BASEBALL', 'PERFECT_GAME', 'COMPOSITE');

-- CreateEnum
CREATE TYPE "ArticleStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'PUBLISHED');

-- CreateTable
CREATE TABLE "Conference" (
    "id" TEXT NOT NULL,
    "externalId" TEXT,
    "sport" "Sport" NOT NULL,
    "league" "League" NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "shortName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Conference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Venue" (
    "id" TEXT NOT NULL,
    "externalId" TEXT,
    "name" TEXT NOT NULL,
    "city" TEXT,
    "state" TEXT,
    "capacity" INTEGER,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Venue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Team" (
    "id" TEXT NOT NULL,
    "externalId" TEXT,
    "sport" "Sport" NOT NULL,
    "league" "League" NOT NULL,
    "name" TEXT NOT NULL,
    "school" TEXT,
    "nickname" TEXT,
    "slug" TEXT NOT NULL,
    "abbreviation" TEXT,
    "conferenceId" TEXT,
    "division" TEXT,
    "logoUrl" TEXT,
    "primaryColor" TEXT,
    "secondaryColor" TEXT,
    "foundedYear" INTEGER,
    "city" TEXT,
    "state" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Team_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Player" (
    "id" TEXT NOT NULL,
    "externalId" TEXT,
    "sport" "Sport" NOT NULL,
    "league" "League" NOT NULL,
    "teamId" TEXT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "position" TEXT,
    "jerseyNumber" INTEGER,
    "bats" TEXT,
    "throws" TEXT,
    "classYear" TEXT,
    "heightInches" INTEGER,
    "weightLbs" INTEGER,
    "birthDate" TIMESTAMP(3),
    "hometown" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Player_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Game" (
    "id" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "sport" "Sport" NOT NULL,
    "league" "League" NOT NULL,
    "season" INTEGER NOT NULL,
    "seasonType" "SeasonType" NOT NULL DEFAULT 'REGULAR',
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "status" "GameStatus" NOT NULL DEFAULT 'SCHEDULED',
    "venueId" TEXT,
    "homeTeamId" TEXT NOT NULL,
    "awayTeamId" TEXT NOT NULL,
    "homeScore" INTEGER DEFAULT 0,
    "awayScore" INTEGER DEFAULT 0,
    "currentInning" INTEGER,
    "currentInningHalf" "InningHalf",
    "balls" INTEGER,
    "strikes" INTEGER,
    "outs" INTEGER,
    "providerName" TEXT NOT NULL,
    "feedPrecision" "DataFeedPrecision" NOT NULL DEFAULT 'EVENT',
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Game_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InningEvent" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "inningNumber" INTEGER NOT NULL,
    "half" "InningHalf" NOT NULL,
    "sequence" INTEGER NOT NULL,
    "outs" INTEGER,
    "balls" INTEGER,
    "strikes" INTEGER,
    "eventType" TEXT NOT NULL,
    "description" TEXT,
    "batterId" TEXT,
    "pitcherId" TEXT,
    "result" JSONB,
    "homeWinProb" DECIMAL(6,4),
    "wpaSwing" DECIMAL(6,4),
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InningEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamSeasonStat" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "sport" "Sport" NOT NULL,
    "league" "League" NOT NULL,
    "season" INTEGER NOT NULL,
    "seasonType" "SeasonType" NOT NULL DEFAULT 'REGULAR',
    "wins" INTEGER NOT NULL DEFAULT 0,
    "losses" INTEGER NOT NULL DEFAULT 0,
    "confWins" INTEGER NOT NULL DEFAULT 0,
    "confLosses" INTEGER NOT NULL DEFAULT 0,
    "homeWins" INTEGER NOT NULL DEFAULT 0,
    "homeLosses" INTEGER NOT NULL DEFAULT 0,
    "awayWins" INTEGER NOT NULL DEFAULT 0,
    "awayLosses" INTEGER NOT NULL DEFAULT 0,
    "runsScored" INTEGER NOT NULL DEFAULT 0,
    "runsAllowed" INTEGER NOT NULL DEFAULT 0,
    "hitsTotal" INTEGER NOT NULL DEFAULT 0,
    "homeRuns" INTEGER NOT NULL DEFAULT 0,
    "stolenBases" INTEGER NOT NULL DEFAULT 0,
    "battingAvg" DECIMAL(5,3),
    "onBasePct" DECIMAL(5,3),
    "sluggingPct" DECIMAL(5,3),
    "era" DECIMAL(5,2),
    "whip" DECIMAL(5,2),
    "fieldingPct" DECIMAL(5,3),
    "rpi" DECIMAL(6,4),
    "strengthOfSched" DECIMAL(6,4),
    "pythagWins" DECIMAL(6,2),
    "earnedRuns" INTEGER NOT NULL DEFAULT 0,
    "hitsAllowed" INTEGER NOT NULL DEFAULT 0,
    "strikeouts" INTEGER NOT NULL DEFAULT 0,
    "walks" INTEGER NOT NULL DEFAULT 0,
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeamSeasonStat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlayerSeasonStat" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "sport" "Sport" NOT NULL,
    "league" "League" NOT NULL,
    "season" INTEGER NOT NULL,
    "seasonType" "SeasonType" NOT NULL DEFAULT 'REGULAR',
    "gamesPlayed" INTEGER NOT NULL DEFAULT 0,
    "atBats" INTEGER NOT NULL DEFAULT 0,
    "runs" INTEGER NOT NULL DEFAULT 0,
    "hits" INTEGER NOT NULL DEFAULT 0,
    "doubles" INTEGER NOT NULL DEFAULT 0,
    "triples" INTEGER NOT NULL DEFAULT 0,
    "homeRuns" INTEGER NOT NULL DEFAULT 0,
    "rbi" INTEGER NOT NULL DEFAULT 0,
    "walks" INTEGER NOT NULL DEFAULT 0,
    "strikeouts" INTEGER NOT NULL DEFAULT 0,
    "stolenBases" INTEGER NOT NULL DEFAULT 0,
    "caughtStealing" INTEGER NOT NULL DEFAULT 0,
    "battingAvg" DECIMAL(5,3),
    "obp" DECIMAL(5,3),
    "slg" DECIMAL(5,3),
    "ops" DECIMAL(6,3),
    "gamesPitched" INTEGER NOT NULL DEFAULT 0,
    "gamesStarted" INTEGER NOT NULL DEFAULT 0,
    "wins" INTEGER NOT NULL DEFAULT 0,
    "losses" INTEGER NOT NULL DEFAULT 0,
    "saves" INTEGER NOT NULL DEFAULT 0,
    "inningsPitched" DECIMAL(6,1),
    "earnedRuns" INTEGER NOT NULL DEFAULT 0,
    "hitsAllowed" INTEGER NOT NULL DEFAULT 0,
    "walksAllowed" INTEGER NOT NULL DEFAULT 0,
    "strikeoutsPitched" INTEGER NOT NULL DEFAULT 0,
    "era" DECIMAL(5,2),
    "whip" DECIMAL(5,2),
    "homeRunsAllowed" INTEGER NOT NULL DEFAULT 0,
    "strikeoutsPerNine" DECIMAL(5,2),
    "walksPerNine" DECIMAL(5,2),
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlayerSeasonStat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GamePlayerStat" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "battingOrder" INTEGER,
    "side" TEXT,
    "ab" INTEGER NOT NULL DEFAULT 0,
    "r" INTEGER NOT NULL DEFAULT 0,
    "h" INTEGER NOT NULL DEFAULT 0,
    "doubles" INTEGER NOT NULL DEFAULT 0,
    "triples" INTEGER NOT NULL DEFAULT 0,
    "homeRuns" INTEGER NOT NULL DEFAULT 0,
    "rbi" INTEGER NOT NULL DEFAULT 0,
    "bb" INTEGER NOT NULL DEFAULT 0,
    "so" INTEGER NOT NULL DEFAULT 0,
    "stolenBases" INTEGER NOT NULL DEFAULT 0,
    "caughtStealing" INTEGER NOT NULL DEFAULT 0,
    "totalBases" INTEGER NOT NULL DEFAULT 0,
    "ip" DECIMAL(4,1),
    "hitsAllowed" INTEGER NOT NULL DEFAULT 0,
    "runsAllowed" INTEGER NOT NULL DEFAULT 0,
    "earnedRuns" INTEGER NOT NULL DEFAULT 0,
    "bbAllowed" INTEGER NOT NULL DEFAULT 0,
    "soRecorded" INTEGER NOT NULL DEFAULT 0,
    "pitchCount" INTEGER NOT NULL DEFAULT 0,
    "decision" TEXT,
    "result" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GamePlayerStat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ranking" (
    "id" TEXT NOT NULL,
    "pollType" "PollType" NOT NULL,
    "season" INTEGER NOT NULL,
    "week" INTEGER NOT NULL,
    "sport" "Sport" NOT NULL,
    "league" "League" NOT NULL,
    "teamId" TEXT NOT NULL,
    "conferenceId" TEXT,
    "rank" INTEGER NOT NULL,
    "previousRank" INTEGER,
    "points" INTEGER,
    "firstPlaceVotes" INTEGER,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Ranking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Article" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "content" TEXT NOT NULL,
    "sport" "Sport" NOT NULL,
    "league" "League" NOT NULL,
    "status" "ArticleStatus" NOT NULL DEFAULT 'DRAFT',
    "author" TEXT,
    "teamId" TEXT,
    "publishedAt" TIMESTAMP(3),
    "source" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Article_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Conference_externalId_key" ON "Conference"("externalId");

-- CreateIndex
CREATE UNIQUE INDEX "Conference_slug_key" ON "Conference"("slug");

-- CreateIndex
CREATE INDEX "Conference_sport_league_idx" ON "Conference"("sport", "league");

-- CreateIndex
CREATE UNIQUE INDEX "Venue_externalId_key" ON "Venue"("externalId");

-- CreateIndex
CREATE INDEX "Venue_city_state_idx" ON "Venue"("city", "state");

-- CreateIndex
CREATE UNIQUE INDEX "Team_externalId_key" ON "Team"("externalId");

-- CreateIndex
CREATE UNIQUE INDEX "Team_slug_key" ON "Team"("slug");

-- CreateIndex
CREATE INDEX "Team_sport_league_idx" ON "Team"("sport", "league");

-- CreateIndex
CREATE INDEX "Team_league_slug_idx" ON "Team"("league", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "Player_externalId_key" ON "Player"("externalId");

-- CreateIndex
CREATE INDEX "Player_sport_league_idx" ON "Player"("sport", "league");

-- CreateIndex
CREATE INDEX "Player_teamId_idx" ON "Player"("teamId");

-- CreateIndex
CREATE UNIQUE INDEX "Game_externalId_key" ON "Game"("externalId");

-- CreateIndex
CREATE INDEX "Game_sport_league_season_status_idx" ON "Game"("sport", "league", "season", "status");

-- CreateIndex
CREATE INDEX "Game_season_scheduledAt_idx" ON "Game"("season", "scheduledAt");

-- CreateIndex
CREATE INDEX "Game_homeTeamId_awayTeamId_idx" ON "Game"("homeTeamId", "awayTeamId");

-- CreateIndex
CREATE INDEX "InningEvent_gameId_inningNumber_half_sequence_idx" ON "InningEvent"("gameId", "inningNumber", "half", "sequence");

-- CreateIndex
CREATE INDEX "InningEvent_recordedAt_idx" ON "InningEvent"("recordedAt");

-- CreateIndex
CREATE INDEX "TeamSeasonStat_sport_league_season_idx" ON "TeamSeasonStat"("sport", "league", "season");

-- CreateIndex
CREATE UNIQUE INDEX "TeamSeasonStat_teamId_season_seasonType_key" ON "TeamSeasonStat"("teamId", "season", "seasonType");

-- CreateIndex
CREATE INDEX "PlayerSeasonStat_sport_league_season_idx" ON "PlayerSeasonStat"("sport", "league", "season");

-- CreateIndex
CREATE UNIQUE INDEX "PlayerSeasonStat_playerId_season_seasonType_key" ON "PlayerSeasonStat"("playerId", "season", "seasonType");

-- CreateIndex
CREATE INDEX "GamePlayerStat_gameId_teamId_idx" ON "GamePlayerStat"("gameId", "teamId");

-- CreateIndex
CREATE INDEX "GamePlayerStat_playerId_idx" ON "GamePlayerStat"("playerId");

-- CreateIndex
CREATE INDEX "Ranking_sport_league_season_week_idx" ON "Ranking"("sport", "league", "season", "week");

-- CreateIndex
CREATE UNIQUE INDEX "Ranking_pollType_season_week_teamId_key" ON "Ranking"("pollType", "season", "week", "teamId");

-- CreateIndex
CREATE UNIQUE INDEX "Article_slug_key" ON "Article"("slug");

-- CreateIndex
CREATE INDEX "Article_sport_league_status_idx" ON "Article"("sport", "league", "status");

-- CreateIndex
CREATE INDEX "Article_publishedAt_idx" ON "Article"("publishedAt");

-- AddForeignKey
ALTER TABLE "Team" ADD CONSTRAINT "Team_conferenceId_fkey" FOREIGN KEY ("conferenceId") REFERENCES "Conference"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Player" ADD CONSTRAINT "Player_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Game" ADD CONSTRAINT "Game_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "Venue"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Game" ADD CONSTRAINT "Game_homeTeamId_fkey" FOREIGN KEY ("homeTeamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Game" ADD CONSTRAINT "Game_awayTeamId_fkey" FOREIGN KEY ("awayTeamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InningEvent" ADD CONSTRAINT "InningEvent_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InningEvent" ADD CONSTRAINT "InningEvent_batterId_fkey" FOREIGN KEY ("batterId") REFERENCES "Player"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InningEvent" ADD CONSTRAINT "InningEvent_pitcherId_fkey" FOREIGN KEY ("pitcherId") REFERENCES "Player"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamSeasonStat" ADD CONSTRAINT "TeamSeasonStat_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerSeasonStat" ADD CONSTRAINT "PlayerSeasonStat_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GamePlayerStat" ADD CONSTRAINT "GamePlayerStat_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GamePlayerStat" ADD CONSTRAINT "GamePlayerStat_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GamePlayerStat" ADD CONSTRAINT "GamePlayerStat_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ranking" ADD CONSTRAINT "Ranking_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ranking" ADD CONSTRAINT "Ranking_conferenceId_fkey" FOREIGN KEY ("conferenceId") REFERENCES "Conference"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Article" ADD CONSTRAINT "Article_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

