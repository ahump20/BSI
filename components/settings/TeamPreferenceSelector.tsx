'use client';

/**
 * Team Preference Selector Component
 *
 * Allows users to select their favorite team for each league.
 * Features team colors, logos, and smooth interactions.
 *
 * Last Updated: 2025-12-28
 */

import { useState } from 'react';
import { cn } from '@/lib/utils';
import {
  useTeamPreferences,
  type League,
  type Team,
  TEAMS_BY_LEAGUE,
} from '@/lib/hooks/useTeamPreferences';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

// ============================================================================
// TYPES
// ============================================================================

export interface TeamPreferenceSelectorProps {
  /** Callback when preferences are saved */
  onSave?: () => void;
  /** Compact mode for inline usage */
  compact?: boolean;
  /** Show save button */
  showSaveButton?: boolean;
  /** Additional class names */
  className?: string;
}

interface LeagueSectionProps {
  league: League;
  label: string;
  teams: Team[];
  selectedTeamId: string | null;
  onSelect: (teamId: string | null) => void;
  compact?: boolean;
}

// ============================================================================
// LEAGUE SECTION COMPONENT
// ============================================================================

function LeagueSection({
  league,
  label,
  teams,
  selectedTeamId,
  onSelect,
  compact,
}: LeagueSectionProps) {
  const [isExpanded, setIsExpanded] = useState(!compact || selectedTeamId !== null);

  const selectedTeam = teams.find((t) => t.id === selectedTeamId);

  return (
    <div className="mb-6 last:mb-0">
      {/* League Header */}
      <button
        onClick={() => compact && setIsExpanded(!isExpanded)}
        className={cn(
          'w-full flex items-center justify-between mb-3',
          compact && 'cursor-pointer hover:opacity-80 transition-opacity'
        )}
      >
        <h4 className="text-sm font-semibold text-white/70 uppercase tracking-wider">
          {label}
        </h4>
        {selectedTeam && (
          <span
            className="text-xs px-2 py-0.5 rounded-full font-medium"
            style={{
              backgroundColor: selectedTeam.colors.primary + '30',
              color: selectedTeam.colors.primary,
            }}
          >
            {selectedTeam.shortName}
          </span>
        )}
      </button>

      {/* Team Grid */}
      {isExpanded && (
        <div
          className={cn(
            'grid gap-2',
            compact ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4'
          )}
        >
          {teams.map((team) => {
            const isSelected = team.id === selectedTeamId;

            return (
              <button
                key={team.id}
                onClick={() => onSelect(isSelected ? null : team.id)}
                className={cn(
                  'relative p-3 rounded-lg border transition-all text-left group',
                  'hover:scale-[1.02] active:scale-[0.98]',
                  isSelected
                    ? 'border-transparent ring-2 ring-offset-2 ring-offset-midnight'
                    : 'border-white/10 hover:border-white/20'
                )}
                style={{
                  backgroundColor: isSelected ? team.colors.primary + '20' : 'transparent',
                  ...(isSelected && {
                    ringColor: team.colors.primary,
                  }),
                }}
              >
                {/* Team Color Accent */}
                <div
                  className="absolute inset-y-0 left-0 w-1 rounded-l-lg"
                  style={{ backgroundColor: team.colors.primary }}
                />

                {/* Team Info */}
                <div className="pl-2">
                  <p
                    className={cn(
                      'font-semibold text-sm transition-colors',
                      isSelected ? 'text-white' : 'text-white/80 group-hover:text-white'
                    )}
                  >
                    {team.shortName}
                  </p>
                  <p className="text-xs text-white/50">{team.city}</p>
                </div>

                {/* Selected Indicator */}
                {isSelected && (
                  <div
                    className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: team.colors.primary }}
                  >
                    <svg
                      className="w-3 h-3 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function TeamPreferenceSelector({
  onSave,
  compact = false,
  showSaveButton = true,
  className,
}: TeamPreferenceSelectorProps) {
  const {
    preferences,
    isLoaded,
    setFavoriteTeam,
    hasFavorites,
    clearPreferences,
    leagueLabels,
  } = useTeamPreferences();

  const [hasChanges, setHasChanges] = useState(false);

  const handleSelect = (league: League, teamId: string | null) => {
    setFavoriteTeam(league, teamId);
    setHasChanges(true);
  };

  const handleSave = () => {
    setHasChanges(false);
    onSave?.();
  };

  const handleClear = () => {
    clearPreferences();
    setHasChanges(true);
  };

  if (!isLoaded) {
    return (
      <Card className={cn('animate-pulse', className)}>
        <div className="h-48 bg-white/5 rounded" />
      </Card>
    );
  }

  const leagues: League[] = ['mlb', 'nfl', 'nba', 'ncaa'];

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="text-2xl">🏆</span>
          Your Teams
        </CardTitle>
        {hasFavorites() && (
          <button
            onClick={handleClear}
            className="text-xs text-white/50 hover:text-error transition-colors"
          >
            Clear all
          </button>
        )}
      </CardHeader>

      <div className={cn('px-4 pb-4', compact && 'px-3 pb-3')}>
        <p className="text-sm text-white/60 mb-6">
          Pick your favorites and we'll prioritize their games on your dashboard.
        </p>

        {leagues.map((league) => (
          <LeagueSection
            key={league}
            league={league}
            label={leagueLabels[league]}
            teams={TEAMS_BY_LEAGUE[league]}
            selectedTeamId={preferences.favoriteTeams[league]}
            onSelect={(teamId) => handleSelect(league, teamId)}
            compact={compact}
          />
        ))}

        {showSaveButton && hasChanges && (
          <div className="mt-6 flex justify-end">
            <Button variant="primary" size="sm" onClick={handleSave}>
              Save Preferences
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}

// ============================================================================
// INLINE SUMMARY COMPONENT
// ============================================================================

export interface FavoriteTeamsBadgeProps {
  className?: string;
}

/**
 * Compact display of favorite teams for use in headers/nav
 */
export function FavoriteTeamsBadge({ className }: FavoriteTeamsBadgeProps) {
  const { getAllFavorites, isLoaded, hasFavorites } = useTeamPreferences();

  if (!isLoaded || !hasFavorites()) {
    return null;
  }

  const favorites = getAllFavorites();
  const teams = Object.values(favorites).filter(Boolean) as Team[];

  return (
    <div className={cn('flex items-center gap-1', className)}>
      {teams.map((team) => (
        <span
          key={team.id}
          className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
          style={{ backgroundColor: team.colors.primary }}
          title={team.name}
        >
          {team.shortName.charAt(0)}
        </span>
      ))}
    </div>
  );
}

export default TeamPreferenceSelector;
