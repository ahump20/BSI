-- CreateEnum
CREATE TYPE "Division" AS ENUM ('D1', 'D2', 'D3', 'JUCO', 'NAIA', 'OTHER');

-- CreateEnum
CREATE TYPE "Sport" AS ENUM ('BASEBALL', 'SOFTBALL', 'BASKETBALL', 'FOOTBALL', 'VOLLEYBALL', 'LACROSSE', 'OTHER');

-- CreateEnum
CREATE TYPE "SeasonType" AS ENUM ('REGULAR', 'POSTSEASON', 'CONFERENCE', 'TOURNAMENT', 'EXHIBITION');

-- CreateEnum
CREATE TYPE "GameStatus" AS ENUM ('SCHEDULED', 'LIVE', 'FINAL', 'POSTPONED', 'DELAYED', 'SUSPENDED', 'CANCELED');

-- CreateEnum
CREATE TYPE "InningHalf" AS ENUM ('TOP', 'MIDDLE', 'BOTTOM', 'END');

-- CreateEnum
CREATE TYPE "BoxLineSide" AS ENUM ('HOME', 'AWAY');

-- CreateEnum
CREATE TYPE "Position" AS ENUM ('P', 'C', 'FIRST_BASE', 'SECOND_BASE', 'THIRD_BASE', 'SHORTSTOP', 'LEFT_FIELD', 'CENTER_FIELD', 'RIGHT_FIELD', 'INFIELD', 'OUTFIELD', 'DESIGNATED_HITTER', 'UTILITY', 'STARTING_PITCHER', 'RELIEF_PITCHER');

-- CreateEnum
CREATE TYPE "HandedEnum" AS ENUM ('LEFT', 'RIGHT', 'SWITCH');

-- CreateEnum
CREATE TYPE "AcademicYear" AS ENUM ('FRESHMAN', 'SOPHOMORE', 'JUNIOR', 'SENIOR', 'GRADUATE', 'REDSHIRT_FRESHMAN', 'REDSHIRT_SOPHOMORE', 'REDSHIRT_JUNIOR', 'REDSHIRT_SENIOR');

-- CreateEnum
CREATE TYPE "PollType" AS ENUM ('COACHES', 'BASEBALL_AMERICA', 'D1BASEBALL', 'PERFECT_GAME', 'COMPOSITE');

-- CreateTable
CREATE TABLE "Conference" (
    "id" TEXT NOT NULL,
    "externalId" TEXT,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "shortName" TEXT,
    "division" "Division" NOT NULL,
    "abbreviation" TEXT,
    "logoUrl" TEXT,
    "primaryColor" TEXT,
    "secondaryColor" TEXT,
    "city" TEXT,
    "state" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Conference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Venue" (
    "id" TEXT NOT NULL,
    "externalId" TEXT,
    "name" TEXT NOT NULL,
    "nickname" TEXT,
    "city" TEXT,
    "state" TEXT,
    "country" TEXT,
    "capacity" INTEGER,
    "surface" TEXT,
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
    "conferenceId" TEXT,
    "venueId" TEXT,
    "sport" "Sport" NOT NULL DEFAULT 'BASEBALL',
    "division" "Division" NOT NULL DEFAULT 'D1',
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "school" TEXT NOT NULL,
    "nickname" TEXT,
    "abbreviation" TEXT,
    "logoUrl" TEXT,
    "primaryColor" TEXT,
    "secondaryColor" TEXT,
    "city" TEXT,
    "state" TEXT,
    "foundedYear" INTEGER,
    "headCoach" TEXT,
    "websiteUrl" TEXT,
    "twitterHandle" TEXT,
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
    "jerseyNumber" TEXT,
    "position" "Position" NOT NULL,
    "bats" "HandedEnum",
    "throws" "HandedEnum",
    "year" "AcademicYear",
    "height" INTEGER,
    "weight" INTEGER,
    "hometown" TEXT,
    "hometownCity" TEXT,
    "hometownState" TEXT,
    "birthDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Player_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlayerStats" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "season" INTEGER NOT NULL,
    "gamesPlayed" INTEGER NOT NULL DEFAULT 0,
    "gamesStarted" INTEGER NOT NULL DEFAULT 0,
    "gamesPitched" INTEGER NOT NULL DEFAULT 0,
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
CREATE TABLE "Game" (
    "id" TEXT NOT NULL,
    "externalId" TEXT,
    "sport" "Sport" NOT NULL DEFAULT 'BASEBALL',
    "division" "Division" NOT NULL DEFAULT 'D1',
    "season" INTEGER NOT NULL,
    "seasonType" "SeasonType" NOT NULL DEFAULT 'REGULAR',
    "conferenceId" TEXT,
    "venueId" TEXT,
    "homeTeamId" TEXT NOT NULL,
    "awayTeamId" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "startTime" TIMESTAMP(3),
    "endTime" TIMESTAMP(3),
    "status" "GameStatus" NOT NULL,
    "homeScore" INTEGER,
    "awayScore" INTEGER,
    "attendance" INTEGER,
    "tv" TEXT,
    "weather" JSONB,
    "currentInning" INTEGER,
    "currentInningHalf" "InningHalf",
    "balls" INTEGER,
    "strikes" INTEGER,
    "outs" INTEGER,
    "notes" TEXT,
    "providerName" TEXT,
    "feedPrecision" TEXT,
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "archivedAt" TIMESTAMP(3),
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
    "batterId" TEXT,
    "pitcherId" TEXT,
    "homeScore" INTEGER,
    "awayScore" INTEGER,
    "homeWinProb" DOUBLE PRECISION,
    "wpaSwing" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GameEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GameBoxLine" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "playerId" TEXT,
    "side" "BoxLineSide" NOT NULL,
    "battingOrder" INTEGER,
    "position" "Position",
    "ab" INTEGER NOT NULL DEFAULT 0,
    "r" INTEGER NOT NULL DEFAULT 0,
    "h" INTEGER NOT NULL DEFAULT 0,
    "doubles" INTEGER NOT NULL DEFAULT 0,
    "triples" INTEGER NOT NULL DEFAULT 0,
    "homeRuns" INTEGER NOT NULL DEFAULT 0,
    "rbi" INTEGER NOT NULL DEFAULT 0,
    "bb" INTEGER NOT NULL DEFAULT 0,
    "so" INTEGER NOT NULL DEFAULT 0,
    "hbp" INTEGER NOT NULL DEFAULT 0,
    "sacFly" INTEGER NOT NULL DEFAULT 0,
    "stolenBases" INTEGER NOT NULL DEFAULT 0,
    "caughtStealing" INTEGER NOT NULL DEFAULT 0,
    "totalBases" INTEGER,
    "obp" DOUBLE PRECISION,
    "slg" DOUBLE PRECISION,
    "ops" DOUBLE PRECISION,
    "ip" DOUBLE PRECISION,
    "hitsAllowed" INTEGER,
    "runsAllowed" INTEGER,
    "earnedRuns" INTEGER,
    "bbAllowed" INTEGER,
    "soRecorded" INTEGER,
    "pitches" INTEGER,
    "strikes" INTEGER,
    "decision" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GameBoxLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamStats" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "season" INTEGER NOT NULL,
    "gamesPlayed" INTEGER NOT NULL DEFAULT 0,
    "wins" INTEGER NOT NULL DEFAULT 0,
    "losses" INTEGER NOT NULL DEFAULT 0,
    "ties" INTEGER NOT NULL DEFAULT 0,
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
    "era" DOUBLE PRECISION,
    "whip" DOUBLE PRECISION,
    "fieldingPct" DOUBLE PRECISION,
    "strikeouts" INTEGER NOT NULL DEFAULT 0,
    "walks" INTEGER NOT NULL DEFAULT 0,
    "hitsAllowed" INTEGER NOT NULL DEFAULT 0,
    "earnedRuns" INTEGER NOT NULL DEFAULT 0,
    "inningsPitched" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "saves" INTEGER NOT NULL DEFAULT 0,
    "rpi" DOUBLE PRECISION,
    "strengthOfSched" DOUBLE PRECISION,
    "pythagWins" DOUBLE PRECISION,
    "lastUpdated" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeamStats_pkey" PRIMARY KEY ("id")
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
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Ranking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Article" (
    "id" TEXT NOT NULL,
    "gameId" TEXT,
    "teamId" TEXT,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "summary" TEXT,
    "provider" TEXT,
    "model" TEXT,
    "tokensUsed" INTEGER,
    "factCheckScore" DOUBLE PRECISION,
    "factCheckResults" TEXT,
    "wordCount" INTEGER,
    "readingTimeMinutes" INTEGER,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Article_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Conference_externalId_key" ON "Conference"("externalId");

-- CreateIndex
CREATE UNIQUE INDEX "Conference_slug_key" ON "Conference"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Venue_externalId_key" ON "Venue"("externalId");

-- CreateIndex
CREATE UNIQUE INDEX "Team_externalId_key" ON "Team"("externalId");

-- CreateIndex
CREATE UNIQUE INDEX "Team_slug_key" ON "Team"("slug");

-- CreateIndex
CREATE INDEX "Team_conferenceId_idx" ON "Team"("conferenceId");

-- CreateIndex
CREATE INDEX "Team_sport_division_idx" ON "Team"("sport", "division");

-- CreateIndex
CREATE UNIQUE INDEX "Player_externalId_key" ON "Player"("externalId");

-- CreateIndex
CREATE INDEX "Player_teamId_idx" ON "Player"("teamId");

-- CreateIndex
CREATE INDEX "PlayerStats_season_idx" ON "PlayerStats"("season");

-- CreateIndex
CREATE UNIQUE INDEX "PlayerStats_playerId_season_key" ON "PlayerStats"("playerId", "season");

-- CreateIndex
CREATE UNIQUE INDEX "Game_externalId_key" ON "Game"("externalId");

-- CreateIndex
CREATE INDEX "Game_scheduledAt_idx" ON "Game"("scheduledAt");

-- CreateIndex
CREATE INDEX "Game_status_idx" ON "Game"("status");

-- CreateIndex
CREATE INDEX "Game_season_seasonType_idx" ON "Game"("season", "seasonType");

-- CreateIndex
CREATE INDEX "GameEvent_gameId_sequence_idx" ON "GameEvent"("gameId", "sequence");

-- CreateIndex
CREATE INDEX "GameBoxLine_gameId_idx" ON "GameBoxLine"("gameId");

-- CreateIndex
CREATE INDEX "GameBoxLine_teamId_idx" ON "GameBoxLine"("teamId");

-- CreateIndex
CREATE INDEX "TeamStats_season_idx" ON "TeamStats"("season");

-- CreateIndex
CREATE UNIQUE INDEX "TeamStats_teamId_season_key" ON "TeamStats"("teamId", "season");

-- CreateIndex
CREATE INDEX "Ranking_season_week_idx" ON "Ranking"("season", "week");

-- CreateIndex
CREATE UNIQUE INDEX "Ranking_pollType_season_week_teamId_key" ON "Ranking"("pollType", "season", "week", "teamId");

-- CreateIndex
CREATE INDEX "Article_gameId_idx" ON "Article"("gameId");

-- CreateIndex
CREATE INDEX "Article_type_idx" ON "Article"("type");

-- AddForeignKey
ALTER TABLE "Team" ADD CONSTRAINT "Team_conferenceId_fkey" FOREIGN KEY ("conferenceId") REFERENCES "Conference"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Team" ADD CONSTRAINT "Team_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "Venue"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Player" ADD CONSTRAINT "Player_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerStats" ADD CONSTRAINT "PlayerStats_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Game" ADD CONSTRAINT "Game_conferenceId_fkey" FOREIGN KEY ("conferenceId") REFERENCES "Conference"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Game" ADD CONSTRAINT "Game_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "Venue"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Game" ADD CONSTRAINT "Game_homeTeamId_fkey" FOREIGN KEY ("homeTeamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Game" ADD CONSTRAINT "Game_awayTeamId_fkey" FOREIGN KEY ("awayTeamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameEvent" ADD CONSTRAINT "GameEvent_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameBoxLine" ADD CONSTRAINT "GameBoxLine_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameBoxLine" ADD CONSTRAINT "GameBoxLine_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameBoxLine" ADD CONSTRAINT "GameBoxLine_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamStats" ADD CONSTRAINT "TeamStats_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ranking" ADD CONSTRAINT "Ranking_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Article" ADD CONSTRAINT "Article_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Article" ADD CONSTRAINT "Article_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

