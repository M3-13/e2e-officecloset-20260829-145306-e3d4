import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import WardrobePage from './WardrobePage'
import { deleteItem, listCategories, listItems } from '../api'

vi.mock('../api', () => {
  class ApiError extends Error {
    status: number

    constructor(status: number, detail: string) {
      super(detail)
      this.name = 'ApiError'
      this.status = status
    }
  }

  return {
    ApiError,
    listItems: vi.fn(),
    listCategories: vi.fn(),
    deleteItem: vi.fn(),
  }
})

const mockListItems = vi.mocked(listItems)
const mockListCategories = vi.mocked(listCategories)
const mockDeleteItem = vi.mocked(deleteItem)

function renderPage() {
  return render(
    <MemoryRouter>
      <WardrobePage />
    </MemoryRouter>,
  )
}

afterEach(() => {
  cleanup()
})

beforeEach(() => {
  vi.clearAllMocks()
  mockListCategories.mockResolvedValue([
    { id: 1, name: 'Oberteile' },
    { id: 2, name: 'Hosen' },
  ])
  mockListItems.mockResolvedValue([])
  mockDeleteItem.mockResolvedValue(undefined)
})

describe('WardrobePage', () => {
  it('zeigt die eigenen Kleidungsstücke im Raster an', async () => {
    mockListItems.mockResolvedValue([
      { id: 1, name: 'Abendkleid', category_id: 1, description: null, image_url: null },
      { id: 2, name: 'Anzug', category_id: 2, description: 'Schwarz', image_url: '/api/images/anzug.jpg' },
    ])

    renderPage()

    expect(await screen.findByText('Abendkleid')).toBeTruthy()
    expect(screen.getByText('Anzug')).toBeTruthy()
    expect(screen.getAllByText('Oberteile').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Hosen').length).toBeGreaterThan(0)
  })

  it('zeigt einen Leerzustand, wenn keine Kleidungsstücke vorhanden sind', async () => {
    renderPage()

    expect(await screen.findByText(/Garderobe ist noch leer/i)).toBeTruthy()
  })

  it('bietet Suche und Kategorie-Filter an', async () => {
    renderPage()

    expect(screen.getByLabelText('Kleidungsstücke durchsuchen')).toBeTruthy()
    expect(screen.getByLabelText('Nach Kategorie filtern')).toBeTruthy()
  })

  it('ruft listItems mit dem Suchbegriff auf', async () => {
    renderPage()

    fireEvent.change(screen.getByLabelText('Kleidungsstücke durchsuchen'), {
      target: { value: 'Anzug' },
    })

    await waitFor(() => {
      expect(mockListItems).toHaveBeenCalledWith(expect.objectContaining({ q: 'Anzug' }))
    })
  })

  it('ruft listItems mit dem Kategorie-Filter auf', async () => {
    renderPage()

    await screen.findByRole('option', { name: 'Hosen' })
    fireEvent.change(screen.getByLabelText('Nach Kategorie filtern'), {
      target: { value: '2' },
    })

    await waitFor(() => {
      expect(mockListItems).toHaveBeenCalledWith(expect.objectContaining({ category_id: 2 }))
    })
  })

  it('löscht ein Kleidungsstück erst nach Bestätigung', async () => {
    mockListItems.mockResolvedValue([
      { id: 1, name: 'Abendkleid', category_id: 1, description: null, image_url: null },
    ])

    renderPage()

    fireEvent.click(await screen.findByRole('button', { name: 'Abendkleid löschen' }))
    expect(screen.getByText(/wirklich gelöscht/i)).toBeTruthy()
    expect(mockDeleteItem).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: 'Löschen' }))

    await waitFor(() => {
      expect(mockDeleteItem).toHaveBeenCalledWith(1)
    })
  })

  it('verlinkt Anlegen und Bearbeiten', async () => {
    mockListItems.mockResolvedValue([
      { id: 1, name: 'Abendkleid', category_id: 1, description: null, image_url: null },
    ])

    renderPage()

    expect(screen.getByRole('link', { name: 'Anlegen' }).getAttribute('href')).toBe(
      '/wardrobe/new',
    )
    expect(
      (await screen.findByRole('link', { name: 'Bearbeiten' })).getAttribute('href'),
    ).toBe('/wardrobe/1/edit')
  })
})
