// @vitest-environment jsdom

import React from 'react'
import { describe, test, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Login from '../pages/Login'

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    login: vi.fn(),
    currentUser: null,
    isAdmin: false,
  }),
}))

describe('Login Page UI', () => {
  test('renders login page successfully', () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    )

    expect(screen.getByRole('heading', { name: /sign in/i })).toBeTruthy()
  })
})