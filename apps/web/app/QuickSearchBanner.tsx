'use client';

import { useEffect, useState } from 'react';

/**
 * Quick Search Banner
 *
 * Shows a subtle banner encouraging users to use the command palette.
 * Only shows on desktop and can be dismissed.
 */

export function QuickSearchBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isMac, setIsMac] = useState(false);

  useEffect(() => {
    // Check if user is on Mac for correct keyboard shortcut display
    setIsMac(navigator.platform.toUpperCase().indexOf('MAC') >= 0);

    // Check if banner was previously dismissed
    const dismissed = localStorage.getItem('blaze-search-banner-dismissed');
    if (dismissed === 'true') {
      setIsDismissed(true);
      return;
    }

    // Show banner after a short delay
    const timer = setTimeout(() => setIsVisible(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    setIsDismissed(true);
    localStorage.setItem('blaze-search-banner-dismissed', 'true');
  };

  const handleOpenSearch = () => {
    // Trigger command palette
    const event = new KeyboardEvent('keydown', {
      key: 'k',
      metaKey: isMac,
      ctrlKey: !isMac,
      bubbles: true,
    });
    window.dispatchEvent(event);
  };

  // Don't render on mobile or if dismissed
  if (isDismissed || typeof window !== 'undefined' && window.innerWidth < 768) {
    return null;
  }

  return (
    <div
      className={`quick-search-banner ${isVisible ? 'visible' : ''}`}
      role="complementary"
      aria-label="Quick search tip"
    >
      <button
        className="quick-search-banner-content"
        onClick={handleOpenSearch}
        aria-label={`Open quick search with ${isMac ? 'Command' : 'Control'} + K`}
      >
        <span className="quick-search-banner-icon">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
        </span>
        <span className="quick-search-banner-text">
          Quick search
        </span>
        <kbd className="quick-search-banner-kbd">
          {isMac ? '⌘' : 'Ctrl'}K
        </kbd>
      </button>
      <button
        className="quick-search-banner-dismiss"
        onClick={handleDismiss}
        aria-label="Dismiss search tip"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>

      <style jsx>{`
        .quick-search-banner {
          position: fixed;
          bottom: 1.5rem;
          left: 50%;
          transform: translateX(-50%) translateY(100px);
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem;
          background: rgba(17, 24, 39, 0.95);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          box-shadow: 0 10px 40px -10px rgba(0, 0, 0, 0.5);
          z-index: 100;
          opacity: 0;
          transition: transform 0.4s ease, opacity 0.4s ease;
        }

        .quick-search-banner.visible {
          transform: translateX(-50%) translateY(0);
          opacity: 1;
        }

        .quick-search-banner-content {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 0.75rem;
          background: rgba(255, 255, 255, 0.05);
          border: none;
          border-radius: 8px;
          color: var(--di-text-muted);
          font-size: 0.875rem;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .quick-search-banner-content:hover {
          background: rgba(255, 255, 255, 0.1);
          color: var(--di-text);
        }

        .quick-search-banner-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0.7;
        }

        .quick-search-banner-text {
          opacity: 0.9;
        }

        .quick-search-banner-kbd {
          display: inline-flex;
          padding: 0.2rem 0.4rem;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 4px;
          font-size: 0.7rem;
          font-family: inherit;
          color: var(--di-text);
        }

        .quick-search-banner-dismiss {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          background: transparent;
          border: none;
          border-radius: 6px;
          color: var(--di-text-muted);
          cursor: pointer;
          opacity: 0.5;
          transition: all 0.2s ease;
        }

        .quick-search-banner-dismiss:hover {
          background: rgba(255, 255, 255, 0.1);
          opacity: 1;
        }

        @media (max-width: 768px) {
          .quick-search-banner {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}
