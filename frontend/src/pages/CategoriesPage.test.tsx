import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import CategoriesPage from './CategoriesPage'
import { ApiError, createCategory, deleteCategory, listCategories } from '../api'

vi.mock('../api', () => ({
  ApiError: class ApiError extends Error {
    status: number
    constructor(status: number, detail: string) {
      super(detail)
      this.name = 'ApiError'
      this.status = status
    }
  },
  listCategories: vi.fn(),
  createCategory: vi.fn(),
  deleteCategory: vi.fn(),
}))

const mockedListCategories = listCategories as ReturnType<typeof vi.fn>
const mockedCreateCategory = createCategory as ReturnType<typeof vi.fn>
const mockedDeleteCategory = deleteCategory as ReturnType<typeof vi.fn>

afterEach(() => {
  cleanup()
})

describe('CategoriesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows a loading state while categories are being fetched', () => {
    mockedListCategories.mockReturnValue(new Promise(() => {}))
    render(<CategoriesPage />)
    expect(screen.getByText('Lade Kategorien…')).toBeTruthy()
  })

  it('renders the list of categories once loaded', async () => {
    mockedListCategories.mockResolvedValue([
      { id: 1, name: 'Abendgarderobe' },
      { id: 2, name: 'Casual' },
    ])
    render(<CategoriesPage />)
    await waitFor(() => expect(screen.getByText('Abendgarderobe')).toBeTruthy())
    expect(screen.getByText('Casual')).toBeTruthy()
  })

  it('shows an empty state when there are no categories', async () => {
    mockedListCategories.mockResolvedValue([])
    render(<CategoriesPage />)
    await waitFor(() => expect(screen.getByText('Noch keine Kategorien angelegt.')).toBeTruthy())
  })

  it('shows an error state when loading fails', async () => {
    mockedListCategories.mockRejectedValue(new ApiError(401, 'Nicht angemeldet'))
    render(<CategoriesPage />)
    await waitFor(() => expect(screen.getByText('Nicht angemeldet')).toBeTruthy())
  })

  it('creates a category and appends it to the list', async () => {
    mockedListCategories.mockResolvedValue([])
    mockedCreateCategory.mockResolvedValue({ id: 7, name: 'Schuhe' })
    render(<CategoriesPage />)
    await waitFor(() => expect(screen.getByText('Noch keine Kategorien angelegt.')).toBeTruthy())

    fireEvent.change(screen.getByLabelText('Name der Kategorie'), {
      target: { value: 'Schuhe' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Anlegen' }))

    await waitFor(() => expect(mockedCreateCategory).toHaveBeenCalledWith('Schuhe'))
    await waitFor(() => expect(screen.getByText('Schuhe')).toBeTruthy())
  })

  it('deletes a category and removes it from the list', async () => {
    mockedListCategories.mockResolvedValue([{ id: 3, name: 'Accessoires' }])
    mockedDeleteCategory.mockResolvedValue(undefined)
    render(<CategoriesPage />)
    await waitFor(() => expect(screen.getByText('Accessoires')).toBeTruthy())

    fireEvent.click(screen.getByRole('button', { name: 'Löschen' }))

    await waitFor(() => expect(mockedDeleteCategory).toHaveBeenCalledWith(3))
    await waitFor(() =>
      expect(screen.getByText('Noch keine Kategorien angelegt.')).toBeTruthy(),
    )
  })
})
