'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { Sheet, SheetHeader, SheetBody } from '@/components/ui/Sheet';
import { TeamCircle } from '@/components/sports/TeamCircle';

/**
 * Box Score Drawer
 *
 * Same-page pop-up with a game's line score, batting lines, and pitching
 * lines. Opens as a right-side drawer on desktop, a bottom sheet on mobile.
 *
 * Sport-agnostic — accepts an `apiPrefix` (e.g., `/api/college-baseball`) and
 * fetches `{apiPrefix}/game/{gameId}`. Each sport can supply its own drawer
 * content via `children`; when `children` is omitted, the default baseball
 * layout (line score + batting + pitching) is rendered.
 *
 * Designed to live alongside the full-page game routes: the footer includes
 * an "Open full game" deep link to `/{sport}/game/{id}` for users who want
 * the complete experience (play-by-play, recap, team stats).
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Player {
  id?: string;
  name: string;
  position?: string;
  year?: string;
  headshot?: string;
}

interface BattingLine {
  player: Player;
  ab: number | string;
  r: number | string;
  h: number | string;
  rbi: number | string;
  bb: number | string;
  so: number | string;
  avg: string;
}

interface PitchingLine {
  player: Player;
  ip: string;
  h: number | string;
  r: number | string;
  er: number | string;
  bb: number | string;
  so: number | string;
  era: string;
  decision?: 'W' | 'L' | 'S' | 'H' | 'BS' | string;
}

interface GameData {
  id?: string;
  status?: {
    state?: string;
    detailedState?: string;
    isLive?: boolean;
    isFinal?: boolean;
    inning?: number;
  };
  teams?: {
    away?: {
      name?: string;
      displayName?: string;
      abbreviation?: string;
      score?: number;
      isWinner?: boolean;
      record?: string;
      logo?: string;
    };
    home?: {
      name?: string;
      displayName?: string;
      abbreviation?: string;
      score?: number;
      isWinner?: boolean;
      record?: string;
      logo?: string;
    };
  };
  venue?: { name?: string; city?: string; state?: string };
  linescore?: {
    innings?: Array<{ away: number | string; home: number | string }>;
    totals?: {
      away: { runs: number | string; hits: number | string; errors: number | string };
      home: { runs: number | string; hits: number | string; errors: number | string };
    };
  };
  boxscore?: {
    away?: { batting?: BattingLine[]; pitching?: PitchingLine[] };
    home?: { batting?: BattingLine[]; pitching?: PitchingLine[] };
  };
}

interface BoxScoreDrawerProps {
  /** Game id to load. When null/undefined the drawer is closed. */
  gameId: string | null;
  /** API prefix for the sport, e.g. `/api/college-baseball`. */
  apiPrefix: string;
  /** Sport slug used to build the "Open full game" deep link, e.g. `college-baseball`. */
  sportSlug: string;
  /** Called when the drawer should close (ESC, backdrop click, close button). */
  onClose: () => void;
  /** Optional source label for the footer, default "NCAA / D1Baseball". */
  sourceLabel?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function BoxScoreDrawer({
  gameId,
  apiPrefix,
  sportSlug,
  onClose,
  sourceLabel = 'NCAA / D1Baseball',
}: BoxScoreDrawerProps) {
  const open = Boolean(gameId);

  const [game, setGame] = useState<GameData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch on open; abort on close or id change.
  useEffect(() => {
    if (!gameId) {
      setGame(null);
      setError(null);
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const res = await fetch(`${apiPrefix}/game/${encodeURIComponent(gameId)}`, { signal: controller.signal });
        if (!res.ok) throw new Error(`${res.status}`);
        const data = (await res.json()) as { game?: GameData };
        const resolved = data.game ?? (data as GameData);
        // Guard against `200 OK` responses that degrade to `game: null`.
        if (!resolved || (!resolved.teams && !resolved.status && !resolved.boxscore)) {
          throw new Error('Game data unavailable');
        }
        setGame(resolved);
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          setError('Could not load game data');
        }
      } finally {
        setLoading(false);
      }
    })();
    return () => controller.abort();
  }, [gameId, apiPrefix]);

  // Focus the close button when the drawer opens (keyboard-accessibility).
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  useEffect(() => {
    if (open) {
      // Delay one tick to allow the Sheet's animation to mount the element.
      const t = setTimeout(() => closeButtonRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
  }, [open]);

  const matchupLabel = useMemo(() => {
    const away = game?.teams?.away?.abbreviation ?? game?.teams?.away?.name ?? 'Away';
    const home = game?.teams?.home?.abbreviation ?? game?.teams?.home?.name ?? 'Home';
    return `${away} @ ${home}`;
  }, [game]);

  return (
    <Sheet open={open} onClose={onClose} side="right" className="sm:max-w-[640px]">
      <SheetHeader>
        <div className="flex items-center justify-between">
          <div className="min-w-0">
            <p className="text-[10px] font-display uppercase tracking-widest text-text-tertiary">
              Box Score
            </p>
            <h2
              id="box-score-drawer-title"
              className="mt-1 text-lg font-display font-bold text-text-primary truncate"
            >
              {loading && !game ? 'Loading game…' : matchupLabel}
            </h2>
          </div>
          <button
            ref={closeButtonRef}
            onClick={onClose}
            aria-label="Close box score"
            className="ml-3 flex items-center justify-center w-9 h-9 rounded-sm text-text-secondary hover:text-burnt-orange hover:bg-surface-light transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-burnt-orange"
          >
            <svg viewBox="0 0 20 20" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 4l12 12M16 4L4 16" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </SheetHeader>

      <SheetBody className="pb-24">
        {loading && !game && <DrawerLoading />}
        {error && !loading && <DrawerError error={error} sportSlug={sportSlug} gameId={gameId} />}
        {game && !error && (
          <DrawerContent game={game} sportSlug={sportSlug} gameId={gameId} sourceLabel={sourceLabel} />
        )}
      </SheetBody>
    </Sheet>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function DrawerLoading() {
  return (
    <div className="space-y-5 animate-pulse">
      <div className="h-24 bg-surface-light rounded-sm" />
      <div className="h-20 bg-surface-light rounded-sm" />
      <div className="space-y-2">
        <div className="h-6 w-32 bg-surface-light rounded-sm" />
        <div className="h-8 bg-surface-light rounded-sm" />
        <div className="h-8 bg-surface-light rounded-sm" />
        <div className="h-8 bg-surface-light rounded-sm" />
      </div>
    </div>
  );
}

function DrawerError({
  error,
  sportSlug,
  gameId,
}: {
  error: string;
  sportSlug: string;
  gameId: string | null;
}) {
  return (
    <div className="text-center py-10">
      <p className="text-text-secondary text-sm mb-4">{error}</p>
      {gameId && (
        <Link
          href={`/${sportSlug}/game/${gameId}/box-score/`}
          className="inline-block px-4 py-2 text-xs font-display uppercase tracking-wider border border-border text-text-secondary hover:border-burnt-orange hover:text-burnt-orange transition-colors rounded-sm"
        >
          Open full game →
        </Link>
      )}
    </div>
  );
}

function DrawerContent({
  game,
  sportSlug,
  gameId,
  sourceLabel,
}: {
  game: GameData;
  sportSlug: string;
  gameId: string | null;
  sourceLabel: string;
}) {
  return (
    <div className="space-y-6">
      <MatchupHeader game={game} />
      {game.linescore && <LineScoreBlock linescore={game.linescore} game={game} />}
      {game.boxscore?.away?.batting && game.boxscore.away.batting.length > 0 && (
        <TeamBoxBlock team="away" game={game} />
      )}
      {game.boxscore?.home?.batting && game.boxscore.home.batting.length > 0 && (
        <TeamBoxBlock team="home" game={game} />
      )}
      <DrawerFooter sportSlug={sportSlug} gameId={gameId} sourceLabel={sourceLabel} />
    </div>
  );
}

function MatchupHeader({ game }: { game: GameData }) {
  const away = game.teams?.away;
  const home = game.teams?.home;
  const statusLabel = game.status?.isFinal
    ? 'Final'
    : game.status?.isLive
      ? game.status?.inning
        ? `Inning ${game.status.inning}`
        : 'Live'
      : game.status?.detailedState || 'Scheduled';

  return (
    <div className="border border-border-subtle rounded-sm bg-background-tertiary p-4">
      <div className="flex items-center justify-between mb-3">
        <span
          className={`text-[10px] font-display uppercase tracking-widest ${
            game.status?.isLive
              ? 'text-success'
              : game.status?.isFinal
                ? 'text-text-tertiary'
                : 'text-burnt-orange'
          }`}
        >
          {game.status?.isLive && <span className="inline-block w-1.5 h-1.5 bg-success rounded-full mr-2" />}
          {statusLabel}
        </span>
        {game.venue?.name && game.venue.name !== 'TBD' && (
          <span className="text-[10px] font-mono text-text-tertiary uppercase tracking-wider truncate ml-3 max-w-[60%]">
            {game.venue.name}
          </span>
        )}
      </div>
      <MatchupRow team={away} isWinner={!!away?.isWinner} />
      <div className="h-px bg-border-subtle my-2" />
      <MatchupRow team={home} isWinner={!!home?.isWinner} />
    </div>
  );
}

function MatchupRow({
  team,
  isWinner,
}: {
  team: GameData['teams'] extends infer T ? (T extends { away?: infer S } ? S : never) : never;
  isWinner: boolean;
}) {
  if (!team) return null;
  const name = team.displayName ?? team.name ?? team.abbreviation ?? '—';
  const abbr = team.abbreviation ?? name.slice(0, 3).toUpperCase();
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <TeamCircle
          logo={team.logo}
          abbreviation={abbr}
          size="w-10 h-10"
          textSize="text-xs"
          className="shrink-0"
        />
        <div className="min-w-0 flex-1">
          <p
            className={`font-display text-base truncate ${
              isWinner ? 'text-text-primary font-semibold' : 'text-text-secondary'
            }`}
          >
            {name}
          </p>
          {team.record && <p className="text-[11px] text-text-tertiary mt-0.5">{team.record}</p>}
        </div>
      </div>
      <span
        className={`text-2xl font-mono tabular-nums ml-1 ${
          isWinner ? 'text-burnt-orange font-bold' : 'text-text-primary'
        }`}
      >
        {team.score ?? '—'}
      </span>
    </div>
  );
}

function LineScoreBlock({
  linescore,
  game,
}: {
  linescore: NonNullable<GameData['linescore']>;
  game: GameData;
}) {
  const innings = linescore.innings ?? [];
  const showInnings = innings.length > 0;
  // Always show at least 9 columns for a complete line-score grid feel.
  const displayInningCount = Math.max(9, innings.length);
  const headers = Array.from({ length: displayInningCount }, (_, i) => String(i + 1));
  const totals = linescore.totals;

  const away = game.teams?.away;
  const home = game.teams?.home;
  const awayAbbr = away?.abbreviation ?? away?.name?.slice(0, 3).toUpperCase() ?? 'AWY';
  const homeAbbr = home?.abbreviation ?? home?.name?.slice(0, 3).toUpperCase() ?? 'HME';

  return (
    <div>
      <h3 className="font-display text-xs uppercase tracking-widest text-text-tertiary mb-2">
        Line Score
      </h3>
      <div className="overflow-x-auto border border-border-subtle rounded-sm">
        <table className="w-full text-xs font-mono tabular-nums">
          <thead>
            <tr className="bg-background-tertiary text-text-tertiary">
              <th className="text-left px-3 py-2 font-display uppercase tracking-wider min-w-[56px]">
                Team
              </th>
              {headers.map((h) => (
                <th key={h} className="text-center px-2 py-2 min-w-[24px]">
                  {h}
                </th>
              ))}
              <th className="text-center px-2 py-2 font-bold text-text-secondary">R</th>
              <th className="text-center px-2 py-2 font-bold text-text-secondary">H</th>
              <th className="text-center px-2 py-2 font-bold text-text-secondary">E</th>
            </tr>
          </thead>
          <tbody>
            {[
              { abbr: awayAbbr, side: 'away' as const, isWinner: !!away?.isWinner },
              { abbr: homeAbbr, side: 'home' as const, isWinner: !!home?.isWinner },
            ].map((row) => (
              <tr key={row.side} className="border-t border-border-subtle">
                <td className="text-left px-3 py-2 font-display uppercase tracking-wider text-text-primary">
                  {row.abbr}
                </td>
                {headers.map((_, idx) => {
                  const val = showInnings ? innings[idx]?.[row.side] : undefined;
                  return (
                    <td key={idx} className="text-center px-2 py-2 text-text-secondary">
                      {val === undefined || val === null || val === '' ? '—' : val}
                    </td>
                  );
                })}
                <td
                  className={`text-center px-2 py-2 font-bold ${
                    row.isWinner ? 'text-burnt-orange' : 'text-text-primary'
                  }`}
                >
                  {totals?.[row.side]?.runs ?? '—'}
                </td>
                <td className="text-center px-2 py-2 text-text-secondary">
                  {totals?.[row.side]?.hits ?? '—'}
                </td>
                <td className="text-center px-2 py-2 text-text-secondary">
                  {totals?.[row.side]?.errors ?? '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TeamBoxBlock({
  team,
  game,
}: {
  team: 'away' | 'home';
  game: GameData;
}) {
  const teamMeta = game.teams?.[team];
  const box = game.boxscore?.[team];
  const batting = box?.batting ?? [];
  const pitching = box?.pitching ?? [];
  const label = teamMeta?.displayName ?? teamMeta?.name ?? teamMeta?.abbreviation ?? (team === 'away' ? 'Away' : 'Home');
  const abbr = teamMeta?.abbreviation ?? label.slice(0, 3).toUpperCase();

  return (
    <div>
      <h3 className="flex items-center gap-2 font-display text-xs uppercase tracking-widest text-text-tertiary mb-2">
        <TeamCircle
          logo={teamMeta?.logo}
          abbreviation={abbr}
          size="w-6 h-6"
          textSize="text-[9px]"
        />
        <span>{label}</span>
      </h3>

      {batting.length > 0 && (
        <div className="border border-border-subtle rounded-sm overflow-hidden mb-4">
          <div className="bg-background-tertiary px-3 py-2 text-[11px] font-display uppercase tracking-widest text-text-secondary">
            Batting
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="text-text-tertiary">
                <tr className="border-b border-border-subtle">
                  <th className="text-left px-3 py-2 font-display uppercase tracking-wider">Player</th>
                  <StatHead>AB</StatHead>
                  <StatHead>R</StatHead>
                  <StatHead>H</StatHead>
                  <StatHead>RBI</StatHead>
                  <StatHead>BB</StatHead>
                  <StatHead>SO</StatHead>
                  <StatHead>AVG</StatHead>
                </tr>
              </thead>
              <tbody>
                {batting.map((b, i) => (
                  <tr key={`${b.player.id ?? b.player.name}-${i}`} className="border-b border-border-subtle last:border-b-0">
                    <td className="px-3 py-2">
                      <span className="flex items-center gap-2">
                        <PlayerAvatar headshot={b.player.headshot} name={b.player.name} />
                        {b.player.position && (
                          <span className="text-[10px] text-text-tertiary font-mono uppercase min-w-[24px]">
                            {b.player.position}
                          </span>
                        )}
                        <span className="text-text-primary">{b.player.name}</span>
                      </span>
                    </td>
                    <StatCell>{b.ab}</StatCell>
                    <StatCell>{b.r}</StatCell>
                    <StatCell emphasis>{b.h}</StatCell>
                    <StatCell>{b.rbi}</StatCell>
                    <StatCell>{b.bb}</StatCell>
                    <StatCell>{b.so}</StatCell>
                    <StatCell muted>{b.avg}</StatCell>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {pitching.length > 0 && (
        <div className="border border-border-subtle rounded-sm overflow-hidden">
          <div className="bg-background-tertiary px-3 py-2 text-[11px] font-display uppercase tracking-widest text-text-secondary">
            Pitching
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="text-text-tertiary">
                <tr className="border-b border-border-subtle">
                  <th className="text-left px-3 py-2 font-display uppercase tracking-wider">Pitcher</th>
                  <StatHead>IP</StatHead>
                  <StatHead>H</StatHead>
                  <StatHead>R</StatHead>
                  <StatHead>ER</StatHead>
                  <StatHead>BB</StatHead>
                  <StatHead>K</StatHead>
                  <StatHead>ERA</StatHead>
                </tr>
              </thead>
              <tbody>
                {pitching.map((p, i) => (
                  <tr key={`${p.player.id ?? p.player.name}-${i}`} className="border-b border-border-subtle last:border-b-0">
                    <td className="px-3 py-2">
                      <span className="flex items-center gap-2">
                        <PlayerAvatar headshot={p.player.headshot} name={p.player.name} />
                        <span className="text-text-primary">{p.player.name}</span>
                        {p.decision && (
                          <span
                            className={`text-[10px] font-display uppercase tracking-wider px-1.5 py-0.5 rounded-sm ${
                              p.decision === 'W'
                                ? 'bg-success/20 text-success'
                                : p.decision === 'L'
                                  ? 'bg-danger/20 text-danger'
                                  : 'bg-burnt-orange/20 text-burnt-orange'
                            }`}
                          >
                            {p.decision}
                          </span>
                        )}
                      </span>
                    </td>
                    <StatCell>{p.ip}</StatCell>
                    <StatCell>{p.h}</StatCell>
                    <StatCell>{p.r}</StatCell>
                    <StatCell emphasis>{p.er}</StatCell>
                    <StatCell>{p.bb}</StatCell>
                    <StatCell>{p.so}</StatCell>
                    <StatCell muted>{p.era}</StatCell>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function PlayerAvatar({ headshot, name }: { headshot?: string; name: string }) {
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase();
  if (!headshot) {
    return (
      <span className="w-6 h-6 rounded-full bg-background-secondary flex items-center justify-center text-[9px] font-display font-bold text-text-tertiary shrink-0">
        {initials}
      </span>
    );
  }
  return (
    <img
      src={headshot}
      alt={name}
      className="w-6 h-6 rounded-full object-cover shrink-0 bg-background-secondary"
      loading="lazy"
      onError={(e) => {
        // eslint-disable-next-line no-console
        console.warn('[PlayerAvatar] headshot failed to load', { url: headshot, name });
        (e.currentTarget as HTMLImageElement).style.display = 'none';
      }}
    />
  );
}

function StatHead({ children }: { children: React.ReactNode }) {
  return <th className="text-center px-2 py-2 font-display uppercase tracking-wider font-medium">{children}</th>;
}

function StatCell({
  children,
  emphasis,
  muted,
}: {
  children: React.ReactNode;
  emphasis?: boolean;
  muted?: boolean;
}) {
  return (
    <td
      className={`text-center px-2 py-2 font-mono tabular-nums ${
        emphasis ? 'text-text-primary font-semibold' : muted ? 'text-text-tertiary' : 'text-text-secondary'
      }`}
    >
      {children}
    </td>
  );
}

function DrawerFooter({
  sportSlug,
  gameId,
  sourceLabel,
}: {
  sportSlug: string;
  gameId: string | null;
  sourceLabel: string;
}) {
  return (
    <div className="pt-2 mt-2 border-t border-border-subtle flex items-center justify-between text-[11px]">
      <span className="text-text-tertiary font-mono uppercase tracking-wider">{sourceLabel}</span>
      {gameId && (
        <Link
          href={`/${sportSlug}/game/${gameId}/box-score/`}
          className="text-burnt-orange hover:text-ember transition-colors font-display uppercase tracking-wider"
        >
          Open full game →
        </Link>
      )}
    </div>
  );
}
