// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import React from 'react'
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup, waitFor, act } from '@testing-library/react'
import { SchoolsProvider, useSchools } from '../context/SchoolsContext'

// The provider is the mechanism behind two Definition-of-Done points: a new school appearing in every dropdown at once, and the list staying current.
// These tests pin that behaviour.

const authState = {
  authLoading: false,
  currentUser: { uid: 'u1' },
  userRole: 'Company Admin',
  isCompanyAdmin: true,
}

vi.mock('../context/AuthContext', () => ({
  useAuth: () => authState,
}))

const listMock = vi.fn()
const createMock = vi.fn()

vi.mock('../api/client', () => ({
  schoolAPI: {
    list: (...args) => listMock(...args),
    create: (...args) => createMock(...args),
    rename: vi.fn(),
    setActive: vi.fn(),
  },
}))

function Probe() {
  const { schools, allSchools, loading, createSchool } = useSchools()

  return (
    <div>
      <span data-testid="loading">{String(loading)}</span>
      <span data-testid="dropdown">{schools.map(s => s.name).join(',')}</span>
      <span data-testid="all">{allSchools.map(s => s.name).join(',')}</span>
      <button onClick={() => createSchool('North Campus').catch(() => {})}>add</button>
    </div>
  )
}

function renderProvider() {
  return render(<SchoolsProvider><Probe /></SchoolsProvider>)
}

beforeEach(() => {
  listMock.mockReset()
  createMock.mockReset()
  authState.authLoading = false
  authState.currentUser = { uid: 'u1' }
  authState.userRole = 'Company Admin'
  authState.isCompanyAdmin = true
})

afterEach(() => cleanup())

describe('SchoolsProvider', () => {
  test('loads schools from the API on mount', async () => {
    listMock.mockResolvedValue({
      schools: [{ id: 'school_east', name: 'East Campus', active: true }],
      version: 1,
    })

    renderProvider()

    await waitFor(() => expect(screen.getByTestId('dropdown')).toHaveTextContent('East Campus'))
    expect(screen.getByTestId('loading')).toHaveTextContent('false')
  })

  test('requests inactive schools for a Company Admin so Setup can manage them', async () => {
    listMock.mockResolvedValue({ schools: [], version: 1 })

    renderProvider()

    await waitFor(() => expect(listMock).toHaveBeenCalled())
    expect(listMock).toHaveBeenCalledWith({ includeInactive: true })
  })

  test('does not request inactive schools for other roles', async () => {
    authState.isCompanyAdmin = false
    authState.userRole = 'School Admin'
    listMock.mockResolvedValue({ schools: [], version: 1 })

    renderProvider()

    await waitFor(() => expect(listMock).toHaveBeenCalled())
    expect(listMock).toHaveBeenCalledWith({ includeInactive: false })
  })

  test('hides inactive schools from dropdowns but keeps them for management', async () => {
    listMock.mockResolvedValue({
      schools: [
        { id: 'school_east', name: 'East Campus', active: true },
        { id: 'school_old', name: 'Old Campus', active: false },
      ],
      version: 1,
    })

    renderProvider()

    await waitFor(() => expect(screen.getByTestId('all')).toHaveTextContent('East Campus,Old Campus'))
    expect(screen.getByTestId('dropdown')).toHaveTextContent('East Campus')
    expect(screen.getByTestId('dropdown')).not.toHaveTextContent('Old Campus')
  })

  test('a non-admin keeps their own school even when it is deactivated', async () => {
    // The server deliberately returns it; filtering it out client-side would blank the dashboard and analytics headings for that user.
    authState.isCompanyAdmin = false
    authState.userRole = 'Staff'
    listMock.mockResolvedValue({
      schools: [{ id: 'school_mine', name: 'My Campus', active: false }],
      version: 1,
    })

    renderProvider()

    await waitFor(() => expect(screen.getByTestId('dropdown')).toHaveTextContent('My Campus'))
  })

  test('a created school appears immediately without waiting for the poll', async () => {
    listMock
      .mockResolvedValueOnce({
        schools: [{ id: 'school_east', name: 'East Campus', active: true }],
        version: 1,
      })
      .mockResolvedValue({
        schools: [
          { id: 'school_east', name: 'East Campus', active: true },
          { id: 'school_north', name: 'North Campus', active: true },
        ],
        version: 2,
      })
    createMock.mockResolvedValue({ id: 'school_north', name: 'North Campus', active: true })

    renderProvider()
    await waitFor(() => expect(screen.getByTestId('dropdown')).toHaveTextContent('East Campus'))

    await act(async () => {
      screen.getByText('add').click()
    })

    await waitFor(() => expect(screen.getByTestId('dropdown')).toHaveTextContent('North Campus'))
    expect(createMock).toHaveBeenCalledWith('North Campus')
  })

  test('a forced refresh does not reuse an in-flight request issued before the change', async () => {
    // Regression guard: reusing the in-flight promise made createSchool resolve with a list that had been fetched before the school existed.
    let resolveFirst
    listMock
      .mockImplementationOnce(() => new Promise(resolve => { resolveFirst = resolve }))
      .mockResolvedValue({
        schools: [{ id: 'school_north', name: 'North Campus', active: true }],
        version: 2,
      })
    createMock.mockResolvedValue({ id: 'school_north', name: 'North Campus', active: true })

    renderProvider()
    await waitFor(() => expect(listMock).toHaveBeenCalledTimes(1))

    await act(async () => {
      screen.getByText('add').click()
      resolveFirst({ schools: [], version: 1 })   // the stale reply lands late
    })

    await waitFor(() => expect(screen.getByTestId('dropdown')).toHaveTextContent('North Campus'))
    expect(listMock).toHaveBeenCalledTimes(2)
  })

  test('keeps the previous list when a refresh fails', async () => {
    listMock
      .mockResolvedValueOnce({
        schools: [{ id: 'school_east', name: 'East Campus', active: true }],
        version: 1,
      })
      .mockRejectedValue(new Error('network down'))
    createMock.mockRejectedValue(new Error('boom'))

    renderProvider()
    await waitFor(() => expect(screen.getByTestId('dropdown')).toHaveTextContent('East Campus'))

    await act(async () => {
      screen.getByText('add').click()
    })

    // An empty dropdown would be worse than a slightly stale one.
    expect(screen.getByTestId('dropdown')).toHaveTextContent('East Campus')
  })

  test('clears the list on sign-out so the next user sees nothing stale', async () => {
    listMock.mockResolvedValue({
      schools: [{ id: 'school_east', name: 'East Campus', active: true }],
      version: 1,
    })

    const { rerender } = renderProvider()
    await waitFor(() => expect(screen.getByTestId('dropdown')).toHaveTextContent('East Campus'))

    authState.currentUser = null
    authState.userRole = null
    await act(async () => {
      rerender(<SchoolsProvider><Probe /></SchoolsProvider>)
    })

    expect(screen.getByTestId('dropdown')).toHaveTextContent('')
  })

  test('useSchools outside the provider fails loudly', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => render(<Probe />)).toThrow(/must be used inside a SchoolsProvider/)
    spy.mockRestore()
  })
})
