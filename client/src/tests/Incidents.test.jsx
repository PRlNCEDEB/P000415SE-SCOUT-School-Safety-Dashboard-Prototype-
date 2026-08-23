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

// Incidents reads its school filter options from SchoolsContext, so the page
// needs the context stubbed the same way AuthContext is. Names here are
// deliberately generic no seeded school names in source (see server/tests/no-hardcoded-schools.test.js).
vi.mock('../context/SchoolsContext', () => ({
  useSchools: () => ({
    schools: [
      { id: 'school_north', name: 'North Campus', active: true },
      { id: 'school_south', name: 'South Campus', active: true },
    ],
    schoolsById: new Map(),
    loading: false,
    error: '',
    version: 1,
    refresh: vi.fn(),
    getSchoolName: vi.fn(),
    createSchool: vi.fn(),
    renameSchool: vi.fn(),
    setSchoolActive: vi.fn(),
  }),
}))

vi.mock('../api/client', () => ({
  getIncidents: vi.fn(() =>
    Promise.resolve([
      {
        id: '1',
        title: 'Fire Alert',
        type: 'fire',
        status: 'triggered',
        location: 'Science Block',
        priority: 'high',
        reportedBy: 'Admin',
        triggeredByName: 'Admin',
        timestamp: '2026-05-12 10:00',
        createdAt: new Date().toISOString(),
      },
      {
        id: '2',
        title: 'Medical Emergency',
        type: 'medical',
        status: 'resolved',
        location: 'Library',
        priority: 'medium',
        reportedBy: 'Staff',
        triggeredByName: 'Staff',
        timestamp: '2026-05-12 11:00',
        createdAt: new Date().toISOString(),
      },
    ])
  ),
  settingsAPI: {
    get: vi.fn(() => Promise.resolve({ overdueThresholdMinutes: 15 })),
  },
  archiveAPI: {
    list: vi.fn(() => Promise.resolve([])),
  },
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
    const statusDropdown = screen.getAllByRole('combobox')[0]

    fireEvent.change(statusDropdown, {
      target: { value: 'all' },
    })

    fireEvent.change(searchInput, {
      target: { value: 'medical' },
    })

    expect(searchInput).toHaveValue('medical')
    await waitFor(() => {
      expect(screen.getByText(/medical emergency/i)).toBeInTheDocument()
    })
  })
})
