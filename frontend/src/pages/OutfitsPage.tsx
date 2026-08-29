import { useEffect, useState, type CSSProperties, type ReactNode } from 'react'
import {
  createOutfit,
  deleteOutfit,
  listItems,
  listOutfits,
  type ItemOut,
  type OutfitOut,
} from '../api'

const cardStyle: CSSProperties = {
  background: 'var(--card-bg)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-lg)',
  padding: 'var(--space-4)',
}

const outlinedCardStyle: CSSProperties = {
  ...cardStyle,
  borderTop: '2px solid var(--color-accent)',
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

const labelStyle: CSSProperties = {
  display: 'block',
  marginBottom: 'var(--space-1)',
  color: 'var(--color-fg)',
  fontWeight: 600,
}

const sectionTitleStyle: CSSProperties = {
  margin: '0 0 var(--space-1)',
}

const sectionSubtitleStyle: CSSProperties = {
  margin: '0 0 var(--space-4)',
  color: 'var(--color-muted)',
}

const gridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
  gap: 'var(--space-4)',
  alignItems: 'start',
}

const pickerGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
  gap: 'var(--space-2)',
  marginBottom: 'var(--space-4)',
}

function alertStyle(variant: 'error' | 'success'): CSSProperties {
  const palette =
    variant === 'error'
      ? { border: '#9c2b2b', text: '#e4a0a0', bg: 'rgba(156, 43, 43, 0.10)' }
      : { border: 'var(--color-accent)', text: '#9fcb8b', bg: 'rgba(159, 203, 139, 0.10)' }
  return {
    padding: '12px 16px',
    borderRadius: 'var(--radius-md)',
    border: `1px solid ${palette.border}`,
    color: palette.text,
    background: palette.bg,
    marginBottom: 'var(--space-4)',
  }
}

function HangerIcon({ size = 28 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 4a2 2 0 1 1 2 2" />
      <path d="M12 6 4 18a2 2 0 0 0 1.6 3h12.8A2 2 0 0 0 20 18L12 6z" />
    </svg>
  )
}

function Thumbnail({
  item,
  width = 0,
}: {
  item: ItemOut
  width?: number
}) {
  const containerStyle: CSSProperties = {
    aspectRatio: '3 / 4',
    width: width > 0 ? width : '100%',
    borderRadius: 'var(--radius-md)',
    background: '#1a1614',
    border: '1px dashed var(--color-border)',
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--color-accent)',
    flexShrink: 0,
  }

  if (item.image_url) {
    return (
      <img
        src={item.image_url}
        alt={item.name}
        style={{
          aspectRatio: '3 / 4',
          width: width > 0 ? width : '100%',
          borderRadius: 'var(--radius-md)',
          objectFit: 'cover',
          background: '#1a1614',
          flexShrink: 0,
        }}
      />
    )
  }

  return (
    <div style={containerStyle}>
      <span style={{ opacity: 0.4, display: 'flex' }}>
        <HangerIcon />
      </span>
    </div>
  )
}

function toErrorMessage(err: unknown): string {
  if (err instanceof Error && err.message) {
    return err.message
  }
  return 'Unbekannter Fehler'
}

function EmptyState({ children }: { children: ReactNode }) {
  return <p style={{ color: 'var(--color-muted)' }}>{children}</p>
}

export default function OutfitsPage() {
  const [items, setItems] = useState<ItemOut[]>([])
  const [outfits, setOutfits] = useState<OutfitOut[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const [loadedItems, loadedOutfits] = await Promise.all([listItems(), listOutfits()])
        if (!cancelled) {
          setItems(loadedItems)
          setOutfits(loadedOutfits)
        }
      } catch (err) {
        if (!cancelled) {
          setError(toErrorMessage(err))
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  async function reloadOutfits() {
    const loaded = await listOutfits()
    setOutfits(loaded)
  }

  function toggleItem(id: number) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  async function handleSave() {
    const trimmed = name.trim()
    if (!trimmed) {
      setError('Bitte gib dem Outfit einen Namen.')
      setSuccess(null)
      return
    }
    if (selectedIds.size === 0) {
      setError('Bitte wähle mindestens ein Kleidungsstück aus.')
      setSuccess(null)
      return
    }

    setSaving(true)
    setError(null)
    setSuccess(null)
    try {
      await createOutfit(trimmed, Array.from(selectedIds))
      setName('')
      setSelectedIds(new Set())
      await reloadOutfits()
      setSuccess('Outfit gespeichert.')
    } catch (err) {
      setError(toErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: number) {
    setError(null)
    setSuccess(null)
    try {
      await deleteOutfit(id)
      await reloadOutfits()
    } catch (err) {
      setError(toErrorMessage(err))
    }
  }

  return (
    <div className="page">
      <h1>Outfits</h1>

      {error && (
        <div style={alertStyle('error')} role="alert">
          {error}
        </div>
      )}
      {success && (
        <div style={alertStyle('success')} role="status">
          {success}
        </div>
      )}

      {loading ? (
        <EmptyState>Wird geladen …</EmptyState>
      ) : (
        <div style={gridStyle}>
          <section style={outlinedCardStyle}>
            <h2 style={sectionTitleStyle}>Neues Outfit erstellen</h2>
            <p style={sectionSubtitleStyle}>
              Wähle mehrere Kleidungsstücke aus deiner Garderobe und gib dem Outfit einen Namen.
            </p>

            <div style={{ marginBottom: 'var(--space-4)' }}>
              <label htmlFor="outfit-name" style={labelStyle}>
                Name
              </label>
              <input
                id="outfit-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="z. B. Premieren-Look"
                style={inputStyle}
              />
            </div>

            {items.length === 0 ? (
              <EmptyState>
                Noch keine Kleidungsstücke vorhanden. Lege zuerst Kleidungsstücke in deiner
                Garderobe an.
              </EmptyState>
            ) : (
              <div style={pickerGridStyle}>
                {items.map((item) => {
                  const selected = selectedIds.has(item.id)
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => toggleItem(item.id)}
                      aria-pressed={selected}
                      className="secondary"
                      style={{
                        minHeight: 0,
                        padding: 'var(--space-1)',
                        borderRadius: 'var(--radius-md)',
                        border: selected
                          ? '2px solid var(--color-accent)'
                          : '1px solid var(--color-border)',
                        background: selected ? 'rgba(200, 162, 74, 0.12)' : 'transparent',
                        color: 'var(--color-fg)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 'var(--space-1)',
                        textAlign: 'left',
                      }}
                    >
                      <Thumbnail item={item} />
                      <span
                        style={{
                          fontSize: '0.85rem',
                          padding: '0 var(--space-1)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {item.name}
                      </span>
                    </button>
                  )
                })}
              </div>
            )}

            <button
              type="button"
              onClick={handleSave}
              disabled={saving || items.length === 0}
            >
              {saving ? 'Speichern …' : 'Outfit speichern'}
            </button>
          </section>

          <section style={cardStyle}>
            <h2 style={sectionTitleStyle}>Gespeicherte Outfits</h2>
            <p style={sectionSubtitleStyle}>{outfits.length} Outfit(s)</p>

            {outfits.length === 0 ? (
              <EmptyState>Noch keine Outfits gespeichert.</EmptyState>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                {outfits.map((outfit) => (
                  <div
                    key={outfit.id}
                    style={{
                      background: 'var(--card-bg)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-lg)',
                      padding: 'var(--space-3)',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: 'var(--space-2)',
                        marginBottom: 'var(--space-2)',
                      }}
                    >
                      <h3 style={{ margin: 0 }}>{outfit.name}</h3>
                      <button
                        type="button"
                        className="danger"
                        onClick={() => handleDelete(outfit.id)}
                        style={{ minHeight: '36px', padding: '6px 16px' }}
                      >
                        Löschen
                      </button>
                    </div>

                    {outfit.items.length === 0 ? (
                      <EmptyState>Keine Kleidungsstücke enthalten.</EmptyState>
                    ) : (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
                        {outfit.items.map((item) => (
                          <div
                            key={item.id}
                            title={item.name}
                            style={{ width: '72px', textAlign: 'center' }}
                          >
                            <Thumbnail item={item} width={72} />
                            <span
                              style={{
                                display: 'block',
                                fontSize: '0.75rem',
                                color: 'var(--color-muted)',
                                marginTop: 'var(--space-0)',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {item.name}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  )
}
