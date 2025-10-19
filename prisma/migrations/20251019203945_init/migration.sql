-- CreateEnum
CREATE TYPE "Sport" AS ENUM ('BASEBALL', 'FOOTBALL', 'BASKETBALL');

-- CreateEnum
CREATE TYPE "Division" AS ENUM ('D1', 'D2', 'D3', 'JUCO');

-- CreateEnum
CREATE TYPE "GameStatus" AS ENUM ('SCHEDULED', 'LIVE', 'FINAL', 'POSTPONED', 'DELAYED', 'SUSPENDED', 'CANCELED');

-- CreateEnum
CREATE TYPE "SeasonType" AS ENUM ('REGULAR', 'POSTSEASON', 'CONFERENCE', 'EXHIBITION');

-- CreateEnum
CREATE TYPE "FeedPrecision" AS ENUM ('EVENT', 'PLAY', 'PITCH');

-- CreateEnum
CREATE TYPE "InningHalf" AS ENUM ('TOP', 'BOTTOM');

-- CreateEnum
CREATE TYPE "BoxLineSide" AS ENUM ('HOME', 'AWAY');

-- CreateEnum
CREATE TYPE "Position" AS ENUM ('P', 'C', 'FIRST_BASE', 'SECOND_BASE', 'THIRD_BASE', 'SHORTSTOP', 'LEFT_FIELD', 'CENTER_FIELD', 'RIGHT_FIELD', 'DESIGNATED_HITTER', 'UTILITY', 'TWO_WAY');

-- CreateEnum
CREATE TYPE "HandedEnum" AS ENUM ('R', 'L', 'S');

-- CreateEnum
CREATE TYPE "AcademicYear" AS ENUM ('FRESHMAN', 'SOPHOMORE', 'JUNIOR', 'SENIOR', 'GRADUATE');

-- CreateEnum
CREATE TYPE "PollType" AS ENUM ('COACHES', 'BASEBALL_AMERICA', 'D1BASEBALL', 'PERFECT_GAME', 'COMPOSITE');

-- CreateEnum
CREATE TYPE "ArticleType" AS ENUM ('RECAP', 'PREVIEW', 'FEATURE', 'NEWS', 'ANALYSIS');

-- CreateEnum
CREATE TYPE "ArticleStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateTable
CREATE TABLE "Conference" (
    "id" TEXT NOT NULL,
    "externalId" TEXT,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "shortName" TEXT,
    "division" "Division" NOT NULL,
    "sport" "Sport" NOT NULL DEFAULT 'BASEBALL',
    "foundedYear" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Conference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Team" (
    "id" TEXT NOT NULL,
    "externalId" TEXT,
    "conferenceId" TEXT,
    "sport" "Sport" NOT NULL DEFAULT 'BASEBALL',
    "division" "Division" NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "school" TEXT NOT NULL,
    "abbreviation" TEXT,
    "city" TEXT,
    "state" TEXT,
    "logoUrl" TEXT,
    "primaryColor" TEXT,
    "secondaryColor" TEXT,
    "foundedYear" INTEGER,
    "headCoach" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Team_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Player" (
    "id" TEXT NOT NULL,
    "externalId" TEXT,
    "teamId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "slug" TEXT,
    "jerseyNumber" TEXT,
    "position" "Position" NOT NULL,
    "bats" "HandedEnum",
    "throws" "HandedEnum",
    "year" "AcademicYear",
    "height" INTEGER,
    "weight" INTEGER,
    "hometown" TEXT,
    "birthDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Player_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Game" (
    "id" TEXT NOT NULL,
    "externalId" TEXT,
    "season" INTEGER NOT NULL,
    "seasonType" "SeasonType" NOT NULL DEFAULT 'REGULAR',
    "sport" "Sport" NOT NULL DEFAULT 'BASEBALL',
    "division" "Division" NOT NULL,
    "status" "GameStatus" NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "startTimeLocal" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "homeTeamId" TEXT NOT NULL,
    "awayTeamId" TEXT NOT NULL,
    "venueId" TEXT,
    "homeScore" INTEGER,
    "awayScore" INTEGER,
    "currentInning" INTEGER,
    "currentInningHalf" "InningHalf",
    "balls" INTEGER,
    "strikes" INTEGER,
    "outs" INTEGER,
    "providerName" TEXT NOT NULL,
    "feedPrecision" "FeedPrecision" NOT NULL DEFAULT 'EVENT',
    "lastUpdated" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Game_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "inning" INTEGER NOT NULL,
    "inningHalf" "InningHalf" NOT NULL,
    "outs" INTEGER,
    "eventType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "homeWinProb" DOUBLE PRECISION,
    "wpaSwing" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GameBoxLine" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "side" "BoxLineSide" NOT NULL,
    "battingOrder" INTEGER,
    "ab" INTEGER NOT NULL,
    "r" INTEGER NOT NULL,
    "h" INTEGER NOT NULL,
    "rbi" INTEGER NOT NULL,
    "bb" INTEGER NOT NULL,
    "so" INTEGER NOT NULL,
    "doubles" INTEGER,
    "triples" INTEGER,
    "homeRuns" INTEGER,
    "stolenBases" INTEGER,
    "caughtStealing" INTEGER,
    "totalBases" INTEGER,
    "ip" DECIMAL(5,2),
    "hitsAllowed" INTEGER,
    "runsAllowed" INTEGER,
    "earnedRuns" INTEGER,
    "bbAllowed" INTEGER,
    "soRecorded" INTEGER,
    "homeRunsAllowed" INTEGER,
    "decision" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GameBoxLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamStats" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "season" INTEGER NOT NULL,
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
    "battingAvg" DOUBLE PRECISION,
    "onBasePct" DOUBLE PRECISION,
    "sluggingPct" DOUBLE PRECISION,
    "era" DOUBLE PRECISION,
    "fieldingPct" DOUBLE PRECISION,
    "earnedRuns" INTEGER NOT NULL DEFAULT 0,
    "hitsAllowed" INTEGER NOT NULL DEFAULT 0,
    "strikeouts" INTEGER NOT NULL DEFAULT 0,
    "walks" INTEGER NOT NULL DEFAULT 0,
    "rpi" DOUBLE PRECISION,
    "strengthOfSched" DOUBLE PRECISION,
    "pythagWins" DOUBLE PRECISION,
    "lastUpdated" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeamStats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlayerStats" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "teamId" TEXT,
    "season" INTEGER NOT NULL,
    "gamesPlayed" INTEGER NOT NULL DEFAULT 0,
    "gamesStarted" INTEGER NOT NULL DEFAULT 0,
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
    "battingAvg" DOUBLE PRECISION,
    "onBasePct" DOUBLE PRECISION,
    "sluggingPct" DOUBLE PRECISION,
    "ops" DOUBLE PRECISION,
    "gamesPitched" INTEGER NOT NULL DEFAULT 0,
    "wins" INTEGER NOT NULL DEFAULT 0,
    "losses" INTEGER NOT NULL DEFAULT 0,
    "saves" INTEGER NOT NULL DEFAULT 0,
    "inningsPitched" DECIMAL(6,2) NOT NULL DEFAULT 0,
    "runsAllowed" INTEGER NOT NULL DEFAULT 0,
    "earnedRuns" INTEGER NOT NULL DEFAULT 0,
    "hitsAllowed" INTEGER NOT NULL DEFAULT 0,
    "walksAllowed" INTEGER NOT NULL DEFAULT 0,
    "homeRunsAllowed" INTEGER NOT NULL DEFAULT 0,
    "era" DOUBLE PRECISION,
    "whip" DOUBLE PRECISION,
    "strikeoutsPerNine" DOUBLE PRECISION,
    "walksPerNine" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlayerStats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ranking" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "pollType" "PollType" NOT NULL,
    "season" INTEGER NOT NULL,
    "week" INTEGER NOT NULL,
    "rank" INTEGER NOT NULL,
    "previousRank" INTEGER,
    "points" INTEGER,
    "firstPlaceVotes" INTEGER,
    "publishedDate" TIMESTAMP(3),
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
    "type" "ArticleType" NOT NULL,
    "status" "ArticleStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "author" TEXT,
    "teamId" TEXT,
    "gameId" TEXT,
    "heroImageUrl" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Article_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Conference_externalId_key" ON "Conference"("externalId");

-- CreateIndex
CREATE UNIQUE INDEX "Conference_slug_key" ON "Conference"("slug");

-- CreateIndex
CREATE INDEX "Conference_division_sport_idx" ON "Conference"("division", "sport");

-- CreateIndex
CREATE UNIQUE INDEX "Team_externalId_key" ON "Team"("externalId");

-- CreateIndex
CREATE UNIQUE INDEX "Team_slug_key" ON "Team"("slug");

-- CreateIndex
CREATE INDEX "Team_conferenceId_idx" ON "Team"("conferenceId");

-- CreateIndex
CREATE INDEX "Team_division_idx" ON "Team"("division");

-- CreateIndex
CREATE UNIQUE INDEX "Player_externalId_key" ON "Player"("externalId");

-- CreateIndex
CREATE UNIQUE INDEX "Player_slug_key" ON "Player"("slug");

-- CreateIndex
CREATE INDEX "Player_teamId_idx" ON "Player"("teamId");

-- CreateIndex
CREATE UNIQUE INDEX "Game_externalId_key" ON "Game"("externalId");

-- CreateIndex
CREATE INDEX "Game_season_status_idx" ON "Game"("season", "status");

-- CreateIndex
CREATE INDEX "Game_scheduledAt_idx" ON "Game"("scheduledAt");

-- CreateIndex
CREATE INDEX "Game_homeTeamId_idx" ON "Game"("homeTeamId");

-- CreateIndex
CREATE INDEX "Game_awayTeamId_idx" ON "Game"("awayTeamId");

-- CreateIndex
CREATE INDEX "Event_gameId_idx" ON "Event"("gameId");

-- CreateIndex
CREATE UNIQUE INDEX "Event_gameId_sequence_key" ON "Event"("gameId", "sequence");

-- CreateIndex
CREATE INDEX "GameBoxLine_gameId_side_idx" ON "GameBoxLine"("gameId", "side");

-- CreateIndex
CREATE INDEX "GameBoxLine_teamId_idx" ON "GameBoxLine"("teamId");

-- CreateIndex
CREATE UNIQUE INDEX "GameBoxLine_gameId_playerId_key" ON "GameBoxLine"("gameId", "playerId");

-- CreateIndex
CREATE INDEX "TeamStats_season_idx" ON "TeamStats"("season");

-- CreateIndex
CREATE UNIQUE INDEX "TeamStats_teamId_season_key" ON "TeamStats"("teamId", "season");

-- CreateIndex
CREATE INDEX "PlayerStats_teamId_idx" ON "PlayerStats"("teamId");

-- CreateIndex
CREATE INDEX "PlayerStats_season_idx" ON "PlayerStats"("season");

-- CreateIndex
CREATE UNIQUE INDEX "PlayerStats_playerId_season_key" ON "PlayerStats"("playerId", "season");

-- CreateIndex
CREATE INDEX "Ranking_season_week_idx" ON "Ranking"("season", "week");

-- CreateIndex
CREATE UNIQUE INDEX "Ranking_pollType_season_week_teamId_key" ON "Ranking"("pollType", "season", "week", "teamId");

-- CreateIndex
CREATE UNIQUE INDEX "Article_slug_key" ON "Article"("slug");

-- CreateIndex
CREATE INDEX "Article_teamId_idx" ON "Article"("teamId");

-- CreateIndex
CREATE INDEX "Article_gameId_idx" ON "Article"("gameId");

-- CreateIndex
CREATE INDEX "Article_type_status_idx" ON "Article"("type", "status");

-- AddForeignKey
ALTER TABLE "Team" ADD CONSTRAINT "Team_conferenceId_fkey" FOREIGN KEY ("conferenceId") REFERENCES "Conference"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Player" ADD CONSTRAINT "Player_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Game" ADD CONSTRAINT "Game_homeTeamId_fkey" FOREIGN KEY ("homeTeamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Game" ADD CONSTRAINT "Game_awayTeamId_fkey" FOREIGN KEY ("awayTeamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameBoxLine" ADD CONSTRAINT "GameBoxLine_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameBoxLine" ADD CONSTRAINT "GameBoxLine_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameBoxLine" ADD CONSTRAINT "GameBoxLine_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamStats" ADD CONSTRAINT "TeamStats_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerStats" ADD CONSTRAINT "PlayerStats_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerStats" ADD CONSTRAINT "PlayerStats_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ranking" ADD CONSTRAINT "Ranking_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Article" ADD CONSTRAINT "Article_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Article" ADD CONSTRAINT "Article_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE SET NULL ON UPDATE CASCADE;

