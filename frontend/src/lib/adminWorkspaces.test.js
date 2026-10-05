import { describe, expect, it } from 'vitest'

import { ADMIN_ROUTES } from './routes'
import {
  ADM1_ITEMS,
  ADM2_IMPLEMENTED_ROUTES,
  ADM2_ITEMS,
  getWorkspaceForPath,
} from './adminWorkspaces'

describe('admin workspace registry', () => {
  it('keeps every current administrative route reachable from Adm 1', () => {
    const currentRoutes = ADMIN_ROUTES
      .map((route) => route.path)
      .filter((path) => !path.startsWith('/adm1') && !path.startsWith('/adm2'))

    expect(ADM1_ITEMS.map((item) => item.to)).toEqual(currentRoutes)
  })

  it('uses unique ids and honest Adm 2 states', () => {
    const allowedStates = ['REAL', 'PARCIAL', 'PLANEJADO', 'INDISPONIVEL', 'BLOQUEADO']
    const ids = ADM2_ITEMS.map((item) => item.id)

    expect(new Set(ids).size).toBe(ids.length)
    expect(ADM2_ITEMS.every((item) => allowedStates.includes(item.status))).toBe(true)
  })

  it('only exposes links for implemented Adm 2 modules', () => {
    expect(ADM2_ITEMS.filter((item) => item.to).map((item) => item.to)).toEqual(
      ADM2_IMPLEMENTED_ROUTES,
    )
    expect(ADM2_ITEMS.filter((item) => item.status === 'PLANEJADO').every((item) => !item.to)).toBe(true)
  })

  it.each([
    ['/adm2', 'adm2'],
    ['/adm2/panorama', 'adm2'],
    ['/adm2/saas', 'adm2'],
    ['/adm1', 'adm1'],
    ['/administration', 'adm1'],
  ])('resolves %s to %s', (pathname, expected) => {
    expect(getWorkspaceForPath(pathname)).toBe(expected)
  })
})
