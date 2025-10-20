-- CreateEnum
CREATE TYPE "Sport" AS ENUM ('BASEBALL', 'BASKETBALL', 'FOOTBALL', 'SOFTBALL');

-- CreateEnum
CREATE TYPE "Division" AS ENUM ('D1', 'D2', 'D3', 'JUCO', 'FBS', 'FCS');

-- CreateEnum
CREATE TYPE "SeasonType" AS ENUM ('REGULAR', 'POSTSEASON');

-- CreateEnum
CREATE TYPE "GameStatus" AS ENUM ('SCHEDULED', 'LIVE', 'FINAL', 'POSTPONED', 'DELAYED', 'SUSPENDED', 'CANCELED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "InningHalf" AS ENUM ('TOP', 'BOTTOM');

-- CreateEnum
CREATE TYPE "FeedPrecision" AS ENUM ('EVENT', 'PLAY', 'PITCH');

-- CreateEnum
CREATE TYPE "ArticleStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ArticleCategory" AS ENUM ('NEWS', 'PREVIEW', 'RECAP', 'FEATURE', 'ANALYSIS');

-- CreateEnum
CREATE TYPE "TeamSide" AS ENUM ('HOME', 'AWAY');

-- CreateEnum
CREATE TYPE "Position" AS ENUM ('P', 'C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF', 'DH', 'UTIL');

-- CreateEnum
CREATE TYPE "HandedEnum" AS ENUM ('LEFT', 'RIGHT', 'SWITCH');

-- CreateEnum
CREATE TYPE "AcademicYear" AS ENUM ('FRESHMAN', 'SOPHOMORE', 'JUNIOR', 'SENIOR', 'SUPER_SENIOR', 'GRADUATE', 'TRANSFER');

-- CreateTable
CREATE TABLE "conferences" (
    "id" TEXT NOT NULL,
    "sport" "Sport" NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "abbreviation" TEXT,
    "division" "Division",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "conferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "venues" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "city" TEXT,
    "state" TEXT,
    "capacity" INTEGER,
    "surface" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "venues_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teams" (
    "id" TEXT NOT NULL,
    "sport" "Sport" NOT NULL,
    "division" "Division",
    "externalId" TEXT NOT NULL,
    "globalTeamId" TEXT,
    "key" TEXT,
    "slug" TEXT NOT NULL,
    "city" TEXT,
    "name" TEXT NOT NULL,
    "school" TEXT,
    "nickname" TEXT,
    "abbreviation" TEXT,
    "conferenceId" TEXT,
    "stadiumName" TEXT,
    "stadiumCapacity" INTEGER,
    "logoUrl" TEXT,
    "primaryColor" TEXT,
    "secondaryColor" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "teams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "players" (
    "id" TEXT NOT NULL,
    "sport" "Sport" NOT NULL,
    "externalId" TEXT NOT NULL,
    "teamId" TEXT,
    "firstName" TEXT,
    "lastName" TEXT,
    "fullName" TEXT NOT NULL,
    "nickname" TEXT,
    "jerseyNumber" TEXT,
    "position" "Position",
    "bats" "HandedEnum",
    "throws" "HandedEnum",
    "year" "AcademicYear",
    "heightInches" INTEGER,
    "weightLbs" INTEGER,
    "birthDate" TIMESTAMP(3),
    "birthCity" TEXT,
    "birthState" TEXT,
    "hometown" TEXT,
    "status" TEXT,
    "photoUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "players_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "games" (
    "id" TEXT NOT NULL,
    "sport" "Sport" NOT NULL,
    "division" "Division",
    "externalId" TEXT NOT NULL,
    "season" INTEGER NOT NULL,
    "seasonType" "SeasonType" NOT NULL DEFAULT 'REGULAR',
    "week" INTEGER,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "status" "GameStatus" NOT NULL,
    "venueId" TEXT,
    "venueNameOverride" TEXT,
    "homeTeamId" TEXT NOT NULL,
    "awayTeamId" TEXT NOT NULL,
    "homeScore" INTEGER,
    "awayScore" INTEGER,
    "currentInning" INTEGER,
    "currentInningHalf" "InningHalf",
    "balls" INTEGER,
    "strikes" INTEGER,
    "outs" INTEGER,
    "providerName" TEXT NOT NULL,
    "feedPrecision" "FeedPrecision" NOT NULL,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "archivedAt" TIMESTAMP(3),
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "games_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inning_events" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "inning" INTEGER NOT NULL,
    "inningHalf" "InningHalf" NOT NULL,
    "outs" INTEGER,
    "eventType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "batterId" TEXT,
    "pitcherId" TEXT,
    "homeScore" INTEGER,
    "awayScore" INTEGER,
    "homeWinProb" DOUBLE PRECISION,
    "wpaSwing" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inning_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "game_box_lines" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "side" "TeamSide" NOT NULL,
    "ab" INTEGER NOT NULL DEFAULT 0,
    "r" INTEGER NOT NULL DEFAULT 0,
    "h" INTEGER NOT NULL DEFAULT 0,
    "rbi" INTEGER NOT NULL DEFAULT 0,
    "bb" INTEGER NOT NULL DEFAULT 0,
    "so" INTEGER NOT NULL DEFAULT 0,
    "doubles" INTEGER NOT NULL DEFAULT 0,
    "triples" INTEGER NOT NULL DEFAULT 0,
    "homeRuns" INTEGER NOT NULL DEFAULT 0,
    "stolenBases" INTEGER NOT NULL DEFAULT 0,
    "caughtStealing" INTEGER NOT NULL DEFAULT 0,
    "totalBases" INTEGER NOT NULL DEFAULT 0,
    "ip" DOUBLE PRECISION,
    "hitsAllowed" INTEGER,
    "runsAllowed" INTEGER,
    "earnedRuns" INTEGER,
    "bbAllowed" INTEGER,
    "soRecorded" INTEGER,
    "pitchCount" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "game_box_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "team_season_stats" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "sport" "Sport" NOT NULL,
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
    "doubles" INTEGER NOT NULL DEFAULT 0,
    "triples" INTEGER NOT NULL DEFAULT 0,
    "homeRuns" INTEGER NOT NULL DEFAULT 0,
    "stolenBases" INTEGER NOT NULL DEFAULT 0,
    "caughtStealing" INTEGER NOT NULL DEFAULT 0,
    "battingAvg" DOUBLE PRECISION,
    "onBasePct" DOUBLE PRECISION,
    "sluggingPct" DOUBLE PRECISION,
    "ops" DOUBLE PRECISION,
    "fieldingPct" DOUBLE PRECISION,
    "earnedRuns" INTEGER NOT NULL DEFAULT 0,
    "hitsAllowed" INTEGER NOT NULL DEFAULT 0,
    "strikeouts" INTEGER NOT NULL DEFAULT 0,
    "walks" INTEGER NOT NULL DEFAULT 0,
    "era" DOUBLE PRECISION,
    "whip" DOUBLE PRECISION,
    "confStanding" INTEGER,
    "nationalRank" INTEGER,
    "pythagWins" DOUBLE PRECISION,
    "strengthOfSched" DOUBLE PRECISION,
    "rpi" DOUBLE PRECISION,
    "recentForm" TEXT,
    "injuryImpact" DOUBLE PRECISION,
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "team_season_stats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "articles" (
    "id" TEXT NOT NULL,
    "sport" "Sport" NOT NULL,
    "category" "ArticleCategory" NOT NULL,
    "status" "ArticleStatus" NOT NULL DEFAULT 'DRAFT',
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "summary" TEXT,
    "body" TEXT NOT NULL,
    "authorId" TEXT,
    "gameId" TEXT,
    "teamId" TEXT,
    "playerId" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "articles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "conferences_slug_key" ON "conferences"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "conferences_sport_name_key" ON "conferences"("sport", "name");

-- CreateIndex
CREATE UNIQUE INDEX "teams_slug_key" ON "teams"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "teams_sport_externalId_key" ON "teams"("sport", "externalId");

-- CreateIndex
CREATE UNIQUE INDEX "players_sport_externalId_key" ON "players"("sport", "externalId");

-- CreateIndex
CREATE UNIQUE INDEX "games_externalId_key" ON "games"("externalId");

-- CreateIndex
CREATE INDEX "games_sport_season_seasonType_idx" ON "games"("sport", "season", "seasonType");

-- CreateIndex
CREATE INDEX "games_scheduledAt_idx" ON "games"("scheduledAt");

-- CreateIndex
CREATE INDEX "games_homeTeamId_idx" ON "games"("homeTeamId");

-- CreateIndex
CREATE INDEX "games_awayTeamId_idx" ON "games"("awayTeamId");

-- CreateIndex
CREATE INDEX "idx_inning_event_game_sequence" ON "inning_events"("gameId", "sequence");

-- CreateIndex
CREATE INDEX "game_box_lines_gameId_idx" ON "game_box_lines"("gameId");

-- CreateIndex
CREATE INDEX "game_box_lines_teamId_idx" ON "game_box_lines"("teamId");

-- CreateIndex
CREATE INDEX "game_box_lines_playerId_idx" ON "game_box_lines"("playerId");

-- CreateIndex
CREATE UNIQUE INDEX "game_box_lines_gameId_playerId_side_key" ON "game_box_lines"("gameId", "playerId", "side");

-- CreateIndex
CREATE INDEX "team_season_stats_sport_season_seasonType_idx" ON "team_season_stats"("sport", "season", "seasonType");

-- CreateIndex
CREATE UNIQUE INDEX "team_season_stats_teamId_season_seasonType_key" ON "team_season_stats"("teamId", "season", "seasonType");

-- CreateIndex
CREATE UNIQUE INDEX "articles_slug_key" ON "articles"("slug");

-- CreateIndex
CREATE INDEX "articles_sport_status_idx" ON "articles"("sport", "status");

-- CreateIndex
CREATE INDEX "articles_gameId_idx" ON "articles"("gameId");

-- AddForeignKey
ALTER TABLE "teams" ADD CONSTRAINT "teams_conferenceId_fkey" FOREIGN KEY ("conferenceId") REFERENCES "conferences"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "players" ADD CONSTRAINT "players_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "games" ADD CONSTRAINT "games_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "venues"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "games" ADD CONSTRAINT "games_homeTeamId_fkey" FOREIGN KEY ("homeTeamId") REFERENCES "teams"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "games" ADD CONSTRAINT "games_awayTeamId_fkey" FOREIGN KEY ("awayTeamId") REFERENCES "teams"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inning_events" ADD CONSTRAINT "inning_events_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "games"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inning_events" ADD CONSTRAINT "inning_events_batterId_fkey" FOREIGN KEY ("batterId") REFERENCES "players"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inning_events" ADD CONSTRAINT "inning_events_pitcherId_fkey" FOREIGN KEY ("pitcherId") REFERENCES "players"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "game_box_lines" ADD CONSTRAINT "game_box_lines_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "games"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "game_box_lines" ADD CONSTRAINT "game_box_lines_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "game_box_lines" ADD CONSTRAINT "game_box_lines_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_season_stats" ADD CONSTRAINT "team_season_stats_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "articles" ADD CONSTRAINT "articles_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "games"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "articles" ADD CONSTRAINT "articles_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "articles" ADD CONSTRAINT "articles_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "players"("id") ON DELETE SET NULL ON UPDATE CASCADE;

