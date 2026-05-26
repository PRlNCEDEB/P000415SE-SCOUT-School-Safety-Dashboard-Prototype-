// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import React from 'react'
import { describe, test, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup, waitFor, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Incidents from '../pages/Incidents'

afterEach(() => {
  cleanup()
})

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    currentUser: { email: 'admin@school.edu' },
    userRole: 'Company Admin',
    isCompanyAdmin: true,
    isAdmin: true,
    authLoading: false,
  }),
}))

vi.mock('../api/client', () => ({
  getIncidents: vi.fn(() =>
    Promise.resolve([
      {
        id: '1',
        title: 'Fire Alert',
        type: 'fire',
        status: 'active',
        location: 'Science Block',
        priority: 'high',
        reportedBy: 'Admin',
        timestamp: '2026-05-12 10:00',
      },
      {
        id: '2',
        title: 'Medical Emergency',
        type: 'medical',
        status: 'resolved',
        location: 'Library',
        priority: 'medium',
        reportedBy: 'Staff',
        timestamp: '2026-05-12 11:00',
      },
    ])
  ),
}))

describe('Incidents Page', () => {
  test('renders incidents page data', async () => {
    render(
      <MemoryRouter>
        <Incidents />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText(/fire alert/i)).toBeInTheDocument()
      expect(screen.getByText(/science block/i)).toBeInTheDocument()
    })
  })

  test('renders incident log heading', () => {
    render(
      <MemoryRouter>
        <Incidents />
      </MemoryRouter>
    )

    expect(
      screen.getByRole('heading', { name: /incident log/i })
    ).toBeInTheDocument()
  })

  test('filters incidents by resolved status', async () => {
  render(
    <MemoryRouter>
      <Incidents />
    </MemoryRouter>
  )

  await waitFor(() => {
    expect(screen.getByText(/fire alert/i)).toBeInTheDocument()
    expect(screen.getByText(/medical emergency/i)).toBeInTheDocument()
  })

  const statusDropdown = screen.getAllByRole('combobox')[0]

  fireEvent.change(statusDropdown, {
    target: { value: 'resolved' },
  })

  await waitFor(() => {
    expect(screen.getByText(/medical emergency/i)).toBeInTheDocument()
    expect(screen.queryByText(/fire alert/i)).not.toBeInTheDocument()
  })
})

  test('allows user to search incidents', async () => {
    render(
      <MemoryRouter>
        <Incidents />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText(/fire alert/i)).toBeInTheDocument()
    })

    const searchInput = screen.getByPlaceholderText(/search incidents/i)

    fireEvent.change(searchInput, {
      target: { value: 'medical' },
    })

    expect(searchInput).toHaveValue('medical')
    expect(screen.getByText(/medical emergency/i)).toBeInTheDocument()
  })
})