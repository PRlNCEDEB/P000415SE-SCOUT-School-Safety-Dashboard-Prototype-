// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import React from 'react'
import { describe, test, expect, vi, afterEach } from 'vitest'
import { render, screen, waitFor, cleanup } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Analytics from '../pages/Analytics'

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    currentUser: { email: 'admin@school.edu' },
    userRole: 'Company Admin',
    isAdmin: true,
    isCompanyAdmin: true,
    isSchoolAdmin: false,
    isStaff: false,
    authLoading: false,
  }),
}))

vi.mock('../api/client', () => ({
  analyticsAPI: {
    all: vi.fn(() =>
      Promise.resolve({
        summary: {
          totalIncidents: 10,
          resolvedCount: 7,
          avgResponseTime: 5,
          thisWeekIncidents: 3,
        },
        incidentsByType: [],
        statusData: [],
        responseTimeData: [],
        locationData: [],
        incidentsByDay: [],
      })
    ),
  },
}))

describe('Analytics Page', () => {
  test('renders analytics page heading', async () => {
    render(
      <MemoryRouter>
        <Analytics />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText(/analytics/i)).toBeInTheDocument()
    })
  })

  test('renders analytics summary labels', async () => {
    render(
      <MemoryRouter>
        <Analytics />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText(/total incidents/i)).toBeInTheDocument()
      expect(screen.getByText(/resolved/i)).toBeInTheDocument()
      expect(screen.getByText(/avg response/i)).toBeInTheDocument()
      expect(screen.getByText(/this week/i)).toBeInTheDocument()
    })
  })
})
