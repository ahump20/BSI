'use client';

import { useState, useEffect } from 'react';

interface DataAttributionProps {
  lastUpdated: string;
  source?: string;
  className?: string;
}

export function DataAttribution({ lastUpdated, source = 'Highlightly', className = '' }: DataAttributionProps) {
  const [relative, setRelative] = useState('');
  const isValidDate = lastUpdated && !isNaN(new Date(lastUpdated).getTime());

  useEffect(() => {
    if (!isValidDate) return;

    function update() {
      const diff = Date.now() - new Date(lastUpdated).getTime();
      const secs = Math.floor(diff / 1000);
      if (secs < 60) setRelative(`Updated ${secs}s ago`);
      else if (secs < 3600) setRelative(`Updated ${Math.floor(secs / 60)}m ago`);
      else if (secs < 86400) setRelative(`Updated ${Math.floor(secs / 3600)}h ago`);
      else setRelative(`Updated ${Math.floor(secs / 86400)}d ago`);
    }
    update();
    const id = setInterval(update, 10000);
    return () => clearInterval(id);
  }, [lastUpdated, isValidDate]);

  if (!isValidDate) {
    return source ? (
      <div className={`flex items-center gap-2 text-xs text-text-muted ${className}`}>
        <span>Powered by {source}</span>
      </div>
    ) : null;
  }

  return (
    <div className={`flex items-center gap-2 text-xs text-text-muted ${className}`}>
      <span>{relative}</span>
      <span className="text-text-muted">·</span>
      <span>Powered by {source}</span>
    </div>
  );
}
