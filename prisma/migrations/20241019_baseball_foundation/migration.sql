-- CreateEnum
CREATE TYPE "Sport" AS ENUM ('BASEBALL', 'SOFTBALL', 'LACROSSE');

-- CreateEnum
CREATE TYPE "GameStatus" AS ENUM ('SCHEDULED', 'LIVE', 'FINAL', 'POSTPONED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "SeasonType" AS ENUM ('REGULAR', 'POSTSEASON');

-- CreateEnum
CREATE TYPE "InningHalf" AS ENUM ('TOP', 'BOTTOM');

-- CreateEnum
CREATE TYPE "FeedPrecision" AS ENUM ('EVENT', 'PITCH', 'PLAY');

-- CreateEnum
CREATE TYPE "StatScope" AS ENUM ('GAME', 'SEASON');

-- CreateEnum
CREATE TYPE "ArticleStatus" AS ENUM ('DRAFT', 'REVIEW', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "BoxRole" AS ENUM ('BATTING', 'PITCHING', 'FIELDING');

-- CreateTable
CREATE TABLE "Conference" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sport" "Sport" NOT NULL,
    "division" TEXT,
    "shortName" TEXT,
    "region" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Conference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Team" (
    "id" TEXT NOT NULL,
    "externalId" TEXT,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nickname" TEXT,
    "sport" "Sport" NOT NULL,
    "division" TEXT NOT NULL DEFAULT 'D1',
    "school" TEXT,
    "abbreviation" TEXT,
    "city" TEXT,
    "state" TEXT,
    "primaryColor" TEXT,
    "secondaryColor" TEXT,
    "logoUrl" TEXT,
    "foundedYear" INTEGER,
    "conferenceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Team_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Player" (
    "id" TEXT NOT NULL,
    "externalId" TEXT,
    "slug" TEXT,
    "teamId" TEXT,
    "firstName" TEXT,
    "lastName" TEXT,
    "fullName" TEXT NOT NULL,
    "position" TEXT,
    "jerseyNumber" INTEGER,
    "bats" TEXT,
    "throws" TEXT,
    "height" TEXT,
    "weight" INTEGER,
    "classYear" TEXT,
    "eligibility" TEXT,
    "hometown" TEXT,
    "homeState" TEXT,
    "birthDate" TIMESTAMP(3),
    "bio" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Player_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Game" (
    "id" TEXT NOT NULL,
    "externalId" TEXT,
    "sport" "Sport" NOT NULL,
    "division" TEXT NOT NULL DEFAULT 'D1',
    "season" INTEGER NOT NULL,
    "seasonType" "SeasonType" NOT NULL DEFAULT 'REGULAR',
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "status" "GameStatus" NOT NULL DEFAULT 'SCHEDULED',
    "venue" TEXT,
    "city" TEXT,
    "state" TEXT,
    "attendance" INTEGER,
    "weather" JSONB,
    "providerName" TEXT NOT NULL,
    "feedPrecision" "FeedPrecision" NOT NULL DEFAULT 'EVENT',
    "currentInning" INTEGER,
    "currentInningHalf" "InningHalf",
    "balls" INTEGER,
    "strikes" INTEGER,
    "outs" INTEGER,
    "homeScore" INTEGER DEFAULT 0,
    "awayScore" INTEGER DEFAULT 0,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "homeTeamId" TEXT NOT NULL,
    "awayTeamId" TEXT NOT NULL,

    CONSTRAINT "Game_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "inning" INTEGER,
    "halfInning" "InningHalf",
    "eventType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "outsBefore" INTEGER,
    "outsAfter" INTEGER,
    "homeScore" INTEGER,
    "awayScore" INTEGER,
    "runners" JSONB,
    "metadata" JSONB,
    "batterId" TEXT,
    "pitcherId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BoxLine" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "playerId" TEXT,
    "role" "BoxRole" NOT NULL,
    "sequence" INTEGER,
    "started" BOOLEAN NOT NULL DEFAULT false,
    "summary" JSONB,
    "atBats" INTEGER,
    "runs" INTEGER,
    "hits" INTEGER,
    "doubles" INTEGER,
    "triples" INTEGER,
    "homeRuns" INTEGER,
    "rbis" INTEGER,
    "walks" INTEGER,
    "strikeouts" INTEGER,
    "stolenBases" INTEGER,
    "inningsPitched" DECIMAL(4,2),
    "hitsAllowed" INTEGER,
    "runsAllowed" INTEGER,
    "earnedRuns" INTEGER,
    "walksAllowed" INTEGER,
    "strikeoutsPitched" INTEGER,
    "pitches" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BoxLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamStats" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "season" INTEGER NOT NULL,
    "scope" "StatScope" NOT NULL DEFAULT 'SEASON',
    "gameId" TEXT,
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
    "battingAvg" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "era" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "fieldingPct" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "strengthOfSched" DOUBLE PRECISION DEFAULT 0,
    "rpi" DOUBLE PRECISION DEFAULT 0,
    "pythagWins" DOUBLE PRECISION DEFAULT 0,
    "lastSyncedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeamStats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlayerStats" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "season" INTEGER NOT NULL,
    "scope" "StatScope" NOT NULL DEFAULT 'SEASON',
    "gameId" TEXT,
    "gamesPlayed" INTEGER NOT NULL DEFAULT 0,
    "atBats" INTEGER NOT NULL DEFAULT 0,
    "runs" INTEGER NOT NULL DEFAULT 0,
    "hits" INTEGER NOT NULL DEFAULT 0,
    "doubles" INTEGER NOT NULL DEFAULT 0,
    "triples" INTEGER NOT NULL DEFAULT 0,
    "homeRuns" INTEGER NOT NULL DEFAULT 0,
    "rbis" INTEGER NOT NULL DEFAULT 0,
    "walks" INTEGER NOT NULL DEFAULT 0,
    "strikeouts" INTEGER NOT NULL DEFAULT 0,
    "stolenBases" INTEGER NOT NULL DEFAULT 0,
    "inningsPitched" DECIMAL(5,2),
    "strikeoutsPitched" INTEGER DEFAULT 0,
    "era" DOUBLE PRECISION DEFAULT 0,
    "whip" DOUBLE PRECISION DEFAULT 0,
    "battingAvg" DOUBLE PRECISION DEFAULT 0,
    "obp" DOUBLE PRECISION DEFAULT 0,
    "slg" DOUBLE PRECISION DEFAULT 0,
    "ops" DOUBLE PRECISION DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlayerStats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ranking" (
    "id" TEXT NOT NULL,
    "sport" "Sport" NOT NULL,
    "poll" TEXT NOT NULL,
    "season" INTEGER NOT NULL,
    "week" INTEGER NOT NULL,
    "rank" INTEGER NOT NULL,
    "teamId" TEXT NOT NULL,
    "points" INTEGER,
    "firstPlaceVotes" INTEGER,
    "releasedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "conferenceId" TEXT,

    CONSTRAINT "Ranking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Article" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "body" TEXT NOT NULL,
    "status" "ArticleStatus" NOT NULL DEFAULT 'DRAFT',
    "sport" "Sport" NOT NULL,
    "teamId" TEXT,
    "gameId" TEXT,
    "author" TEXT,
    "source" TEXT,
    "tags" TEXT[],
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Article_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Conference_slug_key" ON "Conference"("slug");

-- CreateIndex
CREATE INDEX "Conference_sport_division_idx" ON "Conference"("sport", "division");

-- CreateIndex
CREATE UNIQUE INDEX "Team_externalId_key" ON "Team"("externalId");

-- CreateIndex
CREATE UNIQUE INDEX "Team_slug_key" ON "Team"("slug");

-- CreateIndex
CREATE INDEX "Team_sport_division_idx" ON "Team"("sport", "division");

-- CreateIndex
CREATE UNIQUE INDEX "Player_externalId_key" ON "Player"("externalId");

-- CreateIndex
CREATE UNIQUE INDEX "Player_slug_key" ON "Player"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Game_externalId_key" ON "Game"("externalId");

-- CreateIndex
CREATE INDEX "Game_sport_season_seasonType_idx" ON "Game"("sport", "season", "seasonType");

-- CreateIndex
CREATE INDEX "Game_scheduledAt_idx" ON "Game"("scheduledAt");

-- CreateIndex
CREATE INDEX "Event_eventType_idx" ON "Event"("eventType");

-- CreateIndex
CREATE UNIQUE INDEX "Event_gameId_sequence_key" ON "Event"("gameId", "sequence");

-- CreateIndex
CREATE INDEX "BoxLine_gameId_teamId_idx" ON "BoxLine"("gameId", "teamId");

-- CreateIndex
CREATE INDEX "BoxLine_playerId_idx" ON "BoxLine"("playerId");

-- CreateIndex
CREATE UNIQUE INDEX "BoxLine_gameId_teamId_playerId_role_key" ON "BoxLine"("gameId", "teamId", "playerId", "role");

-- CreateIndex
CREATE INDEX "TeamStats_season_idx" ON "TeamStats"("season");

-- CreateIndex
CREATE INDEX "TeamStats_gameId_idx" ON "TeamStats"("gameId");

-- CreateIndex
CREATE UNIQUE INDEX "TeamStats_teamId_season_scope_key" ON "TeamStats"("teamId", "season", "scope");

-- CreateIndex
CREATE INDEX "PlayerStats_teamId_idx" ON "PlayerStats"("teamId");

-- CreateIndex
CREATE INDEX "PlayerStats_gameId_idx" ON "PlayerStats"("gameId");

-- CreateIndex
CREATE UNIQUE INDEX "PlayerStats_playerId_season_scope_key" ON "PlayerStats"("playerId", "season", "scope");

-- CreateIndex
CREATE INDEX "Ranking_season_week_idx" ON "Ranking"("season", "week");

-- CreateIndex
CREATE UNIQUE INDEX "Ranking_poll_season_week_teamId_key" ON "Ranking"("poll", "season", "week", "teamId");

-- CreateIndex
CREATE UNIQUE INDEX "Article_slug_key" ON "Article"("slug");

-- AddForeignKey
ALTER TABLE "Team" ADD CONSTRAINT "Team_conferenceId_fkey" FOREIGN KEY ("conferenceId") REFERENCES "Conference"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Player" ADD CONSTRAINT "Player_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Game" ADD CONSTRAINT "Game_homeTeamId_fkey" FOREIGN KEY ("homeTeamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Game" ADD CONSTRAINT "Game_awayTeamId_fkey" FOREIGN KEY ("awayTeamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_batterId_fkey" FOREIGN KEY ("batterId") REFERENCES "Player"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_pitcherId_fkey" FOREIGN KEY ("pitcherId") REFERENCES "Player"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BoxLine" ADD CONSTRAINT "BoxLine_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BoxLine" ADD CONSTRAINT "BoxLine_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BoxLine" ADD CONSTRAINT "BoxLine_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamStats" ADD CONSTRAINT "TeamStats_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamStats" ADD CONSTRAINT "TeamStats_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerStats" ADD CONSTRAINT "PlayerStats_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerStats" ADD CONSTRAINT "PlayerStats_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerStats" ADD CONSTRAINT "PlayerStats_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ranking" ADD CONSTRAINT "Ranking_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ranking" ADD CONSTRAINT "Ranking_conferenceId_fkey" FOREIGN KEY ("conferenceId") REFERENCES "Conference"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Article" ADD CONSTRAINT "Article_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Article" ADD CONSTRAINT "Article_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE SET NULL ON UPDATE CASCADE;

