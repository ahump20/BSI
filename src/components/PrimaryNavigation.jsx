import { useEffect, useMemo, useRef, useState, useCallback } from 'react'

const PRIMARY_LINKS = [
  { label: 'Scores', href: '/baseball/ncaab' },
  { label: 'Teams', href: '/baseball/ncaab/teams' },
  { label: 'Standings', href: '/baseball/ncaab/standings' },
  { label: 'Rankings', href: '/baseball/ncaab/rankings' },
  { label: 'News', href: '/news' }
]

const TEAM_SUBSECTIONS = [
  { label: 'SEC', href: '/baseball/ncaab/teams?conference=sec' },
  { label: 'ACC', href: '/baseball/ncaab/teams?conference=acc' },
  { label: 'Big 12', href: '/baseball/ncaab/teams?conference=big-12' },
  { label: 'All conferences…', href: '/baseball/ncaab/teams' }
]

const SECONDARY_LINKS = [
  { label: 'About', href: '/about' },
  { label: 'Methodology', href: '/methodology' },
  { label: 'Privacy', href: '/legal/privacy' },
  { label: 'Terms', href: '/legal/terms' }
]

function getFocusableElements(container) {
  if (!container) return []
  return Array.from(
    container.querySelectorAll(
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )
  ).filter((el) => !el.hasAttribute('aria-hidden'))
}

function PrimaryNavigation() {
  const [isOpen, setIsOpen] = useState(false)
  const triggerRef = useRef(null)
  const panelRef = useRef(null)
  const overlayRef = useRef(null)
  const previousFocusRef = useRef(null)

  const mobileMenuLinks = useMemo(() => {
    const baseLinks = [...PRIMARY_LINKS]
    return baseLinks
      .map((link) => {
        if (link.label !== 'Teams') {
          return [link]
        }

        return [
          link,
          ...TEAM_SUBSECTIONS.map((subsection) => ({
            ...subsection,
            parent: 'Teams'
          }))
        ]
      })
      .flat()
      .concat(
        [{ type: 'divider', id: 'info-divider' }],
        SECONDARY_LINKS.slice(0, 2),
        [{ type: 'divider', id: 'legal-divider' }],
        SECONDARY_LINKS.slice(2)
      )
  }, [])

  const closeMenu = useCallback(() => {
    setIsOpen(false)
  }, [])

  useEffect(() => {
    if (!isOpen) {
      if (previousFocusRef.current && typeof previousFocusRef.current.focus === 'function') {
        previousFocusRef.current.focus()
      }
      if (overlayRef.current) {
        overlayRef.current.setAttribute('aria-hidden', 'true')
      }
      return
    }

    previousFocusRef.current = document.activeElement

    const overlayEl = overlayRef.current
    if (overlayEl) {
      overlayEl.removeAttribute('aria-hidden')
    }

    const focusable = getFocusableElements(panelRef.current)
    if (focusable.length > 0) {
      focusable[0].focus()
    }

    function handleKeyDown(event) {
      if (!panelRef.current) return

      if (event.key === 'Escape') {
        event.preventDefault()
        closeMenu()
        return
      }

      if (event.key === 'Tab') {
        const focusableEls = getFocusableElements(panelRef.current)
        if (focusableEls.length === 0) return

        const first = focusableEls[0]
        const last = focusableEls[focusableEls.length - 1]

        if (event.shiftKey) {
          if (document.activeElement === first) {
            event.preventDefault()
            last.focus()
          }
        } else if (document.activeElement === last) {
          event.preventDefault()
          first.focus()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, closeMenu])

  useEffect(() => {
    function handleResize() {
      if (window.innerWidth >= 768) {
        setIsOpen(false)
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    function handlePointerDown(event) {
      if (!panelRef.current || !overlayRef.current) return
      if (
        overlayRef.current.contains(event.target) &&
        !panelRef.current.contains(event.target)
      ) {
        closeMenu()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handlePointerDown)
      document.addEventListener('touchstart', handlePointerDown)
    }

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('touchstart', handlePointerDown)
    }
  }, [isOpen, closeMenu])

  const handleToggle = () => {
    if (isOpen) {
      closeMenu()
      return
    }
    previousFocusRef.current = triggerRef.current
    setIsOpen(true)
  }

  const handleLinkClick = () => {
    closeMenu()
  }

  return (
    <div className="primary-nav" data-open={isOpen ? 'true' : 'false'}>
      <a className="primary-nav__brand" href="/">
        <span className="brand-mark" aria-hidden="true">
          ⚾
        </span>
        <span className="brand-name">Diamond Insights</span>
      </a>

      <nav className="primary-nav__links" aria-label="Primary navigation">
        <ul>
          {PRIMARY_LINKS.map((link) => (
            <li key={link.label}>
              <a href={link.href}>{link.label}</a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="primary-nav__utilities">
        <a className="utility-link" href="/search" aria-label="Search Diamond Insights">
          Search
        </a>
        <a className="utility-link" href="/account" aria-label="Manage your Diamond Insights account">
          Account
        </a>
      </div>

      <button
        type="button"
        className="primary-nav__hamburger"
        aria-expanded={isOpen}
        aria-controls="mobile-primary-nav"
        onClick={handleToggle}
        ref={triggerRef}
      >
        <span className="sr-only">Toggle primary navigation</span>
        <span aria-hidden="true" className="hamburger-lines">
          <span></span>
          <span></span>
          <span></span>
        </span>
      </button>

      <div
        className={`mobile-nav-overlay ${isOpen ? 'mobile-nav-overlay--open' : ''}`}
        ref={overlayRef}
        aria-hidden={!isOpen}
      >
        <nav
          id="mobile-primary-nav"
          className={`mobile-nav-panel ${isOpen ? 'mobile-nav-panel--open' : ''}`}
          aria-label="Mobile primary navigation"
          ref={panelRef}
          data-state={isOpen ? 'open' : 'closed'}
        >
          <ul>
            {mobileMenuLinks.map((item) => {
              if (item.type === 'divider') {
                return (
                  <li key={item.id} role="separator" className={`mobile-nav-divider mobile-nav-divider--${item.id}`}></li>
                )
              }

              if (item.parent === 'Teams') {
                return (
                  <li key={`${item.parent}-${item.label}`} className="mobile-sub-link">
                    <a href={item.href} onClick={handleLinkClick}>
                      {item.label}
                    </a>
                  </li>
                )
              }

              if (item.label === 'Teams') {
                return (
                  <li key={item.label} className="mobile-link-group">
                    <a href={item.href} onClick={handleLinkClick}>
                      {item.label}
                    </a>
                  </li>
                )
              }

              return (
                <li key={item.label}>
                  <a href={item.href} onClick={handleLinkClick}>
                    {item.label}
                  </a>
                </li>
              )
            })}
          </ul>
        </nav>
      </div>
    </div>
  )
}

export default PrimaryNavigation
