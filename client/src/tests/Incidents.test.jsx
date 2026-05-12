// @vitest-environment jsdom

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
import Incidents from '../pages/Incidents'

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
  }),
}))

vi.mock('../api/client', () => ({
  getIncidents: vi.fn(() =>
    Promise.resolve([
      {
        id: '1',
        title: 'Medical Emergency',
        type: 'medical',
        priority: 'high',
        status: 'triggered',
        location: 'Library',
        timestamp: '2026-05-07',
      },
      {
        id: '2',
        title: 'Fire Drill',
        type: 'fire',
        priority: 'critical',
        status: 'resolved',
        location: 'Block A',
        timestamp: '2026-05-07',
      },
    ])
  ),
}))

describe('Incidents Page UI', () => {
  test('renders incidents page successfully', async () => {
    render(
      <MemoryRouter>
        <Incidents />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText(/incident log/i)).toBeTruthy()
    })

    expect(screen.getAllByText(/medical emergency/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/fire drill/i).length).toBeGreaterThan(0)
  })

  test('filters incidents using search input', async () => {
    render(
      <MemoryRouter>
        <Incidents />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getAllByText(/medical emergency/i).length).toBeGreaterThan(0)
    })

    fireEvent.change(screen.getAllByPlaceholderText(/search incidents/i)[0], {
      target: { value: 'medical' },
    })

    expect(screen.getAllByText(/medical emergency/i).length).toBeGreaterThan(0)
    expect(screen.queryByText(/fire drill/i)).toBeNull()
  })

  test('shows error message when incidents API fails', async () => {
    const { getIncidents } = await import('../api/client')

    getIncidents.mockRejectedValueOnce(new Error('API failed'))

    render(
      <MemoryRouter>
        <Incidents />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText(/failed/i)).toBeTruthy()
    })
  })

  test('filters incidents by status and priority', async () => {
    render(
      <MemoryRouter>
        <Incidents />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getAllByText(/medical emergency/i).length).toBeGreaterThan(0)
    })

    const dropdowns = screen.getAllByRole('combobox')

    fireEvent.change(dropdowns[0], {
      target: { value: 'resolved' },
    })

    expect(screen.getAllByText(/fire drill/i).length).toBeGreaterThan(0)
    expect(screen.queryByText(/medical emergency/i)).toBeNull()

    fireEvent.change(dropdowns[1], {
      target: { value: 'critical' },
    })

    expect(screen.getAllByText(/fire drill/i).length).toBeGreaterThan(0)
  })
})