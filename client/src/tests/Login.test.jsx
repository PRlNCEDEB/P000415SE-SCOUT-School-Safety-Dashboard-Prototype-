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
  fireEvent,
  waitFor,
} from '@testing-library/react'

import { MemoryRouter } from 'react-router-dom'
import Login from '../pages/Login'

const mockLogin = vi.fn()
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
    login: mockLogin,
    currentUser: null,
    authLoading: false,
    userRole: 'Company Admin',
  }),
}))

describe('Login Authentication Flow', () => {
  test('renders sign in heading', () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    )

    expect(
      screen.getByRole('heading', { name: /sign in/i })
    ).toBeInTheDocument()
  })

  test('allows user to type email and password', () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    )

    const emailInput =
      screen.getByPlaceholderText(/you@school.edu/i)

    const passwordInput =
      screen.getByPlaceholderText(/password/i)

    fireEvent.change(emailInput, {
      target: { value: 'admin@school.edu' },
    })

    fireEvent.change(passwordInput, {
      target: { value: 'password123' },
    })

    expect(emailInput).toHaveValue('admin@school.edu')
    expect(passwordInput).toHaveValue('password123')
  })

  test('calls login function on submit', async () => {
    mockLogin.mockResolvedValueOnce(true)

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    )

    fireEvent.change(
      screen.getByPlaceholderText(/you@school.edu/i),
      {
        target: { value: 'admin@school.edu' },
      }
    )

    fireEvent.change(
      screen.getByPlaceholderText(/password/i),
      {
        target: { value: 'password123' },
      }
    )

    fireEvent.click(
      screen.getByRole('button', {
        name: /sign in/i,
      })
    )

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalled()
    })
  })

  test('handles invalid login attempt', async () => {
    mockLogin.mockRejectedValueOnce(
      new Error('Invalid credentials')
    )

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    )

    fireEvent.change(
      screen.getByPlaceholderText(/you@school.edu/i),
      {
        target: { value: 'wrong@school.edu' },
      }
    )

    fireEvent.change(
      screen.getByPlaceholderText(/password/i),
      {
        target: { value: 'wrongpassword' },
      }
    )

    fireEvent.click(
      screen.getByRole('button', {
        name: /sign in/i,
      })
    )

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalled()
    })
  })
})