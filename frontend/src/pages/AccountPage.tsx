import { useState } from 'react'
import type { CSSProperties } from 'react'
import { useNavigate } from 'react-router-dom'
import { deleteAccount } from '../api'
import { useAuth } from '../context/AuthContext'

const cardStyle: CSSProperties = {
  background: 'var(--card-bg)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-lg)',
  padding: 'var(--space-4)',
  marginBottom: 'var(--space-4)',
}

const sectionTitle: CSSProperties = {
  marginTop: 0,
  marginBottom: 'var(--space-3)',
  color: 'var(--color-accent)',
  fontSize: '1.25rem',
}

const dangerCardStyle: CSSProperties = {
  ...cardStyle,
  border: '1px solid var(--color-danger)',
}

const mutedStyle: CSSProperties = { color: 'var(--color-muted)' }

const alertStyle: CSSProperties = {
  padding: 'var(--space-2) var(--space-3)',
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--color-danger)',
  color: '#e4a0a0',
  background: 'rgba(156, 43, 43, 0.10)',
  marginBottom: 'var(--space-3)',
}

const confirmBox: CSSProperties = {
  border: '1px solid var(--color-danger)',
  borderRadius: 'var(--radius-md)',
  padding: 'var(--space-3)',
  marginTop: 'var(--space-3)',
}

const buttonRow: CSSProperties = {
  display: 'flex',
  gap: 'var(--space-2)',
  marginTop: 'var(--space-3)',
}

export default function AccountPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const requestDelete = () => {
    setError(null)
    setConfirming(true)
  }

  const cancelDelete = () => {
    setError(null)
    setConfirming(false)
  }

  const confirmDelete = async () => {
    setDeleting(true)
    setError(null)
    try {
      await deleteAccount()
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Das Konto konnte nicht gelöscht werden. Bitte versuche es erneut.',
      )
      setDeleting(false)
      setConfirming(false)
      return
    }

    try {
      await logout()
    } catch {
      // Nach der Kontolöschung ist die Sitzung serverseitig bereits beendet;
      // ein Fehler hier ist erwartbar und ändert nichts an der Weiterleitung.
    }

    navigate('/login', { replace: true })
  }

  return (
    <div className="page">
      <h1>Konto</h1>

      <section style={cardStyle}>
        <h2 style={sectionTitle}>Kontoübersicht</h2>
        <p style={{ margin: 0 }}>
          Angemeldet als <strong>{user ? user.email : '–'}</strong>
        </p>
      </section>

      <section style={dangerCardStyle}>
        <h2 style={{ ...sectionTitle, color: 'var(--color-fg)' }}>Konto löschen</h2>
        <p style={{ ...mutedStyle, margin: '0 0 var(--space-3)' }}>
          Wenn du dein Konto löschst, werden dein Profil, deine Kategorien,
          Kleidungsstücke, Outfits und alle hochgeladenen Bilder dauerhaft und
          unwiderruflich entfernt.
        </p>

        {error && (
          <p role="alert" style={alertStyle}>
            {error}
          </p>
        )}

        {confirming ? (
          <div style={confirmBox}>
            <p style={{ margin: '0 0 var(--space-2)' }}>
              Bist du sicher, dass du dein Konto endgültig löschen möchtest? Dieser
              Vorgang kann nicht rückgängig gemacht werden.
            </p>
            <div style={buttonRow}>
              <button
                type="button"
                className="danger"
                onClick={confirmDelete}
                disabled={deleting}
              >
                {deleting ? 'Wird gelöscht …' : 'Ja, endgültig löschen'}
              </button>
              <button
                type="button"
                className="secondary"
                onClick={cancelDelete}
                disabled={deleting}
              >
                Abbrechen
              </button>
            </div>
          </div>
        ) : (
          <button type="button" className="danger" onClick={requestDelete}>
            Konto löschen
          </button>
        )}
      </section>
    </div>
  )
}
