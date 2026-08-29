import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import ItemFormPage from './ItemFormPage'
import { createItem, getItem, listCategories, updateItem, uploadImage } from '../api'

vi.mock('../api', () => ({
  listCategories: vi.fn(),
  getItem: vi.fn(),
  createItem: vi.fn(),
  updateItem: vi.fn(),
  uploadImage: vi.fn(),
}))

if (typeof URL.createObjectURL !== 'function') {
  URL.createObjectURL = () => 'blob:mock-preview'
}
if (typeof URL.revokeObjectURL !== 'function') {
  URL.revokeObjectURL = () => {}
}

function renderPage(route = '/wardrobe/new') {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <Routes>
        <Route path="/wardrobe/new" element={<ItemFormPage />} />
        <Route path="/wardrobe/:id/edit" element={<ItemFormPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

function fillRequiredFields(name = 'Bluse', category = '1') {
  fireEvent.change(screen.getByLabelText('Name'), { target: { value: name } })
  fireEvent.change(screen.getByLabelText('Kategorie'), { target: { value: category } })
}

describe('ItemFormPage', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    vi.mocked(listCategories).mockResolvedValue([{ id: 1, name: 'Hemd' }])
  })

  afterEach(() => {
    cleanup()
  })

  it('renders the create form with name, category, description and a placeholder instead of a broken image', async () => {
    renderPage()

    expect(screen.getByText('Neues Kleidungsstück')).toBeTruthy()

    await screen.findByText('Hemd')

    expect(screen.getByLabelText('Name')).toBeTruthy()
    expect(screen.getByLabelText('Kategorie')).toBeTruthy()
    expect(screen.getByLabelText('Beschreibung')).toBeTruthy()

    expect(screen.queryByRole('img')).toBeNull()
    expect(screen.getByText('Kein Bild')).toBeTruthy()
  })

  it('uploads the image first and passes image_filename when creating an item', async () => {
    const file = new File(['x'], 'bluse.png', { type: 'image/png' })
    vi.mocked(uploadImage).mockResolvedValue({ filename: 'abc.jpg' })
    vi.mocked(createItem).mockResolvedValue({
      id: 1,
      name: 'Bluse',
      category_id: 1,
      description: null,
      image_url: '/api/images/abc.jpg',
    })

    renderPage()
    await screen.findByText('Hemd')
    fillRequiredFields()

    fireEvent.change(screen.getByTestId('image-input'), { target: { files: [file] } })

    fireEvent.click(screen.getByRole('button', { name: 'Anlegen' }))

    await waitFor(() => expect(uploadImage).toHaveBeenCalledWith(file))
    await waitFor(() =>
      expect(createItem).toHaveBeenCalledWith({
        name: 'Bluse',
        category_id: 1,
        description: undefined,
        image_filename: 'abc.jpg',
      }),
    )
  })

  it('creates an item without an image_filename when no image is chosen', async () => {
    vi.mocked(createItem).mockResolvedValue({
      id: 1,
      name: 'Bluse',
      category_id: 1,
      description: null,
      image_url: null,
    })

    renderPage()
    await screen.findByText('Hemd')
    fillRequiredFields()

    fireEvent.click(screen.getByRole('button', { name: 'Anlegen' }))

    await waitFor(() => expect(createItem).toHaveBeenCalledTimes(1))
    const arg = vi.mocked(createItem).mock.calls[0][0]
    expect(arg.image_filename).toBeUndefined()
    expect(arg.name).toBe('Bluse')
    expect(arg.category_id).toBe(1)
  })

  it('shows an error message when the upload fails', async () => {
    const file = new File(['x'], 'bluse.png', { type: 'image/png' })
    vi.mocked(uploadImage).mockRejectedValue(new Error('Bild zu groß'))
    vi.mocked(createItem).mockResolvedValue({
      id: 1,
      name: 'Bluse',
      category_id: 1,
      description: null,
      image_url: null,
    })

    renderPage()
    await screen.findByText('Hemd')
    fillRequiredFields()
    fireEvent.change(screen.getByTestId('image-input'), { target: { files: [file] } })

    fireEvent.click(screen.getByRole('button', { name: 'Anlegen' }))

    await screen.findByText('Bild zu groß')
    expect(createItem).not.toHaveBeenCalled()
  })

  it('loads an existing item for editing and shows its image', async () => {
    vi.mocked(getItem).mockResolvedValue({
      id: 5,
      name: 'Bluse',
      category_id: 1,
      description: 'Seide',
      image_url: '/api/images/old.jpg',
    })

    renderPage('/wardrobe/5/edit')

    expect(await screen.findByDisplayValue('Bluse')).toBeTruthy()
    expect((screen.getByLabelText('Beschreibung') as HTMLTextAreaElement).value).toBe('Seide')
    expect((screen.getByRole('img') as HTMLImageElement).getAttribute('src')).toBe(
      '/api/images/old.jpg',
    )
  })

  it('updates an existing item and preserves the image when no new file is chosen', async () => {
    vi.mocked(getItem).mockResolvedValue({
      id: 5,
      name: 'Bluse',
      category_id: 1,
      description: 'Seide',
      image_url: '/api/images/old.jpg',
    })
    vi.mocked(updateItem).mockResolvedValue({
      id: 5,
      name: 'Bluse',
      category_id: 1,
      description: 'Seide',
      image_url: '/api/images/old.jpg',
    })

    renderPage('/wardrobe/5/edit')
    await screen.findByDisplayValue('Bluse')

    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Bluse neu' } })
    fireEvent.click(screen.getByRole('button', { name: 'Speichern' }))

    await waitFor(() => expect(updateItem).toHaveBeenCalledTimes(1))
    const arg = vi.mocked(updateItem).mock.calls[0][0]
    expect(arg).toBe(5)
    const payload = vi.mocked(updateItem).mock.calls[0][1]
    expect(payload.name).toBe('Bluse neu')
    expect(payload.image_filename).toBeUndefined()
    expect(uploadImage).not.toHaveBeenCalled()
  })

  it('shows validation errors and does not save when name or category are missing', async () => {
    renderPage()
    await screen.findByText('Hemd')

    fireEvent.click(screen.getByRole('button', { name: 'Anlegen' }))

    await screen.findByText('Name ist erforderlich.')
    await screen.findByText('Bitte eine Kategorie wählen.')
    expect(createItem).not.toHaveBeenCalled()
  })
})
