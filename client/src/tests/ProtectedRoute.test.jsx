// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import React from 'react'
import {
  describe,
  test,
  expect,
  vi,
  afterEach,
} from 'vitest'

import {
  render,
  screen,
  cleanup,
} from '@testing-library/react'

import {
  MemoryRouter,
  Routes,
  Route,
} from 'react-router-dom'

import Analytics from '../pages/Analytics'

afterEach(() => {
  cleanup()
})

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    currentUser: { email: 'staff@school.edu' },
    userRole: 'Staff',
    isAdmin: false,
    isCompanyAdmin: false,
    isSchoolAdmin: false,
    isStaff: true,
    authLoading: false,
  }),
}))

vi.mock('../api/client', () => ({
  analyticsAPI: {
    all: vi.fn(() =>
      Promise.resolve({
        summary: {
          totalIncidents: 0,
          resolvedCount: 0,
          avgResponseTime: '0m',
          thisWeekIncidents: 0,
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

describe('Protected Route Test', () => {
  test('non-admin user cannot access analytics page', async () => {
    render(
      <MemoryRouter initialEntries={['/analytics']}>
        <Routes>
          <Route
            path="/analytics"
            element={<Analytics />}
          />
        </Routes>
      </MemoryRouter>
    )

    expect(
      screen.queryByText(/analytics/i)
    ).not.toBeInTheDocument()
  })
})