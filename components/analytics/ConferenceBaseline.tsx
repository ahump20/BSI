'use client';

interface ConferenceBaselineProps {
  /** The stat value for this team/player */
  value: number | null | undefined;
  /** Label for the stat (e.g. "wRC+") */
  label: string;
  /** Conference average for this stat */
  confAvg?: number | null;
  /** Conference name (e.g. "SEC") */
  confName?: string;
  /** Custom formatter — defaults to 3-decimal for rates, integer otherwise */
  format?: (v: number) => string;
  /** When true, values above the conference average are good (green). Default true. */
  higherIsBetter?: boolean;
}

function defaultFormat(v: number | null | undefined): string {
  if (v === null || v === undefined || !Number.isFinite(v)) return '—';
  if (Math.abs(v) < 10 && v !== Math.floor(v)) return v.toFixed(3);
  return v.toFixed(1);
}

/**
 * ConferenceBaseline — displays a stat value with conference-average context.
 *
 * Example output: "115 wRC+ (SEC avg: 98)" with a small color indicator
 * showing whether the value is above or below conference average.
 */
export function ConferenceBaseline({
  value,
  label,
  confAvg,
  confName,
  format = defaultFormat,
  higherIsBetter = true,
}: ConferenceBaselineProps) {
  const formatted = format(value);
  const hasValue = value !== null && value !== undefined && Number.isFinite(value);
  const hasContext =
    hasValue &&
    confAvg !== null &&
    confAvg !== undefined &&
    Number.isFinite(confAvg) &&
    Boolean(confName);

  let indicatorColor = 'text-bsi-dust';
  if (hasContext) {
    const diff = value - confAvg;
    const isGood = higherIsBetter ? diff > 0 : diff < 0;
    const isBad = higherIsBetter ? diff < 0 : diff > 0;
    if (isGood) indicatorColor = 'text-emerald-400';
    else if (isBad) indicatorColor = 'text-red-400';
  }

  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`font-mono font-semibold ${indicatorColor}`}>{formatted}</span>
      <span className="text-bsi-dust text-xs">{label}</span>
      {hasContext && (
        <span className="text-bsi-dust/60 text-xs">
          ({confName} avg: {format(confAvg)})
        </span>
      )}
    </span>
  );
}
