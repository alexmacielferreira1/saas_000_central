import { describe, expect, it } from 'vitest'

import { ADMIN_ROUTES, PUBLIC_ROUTES } from './routes'

describe('route contract', () => {
  it('keeps every route unique', () => {
    const paths = [...PUBLIC_ROUTES, ...ADMIN_ROUTES].map((route) => route.path)

    expect(new Set(paths).size).toBe(paths.length)
  })

  it('preserves the public authentication journeys', () => {
    expect(PUBLIC_ROUTES.map((route) => route.path)).toEqual([
      '/login',
      '/register',
      '/forgot-password',
      '/reset-password',
    ])
  })

  it('preserves the current administrative pages', () => {
    expect(ADMIN_ROUTES.map((route) => route.path)).toEqual([
      '/',
      '/control-map',
      '/resolution',
      '/api-guides',
      '/saas',
      '/saas/:id',
      '/administration',
      '/administration/overview',
      '/experience/screens',
      '/experience/feature-flags',
      '/users',
      '/configurations',
      '/operations',
      '/operations/jobs',
      '/audit',
      '/incidents',
      '/integrations',
      '/health',
      '/errors',
      '/commercial/plans',
      '/usage',
      '/costs',
      '/ai/governance',
      '/storage',
      '/operations/releases',
      '/security',
      '/privacy/data-inventory',
      '/continuity/backups',
      '/docs',
      '/data/imports/new',
    ])
  })
})

describe('route code splitting', () => {
  it('loads every administrative page on demand', () => {
    expect(ADMIN_ROUTES.filter((route) => route.Component.lazyRoute !== true)).toEqual([])
  })

  it('keeps the login page in the initial bundle', () => {
    const login = PUBLIC_ROUTES.find((route) => route.path === '/login')
    expect(login.Component.lazyRoute).toBeUndefined()
  })
})
