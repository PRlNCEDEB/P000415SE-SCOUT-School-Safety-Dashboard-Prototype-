// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import React from 'react'
import { describe, test, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Dashboard from '../pages/Dashboard'

afterEach(() => {
  cleanup()
})

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    currentUser: { email: 'admin@school.edu' },
    userRole: 'Company Admin',
    isCompanyAdmin: true,
    isSchoolAdmin: false,
    isStaff: false,
    isAdmin: true,
    authLoading: false,
  }),
}))

vi.mock('../api/client', () => ({
  incidentAPI: {
    list: vi.fn(() =>
      Promise.resolve([
        {
          id: '1',
          title: 'Fire Alert',
          type: 'fire',
          status: 'active',
          location: 'Science Block',
          priority: 'high',
          timestamp: '2026-05-12 10:00',
        },
        {
          id: '2',
          title: 'Medical Emergency',
          type: 'medical',
          status: 'resolved',
          location: 'Library',
          priority: 'medium',
          timestamp: '2026-05-12 11:00',
        },
      ])
    ),
  },
  notificationsAPI: {
    list: vi.fn(() => Promise.resolve([])),
  },
}))

describe('Dashboard Page', () => {
  test('renders dashboard heading', async () => {
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    )

    expect(
      await screen.findByText(/dashboard/i)
    ).toBeInTheDocument()
  })

  test('renders recent incident data', async () => {
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText(/fire alert/i)).toBeInTheDocument()
      expect(screen.getByText(/science block/i)).toBeInTheDocument()
    })
  })

  test('renders multiple incident records', async () => {
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText(/fire alert/i)).toBeInTheDocument()
      expect(screen.getByText(/medical emergency/i)).toBeInTheDocument()
    })
  })
})