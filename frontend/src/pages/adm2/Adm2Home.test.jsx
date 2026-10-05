import '@testing-library/jest-dom/vitest'
import React from 'react'
import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import Adm2Home from './Adm2Home'

const api = vi.hoisted(() => ({ getHomeSummary: vi.fn(), listSaas: vi.fn() }))
vi.mock('@/api/home', () => ({ getHomeSummary: api.getHomeSummary }))
vi.mock('@/api/saasRegistry', () => ({ listSaas: api.listSaas }))

describe('Adm2Home', () => {
  beforeEach(() => {
    api.getHomeSummary.mockResolvedValue({ products: { total: 1, connected: 1, degraded: 0 }, operations: { availability: 'unavailable', active: null }, incidents: { availability: 'unavailable', open: null } })
    api.listSaas.mockResolvedValue([{ id: 'product-1', name: 'Produto real', status: 'connected', health: 'healthy' }])
  })
  afterEach(() => { cleanup(); vi.clearAllMocks() })

  it('shows real products and marks absent operational data unavailable', async () => {
    render(<MemoryRouter><Adm2Home /></MemoryRouter>)
    expect(await screen.findByText('Produto real')).toBeInTheDocument()
    expect(screen.getAllByText('Não integrado').length).toBeGreaterThanOrEqual(2)
    expect(screen.getByText('1 conectado')).toBeInTheDocument()
  })

  it('shows an explicit API failure instead of zeroes', async () => {
    api.getHomeSummary.mockRejectedValue(new Error('offline'))
    render(<MemoryRouter><Adm2Home /></MemoryRouter>)
    expect(await screen.findByText('Dados indisponíveis')).toBeInTheDocument()
    expect(screen.queryByText('0')).not.toBeInTheDocument()
  })

  it('keeps valid summary metrics when only the product list fails', async () => {
    api.listSaas.mockRejectedValue(new Error('inventory offline'))
    render(<MemoryRouter><Adm2Home /></MemoryRouter>)

    expect(await screen.findByText('1 conectado')).toBeInTheDocument()
    expect(screen.getByText('Inventário de produtos indisponível.')).toBeInTheDocument()
    expect(screen.queryByText('Dados indisponíveis')).not.toBeInTheDocument()
  })
})
