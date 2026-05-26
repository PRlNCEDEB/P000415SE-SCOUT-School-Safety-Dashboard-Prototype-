// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import React from 'react'
import { describe, test, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Notifications from '../pages/Notifications'

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
  notificationsAPI: {
    list: vi.fn(() =>
      Promise.resolve([
        {
          id: '1',
          incidentId: 'INC001',
          incidentTitle: 'Fire Alert',
          recipientName: 'John Staff',
          recipientEmail: 'john@school.edu',
          recipientPhone: '0400000000',
          sms: 'sent',
          email: 'sent',
          type: 'fire',
          timestamp: '2026-05-12 10:00',
        },
        {
          id: '2',
          incidentId: 'INC002',
          incidentTitle: 'Medical Emergency',
          recipientName: 'Sarah Admin',
          recipientEmail: 'sarah@school.edu',
          recipientPhone: '',
          sms: 'skipped',
          email: 'sent',
          type: 'medical',
          timestamp: '2026-05-12 11:00',
        },
      ])
    ),
  },
}))

describe('Notifications Page', () => {
  test('renders notification data from API', async () => {
    render(
      <MemoryRouter>
        <Notifications />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText(/fire alert/i)).toBeInTheDocument()
      expect(screen.getByText(/john staff/i)).toBeInTheDocument()
    })
  })

  test('renders multiple notification records', async () => {
    render(
      <MemoryRouter>
        <Notifications />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText(/fire alert/i)).toBeInTheDocument()
      expect(screen.getByText(/medical emergency/i)).toBeInTheDocument()
      expect(screen.getByText(/sarah admin/i)).toBeInTheDocument()
    })
  })

  test('renders notification status badges', async () => {
  render(
    <MemoryRouter>
      <Notifications />
    </MemoryRouter>
  )

  await waitFor(() => {
    expect(screen.getByText(/fire alert/i)).toBeInTheDocument()
  })

  expect(screen.getAllByText(/sent/i).length).toBeGreaterThan(0)
  expect(screen.getByText(/skipped/i)).toBeInTheDocument()
})

  test('renders email and sms statuses', async () => {
    render(
      <MemoryRouter>
        <Notifications />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getAllByText(/sent/i).length).toBeGreaterThan(0)
      expect(screen.getByText(/skipped/i)).toBeInTheDocument()
    })
  })
})