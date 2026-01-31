'use client';

import { useState, useEffect } from 'react';

/**
 * 32px ecosystem bar linking BSI <-> BlazeCraft.
 * On BSI: shows BlazeCraft link with agent pulse dot.
 * On BlazeCraft: shows BSI link with live score count.
 */
export function EcosystemBar() {
  const [agentActive, setAgentActive] = useState(false);

  useEffect(() => {
    // Lightweight health check — fire-and-forget, silent fail
    const controller = new AbortController();
    fetch('/api/agent-health', { signal: controller.signal })
      .then((r) => r.ok && r.json())
      .then((data) => {
        if (data?.active) setAgentActive(true);
      })
      .catch(() => {});
    return () => controller.abort();
  }, []);

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[1090] h-8 flex items-center px-4"
      style={{
        background: 'rgba(13, 13, 18, 0.75)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        borderLeft: '3px solid var(--bsi-primary)',
      }}
    >
      <div className="max-w-7xl mx-auto w-full flex items-center justify-between text-xs">
        <a
          href="https://blazecraft.app?source=bsi-ecosystem"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
        >
          {agentActive && (
            <span className="live-indicator__dot" style={{ width: 6, height: 6 }} />
          )}
          <span className="font-display tracking-wider uppercase text-[0.625rem]">
            BlazeCraft Command Center
          </span>
        </a>
        <span className="text-white/30 text-[0.5625rem] tracking-wide uppercase hidden sm:inline">
          Blaze Sports Intel Ecosystem
        </span>
      </div>
    </div>
  );
}
