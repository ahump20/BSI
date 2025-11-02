import { useState } from 'react'
import './SportSwitcher.css'

/**
 * Floating Action Button for Sport Switching
 *
 * Mobile-first component positioned in bottom-right corner
 * Allows users to switch between Baseball, Football, Basketball, and Tools
 */
function SportSwitcher({ currentSport = 'baseball' }) {
  const [isOpen, setIsOpen] = useState(false)

  const sports = [
    {
      name: 'Baseball',
      icon: '⚾',
      path: '/',
      color: '#00a86b'
    },
    {
      name: 'Football',
      icon: '🏈',
      path: '/football',
      color: '#ff6b00'
    },
    {
      name: 'Basketball',
      icon: '🏀',
      path: '/basketball',
      color: '#ff8c00'
    },
    {
      name: 'Tools',
      icon: '🔧',
      path: '/tools',
      color: '#bf5700'
    }
  ]

  const handleSportClick = (path) => {
    window.location.href = path
  }

  return (
    <div className="sport-switcher">
      {/* Expanded menu */}
      {isOpen && (
        <div className="sport-menu">
          {sports.map((sport) => {
            const isCurrent = (currentSport === 'baseball' && sport.path === '/') ||
                              (currentSport === 'football' && sport.path === '/football') ||
                              (currentSport === 'basketball' && sport.path === '/basketball') ||
                              (currentSport === 'tools' && sport.path === '/tools')

            return (
              <button
                key={sport.name}
                className={`sport-option ${isCurrent ? 'current' : ''}`}
                onClick={() => handleSportClick(sport.path)}
                style={{ borderColor: sport.color }}
                disabled={isCurrent}
              >
                <span className="sport-icon">{sport.icon}</span>
                <span className="sport-name">{sport.name}</span>
              </button>
            )
          })}
        </div>
      )}

      {/* FAB toggle button */}
      <button
        className={`fab ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Switch sport"
      >
        {isOpen ? '✕' : '⚡'}
      </button>
    </div>
  )
}

export default SportSwitcher
