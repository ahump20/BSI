/**
 * BLAZE SPORTS INTEL - Timezone Utilities
 *
 * Utilities for detecting, formatting, and managing timezone preferences.
 * BSI APIs always return America/Chicago timestamps; this module handles
 * frontend conversion to user's preferred timezone.
 *
 * Last Updated: 2025-01-07
 */

// ============================================================================
// CONSTANTS
// ============================================================================

/** BSI's canonical timezone - all API data uses this */
export const BSI_TIMEZONE = 'America/Chicago';

/** Common US timezones for quick selection */
export const US_TIMEZONES = [
  { value: 'America/New_York', label: 'Eastern Time (ET)', abbr: 'ET' },
  { value: 'America/Chicago', label: 'Central Time (CT)', abbr: 'CT' },
  { value: 'America/Denver', label: 'Mountain Time (MT)', abbr: 'MT' },
  { value: 'America/Phoenix', label: 'Arizona (AZ)', abbr: 'AZ' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)', abbr: 'PT' },
  { value: 'America/Anchorage', label: 'Alaska Time (AKT)', abbr: 'AKT' },
  { value: 'Pacific/Honolulu', label: 'Hawaii Time (HT)', abbr: 'HT' },
] as const;

/** All supported IANA timezones (US focus, but includes major intl) */
export const ALL_TIMEZONES = [
  ...US_TIMEZONES,
  { value: 'Europe/London', label: 'London (GMT/BST)', abbr: 'GMT' },
  { value: 'Europe/Paris', label: 'Central Europe (CET)', abbr: 'CET' },
  { value: 'Asia/Tokyo', label: 'Japan (JST)', abbr: 'JST' },
  { value: 'Australia/Sydney', label: 'Sydney (AEST)', abbr: 'AEST' },
] as const;

export type TimezoneOption = (typeof ALL_TIMEZONES)[number];

// ============================================================================
// DETECTION
// ============================================================================

/**
 * Detect user's browser timezone
 * Returns IANA timezone string (e.g., 'America/Chicago')
 */
export function detectUserTimezone(): string {
  if (typeof Intl === 'undefined') {
    return BSI_TIMEZONE;
  }

  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return BSI_TIMEZONE;
  }
}

/**
 * Check if a timezone string is valid IANA format
 */
export function isValidTimezone(tz: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

/**
 * Get a friendly label for a timezone, falling back to the raw value
 */
export function getTimezoneLabel(tz: string): string {
  const found = ALL_TIMEZONES.find((t) => t.value === tz);
  return found?.label ?? tz;
}

/**
 * Get the abbreviation for a timezone at a given time
 */
export function getTimezoneAbbr(tz: string, date: Date = new Date()): string {
  const found = ALL_TIMEZONES.find((t) => t.value === tz);
  if (found) return found.abbr;

  // Fallback: extract from formatted string
  try {
    const formatted = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      timeZoneName: 'short',
    }).format(date);
    const match = formatted.match(/[A-Z]{2,4}$/);
    return match?.[0] ?? tz;
  } catch {
    return tz;
  }
}

// ============================================================================
// FORMATTING
// ============================================================================

export interface FormatOptions {
  timezone?: string;
  includeTime?: boolean;
  includeDate?: boolean;
  includeTimezone?: boolean;
  format?: 'short' | 'compact' | 'medium' | 'long' | 'full';
}

/**
 * Format a date/time string or Date object in the user's timezone
 *
 * @param input - ISO string or Date object (assumed to be in BSI timezone if string)
 * @param options - Formatting options
 * @returns Formatted string in user's timezone
 *
 * @example
 * formatInTimezone('2025-01-07T19:00:00', { timezone: 'America/New_York' })
 * // => "Jan 7, 2025, 8:00 PM ET"
 */
export function formatInTimezone(input: string | Date, options: FormatOptions = {}): string {
  const {
    timezone = BSI_TIMEZONE,
    includeTime = true,
    includeDate = true,
    includeTimezone = true,
    format = 'medium',
  } = options;

  const date = typeof input === 'string' ? new Date(input) : input;

  if (isNaN(date.getTime())) {
    return 'Invalid date';
  }

  const dateOptions: Intl.DateTimeFormatOptions = {
    timeZone: timezone,
  };

  // Date formatting
  if (includeDate) {
    switch (format) {
      case 'short':
        dateOptions.month = 'numeric';
        dateOptions.day = 'numeric';
        break;
      case 'compact':
        dateOptions.month = 'short';
        dateOptions.day = 'numeric';
        break;
      case 'medium':
        dateOptions.month = 'short';
        dateOptions.day = 'numeric';
        dateOptions.year = 'numeric';
        break;
      case 'long':
        dateOptions.weekday = 'short';
        dateOptions.month = 'short';
        dateOptions.day = 'numeric';
        dateOptions.year = 'numeric';
        break;
      case 'full':
        dateOptions.weekday = 'long';
        dateOptions.month = 'long';
        dateOptions.day = 'numeric';
        dateOptions.year = 'numeric';
        break;
    }
  }

  // Time formatting
  if (includeTime) {
    dateOptions.hour = 'numeric';
    dateOptions.minute = '2-digit';
  }

  if (includeTimezone && includeTime) {
    dateOptions.timeZoneName = 'short';
  }

  try {
    return new Intl.DateTimeFormat('en-US', dateOptions).format(date);
  } catch {
    return date.toLocaleString();
  }
}

/**
 * Format just the time portion in user's timezone
 *
 * @example
 * formatTimeInTimezone('2025-01-07T19:00:00', 'America/New_York')
 * // => "8:00 PM ET"
 */
export function formatTimeInTimezone(
  input: string | Date,
  timezone: string = BSI_TIMEZONE,
  includeTimezone: boolean = true
): string {
  return formatInTimezone(input, {
    timezone,
    includeTime: true,
    includeDate: false,
    includeTimezone,
  });
}

/**
 * Format just the date portion in user's timezone
 *
 * @example
 * formatDateInTimezone('2025-01-07T19:00:00', 'America/New_York')
 * // => "Jan 7, 2025"
 */
export function formatDateInTimezone(
  input: string | Date,
  timezone: string = BSI_TIMEZONE,
  format: FormatOptions['format'] = 'medium'
): string {
  return formatInTimezone(input, {
    timezone,
    includeTime: false,
    includeDate: true,
    format,
  });
}

/**
 * Format a game time for display (common sports use case)
 * Shows time with timezone abbreviation
 *
 * @example
 * formatGameTime('2025-01-07T19:05:00', 'America/New_York')
 * // => "8:05 PM ET"
 */
export function formatGameTime(input: string | Date, timezone: string = BSI_TIMEZONE): string {
  const date = typeof input === 'string' ? new Date(input) : input;

  if (isNaN(date.getTime())) {
    return 'TBD';
  }

  try {
    const time = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour: 'numeric',
      minute: '2-digit',
    }).format(date);

    const abbr = getTimezoneAbbr(timezone, date);
    return `${time} ${abbr}`;
  } catch {
    return 'TBD';
  }
}

/**
 * Format a timestamp in Central Time with " CT" suffix.
 * Drop-in replacement for the inline formatTimestamp that was copy-pasted across 26 pages.
 */
export function formatTimestamp(isoString?: string): string {
  if (isoString === '') return '';
  const date = isoString ? new Date(isoString) : new Date();
  if (isNaN(date.getTime())) return 'Invalid date';
  return (
    date.toLocaleString('en-US', {
      timeZone: BSI_TIMEZONE,
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }) + ' CT'
  );
}

/**
 * Format a date string (YYYY-MM-DD) for display as "Mon, Feb 14" etc.
 * Appends T12:00:00 to avoid date-shift from timezone offset.
 */
export function formatScheduleDate(dateString: string): string {
  const date = new Date(dateString + 'T12:00:00');
  return date.toLocaleDateString('en-US', {
    timeZone: BSI_TIMEZONE,
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Get a YYYY-MM-DD date string offset from today by N days.
 * Positive = future, negative = past, 0 = today.
 */
export function getDateOffset(offset: number): string {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return new Intl.DateTimeFormat('en-CA', { timeZone: BSI_TIMEZONE }).format(date);
}

/**
 * Get relative time description (e.g., "in 2 hours", "yesterday")
 */
export function getRelativeTime(input: string | Date, timezone: string = BSI_TIMEZONE): string {
  const date = typeof input === 'string' ? new Date(input) : input;
  const now = new Date();

  const diffMs = date.getTime() - now.getTime();
  const diffMins = Math.round(diffMs / 60000);
  const diffHours = Math.round(diffMs / 3600000);
  const diffDays = Math.round(diffMs / 86400000);

  if (Math.abs(diffMins) < 60) {
    if (diffMins === 0) return 'now';
    return diffMins > 0 ? `in ${diffMins} min` : `${Math.abs(diffMins)} min ago`;
  }

  if (Math.abs(diffHours) < 24) {
    return diffHours > 0 ? `in ${diffHours}h` : `${Math.abs(diffHours)}h ago`;
  }

  if (Math.abs(diffDays) < 7) {
    if (diffDays === 1) return 'tomorrow';
    if (diffDays === -1) return 'yesterday';
    return diffDays > 0 ? `in ${diffDays} days` : `${Math.abs(diffDays)} days ago`;
  }

  // Fall back to formatted date
  return formatDateInTimezone(date, timezone, 'short');
}
