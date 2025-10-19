import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import PrimaryNav from '../../src/components/PrimaryNav'

describe('PrimaryNav', () => {
  it('renders IA-specified navigation links and utility actions', () => {
    render(<PrimaryNav />)

    expect(screen.getByRole('link', { name: /scores/i })).toHaveAttribute('href', '/baseball/ncaab')
    expect(screen.getByRole('button', { name: /teams/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /standings/i })).toHaveAttribute(
      'href',
      '/baseball/ncaab/standings'
    )
    expect(screen.getByRole('link', { name: /rankings/i })).toHaveAttribute(
      'href',
      '/baseball/ncaab/rankings'
    )
    expect(screen.getByRole('link', { name: /news/i })).toHaveAttribute('href', '/news')
    expect(screen.getByRole('link', { name: /search/i })).toHaveAttribute('href', '/search')
    expect(screen.getByRole('link', { name: /account/i })).toHaveAttribute('href', '/account')
  })

  it('exposes conference-level links when the Teams menu is opened', async () => {
    const user = userEvent.setup()
    render(<PrimaryNav />)

    const teamsButton = screen.getByRole('button', { name: /teams/i })
    expect(teamsButton).toHaveAttribute('aria-expanded', 'false')

    await user.click(teamsButton)
    expect(teamsButton).toHaveAttribute('aria-expanded', 'true')

    const conferenceExpectations = [
      ['SEC', '/baseball/ncaab/teams/sec'],
      ['ACC', '/baseball/ncaab/teams/acc'],
      ['Big 12', '/baseball/ncaab/teams/big-12'],
      ['Pac-12', '/baseball/ncaab/teams/pac-12'],
      ['American', '/baseball/ncaab/teams/american'],
      ['Sun Belt', '/baseball/ncaab/teams/sun-belt'],
      ['Conference USA', '/baseball/ncaab/teams/conference-usa'],
      ['Big West', '/baseball/ncaab/teams/big-west'],
      ['Missouri Valley', '/baseball/ncaab/teams/missouri-valley'],
      ['Southern', '/baseball/ncaab/teams/southern'],
      ['Southland', '/baseball/ncaab/teams/southland'],
      ['More Conferences…', '/baseball/ncaab/teams']
    ]

    for (const [label, href] of conferenceExpectations) {
      const link = screen.getByRole('menuitem', { name: label })
      expect(link).toBeInTheDocument()
      expect(link).toHaveAttribute('href', href)
    }
  })
})
