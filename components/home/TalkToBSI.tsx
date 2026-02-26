'use client';

import { useState, useEffect, useCallback } from 'react';

/**
 * TalkToBSI — ElevenLabs conversational AI widget.
 *
 * Floating button that opens an ElevenLabs Conversational AI modal.
 * Requires an ElevenLabs Conversational AI agent ID configured in
 * the ElevenLabs dashboard with BSI's knowledge base.
 *
 * Set NEXT_PUBLIC_ELEVENLABS_AGENT_ID in environment to enable.
 */

const AGENT_ID = process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID ?? '';

export function TalkToBSI() {
  const [open, setOpen] = useState(false);
  const [sdkLoaded, setSdkLoaded] = useState(false);

  // Load ElevenLabs widget SDK on first open
  useEffect(() => {
    if (!open || sdkLoaded || !AGENT_ID) return;

    const script = document.createElement('script');
    script.src = 'https://elevenlabs.io/convai-widget/index.js';
    script.async = true;
    script.onload = () => setSdkLoaded(true);
    document.body.appendChild(script);

    return () => {
      // SDK persists once loaded
    };
  }, [open, sdkLoaded]);

  const handleToggle = useCallback(() => {
    setOpen((prev) => !prev);
  }, []);

  // Don't render if no agent ID configured
  if (!AGENT_ID) return null;

  return (
    <>
      {/* Floating trigger button — bottom-right, offset above unmute */}
      <button
        onClick={handleToggle}
        aria-label={open ? 'Close BSI assistant' : 'Talk to BSI'}
        className="fixed bottom-24 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-full bg-burnt-orange-500 hover:bg-burnt-orange-600 text-white font-semibold text-sm shadow-lg hover:shadow-glow-sm transition-all duration-300"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z"
          />
        </svg>
        {open ? 'Close' : 'Talk to BSI'}
      </button>

      {/* ElevenLabs Conversational AI widget */}
      {open && sdkLoaded && (
        <div className="fixed bottom-40 right-6 z-50 w-[380px] h-[500px] rounded-2xl overflow-hidden shadow-2xl border border-border">
          <elevenlabs-convai agent-id={AGENT_ID} />
        </div>
      )}
    </>
  );
}

// Type declaration for the ElevenLabs custom element
declare module 'react' {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      'elevenlabs-convai': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & { 'agent-id': string },
        HTMLElement
      >;
    }
  }
}
