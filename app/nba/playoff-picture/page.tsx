'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSportData } from '@/lib/hooks/useSportData';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Badge, DataSourceBadge } from '@/components/ui/Badge';
import { ScrollReveal } from '@/components/cinematic';
import { Footer } from '@/components/layout-ds/Footer';
import { Skeleton } from '@/components/ui/Skeleton';
import { DataErrorBoundary } from '@/components/ui/DataErrorBoundary';
import { DataAttribution } from '@/components/ui/DataAttribution';
import {
  type NBAApiConference,
  type NBAStandingsTeam,
  flattenNBAStandings,
  splitNBAByConference,
} from '@/lib/utils/standings';
import type { DataMeta } from '@/lib/types/data-meta';

// ---------------------------------------------------------------------------
// Types & Constants
// ---------------------------------------------------------------------------

interface StandingsResponse {
  standings?: NBAApiConference[];
  data?: NBAApiConference[];
  meta?: DataMeta;
}

type SeedZone = 'playoff' | 'playin' | 'out';

const NBA_GAMES = 82;

// ---------------------------------------------------------------------------
// Derived Data Helpers
// ---------------------------------------------------------------------------

function getSeedZone(seed: number): SeedZone {
  if (seed <= 6) return 'playoff';
  if (seed <= 10) return 'playin';
  return 'out';
}

function getGamesRemaining(team: NBAStandingsTeam): number {
  return NBA_GAMES - team.wins - team.losses;
}

/**
 * Derive clinch status from the math alone.
 * A team has clinched a playoff spot (top 6) when the 7th-place team
 * cannot catch them even if the 7th-place team wins all remaining games.
 * A team has clinched a play-in berth (top 10) when the 11th-place team
 * cannot catch them.
 * Eliminated when they cannot catch the 10th-place team.
 */
function deriveClinchStatus(
  teams: NBAStandingsTeam[],
): Map<string, 'playoff' | 'playin' | 'eliminated' | null> {
  const sorted = [...teams].sort((a, b) => b.winPercentage - a.winPercentage);
  const clinchMap = new Map<string, 'playoff' | 'playin' | 'eliminated' | null>();

  for (let i = 0; i < sorted.length; i++) {
    const team = sorted[i];
    const seed = i + 1;

    if (seed <= 6) {
      // Check if clinched: can the 7th-place team reach this team's wins?
      const seventh = sorted[6];
      if (seventh) {
        const seventhMaxWins = seventh.wins + getGamesRemaining(seventh);
        if (team.wins > seventhMaxWins) {
          clinchMap.set(team.teamName, 'playoff');
          continue;
        }
      }
    }

    if (seed <= 10) {
      // Check if clinched play-in: can the 11th-place team reach this team's wins?
      const eleventh = sorted[10];
      if (eleventh) {
        const eleventhMaxWins = eleventh.wins + getGamesRemaining(eleventh);
        if (team.wins > eleventhMaxWins) {
          clinchMap.set(team.teamName, clinchMap.get(team.teamName) || 'playin');
          continue;
        }
      }
    }

    if (seed > 10) {
      // Check if eliminated: can this team catch the 10th-place team?
      const tenth = sorted[9];
      if (tenth) {
        const teamMaxWins = team.wins + getGamesRemaining(team);
        if (teamMaxWins < tenth.wins) {
          clinchMap.set(team.teamName, 'eliminated');
          continue;
        }
      }
    }

    if (!clinchMap.has(team.teamName)) {
      clinchMap.set(team.teamName, null);
    }
  }

  return clinchMap;
}

// ---------------------------------------------------------------------------
// Clinch Badge
// ---------------------------------------------------------------------------

function ClinchBadge({ status }: { status: 'playoff' | 'playin' | 'eliminated' | null }) {
  if (!status) return null;

  if (status === 'playoff') {
    return (
      <span
        className="inline-flex items-center gap-1 rounded-sm px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest"
        style={{
          backgroundColor: 'rgba(191, 87, 0, 0.2)',
          color: 'var(--bsi-primary)',
          border: '1px solid rgba(191, 87, 0, 0.35)',
        }}
        title="Clinched playoff berth"
      >
        <span className="text-[8px]" aria-hidden="true">&#9679;</span>
        Clinched
      </span>
    );
  }

  if (status === 'playin') {
    return (
      <span
        className="inline-flex items-center gap-1 rounded-sm px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest"
        style={{
          backgroundColor: 'rgba(75, 156, 211, 0.15)',
          color: 'var(--heritage-columbia-blue)',
          border: '1px solid rgba(75, 156, 211, 0.3)',
        }}
        title="Clinched play-in berth"
      >
        <span className="text-[8px]" aria-hidden="true">&#9679;</span>
        Play-In
      </span>
    );
  }

  return (
    <span
      className="inline-flex items-center gap-1 rounded-sm px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest"
      style={{
        backgroundColor: 'rgba(140, 98, 57, 0.1)',
        color: 'var(--bsi-dust)',
        border: '1px solid rgba(140, 98, 57, 0.2)',
      }}
      title="Eliminated from playoff contention"
    >
      Elim
    </span>
  );
}

// ---------------------------------------------------------------------------
// Team Row
// ---------------------------------------------------------------------------

function TeamRow({
  team,
  seed,
  zone,
  clinchStatus,
  gamesBack1,
}: {
  team: NBAStandingsTeam;
  seed: number;
  zone: SeedZone;
  clinchStatus: 'playoff' | 'playin' | 'eliminated' | null;
  gamesBack1: number;
}) {
  const remaining = getGamesRemaining(team);
  const isTopSeed = seed === 1;
  const isOut = zone === 'out';

  return (
    <div
      className={`group flex items-center gap-2 px-3 py-2 transition-all duration-200 sm:gap-3 ${
        isTopSeed
          ? 'ring-1 ring-inset ring-[var(--bsi-primary)]/30'
          : ''
      }`}
      style={{
        backgroundColor: isTopSeed
          ? 'rgba(191, 87, 0, 0.06)'
          : 'var(--surface-dugout)',
        opacity: isOut ? 0.55 : 1,
      }}
    >
      {/* Seed number */}
      <span
        className="w-5 shrink-0 text-center font-mono text-xs font-bold sm:w-6 sm:text-sm"
        style={{
          color: isTopSeed
            ? 'var(--bsi-primary)'
            : zone === 'playin'
              ? 'var(--heritage-columbia-blue)'
              : isOut
                ? 'var(--bsi-dust)'
                : 'var(--bsi-bone)',
        }}
      >
        {seed}
      </span>

      {/* Team logo */}
      {team.logo ? (
        <Image
          src={team.logo}
          alt={`${team.teamName} logo`}
          width={20}
          height={20}
          className="shrink-0 rounded-sm sm:h-6 sm:w-6"
          unoptimized
        />
      ) : (
        <div
          className="h-5 w-5 shrink-0 rounded-sm sm:h-6 sm:w-6"
          style={{ backgroundColor: 'var(--surface-press-box)' }}
        />
      )}

      {/* Team name */}
      <span
        className="min-w-0 flex-1 truncate font-body text-xs sm:text-sm"
        style={{
          color: isOut ? 'var(--bsi-dust)' : 'var(--bsi-bone)',
        }}
      >
        {team.teamName}
      </span>

      {/* Clinch badge — hidden on very small screens */}
      <span className="hidden sm:inline-flex">
        <ClinchBadge status={clinchStatus} />
      </span>

      {/* Record */}
      <span
        className="shrink-0 font-mono text-[11px] tabular-nums sm:text-xs"
        style={{ color: 'var(--bsi-dust)' }}
      >
        {team.wins}-{team.losses}
      </span>

      {/* Win % — hidden on mobile */}
      <span
        className="hidden w-11 shrink-0 text-right font-mono text-[11px] tabular-nums md:inline"
        style={{ color: 'var(--bsi-dust)' }}
      >
        {team.winPercentage > 0
          ? team.winPercentage.toFixed(3).replace('0.', '.')
          : '.000'}
      </span>

      {/* Games back from #1 */}
      <span
        className="w-8 shrink-0 text-right font-mono text-[11px] tabular-nums sm:w-9"
        style={{ color: 'var(--bsi-dust)' }}
      >
        {gamesBack1 === 0 ? '--' : gamesBack1.toString()}
      </span>

      {/* Games remaining */}
      <span
        className="hidden w-6 shrink-0 text-right font-mono text-[11px] tabular-nums md:inline"
        style={{ color: 'var(--bsi-dust)' }}
      >
        {remaining}
      </span>

      {/* Last 10 — hidden on mobile */}
      <span
        className="hidden w-10 shrink-0 text-right font-mono text-[11px] tabular-nums lg:inline"
        style={{ color: 'var(--bsi-dust)' }}
      >
        {team.last10 || '--'}
      </span>

      {/* Streak */}
      <span
        className="w-8 shrink-0 text-right font-mono text-[11px] sm:w-9"
        style={{
          color: team.streak?.startsWith('W')
            ? 'var(--heritage-columbia-blue)'
            : team.streak?.startsWith('L')
              ? '#ef4444'
              : 'var(--bsi-dust)',
        }}
      >
        {team.streak || '--'}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Column Header
// ---------------------------------------------------------------------------

function ColumnHeader() {
  return (
    <div
      className="flex items-center gap-2 px-3 py-1.5 text-[9px] font-bold uppercase tracking-widest sm:gap-3 sm:text-[10px]"
      style={{
        backgroundColor: 'var(--surface-press-box)',
        color: 'var(--bsi-dust)',
      }}
    >
      <span className="w-5 text-center sm:w-6">#</span>
      <span className="h-5 w-5 sm:h-6 sm:w-6" aria-hidden="true" />
      <span className="flex-1">Team</span>
      <span className="hidden sm:inline">Status</span>
      <span>W-L</span>
      <span className="hidden w-11 text-right md:inline">Pct</span>
      <span className="w-8 text-right sm:w-9">GB</span>
      <span className="hidden w-6 text-right md:inline">Left</span>
      <span className="hidden w-10 text-right lg:inline">L10</span>
      <span className="w-8 text-right sm:w-9">Strk</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Zone Divider
// ---------------------------------------------------------------------------

function ZoneDivider({ label }: { label: string }) {
  return (
    <div className="relative flex items-center py-2">
      <div
        className="flex-1 border-t"
        style={{ borderColor: 'var(--bsi-primary)' }}
      />
      <span
        className="heritage-stamp mx-3 shrink-0"
        style={{ fontSize: '0.6rem' }}
      >
        {label}
      </span>
      <div
        className="flex-1 border-t"
        style={{ borderColor: 'var(--bsi-primary)' }}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Play-In Tournament Bracket
// ---------------------------------------------------------------------------

function PlayInBracket({
  teams,
  conference,
}: {
  teams: NBAStandingsTeam[];
  conference: string;
}) {
  const sorted = [...teams].sort((a, b) => b.winPercentage - a.winPercentage);
  const seed7 = sorted[6];
  const seed8 = sorted[7];
  const seed9 = sorted[8];
  const seed10 = sorted[9];

  if (!seed7 || !seed8 || !seed9 || !seed10) return null;

  return (
    <div
      className="heritage-card corner-marks overflow-hidden p-4"
      role="region"
      aria-label={`${conference} Play-In Tournament bracket`}
    >
      <div className="mb-4 flex items-center justify-between">
        <span
          className="heritage-stamp"
          style={{ border: 'none', padding: 0 }}
        >
          Play-In Tournament
        </span>
        <span
          className="text-[10px] uppercase tracking-wider"
          style={{ color: 'var(--bsi-dust)' }}
        >
          {conference}
        </span>
      </div>

      {/* Bracket grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Game A: 7 vs 8 */}
        <div
          className="rounded-sm border p-3"
          style={{
            borderColor: 'var(--border-vintage)',
            backgroundColor: 'var(--surface-scoreboard)',
          }}
        >
          <div
            className="mb-2 text-[9px] font-bold uppercase tracking-widest"
            style={{ color: 'var(--bsi-dust)' }}
          >
            Game A — Winner gets 7 seed
          </div>
          <PlayInMatchup team={seed7} seed={7} />
          <div
            className="my-1.5 flex items-center gap-2 px-2 text-[10px]"
            style={{ color: 'var(--bsi-dust)' }}
          >
            <span className="flex-1 border-t" style={{ borderColor: 'var(--border-vintage)' }} />
            <span>vs</span>
            <span className="flex-1 border-t" style={{ borderColor: 'var(--border-vintage)' }} />
          </div>
          <PlayInMatchup team={seed8} seed={8} />
        </div>

        {/* Game B: 9 vs 10 */}
        <div
          className="rounded-sm border p-3"
          style={{
            borderColor: 'var(--border-vintage)',
            backgroundColor: 'var(--surface-scoreboard)',
          }}
        >
          <div
            className="mb-2 text-[9px] font-bold uppercase tracking-widest"
            style={{ color: 'var(--bsi-dust)' }}
          >
            Game B — Loser eliminated
          </div>
          <PlayInMatchup team={seed9} seed={9} />
          <div
            className="my-1.5 flex items-center gap-2 px-2 text-[10px]"
            style={{ color: 'var(--bsi-dust)' }}
          >
            <span className="flex-1 border-t" style={{ borderColor: 'var(--border-vintage)' }} />
            <span>vs</span>
            <span className="flex-1 border-t" style={{ borderColor: 'var(--border-vintage)' }} />
          </div>
          <PlayInMatchup team={seed10} seed={10} />
        </div>
      </div>

      {/* Flow explanation */}
      <div
        className="mt-3 rounded-sm border px-3 py-2 text-[10px] leading-relaxed"
        style={{
          borderColor: 'var(--border-vintage)',
          color: 'var(--bsi-dust)',
          backgroundColor: 'rgba(22, 22, 22, 0.5)',
        }}
      >
        <strong style={{ color: 'var(--bsi-bone)' }}>Game C:</strong> Loser
        of A vs Winner of B — winner earns the 8th seed.
      </div>
    </div>
  );
}

function PlayInMatchup({ team, seed }: { team: NBAStandingsTeam; seed: number }) {
  return (
    <div className="flex items-center gap-2 px-1">
      <span
        className="w-4 font-mono text-[10px] font-bold"
        style={{ color: 'var(--heritage-columbia-blue)' }}
      >
        {seed}
      </span>
      {team.logo ? (
        <Image
          src={team.logo}
          alt=""
          width={16}
          height={16}
          className="shrink-0 rounded-sm"
          unoptimized
        />
      ) : (
        <div className="h-4 w-4 rounded-sm" style={{ backgroundColor: 'var(--surface-press-box)' }} />
      )}
      <span
        className="flex-1 truncate text-xs"
        style={{ color: 'var(--bsi-bone)' }}
      >
        {team.teamName}
      </span>
      <span
        className="font-mono text-[10px] tabular-nums"
        style={{ color: 'var(--bsi-dust)' }}
      >
        {team.wins}-{team.losses}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Conference Panel
// ---------------------------------------------------------------------------

function ConferencePanel({
  title,
  teams,
}: {
  title: string;
  teams: NBAStandingsTeam[];
}) {
  const sorted = [...teams].sort((a, b) => b.winPercentage - a.winPercentage);
  const clinchMap = useMemo(() => deriveClinchStatus(sorted), [sorted]);

  const playoffTeams = sorted.slice(0, 6);
  const playInTeams = sorted.slice(6, 10);
  const outTeams = sorted.slice(10);

  const topSeedWins = sorted[0]?.wins ?? 0;

  return (
    <div className="space-y-0">
      {/* Conference header */}
      <div
        className="flex items-center justify-between rounded-t-sm border-b-2 px-3 py-2"
        style={{
          backgroundColor: 'var(--surface-press-box)',
          borderBottomColor: 'var(--bsi-primary)',
        }}
      >
        <h2
          className="font-heading text-lg uppercase tracking-wider sm:text-xl"
          style={{ color: 'var(--bsi-bone)' }}
        >
          {title}
        </h2>
        <span
          className="text-[10px] uppercase tracking-widest"
          style={{ color: 'var(--bsi-dust)' }}
        >
          {sorted.length} teams
        </span>
      </div>

      {/* Column header */}
      <ColumnHeader />

      {/* Playoff zone: seeds 1-6 */}
      <div className="space-y-px">
        {playoffTeams.map((team, i) => {
          const seed = i + 1;
          const gb1 = seed === 1 ? 0 : +(((topSeedWins - team.wins) + (team.losses - (sorted[0]?.losses ?? 0))) / 2).toFixed(1);
          return (
            <TeamRow
              key={team.teamName}
              team={team}
              seed={seed}
              zone="playoff"
              clinchStatus={clinchMap.get(team.teamName) ?? null}
              gamesBack1={team.gamesBack}
            />
          );
        })}
      </div>

      {/* Play-In divider */}
      <ZoneDivider label="Play-In Zone" />

      {/* Play-In zone: seeds 7-10 */}
      <div className="space-y-px">
        {playInTeams.map((team, i) => {
          const seed = 7 + i;
          return (
            <TeamRow
              key={team.teamName}
              team={team}
              seed={seed}
              zone="playin"
              clinchStatus={clinchMap.get(team.teamName) ?? null}
              gamesBack1={team.gamesBack}
            />
          );
        })}
      </div>

      {/* Eliminated divider */}
      {outTeams.length > 0 && (
        <>
          <div className="relative flex items-center py-1.5">
            <div
              className="flex-1 border-t border-dashed"
              style={{ borderColor: 'var(--border-vintage)' }}
            />
            <span
              className="mx-3 text-[9px] font-bold uppercase tracking-widest"
              style={{ color: 'var(--bsi-dust)' }}
            >
              Below the line
            </span>
            <div
              className="flex-1 border-t border-dashed"
              style={{ borderColor: 'var(--border-vintage)' }}
            />
          </div>

          {/* Out zone: seeds 11-15 */}
          <div className="space-y-px">
            {outTeams.map((team, i) => {
              const seed = 11 + i;
              return (
                <TeamRow
                  key={team.teamName}
                  team={team}
                  seed={seed}
                  zone="out"
                  clinchStatus={clinchMap.get(team.teamName) ?? null}
                  gamesBack1={team.gamesBack}
                />
              );
            })}
          </div>
        </>
      )}

      {/* Play-In bracket */}
      {playInTeams.length === 4 && (
        <div className="mt-4">
          <PlayInBracket teams={sorted} conference={title} />
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Season Context Bar
// ---------------------------------------------------------------------------

function SeasonContext({ eastern, western }: { eastern: NBAStandingsTeam[]; western: NBAStandingsTeam[] }) {
  const allTeams = [...eastern, ...western];
  if (allTeams.length === 0) return null;

  const gamesPlayed = allTeams.reduce((sum, t) => sum + t.wins + t.losses, 0) / 2;
  const totalGames = (allTeams.length / 2) * NBA_GAMES;
  const seasonPct = Math.round((gamesPlayed / totalGames) * 100);

  const bestTeam = allTeams.reduce((best, t) =>
    t.winPercentage > best.winPercentage ? t : best, allTeams[0]);

  const eastTop = eastern.length > 0
    ? [...eastern].sort((a, b) => b.winPercentage - a.winPercentage)[0]
    : null;
  const westTop = western.length > 0
    ? [...western].sort((a, b) => b.winPercentage - a.winPercentage)[0]
    : null;

  return (
    <div
      className="grid grid-cols-2 gap-3 sm:grid-cols-4"
    >
      <div
        className="rounded-sm border px-3 py-2"
        style={{
          borderColor: 'var(--border-vintage)',
          backgroundColor: 'var(--surface-dugout)',
        }}
      >
        <div
          className="text-[9px] font-bold uppercase tracking-widest"
          style={{ color: 'var(--bsi-dust)' }}
        >
          Season Progress
        </div>
        <div
          className="mt-0.5 font-mono text-lg font-bold tabular-nums"
          style={{ color: 'var(--bsi-bone)' }}
        >
          {seasonPct}%
        </div>
        <div className="mt-1 h-1 overflow-hidden rounded-full" style={{ backgroundColor: 'var(--surface-press-box)' }}>
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${seasonPct}%`,
              backgroundColor: 'var(--bsi-primary)',
            }}
          />
        </div>
      </div>

      <div
        className="rounded-sm border px-3 py-2"
        style={{
          borderColor: 'var(--border-vintage)',
          backgroundColor: 'var(--surface-dugout)',
        }}
      >
        <div
          className="text-[9px] font-bold uppercase tracking-widest"
          style={{ color: 'var(--bsi-dust)' }}
        >
          Best Record
        </div>
        <div
          className="mt-0.5 truncate font-body text-sm font-semibold"
          style={{ color: 'var(--bsi-primary)' }}
        >
          {bestTeam?.teamName}
        </div>
        <div
          className="font-mono text-xs tabular-nums"
          style={{ color: 'var(--bsi-dust)' }}
        >
          {bestTeam?.wins}-{bestTeam?.losses}
        </div>
      </div>

      <div
        className="rounded-sm border px-3 py-2"
        style={{
          borderColor: 'var(--border-vintage)',
          backgroundColor: 'var(--surface-dugout)',
        }}
      >
        <div
          className="text-[9px] font-bold uppercase tracking-widest"
          style={{ color: 'var(--bsi-dust)' }}
        >
          East #1
        </div>
        <div
          className="mt-0.5 flex items-center gap-1.5"
        >
          {eastTop?.logo && (
            <Image
              src={eastTop.logo}
              alt=""
              width={16}
              height={16}
              className="shrink-0"
              unoptimized
            />
          )}
          <span
            className="truncate font-body text-sm"
            style={{ color: 'var(--bsi-bone)' }}
          >
            {eastTop?.abbreviation || eastTop?.teamName}
          </span>
        </div>
        <div
          className="font-mono text-xs tabular-nums"
          style={{ color: 'var(--bsi-dust)' }}
        >
          {eastTop?.wins}-{eastTop?.losses}
        </div>
      </div>

      <div
        className="rounded-sm border px-3 py-2"
        style={{
          borderColor: 'var(--border-vintage)',
          backgroundColor: 'var(--surface-dugout)',
        }}
      >
        <div
          className="text-[9px] font-bold uppercase tracking-widest"
          style={{ color: 'var(--bsi-dust)' }}
        >
          West #1
        </div>
        <div
          className="mt-0.5 flex items-center gap-1.5"
        >
          {westTop?.logo && (
            <Image
              src={westTop.logo}
              alt=""
              width={16}
              height={16}
              className="shrink-0"
              unoptimized
            />
          )}
          <span
            className="truncate font-body text-sm"
            style={{ color: 'var(--bsi-bone)' }}
          >
            {westTop?.abbreviation || westTop?.teamName}
          </span>
        </div>
        <div
          className="font-mono text-xs tabular-nums"
          style={{ color: 'var(--bsi-dust)' }}
        >
          {westTop?.wins}-{westTop?.losses}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Loading Skeleton
// ---------------------------------------------------------------------------

function PlayoffPictureSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {[0, 1].map((col) => (
        <div key={col} className="space-y-1">
          <Skeleton className="h-10 w-full" height={40} />
          <Skeleton className="h-8 w-full" height={32} />
          {Array.from({ length: 15 }, (_, i) => (
            <Skeleton
              key={i}
              className="h-9 w-full"
              height={36}
              shimmer
            />
          ))}
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function NBAPlayoffPicturePage() {
  const { data: rawData, loading, error, meta: normalizedMeta } = useSportData<StandingsResponse>(
    '/api/nba/standings',
    { refreshInterval: 60_000, refreshWhen: true }
  );

  const rawMeta = rawData?.meta ?? null;

  const { eastern, western } = useMemo(() => {
    const conferences = rawData?.standings ?? rawData?.data ?? [];
    if (!conferences.length) return { eastern: [], western: [] };
    const flat = flattenNBAStandings(conferences);
    return splitNBAByConference(flat);
  }, [rawData]);

  return (
    <>
      {/* Hero */}
      <Section className="relative overflow-hidden pt-6 pb-0 sm:pt-8">
        <Container>
          {/* Breadcrumb */}
          <nav
            className="mb-3 flex items-center gap-1.5 text-xs sm:mb-4"
            style={{ color: 'var(--bsi-dust)' }}
            aria-label="Breadcrumb"
          >
            <Link href="/" className="transition-colors hover:underline" style={{ color: 'var(--bsi-dust)' }}>
              Home
            </Link>
            <span aria-hidden="true">/</span>
            <Link href="/nba" className="transition-colors hover:underline" style={{ color: 'var(--bsi-dust)' }}>
              NBA
            </Link>
            <span aria-hidden="true">/</span>
            <span style={{ color: 'var(--bsi-bone)' }}>Playoff Picture</span>
          </nav>

          {/* Title row */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="mb-1.5 flex items-center gap-3">
                <Badge variant="primary" size="sm">2025-26</Badge>
                <Badge variant="outline" size="sm">
                  {eastern.length + western.length > 0
                    ? `${eastern.length + western.length} Teams`
                    : 'Loading...'}
                </Badge>
              </div>
              <h1
                className="font-heading text-3xl uppercase tracking-tight sm:text-4xl md:text-5xl"
                style={{ color: 'var(--bsi-bone)' }}
              >
                Playoff Picture
              </h1>
              <p
                className="mt-1 max-w-lg text-xs leading-relaxed sm:text-sm"
                style={{ color: 'var(--bsi-dust)' }}
              >
                Seeds 1-6 qualify directly. Seeds 7-10 enter the Play-In
                Tournament. Regular season ends April 13.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <DataAttribution
                meta={rawMeta}
                source="ESPN"
              />
            </div>
          </div>

          {/* Season context bar */}
          {!loading && eastern.length > 0 && (
            <div className="mt-4 sm:mt-5">
              <SeasonContext eastern={eastern} western={western} />
            </div>
          )}
        </Container>
      </Section>

      {/* Conference brackets */}
      <DataErrorBoundary name="NBA Playoff Picture">
        <Section className="pt-5 pb-8 sm:pt-6">
          <Container>
            {loading ? (
              <PlayoffPictureSkeleton />
            ) : error ? (
              <div
                className="heritage-card flex flex-col items-center justify-center p-8 text-center"
              >
                <p
                  className="text-sm"
                  style={{ color: 'var(--bsi-dust)' }}
                >
                  Unable to load standings data.
                </p>
                <button
                  onClick={() => window.location.reload()}
                  className="btn-heritage mt-3 text-xs"
                >
                  Retry
                </button>
              </div>
            ) : (
              <div className="grid gap-6 lg:grid-cols-2">
                {/* Eastern Conference */}
                <ScrollReveal>
                  <ConferencePanel title="Eastern Conference" teams={eastern} />
                </ScrollReveal>

                {/* Western Conference */}
                <ScrollReveal>
                  <ConferencePanel title="Western Conference" teams={western} />
                </ScrollReveal>
              </div>
            )}

            {/* Legend */}
            {!loading && !error && (eastern.length > 0 || western.length > 0) && (
              <div
                className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 rounded-sm border px-4 py-3 text-[10px]"
                style={{
                  borderColor: 'var(--border-vintage)',
                  backgroundColor: 'var(--surface-dugout)',
                  color: 'var(--bsi-dust)',
                }}
              >
                <span className="font-bold uppercase tracking-widest" style={{ color: 'var(--bsi-bone)' }}>
                  Legend
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: 'var(--bsi-primary)' }} />
                  Clinched Playoff
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: 'var(--heritage-columbia-blue)' }} />
                  Clinched Play-In
                </span>
                <span>GB = Games behind #1 seed</span>
                <span className="hidden sm:inline">L10 = Last 10 games</span>
                <span>Strk = Current streak</span>
                <span className="hidden md:inline">Left = Games remaining</span>
              </div>
            )}

            {/* Navigation */}
            <nav className="mt-6 flex flex-wrap gap-2" aria-label="Related pages">
              <Link
                href="/nba/standings"
                className="btn-heritage text-xs"
              >
                Full Standings
              </Link>
              <Link
                href="/nba/scores"
                className="btn-heritage text-xs"
              >
                Today&#39;s Scores
              </Link>
              <Link
                href="/nba"
                className="btn-heritage text-xs"
              >
                NBA Hub
              </Link>
            </nav>
          </Container>
        </Section>
      </DataErrorBoundary>

      <Footer />
    </>
  );
}
