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
