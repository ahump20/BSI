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
    <div className="min-h-screen bg-[var(--surface-scoreboard)]">
      {/* Header */}
      <div className="border-b border-[var(--border-vintage)] relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 70% 50% at 50% 20%, rgba(191,87,0,0.04) 0%, transparent 70%)' }} />
        <div className="max-w-4xl mx-auto px-4 py-8 relative">
          <span className="heritage-stamp block mb-3">Preferences</span>
          <h1 className="font-display text-3xl md:text-4xl font-bold uppercase tracking-display text-[var(--bsi-bone)] mb-2">Settings</h1>
          <p className="text-[var(--bsi-dust)] text-sm">
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
          <h2 className="text-lg font-semibold text-[var(--bsi-bone)] mb-4 flex items-center gap-2">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5 text-[var(--bsi-primary)]/60"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
            Time & Date
          </h2>
          <TimezoneSelector />
          <p className="text-xs text-[rgba(196,184,165,0.35)] mt-3">
            All game times and timestamps will be displayed in your selected timezone. BSI API data
            is stored in America/Chicago (Central Time).
          </p>
        </section>

        {/* Team Preferences */}
        <section>
          <h2 className="text-lg font-semibold text-[var(--bsi-bone)] mb-4 flex items-center gap-2">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6 text-[var(--bsi-dust)]"><path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6M9 9h.01M15 9h.01M9 13h.01M15 13h.01"/></svg>
            Favorite Teams
          </h2>
          <TeamPreferenceSelector />
          <p className="text-xs text-[rgba(196,184,165,0.35)] mt-3">
            Select your favorite teams to see their games highlighted and get personalized content.
          </p>
        </section>

        {/* Display Preferences */}
        <section>
          <h2 className="text-lg font-semibold text-[var(--bsi-bone)] mb-4 flex items-center gap-2">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5 text-[var(--bsi-primary)]/60"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>
            Display
          </h2>
          <div className="heritage-card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[var(--bsi-bone)] font-medium">Theme</p>
                <p className="text-xs text-[rgba(196,184,165,0.5)]">Currently in dark mode (default)</p>
              </div>
              <span className="text-xs px-3 py-1 rounded-sm bg-[var(--bsi-primary)]/20 text-[var(--bsi-primary)]">
                {settings.theme === 'dark' ? 'Dark' : 'Light'}
              </span>
            </div>
            <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
              <div>
                <p className="text-[var(--bsi-bone)] font-medium">Time Format</p>
                <p className="text-xs text-[rgba(196,184,165,0.5)]">12-hour or 24-hour clock</p>
              </div>
              <span className="text-xs px-3 py-1 rounded-sm bg-[var(--surface-dugout)] text-[var(--bsi-dust)]">
                {settings.timeFormat === '12h' ? '12-hour' : '24-hour'}
              </span>
            </div>
          </div>
        </section>

        {/* Reset Section */}
        <section className="pt-4 border-t border-background-secondary/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[var(--bsi-dust)] text-sm">Reset all settings</p>
              <p className="text-xs text-[rgba(196,184,165,0.35)]">
                This will clear your timezone preference and favorite teams.
              </p>
            </div>
            <button
              onClick={handleResetAll}
              className="px-4 py-2 text-sm font-medium text-[var(--bsi-danger)] hover:text-[var(--bsi-danger)] hover:bg-[var(--bsi-danger)]/10 rounded-sm transition-colors"
            >
              Reset All
            </button>
          </div>
        </section>

        {/* Debug Info (dev only) */}
        {process.env.NODE_ENV === 'development' && (
          <section className="pt-4 border-t border-background-secondary/30">
            <details className="text-xs text-[rgba(196,184,165,0.35)]">
              <summary className="cursor-pointer hover:text-[rgba(196,184,165,0.5)]">Debug Info</summary>
              <pre className="mt-2 p-3 bg-[var(--surface-dugout)]/30 rounded-sm overflow-x-auto">
                {JSON.stringify(settings, null, 2)}
              </pre>
            </details>
          </section>
        )}
      </div>
    </div>
  );
}
