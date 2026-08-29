import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import Impressum from './Impressum'

afterEach(cleanup)

describe('Impressum', () => {
  it('renders the legal notice with the required sections', () => {
    render(<Impressum />)
    expect(screen.getByRole('heading', { name: 'Impressum' })).toBeTruthy()
    expect(screen.getByRole('heading', { name: /§ 5 DDG/i })).toBeTruthy()
    expect(screen.getByRole('heading', { name: /Haftung für Inhalte/i })).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'Urheberrecht' })).toBeTruthy()
  })
})
