import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ApiError } from '../api'
import { useAuth } from '../context/AuthContext'
import './auth.css'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)

    if (!email.trim() || !password) {
      setError('Bitte gib deine E-Mail-Adresse und dein Passwort ein.')
      return
    }

    setSubmitting(true)
    try {
      await login(email.trim(), password)
      navigate('/wardrobe')
    } catch (err) {
      setError(loginErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="page auth-form">
      <div className="auth-card">
        <h1>Anmelden</h1>
        <p className="auth-subtitle">Willkommen zurück auf dem roten Teppich.</p>

        {error ? (
          <div className="auth-alert" role="alert">
            {error}
          </div>
        ) : null}

        <form onSubmit={handleSubmit} noValidate>
          <div className="auth-field">
            <label htmlFor="login-email">E-Mail</label>
            <input
              id="login-email"
              className="auth-input"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="du@beispiel.de"
            />
          </div>

          <div className="auth-field">
            <label htmlFor="login-password">Passwort</label>
            <input
              id="login-password"
              className="auth-input"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
            />
          </div>

          <button type="submit" className="auth-submit" disabled={submitting}>
            {submitting ? 'Anmelden…' : 'Anmelden'}
          </button>
        </form>

        <p className="auth-switch">
          Noch kein Konto? <Link to="/register">Registrieren</Link>
        </p>
      </div>
    </div>
  )
}

function loginErrorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.status === 401) {
      return 'E-Mail oder Passwort ist falsch.'
    }
    if (err.status === 422) {
      return 'Bitte gib eine gültige E-Mail-Adresse und ein Passwort ein.'
    }
    return err.message
  }
  return 'Anmeldung fehlgeschlagen. Bitte versuche es erneut.'
}
