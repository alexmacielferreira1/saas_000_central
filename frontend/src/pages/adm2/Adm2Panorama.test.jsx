import '@testing-library/jest-dom/vitest'
import React from 'react'
import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

import Adm2Panorama from './Adm2Panorama'

const api = vi.hoisted(() => ({ getHomeSummary: vi.fn() }))
vi.mock('@/api/home', () => ({ getHomeSummary: api.getHomeSummary }))

describe('Adm2Panorama', () => {
  afterEach(() => { cleanup(); vi.clearAllMocks() })

  it('reorganizes only metrics supplied by the summary API', async () => {
    api.getHomeSummary.mockResolvedValue({ products: { total: 3, connected: 2, degraded: 1 }, operations: { availability: 'available', active: 4 }, incidents: { availability: 'unavailable', open: null } })
    render(<MemoryRouter><Adm2Panorama /></MemoryRouter>)
    expect(await screen.findByText('3')).toBeInTheDocument()
    expect(screen.getByText('4')).toBeInTheDocument()
    expect(screen.getByText('Não integrado')).toBeInTheDocument()
    expect(screen.queryByText(/receita|clientes|custos/i)).not.toBeInTheDocument()
  })
})
