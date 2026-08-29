import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import type { ChangeEvent, FormEvent } from 'react'
import {
  createItem,
  getItem,
  listCategories,
  updateItem,
  uploadImage,
} from '../api'
import type { CategoryOut } from '../api'

const MAX_IMAGE_BYTES = 5 * 1024 * 1024
const NAVIGATE_DELAY_MS = 1500

const CSS = `
.item-form {
  max-width: 520px;
  margin: 0 auto;
}
.item-form-card {
  background: #141112;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}
.item-form-field {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}
.item-form-label {
  font-size: 0.95rem;
  color: var(--color-fg);
  font-weight: 600;
}
.item-form-input,
.item-form-select,
.item-form-textarea {
  min-height: 44px;
  background: #141112;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--space-2) var(--space-3);
  color: var(--color-fg);
  font-family: var(--font-family);
  font-size: 1rem;
  width: 100%;
}
.item-form-input::placeholder,
.item-form-textarea::placeholder {
  color: var(--color-muted);
}
.item-form-input:focus,
.item-form-select:focus,
.item-form-textarea:focus {
  outline: none;
  border-color: var(--color-accent);
  box-shadow: 0 0 0 3px rgba(200, 162, 74, 0.25);
}
.item-form-input.item-form-error,
.item-form-select.item-form-error {
  border-color: var(--color-danger);
}
.item-form-textarea {
  min-height: 96px;
  resize: vertical;
}
.item-form-field-error {
  font-size: 0.85rem;
  color: var(--color-danger);
}
.item-form-image-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
}
.item-form-preview {
  width: 100%;
  max-width: 260px;
  aspect-ratio: 3 / 4;
  object-fit: cover;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  background: #1a1614;
}
.item-form-placeholder {
  width: 100%;
  max-width: 260px;
  aspect-ratio: 3 / 4;
  border-radius: var(--radius-md);
  background: #1a1614;
  border: 1px dashed var(--color-border);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  color: var(--color-muted);
  text-align: center;
  padding: var(--space-3);
}
.item-form-placeholder svg {
  width: 48px;
  height: 48px;
  color: var(--color-accent);
  opacity: 0.4;
}
.item-form-actions {
  display: flex;
  gap: var(--space-2);
  margin-top: var(--space-1);
}
.item-form-actions button {
  flex: 1;
}
.item-form-alert {
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-md);
  border: 1px solid;
  font-size: 0.95rem;
}
.item-form-alert.item-form-alert-error {
  border-color: #9c2b2b;
  color: #e4a0a0;
  background: rgba(156, 43, 43, 0.1);
}
.item-form-alert.item-form-alert-success {
  border-color: var(--color-accent);
  color: #9fcb8b;
  background: rgba(159, 203, 139, 0.1);
}
.item-form-empty {
  text-align: center;
  padding: var(--space-4);
  color: var(--color-muted);
}
`

function HangerIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        d="M21.6 18.2 13 11.75v-.91a3.496 3.496 0 0 0-.18-6.75A3.51 3.51 0 0 0 8.5 7.5h2c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5c0 .84-.69 1.52-1.53 1.5-.54-.01-.97.45-.97.99v1.76L2.4 18.2c-.77.66-.85 1.8-.19 2.57.66.77 1.8.85 2.57.19l7.22-5.55 7.22 5.55c.77.66 1.91.58 2.57-.19.66-.77.42-1.91-.19-2.57z"
        fill="currentColor"
      />
    </svg>
  )
}

function messageOf(err: unknown): string {
  if (err instanceof Error) {
    return err.message
  }
  return 'Unbekannter Fehler'
}

export default function ItemFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = id !== undefined

  const [name, setName] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [description, setDescription] = useState('')
  const [categories, setCategories] = useState<CategoryOut[]>([])
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<{ name?: string; category?: string }>({})

  const fileInputRef = useRef<HTMLInputElement>(null)
  const previewUrlRef = useRef<string | null>(null)
  const navigateTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setLoadError(null)
      try {
        const cats = await listCategories()
        if (cancelled) return
        setCategories(cats)

        if (isEdit) {
          const item = await getItem(Number(id))
          if (cancelled) return
          setName(item.name)
          setCategoryId(String(item.category_id))
          setDescription(item.description ?? '')
          setExistingImageUrl(item.image_url)
        }
      } catch (err) {
        if (!cancelled) {
          setLoadError(messageOf(err))
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [id, isEdit])

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current)
      }
      if (navigateTimeoutRef.current) {
        clearTimeout(navigateTimeoutRef.current)
      }
    }
  }, [])

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0] ?? null
    if (selected && selected.size > MAX_IMAGE_BYTES) {
      e.target.value = ''
      setError('Das Bild darf maximal 5 MB groß sein.')
      return
    }
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current)
    }
    const url = selected ? URL.createObjectURL(selected) : null
    previewUrlRef.current = url
    setFile(selected)
    setPreviewUrl(url)
    setError(null)
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()

    const trimmedName = name.trim()
    const nextFieldErrors: { name?: string; category?: string } = {}
    if (!trimmedName) {
      nextFieldErrors.name = 'Name ist erforderlich.'
    }
    if (!categoryId) {
      nextFieldErrors.category = 'Bitte eine Kategorie wählen.'
    }
    setFieldErrors(nextFieldErrors)
    if (nextFieldErrors.name || nextFieldErrors.category) {
      return
    }

    setSaving(true)
    setError(null)
    setSuccess(null)
    try {
      let imageFilename: string | undefined
      if (file) {
        const upload = await uploadImage(file)
        imageFilename = upload.filename
      }

      const descriptionValue = description.trim() || undefined
      const payload = {
        name: trimmedName,
        category_id: Number(categoryId),
        description: descriptionValue,
        ...(imageFilename ? { image_filename: imageFilename } : {}),
      }

      if (isEdit) {
        await updateItem(Number(id), payload)
        setSuccess('Kleidungsstück gespeichert.')
      } else {
        await createItem(payload)
        setSuccess('Kleidungsstück angelegt.')
      }

      navigateTimeoutRef.current = setTimeout(() => {
        navigate('/wardrobe')
      }, NAVIGATE_DELAY_MS)
    } catch (err) {
      setError(messageOf(err))
    } finally {
      setSaving(false)
    }
  }

  const imageSrc = previewUrl ?? existingImageUrl
  const hasCategories = categories.length > 0

  return (
    <div className="page">
      <h1>{isEdit ? 'Kleidungsstück bearbeiten' : 'Neues Kleidungsstück'}</h1>
      <div className="item-form">
        <style>{CSS}</style>

        {loading ? (
          <p className="item-form-empty">Lädt…</p>
        ) : loadError ? (
          <div className="item-form-card">
            <div className="item-form-alert item-form-alert-error">{loadError}</div>
            <div className="item-form-actions">
              <button type="button" className="secondary" onClick={() => navigate('/wardrobe')}>
                Zurück zur Garderobe
              </button>
            </div>
          </div>
        ) : !hasCategories ? (
          <div className="item-form-card">
            <p className="item-form-empty">
              Du brauchst mindestens eine Kategorie, bevor du ein Kleidungsstück anlegen kannst.
            </p>
            <div className="item-form-actions">
              <button type="button" className="secondary" onClick={() => navigate('/categories')}>
                Kategorien verwalten
              </button>
            </div>
          </div>
        ) : (
          <form className="item-form-card" onSubmit={handleSubmit} noValidate>
            <div className="item-form-field">
              <label className="item-form-label" htmlFor="item-name">
                Name
              </label>
              <input
                id="item-name"
                type="text"
                className={`item-form-input${fieldErrors.name ? ' item-form-error' : ''}`}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="z. B. Schwarze Abendrobe"
              />
              {fieldErrors.name ? (
                <span className="item-form-field-error">{fieldErrors.name}</span>
              ) : null}
            </div>

            <div className="item-form-field">
              <label className="item-form-label" htmlFor="item-category">
                Kategorie
              </label>
              <select
                id="item-category"
                className={`item-form-select${fieldErrors.category ? ' item-form-error' : ''}`}
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
              >
                <option value="" disabled>
                  Kategorie wählen…
                </option>
                {categories.map((cat) => (
                  <option key={cat.id} value={String(cat.id)}>
                    {cat.name}
                  </option>
                ))}
              </select>
              {fieldErrors.category ? (
                <span className="item-form-field-error">{fieldErrors.category}</span>
              ) : null}
            </div>

            <div className="item-form-field">
              <label className="item-form-label" htmlFor="item-description">
                Beschreibung
              </label>
              <textarea
                id="item-description"
                className="item-form-textarea"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional"
              />
            </div>

            <div className="item-form-field">
              <span className="item-form-label">Bild</span>
              <div className="item-form-image-area">
                {imageSrc ? (
                  <img className="item-form-preview" src={imageSrc} alt="Vorschau" />
                ) : (
                  <div className="item-form-placeholder">
                    <HangerIcon />
                    <span>Kein Bild</span>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  data-testid="image-input"
                  style={{ display: 'none' }}
                />
                <button
                  type="button"
                  className="secondary"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {imageSrc ? 'Anderes Bild wählen' : 'Bild auswählen'}
                </button>
              </div>
            </div>

            {error ? <div className="item-form-alert item-form-alert-error">{error}</div> : null}
            {success ? (
              <div className="item-form-alert item-form-alert-success">{success}</div>
            ) : null}

            <div className="item-form-actions">
              <button type="submit" disabled={saving}>
                {saving ? 'Speichert…' : isEdit ? 'Speichern' : 'Anlegen'}
              </button>
              <button
                type="button"
                className="secondary"
                onClick={() => navigate('/wardrobe')}
                disabled={saving}
              >
                Abbrechen
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
