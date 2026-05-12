// @vitest-environment jsdom

import React from 'react'
import { describe, test, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import SubmitAlert from '../pages/SubmitAlert'

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    currentUser: { email: 'staff@school.edu' },
    userRole: 'Staff',
    isStaff: true,
  }),
}))

describe('Submit Alert Page UI', () => {
  test('renders submit alert page successfully', () => {
    render(
      <MemoryRouter>
        <SubmitAlert />
      </MemoryRouter>
    )

    expect(screen.getByRole('heading', { name: /submit alert/i })).toBeTruthy()
    expect(screen.getByText(/alert type/i)).toBeTruthy()
    expect(screen.getByText(/priority/i)).toBeTruthy()
  })

  test('allows user to fill submit alert form fields', () => {
    render(
      <MemoryRouter>
        <SubmitAlert />
      </MemoryRouter>
    )

    fireEvent.click(screen.getAllByText(/medical/i)[0])
    fireEvent.click(screen.getAllByText(/high/i)[0])

    fireEvent.change(screen.getAllByPlaceholderText(/brief description/i)[0], {
      target: { value: 'Student injury near library' },
    })

    fireEvent.change(screen.getAllByRole('combobox')[0], {
      target: { value: 'Library' },
    })

    fireEvent.change(screen.getAllByPlaceholderText(/additional details/i)[0], {
      target: { value: 'Student needs medical support.' },
    })

    expect(screen.getByDisplayValue(/student injury near library/i)).toBeTruthy()
    expect(screen.getByDisplayValue(/student needs medical support/i)).toBeTruthy()
  })

  test('submit alert button is visible to the user', () => {
    render(
      <MemoryRouter>
        <SubmitAlert />
      </MemoryRouter>
    )

    expect(
      screen.getAllByRole('button', { name: /submit alert/i }).length
    ).toBeGreaterThan(0)
  })
})