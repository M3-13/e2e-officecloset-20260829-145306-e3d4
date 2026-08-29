const BASE_URL: string = import.meta.env.VITE_API_BASE_URL ?? '/api'

export interface UserOut {
  id: number
  email: string
}

export interface CategoryOut {
  id: number
  name: string
}

export interface ItemOut {
  id: number
  name: string
  category_id: number
  description: string | null
  image_url: string | null
}

export interface OutfitOut {
  id: number
  name: string
  item_ids: number[]
  items: ItemOut[]
}

export class ApiError extends Error {
  status: number

  constructor(status: number, detail: string) {
    super(detail)
    this.name = 'ApiError'
    this.status = status
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    ...((init.headers as Record<string, string> | undefined) ?? {}),
  }
  if (init.body && !(init.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json'
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    credentials: 'include',
    ...init,
    headers,
  })

  if (res.status === 204) {
    return undefined as T
  }

  if (!res.ok) {
    let detail = res.statusText
    try {
      const body = await res.json()
      if (body && typeof body.detail === 'string') {
        detail = body.detail
      }
    } catch {
      // non-JSON error body — keep statusText
    }
    throw new ApiError(res.status, detail)
  }

  return (await res.json()) as T
}

export function imageUrl(filename: string): string {
  return `${BASE_URL}/images/${filename}`
}

export async function health(): Promise<{ status: string }> {
  return request<{ status: string }>('/health')
}

export async function register(email: string, password: string): Promise<{ user: UserOut }> {
  return request<{ user: UserOut }>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
}

export async function login(email: string, password: string): Promise<{ user: UserOut }> {
  return request<{ user: UserOut }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
}

export async function logout(): Promise<void> {
  return request<void>('/auth/logout', { method: 'POST' })
}

export async function me(): Promise<{ user: UserOut }> {
  return request<{ user: UserOut }>('/auth/me')
}

export async function listCategories(): Promise<CategoryOut[]> {
  return request<CategoryOut[]>('/categories')
}

export async function createCategory(name: string): Promise<CategoryOut> {
  return request<CategoryOut>('/categories', {
    method: 'POST',
    body: JSON.stringify({ name }),
  })
}

export async function deleteCategory(id: number): Promise<void> {
  return request<void>(`/categories/${id}`, { method: 'DELETE' })
}

export interface ListItemsParams {
  category_id?: number
  q?: string
}

export async function listItems(params: ListItemsParams = {}): Promise<ItemOut[]> {
  const search = new URLSearchParams()
  if (params.category_id != null) {
    search.set('category_id', String(params.category_id))
  }
  if (params.q) {
    search.set('q', params.q)
  }
  const qs = search.toString()
  return request<ItemOut[]>(`/items${qs ? `?${qs}` : ''}`)
}

export interface ItemInput {
  name: string
  category_id: number
  description?: string
  image_filename?: string
}

export async function createItem(input: ItemInput): Promise<ItemOut> {
  return request<ItemOut>('/items', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export async function getItem(id: number): Promise<ItemOut> {
  return request<ItemOut>(`/items/${id}`)
}

export async function updateItem(id: number, input: Partial<ItemInput>): Promise<ItemOut> {
  return request<ItemOut>(`/items/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  })
}

export async function deleteItem(id: number): Promise<void> {
  return request<void>(`/items/${id}`, { method: 'DELETE' })
}

export async function uploadImage(file: File): Promise<{ filename: string }> {
  const form = new FormData()
  form.append('file', file)
  return request<{ filename: string }>('/images', {
    method: 'POST',
    body: form,
  })
}

export async function listOutfits(): Promise<OutfitOut[]> {
  return request<OutfitOut[]>('/outfits')
}

export async function createOutfit(name: string, item_ids: number[]): Promise<OutfitOut> {
  return request<OutfitOut>('/outfits', {
    method: 'POST',
    body: JSON.stringify({ name, item_ids }),
  })
}

export async function deleteOutfit(id: number): Promise<void> {
  return request<void>(`/outfits/${id}`, { method: 'DELETE' })
}

export async function deleteAccount(): Promise<void> {
  return request<void>('/account', { method: 'DELETE' })
}
