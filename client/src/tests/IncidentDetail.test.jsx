// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import React from 'react'
import { describe, test, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import IncidentDetail from '../pages/IncidentDetail'

afterEach(() => {
  cleanup()
})

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')

  return {
    ...actual,
    useParams: () => ({
      id: '1',
    }),
  }
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
  getIncidentById: vi.fn(() =>
    Promise.resolve({
      id: '1',
      title: 'Fire Alert',
      type: 'fire',
      status: 'triggered',
      location: 'Science Block',
      description: 'Emergency fire reported',
      priority: 'high',
      timestamp: '2026-05-12 10:00',
      createdAt: new Date().toISOString(),
    })
  ),
  settingsAPI: {
    get: vi.fn(() => Promise.resolve({ overdueThresholdMinutes: 15 })),
  },
}))

describe('Incident Detail Page', () => {
  test('renders incident detail information', async () => {
    render(
      <MemoryRouter>
        <IncidentDetail />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText(/fire alert/i)).toBeInTheDocument()
      expect(screen.getByText(/science block/i)).toBeInTheDocument()
    })
  })

  test('renders incident description', async () => {
    render(
      <MemoryRouter>
        <IncidentDetail />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(
        screen.getByText(/emergency fire reported/i)
      ).toBeInTheDocument()
    })
  })
})
