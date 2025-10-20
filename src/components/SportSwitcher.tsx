import { useState } from 'react';

type SportKey = 'baseball' | 'football' | 'basketball';

interface SportConfig {
  key: SportKey;
  name: string;
  icon: string;
  path: string;
  accent: string;
}

interface SportSwitcherProps {
  currentSport?: SportKey;
}

const SPORTS: SportConfig[] = [
  { key: 'baseball', name: 'Baseball', icon: '⚾', path: '/', accent: '#00a86b' },
  { key: 'football', name: 'Football', icon: '🏈', path: '/football', accent: '#ff6b00' },
  { key: 'basketball', name: 'Basketball', icon: '🏀', path: '/basketball', accent: '#ff8c00' }
];

const MENU_ID = 'sport-switcher-menu';

function SportSwitcher({ currentSport = 'baseball' }: SportSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleSportClick = (path: string) => {
    window.location.href = path;
  };

  return (
    <div className="pointer-events-auto fixed bottom-4 right-4 z-[1000] sm:bottom-6 sm:right-6">
      {isOpen && (
        <div
          id={MENU_ID}
          className="absolute bottom-16 right-0 flex flex-col gap-3 rounded-card bg-[rgba(17,24,39,0.95)] p-3 shadow-card animate-slide-up motion-reduce:animate-none"
          role="menu"
          aria-label="Switch sport"
        >
          {SPORTS.map(sport => {
            const isCurrent = sport.key === currentSport;
            return (
              <button
                key={sport.key}
                type="button"
                className="flex min-w-[9rem] items-center gap-3 rounded-pill border px-4 py-3 text-left text-sm font-semibold text-white shadow-[0_4px_12px_rgba(0,0,0,0.3)] transition duration-200 hover:-translate-x-1 hover:bg-[rgba(60,60,60,0.8)] hover:shadow-[0_6px_18px_rgba(0,0,0,0.4)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#ff6b00] focus-visible:ring-offset-[rgba(17,24,39,0.95)] disabled:cursor-default disabled:opacity-60 disabled:hover:translate-x-0"
                style={{ borderColor: sport.accent }}
                onClick={() => handleSportClick(sport.path)}
                disabled={isCurrent}
                role="menuitem"
              >
                <span className="text-xl" aria-hidden="true">
                  {sport.icon}
                </span>
                <span className="flex-1">{sport.name}</span>
              </button>
            );
          })}
        </div>
      )}

      <button
        type="button"
        className={`flex h-12 w-12 items-center justify-center rounded-full text-xl text-white shadow-[0_4px_12px_rgba(255,107,0,0.4)] transition duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#ff6b00] focus-visible:ring-offset-[rgba(17,24,39,0.95)] sm:h-14 sm:w-14 sm:text-2xl ${
          isOpen ? 'rotate-90' : ''
        }`}
        style={{
          backgroundImage: 'linear-gradient(135deg, #ff6b00 0%, #ff8533 100%)'
        }}
        aria-expanded={isOpen}
        aria-controls={MENU_ID}
        onClick={() => setIsOpen(prev => !prev)}
      >
        {isOpen ? '✕' : '⚡'}
      </button>
    </div>
  );
}

export default SportSwitcher;
