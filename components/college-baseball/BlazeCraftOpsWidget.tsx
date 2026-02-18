'use client';

import { useEffect, useRef } from 'react';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      'blazecraft-status': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & { mode?: string },
        HTMLElement
      >;
    }
  }
}

interface BlazeCraftOpsWidgetProps {
  mode?: 'mini' | 'bar' | 'card';
}

/**
 * BlazeCraft Ops Widget — dynamically loads the BlazeCraft widget script
 * and renders a <blazecraft-status> custom element for operational status display.
 *
 * Modes:
 *  - mini: compact inline indicator (scores pages, footers)
 *  - bar: horizontal status bar (hero sections)
 *  - card: full status card (dashboards)
 */
export function BlazeCraftOpsWidget({ mode = 'bar' }: BlazeCraftOpsWidgetProps) {
  const scriptLoaded = useRef(false);

  useEffect(() => {
    if (scriptLoaded.current) return;
    scriptLoaded.current = true;

    // Check if the script is already present in the DOM
    const existingScript = document.querySelector(
      'script[src="https://blazecraft.app/embed/blazecraft-widget.js"]'
    );
    if (existingScript) return;

    const script = document.createElement('script');
    script.src = 'https://blazecraft.app/embed/blazecraft-widget.js';
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);

    return () => {
      // Cleanup is intentionally a no-op — the script should persist
      // across navigations within the SPA to avoid re-loading
    };
  }, []);

  return <blazecraft-status mode={mode} />;
}

export default BlazeCraftOpsWidget;
