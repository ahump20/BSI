/**
 * BSI Micro-Copy Constants
 * Centralized loading, error, and empty state messages with consistent voice.
 */

export const loadingMessages = {
  default: 'Pulling fresh data...',
  portal: 'Checking the portal...',
  scores: 'Getting live scores...',
  dashboard: 'Waking up the command center...',
  charts: 'Crunching the numbers...',
  standings: 'Loading standings...',
  schedule: 'Fetching the schedule...',
  player: 'Loading player data...',
  team: 'Loading team data...',
} as const;

export const errorMessages = {
  apiFailure: 'Data connection dropped. Retrying...',
  network: 'Network hiccup. Give it a second.',
  rateLimit: 'Slow down, partner. Servers need a breather.',
  notFound: "Couldn't find that. Double-check the URL.",
  serverError: 'Something broke on our end. Working on it.',
  timeout: 'Request timed out. Try again.',
  unauthorized: 'Access denied. Check your credentials.',
} as const;

export const emptyStates = {
  noPlayers: 'No players match your filters. Try loosening them up.',
  noGames: "The diamond's quiet right now. Check the schedule or come back during game time.",
  noStandings: 'Early in the season? Give it a few games.',
  noTransfers: 'No transfers in the portal right now. Check back during the transfer window.',
  noResults: 'No results found. Try a different search.',
  noTeams: 'No teams match your criteria.',
  noSchedule: 'No games scheduled for this date.',
  noStats: 'Stats not available yet.',
} as const;

export const successMessages = {
  saved: 'Saved.',
  updated: 'Updated.',
  deleted: 'Removed.',
  subscribed: "You're subscribed. We'll notify you.",
  unsubscribed: 'Unsubscribed.',
  copied: 'Copied to clipboard.',
  exported: 'Export complete.',
} as const;

export type LoadingMessageKey = keyof typeof loadingMessages;
export type ErrorMessageKey = keyof typeof errorMessages;
export type EmptyStateKey = keyof typeof emptyStates;
export type SuccessMessageKey = keyof typeof successMessages;
