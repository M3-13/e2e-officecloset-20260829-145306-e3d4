import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ApiError,
  deleteItem,
  listCategories,
  listItems,
  type CategoryOut,
  type ItemOut,
} from '../api'
import './WardrobePage.css'

export default function WardrobePage() {
  const [items, setItems] = useState<ItemOut[]>([])
  const [categories, setCategories] = useState<CategoryOut[]>([])
  const [categoryFilter, setCategoryFilter] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refresh, setRefresh] = useState(0)
  const [deleteTarget, setDeleteTarget] = useState<ItemOut | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery.trim()), 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  useEffect(() => {
    listCategories()
      .then(setCategories)
      .catch(() => setCategories([]))
  }, [])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    listItems({
      category_id: categoryFilter === '' ? undefined : Number(categoryFilter),
      q: debouncedQuery === '' ? undefined : debouncedQuery,
    })
      .then((data) => {
        if (cancelled) return
        setItems(data)
        setLoading(false)
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setLoading(false)
        setItems([])
        if (err instanceof ApiError && err.status === 401) {
          setError('unauthorized')
        } else {
          setError(
            err instanceof Error ? err.message : 'Die Garderobe konnte nicht geladen werden.',
          )
        }
      })
    return () => {
      cancelled = true
    }
  }, [categoryFilter, debouncedQuery, refresh])

  const hasActiveFilter = categoryFilter !== '' || debouncedQuery !== ''

  const confirmDelete = async (): Promise<void> => {
    if (!deleteTarget) return
    setDeleting(true)
    setDeleteError(null)
    try {
      await deleteItem(deleteTarget.id)
      setItems((prev) => prev.filter((item) => item.id !== deleteTarget.id))
      setDeleteTarget(null)
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Löschen fehlgeschlagen.')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="page wardrobe-page">
      <header className="wardrobe-header">
        <h1>Garderobe</h1>
        <Link to="/wardrobe/new" className="button-link">
          Anlegen
        </Link>
      </header>

      <div className="wardrobe-toolbar">
        <input
          type="search"
          className="wardrobe-search"
          placeholder="Kleidungsstücke durchsuchen…"
          aria-label="Kleidungsstücke durchsuchen"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
        />
        <select
          className="wardrobe-select"
          aria-label="Nach Kategorie filtern"
          value={categoryFilter}
          onChange={(event) => setCategoryFilter(event.target.value)}
        >
          <option value="">Alle Kategorien</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div className="wardrobe-alert error" role="alert">
          {error === 'unauthorized' ? (
            <>
              Du bist nicht angemeldet. <Link to="/login">Jetzt anmelden</Link>
            </>
          ) : (
            <>
              {error}{' '}
              <button
                type="button"
                className="secondary"
                onClick={() => setRefresh((r) => r + 1)}
              >
                Erneut versuchen
              </button>
            </>
          )}
        </div>
      )}

      {loading && items.length === 0 ? (
        <p className="wardrobe-empty">Wird geladen…</p>
      ) : items.length === 0 ? (
        <div className="wardrobe-empty">
          {hasActiveFilter ? (
            <p>Keine Kleidungsstücke gefunden.</p>
          ) : (
            <>
              <p>Deine Garderobe ist noch leer.</p>
              <Link to="/wardrobe/new" className="button-link">
                Kleidungsstück anlegen
              </Link>
            </>
          )}
        </div>
      ) : (
        <div className="wardrobe-grid">
          {items.map((item) => (
            <WardrobeItemCard
              key={item.id}
              item={item}
              categoryName={categories.find((c) => c.id === item.category_id)?.name}
              onDelete={() => setDeleteTarget(item)}
            />
          ))}
        </div>
      )}

      {deleteTarget && (
        <div className="wardrobe-modal-backdrop" role="dialog" aria-modal="true">
          <div className="wardrobe-modal">
            <h2>Kleidungsstück löschen</h2>
            <p>
              Soll „{deleteTarget.name}“ wirklich gelöscht werden? Dies kann nicht rückgängig
              gemacht werden.
            </p>
            {deleteError && (
              <div className="wardrobe-alert error" role="alert">
                {deleteError}
              </div>
            )}
            <div className="wardrobe-modal-actions">
              <button
                type="button"
                className="secondary"
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
              >
                Abbrechen
              </button>
              <button
                type="button"
                className="danger"
                onClick={confirmDelete}
                disabled={deleting}
              >
                {deleting ? 'Wird gelöscht…' : 'Löschen'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function WardrobeItemCard({
  item,
  categoryName,
  onDelete,
}: {
  item: ItemOut
  categoryName?: string
  onDelete: () => void
}) {
  const [imageFailed, setImageFailed] = useState(false)
  const hasImage = item.image_url != null && !imageFailed

  return (
    <article className="wardrobe-card">
      {hasImage ? (
        <div className="wardrobe-card-image">
          <img
            src={item.image_url ?? undefined}
            alt={item.name}
            onError={() => setImageFailed(true)}
          />
        </div>
      ) : (
        <div className="wardrobe-placeholder">
          <PlaceholderIcon />
          <span>Kein Bild</span>
        </div>
      )}
      <div className="wardrobe-card-body">
        <h3 className="wardrobe-card-name">{item.name}</h3>
        {categoryName && <span className="wardrobe-card-category">{categoryName}</span>}
        {item.description && <p className="wardrobe-card-description">{item.description}</p>}
      </div>
      <div className="wardrobe-card-actions">
        <Link to={`/wardrobe/${item.id}/edit`} className="button-link secondary wardrobe-edit">
          Bearbeiten
        </Link>
        <button
          type="button"
          className="danger"
          onClick={onDelete}
          aria-label={`${item.name} löschen`}
        >
          Löschen
        </button>
      </div>
    </article>
  )
}

function PlaceholderIcon() {
  return (
    <svg
      width="40"
      height="40"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 4a1.75 1.75 0 1 1 1.75 1.75" />
      <path d="M13.75 5.75C12.9 6.3 12 7 11.25 7.9L3.5 13.5A2 2 0 0 0 5 17h14a2 2 0 0 0 1.5-3.5L13 8" />
    </svg>
  )
}
