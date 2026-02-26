'use client';

import { useEffect } from 'react';

interface LiveGameWidgetProps {
  gameId: string;
  tier?: string;
}

/**
 * React wrapper for the BSI Live Game Widget Web Component.
 * Loads the widget script and renders the custom element.
 */
export function LiveGameWidget({ gameId, tier }: LiveGameWidgetProps) {
  useEffect(() => {
    // Load widget script if not already loaded
    if (!document.querySelector('script[src*="widget.js"]')) {
      const script = document.createElement('script');
      script.src = '/widget.js';
      script.async = true;
      document.head.appendChild(script);
    }
  }, []);

  // Use dangerouslySetInnerHTML to render the custom element
  // (Web Components need special handling in React)
  return (
    <div
      dangerouslySetInnerHTML={{
        __html: `<bsi-live-game data-game-id="${gameId}"${tier ? ` tier="${tier}"` : ''}></bsi-live-game>`,
      }}
    />
  );
}
