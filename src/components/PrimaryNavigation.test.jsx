import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import PrimaryNavigation from './PrimaryNavigation'

describe('PrimaryNavigation', () => {
  it('renders mobile menu links when toggled and closes on Escape', async () => {
    const user = userEvent.setup()
    render(<PrimaryNavigation />)

    const toggle = screen.getByRole('button', { name: /toggle primary navigation/i })
    expect(toggle).toHaveAttribute('aria-expanded', 'false')

    await user.click(toggle)

    const mobileNav = screen.getByRole('navigation', { name: /mobile primary navigation/i })
    expect(mobileNav).toHaveAttribute('data-state', 'open')

    const requiredLinks = [
      'Scores',
      'Teams',
      'SEC',
      'ACC',
      'Big 12',
      'All conferences…',
      'Standings',
      'Rankings',
      'News',
      'About',
      'Methodology',
      'Privacy',
      'Terms'
    ]

    requiredLinks.forEach((label) => {
      expect(within(mobileNav).getByRole('link', { name: label })).toBeInTheDocument()
    })

    await user.keyboard('{Escape}')
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    expect(mobileNav).toHaveAttribute('data-state', 'closed')
    expect(toggle).toHaveFocus()
  })

  it('traps focus within the mobile panel', async () => {
    const user = userEvent.setup()
    render(<PrimaryNavigation />)

    const toggle = screen.getByRole('button', { name: /toggle primary navigation/i })
    await user.click(toggle)

    const mobileNav = screen.getByRole('navigation', { name: /mobile primary navigation/i })
    const scoresLink = within(mobileNav).getByRole('link', { name: 'Scores' })
    expect(scoresLink).toHaveFocus()

    const termsLink = within(mobileNav).getByRole('link', { name: 'Terms' })
    termsLink.focus()
    expect(termsLink).toHaveFocus()

    await user.tab()
    expect(scoresLink).toHaveFocus()

    await user.keyboard('{Escape}')
    expect(toggle).toHaveFocus()
  })
})
