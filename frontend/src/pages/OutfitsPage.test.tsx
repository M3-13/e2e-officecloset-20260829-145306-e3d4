import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { ItemOut, OutfitOut } from '../api'
import OutfitsPage from './OutfitsPage'

afterEach(() => cleanup())

const mocks = vi.hoisted(() => ({
  listItems: vi.fn(),
  listOutfits: vi.fn(),
  createOutfit: vi.fn(),
  deleteOutfit: vi.fn(),
}))

vi.mock('../api', () => mocks)

const sampleItems: ItemOut[] = [
  { id: 1, name: 'Schwarzes Kleid', category_id: 1, description: null, image_url: null },
  { id: 2, name: 'Goldene Schuhe', category_id: 2, description: null, image_url: null },
]

const sampleOutfit: OutfitOut = {
  id: 5,
  name: 'Premieren-Look',
  item_ids: [1],
  items: [sampleItems[0]],
}

beforeEach(() => {
  vi.clearAllMocks()
  mocks.listItems.mockResolvedValue(sampleItems)
  mocks.listOutfits.mockResolvedValue([])
  mocks.createOutfit.mockResolvedValue(sampleOutfit)
  mocks.deleteOutfit.mockResolvedValue(undefined)
})

describe('OutfitsPage', () => {
  it('renders the name field and the available items with thumbnails', async () => {
    render(<OutfitsPage />)

    await waitFor(() => expect(screen.getByLabelText('Name')).toBeTruthy())
    expect(screen.getByText('Schwarzes Kleid')).toBeTruthy()
    expect(screen.getByText('Goldene Schuhe')).toBeTruthy()
    expect(screen.getByText('Outfit speichern')).toBeTruthy()
  })

  it('creates an outfit with the selected items', async () => {
    render(<OutfitsPage />)

    await waitFor(() => expect(screen.getByText('Schwarzes Kleid')).toBeTruthy())

    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Mein Look' } })
    fireEvent.click(screen.getByText('Schwarzes Kleid'))
    fireEvent.click(screen.getByText('Outfit speichern'))

    await waitFor(() => expect(mocks.createOutfit).toHaveBeenCalledWith('Mein Look', [1]))
  })

  it('shows an error when saving without a name', async () => {
    render(<OutfitsPage />)

    await waitFor(() => expect(screen.getByText('Schwarzes Kleid')).toBeTruthy())

    fireEvent.click(screen.getByText('Schwarzes Kleid'))
    fireEvent.click(screen.getByText('Outfit speichern'))

    await waitFor(() =>
      expect(screen.getByText('Bitte gib dem Outfit einen Namen.')).toBeTruthy(),
    )
    expect(mocks.createOutfit).not.toHaveBeenCalled()
  })

  it('displays saved outfits and deletes them', async () => {
    mocks.listOutfits.mockResolvedValue([sampleOutfit])
    render(<OutfitsPage />)

    await waitFor(() => expect(screen.getByText('Premieren-Look')).toBeTruthy())

    fireEvent.click(screen.getByRole('button', { name: 'Löschen' }))

    await waitFor(() => expect(mocks.deleteOutfit).toHaveBeenCalledWith(5))
  })
})
