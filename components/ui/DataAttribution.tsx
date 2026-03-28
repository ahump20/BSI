'use client';

import { useState, useEffect } from 'react';
import type { DataMetaLike } from '@/lib/utils/data-meta';
import { getDataSourceLabel, normalizeDataMeta } from '@/lib/utils/data-meta';
import { getRelativeUpdateLabel } from '@/lib/utils/data-freshness';

interface DataAttributionProps {
  lastUpdated?: string;
  source?: string;
  meta?: DataMetaLike | null;
  className?: string;
}

export function DataAttribution({
  lastUpdated,
  source = 'Highlightly',
  meta,
  className = '',
}: DataAttributionProps) {
  const [relative, setRelative] = useState('');
  const normalized = normalizeDataMeta(meta, { lastUpdated, source });
  const effectiveSource = getDataSourceLabel(normalized, source);
  const effectiveLastUpdated = normalized?.lastUpdated ?? undefined;
  const isValidDate = Boolean(effectiveLastUpdated && !isNaN(new Date(effectiveLastUpdated).getTime()));

  useEffect(() => {
    if (!isValidDate) return;

    function update() {
      setRelative(getRelativeUpdateLabel(effectiveLastUpdated));
    }
    update();
    const id = setInterval(update, 10000);
    return () => clearInterval(id);
  }, [effectiveLastUpdated, isValidDate]);

  if (!isValidDate) {
    return effectiveSource ? (
      <div className={`flex items-center gap-2 text-xs text-[rgba(196,184,165,0.35)] ${className}`}>
        <span>Powered by {effectiveSource}</span>
      </div>
    ) : null;
  }

  return (
    <div className={`flex items-center gap-2 text-xs text-[rgba(196,184,165,0.35)] ${className}`}>
      <span>{relative}</span>
      <span className="text-[rgba(196,184,165,0.35)]">·</span>
      <span>Powered by {effectiveSource}</span>
    </div>
  );
}
