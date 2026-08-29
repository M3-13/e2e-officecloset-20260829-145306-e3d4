import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import Datenschutz from './Datenschutz'

afterEach(cleanup)

describe('Datenschutz', () => {
  it('renders the privacy policy with the required sections', () => {
    render(<Datenschutz />)
    expect(screen.getByRole('heading', { name: 'Datenschutzerklärung' })).toBeTruthy()
    expect(screen.getByRole('heading', { name: /Kontolöschung/i })).toBeTruthy()
    expect(screen.getByRole('heading', { name: /Drittanbieter/i })).toBeTruthy()
    expect(screen.getByRole('heading', { name: /Ihre Rechte/i })).toBeTruthy()
  })
})
