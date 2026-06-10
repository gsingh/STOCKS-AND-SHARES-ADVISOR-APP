import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import App from '../app'

describe('App', () => {
  it('shows loading state on initial render', () => {
    render(<App />)
    const loading = screen.getByRole('status')
    expect(loading).toBeInTheDocument()
  })
})
