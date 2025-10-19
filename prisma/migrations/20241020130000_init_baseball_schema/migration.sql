-- CreateEnum
CREATE TYPE "Division" AS ENUM ('D1', 'D2', 'D3', 'JUCO');

-- CreateEnum
CREATE TYPE "GameStatus" AS ENUM ('SCHEDULED', 'LIVE', 'FINAL', 'POSTPONED', 'DELAYED', 'SUSPENDED', 'CANCELED');

-- CreateEnum
CREATE TYPE "GameSide" AS ENUM ('HOME', 'AWAY');

-- CreateEnum
CREATE TYPE "InningHalf" AS ENUM ('TOP', 'BOTTOM');

-- CreateEnum
CREATE TYPE "PollType" AS ENUM ('COACHES', 'BASEBALL_AMERICA', 'D1BASEBALL', 'PERFECT_GAME', 'COMPOSITE');

-- CreateEnum
CREATE TYPE "Position" AS ENUM ('P', 'C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF', 'DH', 'UTL');

-- CreateEnum
CREATE TYPE "HandedEnum" AS ENUM ('L', 'R', 'S');

-- CreateEnum
CREATE TYPE "AcademicYear" AS ENUM ('FRESHMAN', 'SOPHOMORE', 'JUNIOR', 'SENIOR', 'GRADUATE', 'OTHER');

-- CreateEnum
CREATE TYPE "PitchingDecision" AS ENUM ('W', 'L', 'S');

-- CreateTable
CREATE TABLE "Conference" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "shortName" TEXT,
    "division" "Division" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Conference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Team" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "school" TEXT NOT NULL,
    "abbreviation" TEXT,
    "conferenceId" TEXT NOT NULL,
    "division" "Division" NOT NULL,
    "city" TEXT,
    "state" TEXT,
    "logoUrl" TEXT,
    "primaryColor" TEXT,
    "secondaryColor" TEXT,
    "foundedYear" INTEGER,
    "stadium" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Team_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Player" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "jerseyNumber" TEXT,
    "position" "Position" NOT NULL,
    "bats" "HandedEnum",
    "throws" "HandedEnum",
    "year" "AcademicYear",
    "height" INTEGER,
    "weight" INTEGER,
    "hometown" TEXT,
    "highSchool" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Player_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlayerStats" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "season" INTEGER NOT NULL,
    "teamId" TEXT,
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
    "battingAvg" DOUBLE PRECISION,
    "onBasePct" DOUBLE PRECISION,
    "sluggingPct" DOUBLE PRECISION,
    "gamesPitched" INTEGER NOT NULL DEFAULT 0,
    "gamesStarted" INTEGER NOT NULL DEFAULT 0,
    "wins" INTEGER NOT NULL DEFAULT 0,
    "losses" INTEGER NOT NULL DEFAULT 0,
    "saves" INTEGER NOT NULL DEFAULT 0,
    "inningsPitched" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "hitsAllowed" INTEGER NOT NULL DEFAULT 0,
    "runsAllowed" INTEGER NOT NULL DEFAULT 0,
    "earnedRuns" INTEGER NOT NULL DEFAULT 0,
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
CREATE TABLE "TeamStats" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "season" INTEGER NOT NULL,
    "wins" INTEGER NOT NULL DEFAULT 0,
    "losses" INTEGER NOT NULL DEFAULT 0,
    "confWins" INTEGER NOT NULL DEFAULT 0,
    "confLosses" INTEGER NOT NULL DEFAULT 0,
    "runsScored" INTEGER NOT NULL DEFAULT 0,
    "hitsTotal" INTEGER NOT NULL DEFAULT 0,
    "homeRuns" INTEGER NOT NULL DEFAULT 0,
    "stolenBases" INTEGER NOT NULL DEFAULT 0,
    "battingAvg" DOUBLE PRECISION,
    "onBasePct" DOUBLE PRECISION,
    "sluggingPct" DOUBLE PRECISION,
    "runsAllowed" INTEGER NOT NULL DEFAULT 0,
    "earnedRuns" INTEGER NOT NULL DEFAULT 0,
    "hitsAllowed" INTEGER NOT NULL DEFAULT 0,
    "strikeouts" INTEGER NOT NULL DEFAULT 0,
    "walks" INTEGER NOT NULL DEFAULT 0,
    "era" DOUBLE PRECISION,
    "whip" DOUBLE PRECISION,
    "pythagWins" DOUBLE PRECISION,
    "strengthOfSched" DOUBLE PRECISION,
    "rpi" DOUBLE PRECISION,
    "homeWins" INTEGER NOT NULL DEFAULT 0,
    "homeLosses" INTEGER NOT NULL DEFAULT 0,
    "awayWins" INTEGER NOT NULL DEFAULT 0,
    "awayLosses" INTEGER NOT NULL DEFAULT 0,
    "neutralWins" INTEGER NOT NULL DEFAULT 0,
    "neutralLosses" INTEGER NOT NULL DEFAULT 0,
    "lastUpdated" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeamStats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Game" (
    "id" TEXT NOT NULL,
    "season" INTEGER NOT NULL,
    "sport" TEXT NOT NULL DEFAULT 'BASEBALL',
    "status" "GameStatus" NOT NULL DEFAULT 'SCHEDULED',
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "venue" TEXT,
    "attendance" INTEGER,
    "broadcast" TEXT,
    "notes" TEXT,
    "homeTeamId" TEXT NOT NULL,
    "awayTeamId" TEXT NOT NULL,
    "homeScore" INTEGER,
    "awayScore" INTEGER,
    "conferenceGame" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Game_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GameEvent" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "inning" INTEGER NOT NULL,
    "inningHalf" "InningHalf" NOT NULL,
    "outs" INTEGER NOT NULL,
    "eventType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "homeWinProb" DOUBLE PRECISION,
    "wpaSwing" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GameEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GameBoxLine" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "side" "GameSide" NOT NULL,
    "lineupSlot" INTEGER,
    "defensivePos" "Position",
    "ab" INTEGER NOT NULL DEFAULT 0,
    "r" INTEGER NOT NULL DEFAULT 0,
    "h" INTEGER NOT NULL DEFAULT 0,
    "rbi" INTEGER NOT NULL DEFAULT 0,
    "bb" INTEGER NOT NULL DEFAULT 0,
    "so" INTEGER NOT NULL DEFAULT 0,
    "doubles" INTEGER NOT NULL DEFAULT 0,
    "triples" INTEGER NOT NULL DEFAULT 0,
    "homeRuns" INTEGER NOT NULL DEFAULT 0,
    "sb" INTEGER NOT NULL DEFAULT 0,
    "cs" INTEGER NOT NULL DEFAULT 0,
    "ip" DOUBLE PRECISION,
    "hitsAllowed" INTEGER,
    "runsAllowed" INTEGER,
    "earnedRuns" INTEGER,
    "bbAllowed" INTEGER,
    "soRecorded" INTEGER,
    "homeRunsAllowed" INTEGER,
    "decision" "PitchingDecision",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GameBoxLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ranking" (
    "id" TEXT NOT NULL,
    "pollType" "PollType" NOT NULL,
    "season" INTEGER NOT NULL,
    "week" INTEGER NOT NULL,
    "rank" INTEGER NOT NULL,
    "previousRank" INTEGER,
    "points" INTEGER,
    "firstPlaceVotes" INTEGER,
    "teamId" TEXT NOT NULL,
    "publishedDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Ranking_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Conference_slug_key" ON "Conference"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Team_slug_key" ON "Team"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "PlayerStats_playerId_season_key" ON "PlayerStats"("playerId", "season");

-- CreateIndex
CREATE UNIQUE INDEX "TeamStats_teamId_season_key" ON "TeamStats"("teamId", "season");

-- CreateIndex
CREATE UNIQUE INDEX "GameEvent_gameId_sequence_key" ON "GameEvent"("gameId", "sequence");

-- CreateIndex
CREATE UNIQUE INDEX "GameBoxLine_gameId_playerId_side_key" ON "GameBoxLine"("gameId", "playerId", "side");

-- CreateIndex
CREATE INDEX "Ranking_teamId_season_week_idx" ON "Ranking"("teamId", "season", "week");

-- CreateIndex
CREATE UNIQUE INDEX "Ranking_pollType_season_week_rank_key" ON "Ranking"("pollType", "season", "week", "rank");

-- AddForeignKey
ALTER TABLE "Team" ADD CONSTRAINT "Team_conferenceId_fkey" FOREIGN KEY ("conferenceId") REFERENCES "Conference"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Player" ADD CONSTRAINT "Player_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerStats" ADD CONSTRAINT "PlayerStats_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerStats" ADD CONSTRAINT "PlayerStats_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamStats" ADD CONSTRAINT "TeamStats_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Game" ADD CONSTRAINT "Game_homeTeamId_fkey" FOREIGN KEY ("homeTeamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Game" ADD CONSTRAINT "Game_awayTeamId_fkey" FOREIGN KEY ("awayTeamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameEvent" ADD CONSTRAINT "GameEvent_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameBoxLine" ADD CONSTRAINT "GameBoxLine_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameBoxLine" ADD CONSTRAINT "GameBoxLine_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ranking" ADD CONSTRAINT "Ranking_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

