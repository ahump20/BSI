/**
 * SourcePill — Compact badge showing a data source name + last-updated time.
 * Used across the site wherever source attribution appears (dashboard, data
 * sources page, game detail meta rows).
 */

interface SourcePillProps {
  name: string;
  /** ISO timestamp or human-readable string. Omit to skip the time display. */
  updatedAt?: string;
  /** Optional URL to link the source name. */
  href?: string;
  className?: string;
}

function formatTime(iso: string): string {
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      timeZone: 'America/Chicago',
    });
  } catch {
    return iso;
  }
}

export function SourcePill({ name, updatedAt, href, className = '' }: SourcePillProps) {
  const nameEl = href ? (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="hover:text-white/80 transition-colors underline underline-offset-2"
    >
      {name}
    </a>
  ) : (
    <span>{name}</span>
  );

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.06] border border-white/[0.08] text-xs text-white/50 ${className}`}
    >
      {nameEl}
      {updatedAt && (
        <>
          <span className="text-white/15">·</span>
          <span className="text-white/30">{formatTime(updatedAt)}</span>
        </>
      )}
    </span>
  );
}
