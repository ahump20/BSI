import { useState } from 'react'
import type { JSX } from 'react'
import './SportSwitcher.css'

interface SportSwitcherProps {
  currentSport?: 'baseball' | 'football' | 'basketball'
}

interface Sport {
  name: string
  icon: string
  path: string
  color: string
}

const sports: Sport[] = [
  {
    name: 'Baseball',
    icon: '⚾',
    path: '/',
    color: '#00a86b',
  },
  {
    name: 'Football',
    icon: '🏈',
    path: '/football',
    color: '#ff6b00',
  },
  {
    name: 'Basketball',
    icon: '🏀',
    path: '/basketball',
    color: '#ff8c00',
  },
]

const SportSwitcher = ({ currentSport = 'baseball' }: SportSwitcherProps): JSX.Element => {
  const [isOpen, setIsOpen] = useState(false)

  const handleSportClick = (path: string) => {
    window.location.href = path
  }

  return (
    <div className="sport-switcher">
      {isOpen && (
        <div className="sport-menu" role="menu" aria-label="Select sport">
          {sports.map((sport) => {
            const isCurrent =
              (currentSport === 'baseball' && sport.path === '/') ||
              (currentSport === 'football' && sport.path === '/football') ||
              (currentSport === 'basketball' && sport.path === '/basketball')

            return (
              <button
                key={sport.name}
                className={`sport-option ${isCurrent ? 'current' : ''}`}
                onClick={() => handleSportClick(sport.path)}
                style={{ borderColor: sport.color }}
                disabled={isCurrent}
                role="menuitemradio"
                aria-checked={isCurrent}
              >
                <span className="sport-icon" aria-hidden="true">
                  {sport.icon}
                </span>
                <span className="sport-name">{sport.name}</span>
              </button>
            )
          })}
        </div>
      )}

      <button
        className={`fab ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen((value) => !value)}
        aria-label="Switch sport"
        aria-expanded={isOpen}
        aria-haspopup="menu"
        type="button"
      >
        {isOpen ? '✕' : '⚡'}
      </button>
    </div>
  )
}

export default SportSwitcher
