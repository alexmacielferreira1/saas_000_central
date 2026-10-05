import '@testing-library/jest-dom/vitest'
import React from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import AdminWorkspaceSwitcher from '@/components/AdminWorkspaceSwitcher'
import { ADM1_ITEMS } from '@/lib/adminWorkspaces'
import Adm1Workspace from './Adm1Workspace'

function CurrentLocation() {
  return <span data-testid="location">{useLocation().pathname}</span>
}

describe('Adm 1 workspace', () => {
  it('lists the existing Central destinations as real links', () => {
    render(<MemoryRouter><Adm1Workspace /></MemoryRouter>)

    expect(screen.getByRole('heading', { name: 'Adm 1 — Atual' })).toBeInTheDocument()
    expect(screen.getAllByRole('link')).toHaveLength(ADM1_ITEMS.length)
    expect(screen.getByRole('link', { name: /Administração/ })).toHaveAttribute('href', '/administration')
    expect(screen.getByRole('link', { name: /Detalhe SaaS 360/ })).toHaveAccessibleName(/abrir pelo catálogo/i)
  })

  it('switches workspaces by URL without creating parallel session state', () => {
    render(
      <MemoryRouter initialEntries={['/adm1']}>
        <AdminWorkspaceSwitcher />
        <Routes>
          <Route path="*" element={<CurrentLocation />} />
        </Routes>
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByRole('link', { name: 'Adm 2 — Evolução' }))
    expect(screen.getByTestId('location')).toHaveTextContent('/adm2')
  })
})
