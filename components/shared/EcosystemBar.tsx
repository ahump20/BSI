'use client';

import { useState, useEffect } from 'react';

/**
 * 32px ecosystem bar at top of page.
 * Shows BSI Command Center link with agent pulse dot.
 */
export function EcosystemBar() {
  const [agentActive, setAgentActive] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/agent-health', { signal: controller.signal })
      .then((r) => r.ok && r.json())
      .then((data: Record<string, unknown> | false) => {
        if (data && (data as Record<string, unknown>).active) setAgentActive(true);
      })
      .catch(() => {
        // Agent health check is non-critical; silently ignore failures
      });
    return () => controller.abort();
  }, []);

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[1090] h-6 sm:h-8 flex items-center px-3 sm:px-4"
      style={{
        background: 'rgba(13, 13, 13, 0.75)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        borderLeft: '3px solid var(--bsi-primary)',
      }}
    >
      <div className="max-w-7xl mx-auto w-full flex items-center justify-between text-xs">
        <a
          href="/arcade"
          className="flex items-center gap-1.5 sm:gap-2 text-text-secondary hover:text-text-primary transition-colors"
        >
          {agentActive && (
            <span className="live-indicator__dot" style={{ width: 6, height: 6 }} />
          )}
          <span className="font-display tracking-wider uppercase text-[0.5rem] sm:text-[0.625rem]">
            BSI Command Center
          </span>
        </a>
        <span className="text-text-muted text-[0.5rem] sm:text-[0.5625rem] tracking-wide uppercase hidden sm:inline">
          Blaze Sports Intel Ecosystem
        </span>
      </div>
    </div>
  );
}
