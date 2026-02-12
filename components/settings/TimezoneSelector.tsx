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
      <label className="block text-sm font-medium text-text-secondary mb-2">Timezone</label>
      <select
        value={value || 'America/Chicago'}
        onChange={(e) => onChange?.(e.target.value)}
        className="w-full bg-charcoal border border-border-subtle rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-burnt-orange"
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
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-charcoal text-text-secondary border border-border-subtle">
      {tz?.label || 'CT'}
    </span>
  );
}
