import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { deleteAccount } from '../api'
import { useAuth } from '../context/AuthContext'
import AccountPage from './AccountPage'

vi.mock('../api', () => ({
  deleteAccount: vi.fn(),
}))

vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(),
}))

const mockedDeleteAccount = vi.mocked(deleteAccount)
const mockedUseAuth = vi.mocked(useAuth)

function renderAccount() {
  return render(
    <MemoryRouter initialEntries={['/account']}>
      <Routes>
        <Route path="/account" element={<AccountPage />} />
        <Route path="/login" element={<div>LOGIN_PAGE</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

afterEach(cleanup)

describe('AccountPage', () => {
  beforeEach(() => {
    mockedDeleteAccount.mockReset()
    mockedDeleteAccount.mockResolvedValue(undefined)
    mockedUseAuth.mockReset()
    mockedUseAuth.mockReturnValue({
      user: { id: 1, email: 'user@example.com' },
      loading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn().mockResolvedValue(undefined),
    })
  })

  it('renders the account overview with the signed-in email', () => {
    renderAccount()
    expect(screen.getByText('user@example.com')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Konto löschen' })).toBeTruthy()
  })

  it('asks for confirmation before deleting the account', () => {
    renderAccount()
    fireEvent.click(screen.getByRole('button', { name: 'Konto löschen' }))
    expect(screen.getByRole('button', { name: /ja, endgültig löschen/i })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Abbrechen' })).toBeTruthy()
    expect(mockedDeleteAccount).not.toHaveBeenCalled()
  })

  it('deletes the account and redirects to /login on confirm', async () => {
    renderAccount()
    fireEvent.click(screen.getByRole('button', { name: 'Konto löschen' }))
    fireEvent.click(screen.getByRole('button', { name: /ja, endgültig löschen/i }))
    await waitFor(() => {
      expect(mockedDeleteAccount).toHaveBeenCalledTimes(1)
      expect(screen.getByText('LOGIN_PAGE')).toBeTruthy()
    })
  })

  it('cancels the deletion without calling the API', () => {
    renderAccount()
    fireEvent.click(screen.getByRole('button', { name: 'Konto löschen' }))
    fireEvent.click(screen.getByRole('button', { name: 'Abbrechen' }))
    expect(screen.getByRole('button', { name: 'Konto löschen' })).toBeTruthy()
    expect(mockedDeleteAccount).not.toHaveBeenCalled()
  })

  it('shows an error and stays on the page when deletion fails', async () => {
    mockedDeleteAccount.mockRejectedValue(new Error('Interner Serverfehler'))
    renderAccount()
    fireEvent.click(screen.getByRole('button', { name: 'Konto löschen' }))
    fireEvent.click(screen.getByRole('button', { name: /ja, endgültig löschen/i }))
    await waitFor(() => {
      expect(screen.getByText('Interner Serverfehler')).toBeTruthy()
    })
    expect(screen.queryByText('LOGIN_PAGE')).toBeNull()
  })
})
