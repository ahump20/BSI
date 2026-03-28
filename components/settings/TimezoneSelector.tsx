'use client';

interface TimezoneSelectorProps {
  value?: string;
  onChange?: (tz: string) => void;
}

const TIMEZONES = [
  { value: 'America/New_York', label: 'Eastern (ET)' },
  { value: 'America/Chicago', label: 'Central (CT)' },
  { value: 'America/Denver', label: 'Mountain (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific (PT)' },
];

export function TimezoneSelector({ value, onChange }: TimezoneSelectorProps) {
  return (
    <div>
      <label htmlFor="tz-select" className="block text-sm font-medium text-[var(--bsi-dust)] mb-2">Timezone</label>
      <select
        id="tz-select"
        value={value || 'America/Chicago'}
        onChange={(e) => onChange?.(e.target.value)}
        className="w-full bg-[var(--surface-dugout)] border border-[var(--border-vintage)] rounded-sm px-3 py-2 text-white text-sm focus:outline-none focus:border-[var(--bsi-primary)]"
      >
        {TIMEZONES.map((tz) => (
          <option key={tz.value} value={tz.value}>{tz.label}</option>
        ))}
      </select>
    </div>
  );
}

export function TimezoneBadge({ timezone }: { timezone?: string }) {
  const tz = TIMEZONES.find((t) => t.value === timezone);
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-xs bg-[var(--surface-dugout)] text-[var(--bsi-dust)] border border-[var(--border-vintage)]">
      {tz?.label || 'CT'}
    </span>
  );
}
