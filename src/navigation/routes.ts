export type NavigationRoute = {
  label: string
  path: string
  children?: NavigationRoute[]
}

export const navigationRoutes: NavigationRoute[] = [
  {
    label: 'Scores',
    path: '/baseball/ncaab'
  },
  {
    label: 'Teams',
    path: '/teams'
  },
  {
    label: 'Standings',
    path: '/standings'
  },
  {
    label: 'Rankings',
    path: '/rankings'
  },
  {
    label: 'News',
    path: '/news'
  }
]

export default navigationRoutes
