import { useEffect, useState, type CSSProperties, type FormEvent } from 'react'
import {
  ApiError,
  createCategory,
  deleteCategory,
  listCategories,
  type CategoryOut,
} from '../api'

const cardStyle: CSSProperties = {
  background: 'var(--card-bg)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-lg)',
  padding: 'var(--space-4)',
}

const inputStyle: CSSProperties = {
  minHeight: '44px',
  background: 'var(--card-bg)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-md)',
  padding: '12px 16px',
  color: 'var(--color-fg)',
  fontFamily: 'var(--font-family)',
  fontSize: '1rem',
  width: '100%',
}

const errorAlertStyle: CSSProperties = {
  padding: '12px 16px',
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--color-danger)',
  color: '#e4a0a0',
  background: 'rgba(156, 43, 43, 0.10)',
  marginBottom: 'var(--space-3)',
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<CategoryOut[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  useEffect(() => {
    let active = true
    setLoading(true)
    setLoadError(null)
    listCategories()
      .then((result) => {
        if (active) setCategories(result)
      })
      .catch((err: unknown) => {
        if (!active) return
        setLoadError(
          err instanceof ApiError
            ? err.message
            : 'Kategorien konnten nicht geladen werden.',
        )
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const trimmed = name.trim()
    if (!trimmed || submitting) return
    setSubmitting(true)
    setActionError(null)
    try {
      const created = await createCategory(trimmed)
      setCategories((prev) => [...prev, created])
      setName('')
    } catch (err: unknown) {
      setActionError(
        err instanceof ApiError ? err.message : 'Kategorie konnte nicht angelegt werden.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (deletingId !== null) return
    setDeletingId(id)
    setActionError(null)
    try {
      await deleteCategory(id)
      setCategories((prev) => prev.filter((c) => c.id !== id))
    } catch (err: unknown) {
      setActionError(
        err instanceof ApiError ? err.message : 'Kategorie konnte nicht gelöscht werden.',
      )
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="page">
      <h1>Kategorien</h1>

      {actionError && (
        <div style={errorAlertStyle} role="alert">
          {actionError}
        </div>
      )}

      <section style={{ ...cardStyle, maxWidth: '520px', marginBottom: 'var(--space-5)' }}>
        <h2 style={{ marginTop: 0, marginBottom: 'var(--space-3)' }}>Neue Kategorie</h2>
        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name der Kategorie"
            aria-label="Name der Kategorie"
            style={inputStyle}
          />
          <button type="submit" disabled={submitting || !name.trim()}>
            {submitting ? 'Wird angelegt…' : 'Anlegen'}
          </button>
        </form>
      </section>

      <section>
        <h2>Deine Kategorien</h2>
        {loading && <p style={{ color: 'var(--color-muted)' }}>Lade Kategorien…</p>}
        {loadError && (
          <div style={errorAlertStyle} role="alert">
            {loadError}
          </div>
        )}
        {!loading && !loadError && categories.length === 0 && (
          <p style={{ color: 'var(--color-muted)' }}>Noch keine Kategorien angelegt.</p>
        )}
        {!loading && !loadError && categories.length > 0 && (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            {categories.map((category) => (
              <li
                key={category.id}
                style={{
                  ...cardStyle,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 'var(--space-3)',
                }}
              >
                <span style={{ color: 'var(--color-fg)' }}>{category.name}</span>
                <button
                  type="button"
                  className="danger"
                  onClick={() => handleDelete(category.id)}
                  disabled={deletingId !== null}
                >
                  {deletingId === category.id ? 'Wird gelöscht…' : 'Löschen'}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
