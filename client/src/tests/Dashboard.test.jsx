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
  waitFor,
  fireEvent,
  cleanup,
} from '@testing-library/react'

import { MemoryRouter } from 'react-router-dom'
import Dashboard from '../pages/Dashboard'

const mockNavigate = vi.fn()

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')

  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
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
          title: 'Fire alert',
          type: 'fire',
          priority: 'critical',
          status: 'triggered',
          location: 'Building A',
          timestamp: '2026-05-07',
          triggeredByName: 'Staff User',
        },
      ])
    ),
  },

  settingsAPI: {
    get: vi.fn(() =>
      Promise.resolve({
        alertTypes: [],
        locations: [],
        recipients: [],
      })
    ),
  },

  notificationsAPI: {
    list: vi.fn(() => Promise.resolve([])),
  },
}))

describe('Dashboard Page UI', () => {
  test('renders dashboard page successfully', async () => {
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText(/dashboard/i)).toBeInTheDocument()
    })

    expect(screen.getByText(/fire alert/i)).toBeInTheDocument()
    expect(screen.getByText(/active incidents/i)).toBeInTheDocument()

    expect(
      screen.getAllByText(/critical/i).length
    ).toBeGreaterThan(0)
  })

  test('navigates to submit alert page when submit alert button is clicked', async () => {
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText(/dashboard/i)).toBeInTheDocument()
    })

    fireEvent.click(
      screen.getAllByRole('button', {
        name: /submit alert/i,
      })[0]
    )

    expect(mockNavigate).toHaveBeenCalledWith('/submit')
  })

  test('shows company admin role-based dashboard content', async () => {
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText(/dashboard/i)).toBeInTheDocument()
    })

    expect(
      screen.getAllByText(/company admin/i).length
    ).toBeGreaterThan(0)

    expect(
      screen.getByText(/company admin view/i)
    ).toBeInTheDocument()

    expect(
      screen.getByText(/active incidents/i)
    ).toBeInTheDocument()

    expect(
      screen.getAllByText(/critical/i).length
    ).toBeGreaterThan(0)

    expect(
      screen.getByText(/high priority/i)
    ).toBeInTheDocument()

    expect(
      screen.getByText(/avg response/i)
    ).toBeInTheDocument()
  })
})