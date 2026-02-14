/** Convert ISO date string to human-readable relative time label */
export function relativeTime(dateStr: string): string {
  const elapsedMs = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(elapsedMs / 60_000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}
