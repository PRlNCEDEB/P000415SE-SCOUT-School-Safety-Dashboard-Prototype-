// @vitest-environment jsdom

import React, { useState, useEffect } from 'react'
import { describe, test, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import Analytics from '../pages/Analytics'

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    isAdmin: true,
    isCompanyAdmin: true,
    userRole: 'admin',
    authLoading: false,
  }),
}))

describe('Analytics Page UI', () => {
  test('renders analytics page successfully', () => {
    render(<Analytics />)

    expect(screen.getByText(/analytics/i)).toBeTruthy()
  })
})