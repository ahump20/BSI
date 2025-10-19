import { useEffect, useId, useRef, useState } from 'react'
import styles from './PrimaryNav.module.css'

const CONFERENCE_GROUPS = [
  {
    label: 'Power Conferences',
    conferences: [
      { label: 'SEC', href: '/baseball/ncaab/teams/sec' },
      { label: 'ACC', href: '/baseball/ncaab/teams/acc' },
      { label: 'Big 12', href: '/baseball/ncaab/teams/big-12' },
      { label: 'Pac-12', href: '/baseball/ncaab/teams/pac-12' }
    ]
  },
  {
    label: 'National Contenders',
    conferences: [
      { label: 'American', href: '/baseball/ncaab/teams/american' },
      { label: 'Sun Belt', href: '/baseball/ncaab/teams/sun-belt' },
      { label: 'Conference USA', href: '/baseball/ncaab/teams/conference-usa' },
      { label: 'Big West', href: '/baseball/ncaab/teams/big-west' }
    ]
  },
  {
    label: 'Regional Powers',
    conferences: [
      { label: 'Missouri Valley', href: '/baseball/ncaab/teams/missouri-valley' },
      { label: 'Southern', href: '/baseball/ncaab/teams/southern' },
      { label: 'Southland', href: '/baseball/ncaab/teams/southland' },
      { label: 'More Conferences…', href: '/baseball/ncaab/teams' }
    ]
  }
]

const PRIMARY_LINKS = [
  { label: 'Scores', href: '/baseball/ncaab' },
  { label: 'Standings', href: '/baseball/ncaab/standings' },
  { label: 'Rankings', href: '/baseball/ncaab/rankings' },
  { label: 'News', href: '/news' }
]

const UTILITY_LINKS = [
  { label: 'Search', href: '/search' },
  { label: 'Account', href: '/account' }
]

function PrimaryNav() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [teamsOpen, setTeamsOpen] = useState(false)
  const [focusFirstTeamLink, setFocusFirstTeamLink] = useState(false)
  const navRef = useRef(null)
  const teamsButtonRef = useRef(null)
  const firstTeamLinkRef = useRef(null)
  const menuId = useId()
  const dropdownId = useId()

  useEffect(() => {
    if (!teamsOpen && !mobileOpen) {
      return undefined
    }

    const handleClickOutside = (event) => {
      if (navRef.current && !navRef.current.contains(event.target)) {
        setTeamsOpen(false)
        setMobileOpen(false)
        teamsButtonRef.current?.focus()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [teamsOpen, mobileOpen])

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setTeamsOpen(false)
        setMobileOpen(false)
        teamsButtonRef.current?.focus()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('keydown', handleEscape)
    }
  }, [])

  useEffect(() => {
    if (teamsOpen && focusFirstTeamLink && firstTeamLinkRef.current) {
      firstTeamLinkRef.current.focus()
      setFocusFirstTeamLink(false)
    }
  }, [teamsOpen, focusFirstTeamLink])

  useEffect(() => {
    if (!teamsOpen) {
      setFocusFirstTeamLink(false)
    }
  }, [teamsOpen])

  const handleNavLinkClick = () => {
    setMobileOpen(false)
    setTeamsOpen(false)
  }

  const handleTeamsToggle = () => {
    setFocusFirstTeamLink(false)
    setTeamsOpen((prev) => !prev)
  }

  const handleTeamsKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      handleTeamsToggle()
    } else if (event.key === 'ArrowDown') {
      event.preventDefault()
      if (!teamsOpen) {
        setTeamsOpen(true)
        setFocusFirstTeamLink(true)
      }
    }
  }

  const handleDropdownBlur = (event) => {
    if (!event.currentTarget.contains(event.relatedTarget)) {
      setTeamsOpen(false)
    }
  }

  const menuClassName = [styles.menu, mobileOpen ? styles.menuOpen : '']
    .filter(Boolean)
    .join(' ')
  const dropdownClassName = [styles.dropdownPanel, teamsOpen ? styles.dropdownOpen : '']
    .filter(Boolean)
    .join(' ')

  const teamsDropdown = (
    <li
      key="Teams"
      className={styles.dropdown}
      onBlur={handleDropdownBlur}
    >
      <button
        type="button"
        ref={teamsButtonRef}
        className={styles.dropdownToggle}
        aria-expanded={teamsOpen}
        aria-haspopup="true"
        aria-controls={dropdownId}
        onClick={handleTeamsToggle}
        onKeyDown={handleTeamsKeyDown}
      >
        Teams
      </button>
      <div id={dropdownId} className={dropdownClassName} role="menu" aria-label="Teams by conference">
        {CONFERENCE_GROUPS.map((group, groupIndex) => (
          <div key={group.label} className={styles.dropdownGroup}>
            <p className={styles.dropdownGroupLabel}>{group.label}</p>
            <ul className={styles.dropdownList}>
              {group.conferences.map((conference, conferenceIndex) => {
                const isFirstItem = groupIndex === 0 && conferenceIndex === 0
                return (
                  <li key={conference.label} className={styles.dropdownListItem}>
                    <a
                      href={conference.href}
                      role="menuitem"
                      tabIndex={teamsOpen ? 0 : -1}
                      onClick={handleNavLinkClick}
                      ref={isFirstItem ? firstTeamLinkRef : undefined}
                      className={styles.dropdownLink}
                    >
                      {conference.label}
                    </a>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </div>
    </li>
  )

  const navItems = PRIMARY_LINKS.reduce((items, link, index) => {
    items.push(
      <li key={link.label} className={styles.linkItem}>
        <a href={link.href} onClick={handleNavLinkClick} className={styles.link}>
          {link.label}
        </a>
      </li>
    )

    if (index === 0) {
      items.push(teamsDropdown)
    }

    return items
  }, [])

  return (
    <div ref={navRef} className={styles.primaryNav}>
      <div className={styles.inner}>
        <a href="/" className={styles.brand} onClick={handleNavLinkClick}>
          <span aria-hidden="true">⚾</span> Diamond Insights
        </a>
        <button
          type="button"
          className={styles.menuToggle}
          aria-expanded={mobileOpen}
          aria-controls={menuId}
          onClick={() => {
            setMobileOpen((prev) => {
              const next = !prev
              if (!next) {
                setTeamsOpen(false)
              }
              return next
            })
          }}
        >
          <span className={styles.srOnly}>Toggle primary navigation</span>
          <span aria-hidden="true">Menu</span>
        </button>
        <div id={menuId} className={menuClassName}>
          <ul className={styles.linkList}>{navItems}</ul>
          <div className={styles.utilityBar}>
            {UTILITY_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className={styles.utilityLink}
                onClick={handleNavLinkClick}
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default PrimaryNav
