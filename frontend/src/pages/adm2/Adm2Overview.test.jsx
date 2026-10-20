import '@testing-library/jest-dom/vitest'
import React from 'react'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import { ADM2_ITEMS } from '@/lib/adminWorkspaces'
import Adm2Overview from './Adm2Overview'

describe('Adm 2 overview', () => {
  it('shows planned modules as status cards without fake navigation', () => {
    render(<MemoryRouter initialEntries={['/adm2']}><Adm2Overview /></MemoryRouter>)

    expect(screen.getByRole('heading', { name: 'Adm 2 — Evolução' })).toBeInTheDocument()
    for (const item of ADM2_ITEMS.filter((entry) => entry.status === 'PLANEJADO')) {
      expect(screen.getByText(item.label).closest('a')).toBeNull()
    }
  })

  it('links only modules that have implemented routes', () => {
    render(<MemoryRouter initialEntries={['/adm2']}><Adm2Overview /></MemoryRouter>)

    for (const item of ADM2_ITEMS.filter((entry) => entry.to)) {
      expect(screen.getAllByRole('link', { name: new RegExp(item.label) }).some((link) => link.getAttribute('href') === item.to)).toBe(true)
    }
  })

  it('does not fill the catalog with demonstrative business numbers', () => {
    const { container } = render(<MemoryRouter initialEntries={['/adm2']}><Adm2Overview /></MemoryRouter>)

    expect(container).not.toHaveTextContent(/R\$|clientes ativos|receita mensal/i)
  })
})
