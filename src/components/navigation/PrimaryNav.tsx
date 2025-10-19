import type { FC } from 'react'
import { useMemo } from 'react'
import navigationRoutes, { type NavigationRoute } from '../../navigation/routes'

type PrimaryNavProps = {
  currentPath?: string
  routes?: NavigationRoute[]
}

const isActive = (path: string, currentPath: string) => {
  if (path === '/') {
    return currentPath === '/' || currentPath === ''
  }

  if (!path) {
    return false
  }

  return currentPath === path || currentPath.startsWith(`${path}/`)
}

const PrimaryNav: FC<PrimaryNavProps> = ({
  currentPath,
  routes = navigationRoutes
}) => {
  const resolvedPath = useMemo(() => {
    if (currentPath !== undefined) {
      return currentPath
    }

    if (typeof window !== 'undefined') {
      return window.location.pathname
    }

    return ''
  }, [currentPath])

  return (
    <nav className="primary-nav" aria-label="Primary navigation">
      <ul className="primary-nav__list">
        {routes.map((route) => (
          <li key={route.path} className="primary-nav__item">
            <a
              href={route.path}
              className={`primary-nav__link${
                isActive(route.path, resolvedPath) ? ' primary-nav__link--active' : ''
              }`}
              aria-current={isActive(route.path, resolvedPath) ? 'page' : undefined}
            >
              {route.label}
            </a>
            {route.children && route.children.length > 0 && (
              <ul className="primary-nav__submenu">
                {route.children.map((child) => (
                  <li key={child.path} className="primary-nav__submenu-item">
                    <a
                      href={child.path}
                      className={`primary-nav__submenu-link${
                        isActive(child.path, resolvedPath) ? ' primary-nav__submenu-link--active' : ''
                      }`}
                      aria-current={isActive(child.path, resolvedPath) ? 'page' : undefined}
                    >
                      {child.label}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </nav>
  )
}

export default PrimaryNav
