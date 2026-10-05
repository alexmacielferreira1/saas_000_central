import '@testing-library/jest-dom/vitest'
import React from 'react'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

import Adm2Products from './Adm2Products'

const api = vi.hoisted(() => ({ listSaas: vi.fn() }))
vi.mock('@/api/saasRegistry', () => ({ listSaas: api.listSaas }))

describe('Adm2Products', () => {
  afterEach(() => { cleanup(); vi.clearAllMocks() })

  it('lists real products and links to the current canonical detail', async () => {
    api.listSaas.mockResolvedValue([{ id: 'p-1', name: 'MediaMind', slug: 'mediamind', status: 'connected', health: 'healthy' }])
    render(<MemoryRouter><Adm2Products /></MemoryRouter>)
    expect(await screen.findByRole('link', { name: /MediaMind/ })).toHaveAttribute('href', '/saas/p-1')
    expect(screen.getByText('Filtro local')).toBeInTheDocument()
  })

  it('filters the loaded list locally and identifies an empty result', async () => {
    api.listSaas.mockResolvedValue([{ id: 'p-1', name: 'MediaMind', slug: 'mediamind', status: 'connected', health: 'healthy' }])
    render(<MemoryRouter><Adm2Products /></MemoryRouter>)
    await screen.findByText('MediaMind')
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'inexistente' } })
    expect(screen.getByText('Nenhum produto corresponde ao filtro local.')).toBeInTheDocument()
  })

  it('reports inventory API failure without demo products', async () => {
    api.listSaas.mockRejectedValue(new Error('offline'))
    render(<MemoryRouter><Adm2Products /></MemoryRouter>)
    expect(await screen.findByText('Inventário indisponível')).toBeInTheDocument()
  })
})
