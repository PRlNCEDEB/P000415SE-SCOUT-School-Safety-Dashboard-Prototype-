import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import Login from './Login'

const mockNavigate = vi.fn()
const mockLogin = vi.fn()

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate
}))

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    login: mockLogin
  })
}))

describe('Login Page', () => {
  beforeEach(() => {
    mockNavigate.mockClear()
    mockLogin.mockClear()
  })

  it('renders login page content', () => {
    render(<Login />)

    expect(screen.getByText('SCOUT')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Sign in' })).toBeInTheDocument()
    expect(screen.getByPlaceholderText('you@school.edu')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('password')).toBeInTheDocument()
  })

  it('fills demo admin account when clicked', () => {
    render(<Login />)

    fireEvent.click(screen.getByText('Admin User'))

    expect(screen.getByDisplayValue('admin@school.edu')).toBeInTheDocument()
    expect(screen.getByDisplayValue('password123')).toBeInTheDocument()
  })

  it('navigates to dashboard after successful login', async () => {
    mockLogin.mockReturnValue({
      success: true
    })

    render(<Login />)

    fireEvent.change(screen.getByPlaceholderText('you@school.edu'), {
      target: { value: 'admin@school.edu' }
    })

    fireEvent.change(screen.getByPlaceholderText('password'), {
      target: { value: 'password123' }
    })

    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }))

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard')
    })
  })

  it('shows error message after failed login', async () => {
    mockLogin.mockReturnValue({
      success: false,
      message: 'Invalid email or password'
    })

    render(<Login />)

    fireEvent.change(screen.getByPlaceholderText('you@school.edu'), {
      target: { value: 'wrong@school.edu' }
    })

    fireEvent.change(screen.getByPlaceholderText('password'), {
      target: { value: 'wrongpassword' }
    })

    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }))

    await waitFor(() => {
      expect(screen.getByText('Invalid email or password')).toBeInTheDocument()
    })
  })
})