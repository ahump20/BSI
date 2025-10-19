import { render, screen } from '@testing-library/react'
import PrimaryNav from './PrimaryNav'
import navigationRoutes from '../../navigation/routes'

describe('PrimaryNav', () => {
  it('renders the primary navigation landmark and top-level routes', () => {
    render(<PrimaryNav currentPath="/baseball/ncaab" />)

    const nav = screen.getByRole('navigation', { name: /primary navigation/i })
    expect(nav).toBeInTheDocument()

    navigationRoutes.forEach((route) => {
      expect(
        screen.getByRole('link', {
          name: route.label
        })
      ).toHaveAttribute('href', route.path)
    })
  })

  it('marks the current route as active for assistive tech users', () => {
    render(<PrimaryNav currentPath="/rankings" />)

    const activeLink = screen.getByRole('link', { name: 'Rankings' })
    expect(activeLink).toHaveAttribute('aria-current', 'page')
    expect(activeLink.className).toContain('primary-nav__link--active')

    const inactiveLink = screen.getByRole('link', { name: 'Scores' })
    expect(inactiveLink).not.toHaveAttribute('aria-current')
  })
})
