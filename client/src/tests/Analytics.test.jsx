// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import React from 'react'
import { describe, test, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Analytics from '../pages/Analytics'

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
  analyticsAPI: {
    all: vi.fn(() =>
      Promise.resolve({
        summary: {
          totalIncidents: 10,
          resolvedCount: 7,
          avgResponseTime: 5,
          thisWeekIncidents: 3,
        },
        incidentsByType: [
          { type: 'fire', count: 4 },
          { type: 'medical', count: 6 },
        ],
        statusBreakdown: [
          { status: 'resolved', count: 7 },
          { status: 'active', count: 3 },
        ],
        responseTimeData: [
          { date: '2026-05-12', avgResponseTime: 5 },
        ],
        locationData: [
          { location: 'Science Block', count: 5 },
          { location: 'Main Gate', count: 3 },
        ],
        incidentsByDay: [
          { day: 'Monday', count: 2 },
          { day: 'Tuesday', count: 4 },
        ],
        recentActivity: [],
      })
    ),
  },
}))

describe('Analytics Page', () => {
  test('renders analytics summary data', async () => {
    render(
      <MemoryRouter>
        <Analytics />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText(/10/i)).toBeInTheDocument()
      expect(screen.getByText(/7/i)).toBeInTheDocument()
    })
  })

  test('renders analytics chart sections', async () => {
    render(
      <MemoryRouter>
        <Analytics />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText(/Incidents by Type/i)).toBeInTheDocument()
      expect(screen.getByText(/Status Breakdown/i)).toBeInTheDocument()
      expect(screen.getByText(/Incidents by Location/i)).toBeInTheDocument()
    })
  })
})