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
      '/resolution',
      '/api-guides',
      '/saas',
      '/saas/:id',
      '/users',
      '/configurations',
      '/operations',
      '/audit',
      '/incidents',
      '/integrations',
    ])
  })
})
