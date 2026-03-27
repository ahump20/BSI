'use client';

import { tooltipPosition } from '@/lib/analytics/viz';

interface TooltipField {
  label: string;
  value: string;
  color?: string;
}

interface ChartTooltipProps {
  x: number;
  y: number;
  containerWidth: number;
  title: string;
  subtitle?: string;
  fields: TooltipField[];
}

/**
 * Shared tooltip for all D3 scatter/bubble/radar charts.
 * Renders as an absolutely-positioned div overlaying the SVG container.
 * Flips to the left side when cursor crosses the midpoint.
 */
export function ChartTooltip({ x, y, containerWidth, title, subtitle, fields }: ChartTooltipProps) {
  const pos = tooltipPosition(x, containerWidth);

  return (
    <div
      className="absolute z-50 pointer-events-none rounded-[2px] px-3 py-2"
      style={{
        left: pos.left,
        top: y - 10,
        transform: pos.transform,
        background: 'var(--surface-press-box)',
        border: '1px solid var(--border-vintage)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
      }}
    >
      <div className="text-sm font-medium" style={{ color: 'var(--bsi-text)' }}>{title}</div>
      {subtitle && (
        <div className="text-[10px] mt-0.5" style={{ color: 'var(--bsi-text-muted)' }}>{subtitle}</div>
      )}
      <div className="flex gap-3 mt-1.5">
        {fields.map((f) => (
          <div key={f.label}>
            <span className="text-[9px] font-mono" style={{ color: 'var(--bsi-text-dim)' }}>
              {f.label}
            </span>
            <span
              className="block text-xs font-mono font-bold"
              style={{ color: f.color ?? 'var(--bsi-text)' }}
            >
              {f.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
