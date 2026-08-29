import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError, type UserOut } from './api'
import * as api from './api'
import { AuthProvider, useAuth } from './context/AuthContext'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'

vi.mock('./api', async (importOriginal) => {
  const original = await importOriginal<typeof import('./api')>()
  return {
    ...original,
    me: vi.fn(),
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
  }
})

const userA: UserOut = { id: 1, email: 'anna@example.de' }

function Probe() {
  const { user, loading, login, register, logout } = useAuth()
  return (
    <div>
      <span data-testid="loading">{String(loading)}</span>
      <span data-testid="user">{user ? user.email : 'none'}</span>
      <button onClick={() => login('anna@example.de', 'geheim123')}>login</button>
      <button onClick={() => register('anna@example.de', 'geheim123')}>register</button>
      <button onClick={() => logout()}>logout</button>
    </div>
  )
}

function renderLogin() {
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/wardrobe" element={<div>wardrobe-marker</div>} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  )
}

function renderRegister() {
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={['/register']}>
        <Routes>
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/wardrobe" element={<div>wardrobe-marker</div>} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  )
}

beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(api.me).mockRejectedValue(new ApiError(401, 'Not authenticated'))
})

afterEach(() => {
  cleanup()
})

describe('AuthContext', () => {
  it('restores the session on mount via me()', async () => {
    vi.mocked(api.me).mockResolvedValue({ user: userA })
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    )

    expect(screen.getByTestId('loading').textContent).toBe('true')
    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'))
    expect(screen.getByTestId('user').textContent).toBe('anna@example.de')
  })

  it('keeps the user signed out when me() rejects', async () => {
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    )

    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'))
    expect(screen.getByTestId('user').textContent).toBe('none')
  })

  it('login stores the returned user', async () => {
    vi.mocked(api.login).mockResolvedValue({ user: userA })
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    )

    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'))
    fireEvent.click(screen.getByRole('button', { name: 'login' }))

    await waitFor(() => expect(screen.getByTestId('user').textContent).toBe('anna@example.de'))
    expect(api.login).toHaveBeenCalledWith('anna@example.de', 'geheim123')
  })

  it('logout clears the user', async () => {
    vi.mocked(api.me).mockResolvedValue({ user: userA })
    vi.mocked(api.logout).mockResolvedValue(undefined)
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    )

    await waitFor(() => expect(screen.getByTestId('user').textContent).toBe('anna@example.de'))
    fireEvent.click(screen.getByRole('button', { name: 'logout' }))

    await waitFor(() => expect(screen.getByTestId('user').textContent).toBe('none'))
  })
})

describe('LoginPage', () => {
  it('shows a clear error for wrong credentials', async () => {
    vi.mocked(api.login).mockRejectedValue(new ApiError(401, 'Invalid credentials'))
    renderLogin()

    fireEvent.change(screen.getByLabelText('E-Mail'), { target: { value: 'anna@example.de' } })
    fireEvent.change(screen.getByLabelText('Passwort'), { target: { value: 'falsch' } })
    fireEvent.click(screen.getByRole('button', { name: 'Anmelden' }))

    await waitFor(() => expect(screen.getByRole('alert')).toBeTruthy())
    expect(screen.getByRole('alert').textContent).toBe('E-Mail oder Passwort ist falsch.')
  })

  it('redirects to /wardrobe on success', async () => {
    vi.mocked(api.login).mockResolvedValue({ user: userA })
    renderLogin()

    fireEvent.change(screen.getByLabelText('E-Mail'), { target: { value: 'anna@example.de' } })
    fireEvent.change(screen.getByLabelText('Passwort'), { target: { value: 'geheim123' } })
    fireEvent.click(screen.getByRole('button', { name: 'Anmelden' }))

    await waitFor(() => expect(screen.getByText('wardrobe-marker')).toBeTruthy())
  })
})

describe('RegisterPage', () => {
  it('rejects mismatched passwords before calling the API', async () => {
    renderRegister()

    fireEvent.change(screen.getByLabelText('E-Mail'), { target: { value: 'anna@example.de' } })
    fireEvent.change(screen.getByLabelText('Passwort'), { target: { value: 'geheim123' } })
    fireEvent.change(screen.getByLabelText('Passwort bestätigen'), { target: { value: 'anders' } })
    fireEvent.click(screen.getByRole('button', { name: 'Registrieren' }))

    await waitFor(() => expect(screen.getByRole('alert')).toBeTruthy())
    expect(screen.getByRole('alert').textContent).toBe('Die Passwörter stimmen nicht überein.')
    expect(api.register).not.toHaveBeenCalled()
  })

  it('registers and redirects to /wardrobe on success', async () => {
    vi.mocked(api.register).mockResolvedValue({ user: userA })
    renderRegister()

    fireEvent.change(screen.getByLabelText('E-Mail'), { target: { value: 'anna@example.de' } })
    fireEvent.change(screen.getByLabelText('Passwort'), { target: { value: 'geheim123' } })
    fireEvent.change(screen.getByLabelText('Passwort bestätigen'), { target: { value: 'geheim123' } })
    fireEvent.click(screen.getByRole('button', { name: 'Registrieren' }))

    await waitFor(() => expect(screen.getByText('wardrobe-marker')).toBeTruthy())
  })
})
