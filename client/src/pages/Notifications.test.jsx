import { render, screen } from '@testing-library/react'
import { vi } from 'vitest'
import Notifications from './Notifications'

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    isAdmin: true,
    currentUser: {
      name: 'Test Admin',
      email: 'testadmin@example.com'
    }
  })
}))

describe('Notifications Page', () => {
  it('renders without crashing', () => {
    render(<Notifications />)
  })

  it('renders notifications page content', () => {
    render(<Notifications />)

    expect(screen.getByText(/notification/i)).toBeInTheDocument()
  })
})