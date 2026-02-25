'use client';

/**
 * Settings Page
 *
 * User preferences for timezone, favorite teams, and display settings.
 *
 * Last Updated: 2025-01-07
 */

import { TimezoneSelector, TimezoneBadge } from '@/components/settings/TimezoneSelector';
import {
  TeamPreferenceSelector,
  FavoriteTeamsBadge,
} from '@/components/settings/TeamPreferenceSelector';
import { useUserSettings } from '@/lib/hooks';
import { useTeamPreferences } from '@/lib/hooks';

export default function SettingsPage() {
  const { settings, resetSettings, isLoaded: timezoneLoaded } = useUserSettings();
  const { prefs: teamPrefs, clearPreferences: clearTeams, isLoaded: teamsLoaded } = useTeamPreferences();

  if (!settings) {
    return null;
  }

  const handleResetAll = () => {
    if (confirm('Are you sure you want to reset all settings to defaults?')) {
      resetSettings();
      clearTeams();
    }
  };

  return (
    <div className="min-h-screen bg-midnight">
      {/* Header */}
      <div className="border-b border-charcoal/50 bg-charcoal/20">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-display text-white">Settings</h1>
          <p className="text-white/60 mt-2">
            Customize your BSI experience with timezone, favorite teams, and display preferences.
          </p>

          {/* Current Settings Summary */}
          <div className="flex flex-wrap items-center gap-3 mt-4">
            {timezoneLoaded && <TimezoneBadge />}
            {teamsLoaded && <FavoriteTeamsBadge teams={teamPrefs?.favoriteTeams ?? []} />}
          </div>
        </div>
      </div>

      {/* Settings Sections */}
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Timezone Settings */}
        <section>
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <span className="text-2xl">🕐</span>
            Time & Date
          </h2>
          <TimezoneSelector />
          <p className="text-xs text-white/40 mt-3">
            All game times and timestamps will be displayed in your selected timezone. BSI API data
            is stored in America/Chicago (Central Time).
          </p>
        </section>

        {/* Team Preferences */}
        <section>
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <span className="text-2xl">🏟️</span>
            Favorite Teams
          </h2>
          <TeamPreferenceSelector />
          <p className="text-xs text-white/40 mt-3">
            Select your favorite teams to see their games highlighted and get personalized content.
          </p>
        </section>

        {/* Display Preferences */}
        <section>
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <span className="text-2xl">🎨</span>
            Display
          </h2>
          <div className="glass-card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium">Theme</p>
                <p className="text-xs text-white/50">Currently in dark mode (default)</p>
              </div>
              <span className="text-xs px-3 py-1 rounded bg-burnt-orange/20 text-burnt-orange">
                {settings.theme === 'dark' ? 'Dark' : 'Light'}
              </span>
            </div>
            <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between">
              <div>
                <p className="text-white font-medium">Time Format</p>
                <p className="text-xs text-white/50">12-hour or 24-hour clock</p>
              </div>
              <span className="text-xs px-3 py-1 rounded bg-charcoal text-white/70">
                {settings.timeFormat === '12h' ? '12-hour' : '24-hour'}
              </span>
            </div>
          </div>
        </section>

        {/* Reset Section */}
        <section className="pt-4 border-t border-charcoal/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/60 text-sm">Reset all settings</p>
              <p className="text-xs text-white/40">
                This will clear your timezone preference and favorite teams.
              </p>
            </div>
            <button
              onClick={handleResetAll}
              className="px-4 py-2 text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
            >
              Reset All
            </button>
          </div>
        </section>

        {/* Debug Info (dev only) */}
        {process.env.NODE_ENV === 'development' && (
          <section className="pt-4 border-t border-charcoal/30">
            <details className="text-xs text-white/30">
              <summary className="cursor-pointer hover:text-white/50">Debug Info</summary>
              <pre className="mt-2 p-3 bg-charcoal/30 rounded overflow-x-auto">
                {JSON.stringify(settings, null, 2)}
              </pre>
            </details>
          </section>
        )}
      </div>
    </div>
  );
}
