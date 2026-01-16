'use client';

/**
 * Timezone Selector Component
 *
 * Allows users to select their preferred timezone for game times.
 * Features auto-detection, quick US presets, and manual selection.
 *
 * Last Updated: 2025-01-07
 */

import { useState } from 'react';
import { cn } from '@/lib/utils';
import {
  US_TIMEZONES,
  ALL_TIMEZONES,
  BSI_TIMEZONE,
  getTimezoneLabel,
  getTimezoneAbbr,
} from '@/lib/utils/timezone';
import useUserSettings from '@/lib/hooks/useUserSettings';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

// ============================================================================
// TYPES
// ============================================================================

export interface TimezoneSelectorProps {
  /** Callback when timezone is changed */
  onSave?: () => void;
  /** Compact mode for inline usage */
  compact?: boolean;
  /** Show save button */
  showSaveButton?: boolean;
  /** Additional class names */
  className?: string;
}

// ============================================================================
// TIMEZONE OPTION COMPONENT
// ============================================================================

interface TimezoneOptionProps {
  value: string;
  label: string;
  abbr: string;
  isSelected: boolean;
  onSelect: () => void;
  isDefault?: boolean;
  isDetected?: boolean;
}

function TimezoneOption({
  label,
  abbr,
  isSelected,
  onSelect,
  isDefault,
  isDetected,
}: TimezoneOptionProps) {
  return (
    <button
      onClick={onSelect}
      className={cn(
        'relative p-3 rounded-lg border transition-all text-left group w-full',
        'hover:scale-[1.01] active:scale-[0.99]',
        isSelected
          ? 'border-burnt-orange bg-burnt-orange/10 ring-2 ring-burnt-orange/50'
          : 'border-white/10 hover:border-white/20 hover:bg-white/5'
      )}
    >
      <div className="flex items-center justify-between">
        <div>
          <p
            className={cn(
              'font-medium text-sm transition-colors',
              isSelected ? 'text-white' : 'text-white/80 group-hover:text-white'
            )}
          >
            {label}
          </p>
          <p className="text-xs text-white/50 mt-0.5">{abbr}</p>
        </div>

        <div className="flex items-center gap-2">
          {isDefault && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-burnt-orange/20 text-burnt-orange">
              BSI Default
            </span>
          )}
          {isDetected && !isDefault && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-500/20 text-green-400">
              Detected
            </span>
          )}
          {isSelected && (
            <div className="w-5 h-5 rounded-full bg-burnt-orange flex items-center justify-center">
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
        </div>
      </div>
    </button>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function TimezoneSelector({
  onSave,
  compact = false,
  showSaveButton = true,
  className,
}: TimezoneSelectorProps) {
  const { settings, isLoaded, setTimezone, enableAutoTimezone, isNonCentralTimezone } =
    useUserSettings();

  const [showAllTimezones, setShowAllTimezones] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const handleSelect = (tz: string) => {
    setTimezone(tz);
    setHasChanges(true);
  };

  const handleAutoDetect = () => {
    enableAutoTimezone();
    setHasChanges(true);
  };

  const handleSave = () => {
    setHasChanges(false);
    onSave?.();
  };

  if (!isLoaded) {
    return (
      <Card className={cn('animate-pulse', className)}>
        <div className="h-32 bg-white/5 rounded" />
      </Card>
    );
  }

  // Get current time preview in selected timezone
  const now = new Date();
  const previewTime = new Intl.DateTimeFormat('en-US', {
    timeZone: settings.timezone,
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  }).format(now);

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="text-2xl">🕐</span>
          Timezone
        </CardTitle>
        {settings.useAutoTimezone && <span className="text-xs text-green-400">Auto-detected</span>}
      </CardHeader>

      <div className={cn('px-4 pb-4', compact && 'px-3 pb-3')}>
        {/* Current Time Preview */}
        <div className="mb-4 p-3 rounded-lg bg-gradient-to-r from-burnt-orange/10 to-transparent border border-burnt-orange/20">
          <p className="text-xs text-white/50 uppercase tracking-wider">Current Time</p>
          <p className="text-xl font-semibold text-white mt-1">{previewTime}</p>
          <p className="text-xs text-white/60 mt-1">{getTimezoneLabel(settings.timezone)}</p>
        </div>

        {/* Auto-detect notice for non-Central users */}
        {isNonCentralTimezone && settings.timezone === BSI_TIMEZONE && (
          <div className="mb-4 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <p className="text-xs text-blue-400">
              Tip: Your device is in {getTimezoneLabel(settings.detectedTimezone!)}. Want to switch
              from Central Time?
            </p>
            <button
              onClick={handleAutoDetect}
              className="mt-2 text-xs text-blue-400 underline hover:text-blue-300"
            >
              Use my timezone ({getTimezoneAbbr(settings.detectedTimezone!)})
            </button>
          </div>
        )}

        <p className="text-sm text-white/60 mb-4">
          Game times will be shown in your selected timezone.
        </p>

        {/* Quick US Timezones */}
        <div className="mb-4">
          <h4 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">
            US Timezones
          </h4>
          <div className="grid grid-cols-1 gap-2">
            {US_TIMEZONES.map((tz) => (
              <TimezoneOption
                key={tz.value}
                value={tz.value}
                label={tz.label}
                abbr={tz.abbr}
                isSelected={settings.timezone === tz.value}
                onSelect={() => handleSelect(tz.value)}
                isDefault={tz.value === BSI_TIMEZONE}
                isDetected={tz.value === settings.detectedTimezone}
              />
            ))}
          </div>
        </div>

        {/* Show More Toggle */}
        <button
          onClick={() => setShowAllTimezones(!showAllTimezones)}
          className="w-full text-center text-sm text-burnt-orange hover:text-ember transition-colors mb-4"
        >
          {showAllTimezones ? 'Show less' : 'Show international timezones'}
        </button>

        {/* International Timezones */}
        {showAllTimezones && (
          <div className="mb-4">
            <h4 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">
              International
            </h4>
            <div className="grid grid-cols-1 gap-2">
              {ALL_TIMEZONES.filter((tz) => !US_TIMEZONES.some((us) => us.value === tz.value)).map(
                (tz) => (
                  <TimezoneOption
                    key={tz.value}
                    value={tz.value}
                    label={tz.label}
                    abbr={tz.abbr}
                    isSelected={settings.timezone === tz.value}
                    onSelect={() => handleSelect(tz.value)}
                    isDetected={tz.value === settings.detectedTimezone}
                  />
                )
              )}
            </div>
          </div>
        )}

        {/* Save Button */}
        {showSaveButton && hasChanges && (
          <div className="mt-4 flex justify-end">
            <Button variant="primary" size="sm" onClick={handleSave}>
              Save Timezone
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}

// ============================================================================
// INLINE TIMEZONE BADGE
// ============================================================================

export interface TimezoneBadgeProps {
  className?: string;
}

/**
 * Compact display of current timezone for use in headers/nav
 */
export function TimezoneBadge({ className }: TimezoneBadgeProps) {
  const { settings, isLoaded } = useUserSettings();

  if (!isLoaded) {
    return null;
  }

  const abbr = getTimezoneAbbr(settings.timezone);

  return (
    <span
      className={cn('text-xs px-2 py-0.5 rounded bg-white/10 text-white/70', className)}
      title={getTimezoneLabel(settings.timezone)}
    >
      {abbr}
    </span>
  );
}

export default TimezoneSelector;
