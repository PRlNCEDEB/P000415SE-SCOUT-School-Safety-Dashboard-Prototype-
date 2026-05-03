import { render, screen } from '@testing-library/react'
import { vi } from 'vitest'
import Analytics from './Analytics'

vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn()
}))

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }) => <div>{children}</div>,
  BarChart: ({ children }) => <div>{children}</div>,
  Bar: () => <div />,
  XAxis: () => <div />,
  YAxis: () => <div />,
  Tooltip: () => <div />,
  PieChart: ({ children }) => <div>{children}</div>,
  Pie: ({ children }) => <div>{children}</div>,
  Cell: () => <div />,
  LineChart: ({ children }) => <div>{children}</div>,
  Line: () => <div />,
  CartesianGrid: () => <div />,
  Legend: () => <div />
}))

import { useAuth } from '../context/AuthContext'

describe('Analytics Page', () => {
  it('shows restricted access for non-admin users', () => {
    useAuth.mockReturnValue({
      isAdmin: false
    })

    render(<Analytics />)

    expect(screen.getByText('Restricted Access')).toBeInTheDocument()
    expect(screen.getByText(/only available to Admin users/i)).toBeInTheDocument()
  })

  it('renders analytics dashboard for admin users', () => {
    useAuth.mockReturnValue({
      isAdmin: true
    })

    render(<Analytics />)

    expect(screen.getByText('Analytics')).toBeInTheDocument()
    expect(screen.getByText('Operational insights from incident data')).toBeInTheDocument()
  })

  it('displays summary cards correctly', () => {
    useAuth.mockReturnValue({
      isAdmin: true
    })

    render(<Analytics />)

    expect(screen.getByText('Total Incidents')).toBeInTheDocument()
    expect(screen.getByText('51')).toBeInTheDocument()
    expect(screen.getByText('Resolved')).toBeInTheDocument()
    expect(screen.getByText('28')).toBeInTheDocument()
    expect(screen.getByText('Avg Response')).toBeInTheDocument()
    expect(screen.getByText('4.2m')).toBeInTheDocument()
    expect(screen.getByText('This Week')).toBeInTheDocument()
    expect(screen.getByText('12')).toBeInTheDocument()
  })

  it('renders analytics chart section headings', () => {
    useAuth.mockReturnValue({
      isAdmin: true
    })

    render(<Analytics />)

    expect(screen.getByText('Incidents by Type')).toBeInTheDocument()
    expect(screen.getByText('Status Breakdown')).toBeInTheDocument()
    expect(screen.getByText('Avg Response Time (minutes)')).toBeInTheDocument()
    expect(screen.getByText('Incidents by Location')).toBeInTheDocument()
    expect(screen.getByText('Incidents This Week by Day')).toBeInTheDocument()
  })
})