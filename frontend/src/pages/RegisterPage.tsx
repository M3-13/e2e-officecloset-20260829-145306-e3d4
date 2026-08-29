import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ApiError } from '../api'
import { useAuth } from '../context/AuthContext'
import './auth.css'

export default function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)

    if (!email.trim() || !password) {
      setError('Bitte gib deine E-Mail-Adresse und ein Passwort ein.')
      return
    }

    if (password !== confirm) {
      setError('Die Passwörter stimmen nicht überein.')
      return
    }

    setSubmitting(true)
    try {
      await register(email.trim(), password)
      navigate('/wardrobe')
    } catch (err) {
      setError(registerErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="page auth-form">
      <div className="auth-card">
        <h1>Registrieren</h1>
        <p className="auth-subtitle">Tritt dem roten Teppich bei.</p>

        {error ? (
          <div className="auth-alert" role="alert">
            {error}
          </div>
        ) : null}

        <form onSubmit={handleSubmit} noValidate>
          <div className="auth-field">
            <label htmlFor="register-email">E-Mail</label>
            <input
              id="register-email"
              className="auth-input"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="du@beispiel.de"
            />
          </div>

          <div className="auth-field">
            <label htmlFor="register-password">Passwort</label>
            <input
              id="register-password"
              className="auth-input"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
            />
          </div>

          <div className="auth-field">
            <label htmlFor="register-confirm">Passwort bestätigen</label>
            <input
              id="register-confirm"
              className="auth-input"
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(event) => setConfirm(event.target.value)}
              placeholder="••••••••"
            />
          </div>

          <button type="submit" className="auth-submit" disabled={submitting}>
            {submitting ? 'Registrieren…' : 'Registrieren'}
          </button>
        </form>

        <p className="auth-switch">
          Schon ein Konto? <Link to="/login">Anmelden</Link>
        </p>
      </div>
    </div>
  )
}

function registerErrorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.status === 422) {
      return 'Bitte gib eine gültige E-Mail-Adresse und ein Passwort ein.'
    }
    if (err.status === 409) {
      return 'Diese E-Mail-Adresse ist bereits registriert.'
    }
    return err.message
  }
  return 'Registrierung fehlgeschlagen. Bitte versuche es erneut.'
}
