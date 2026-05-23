import type { PublicListingDTO, AdminListingDTO, ListingStatus } from '@fridge/shared'

const BASE = '/api'

export interface ListingsResponse {
  data: PublicListingDTO[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface ListingsParams {
  buyEnabled?: boolean
  rentEnabled?: boolean
  location?: string
  page?: number
  limit?: number
}

export interface AdminMe {
  id: string
  username: string
  role: string
}

export interface AdminListingsResponse {
  data: AdminListingDTO[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface AdminListingsParams {
  search?: string
  status?: string
  location?: string
  page?: number
  limit?: number
}

export interface ActionHistoryRecord {
  id: string
  listingId: string
  actionType: string
  oldValue: string | null
  newValue: string | null
  note: string | null
  performedBy: string
  createdAt: string
}

export interface ActionHistoryResponse {
  data: ActionHistoryRecord[]
  total: number
  page: number
  limit: number
  totalPages: number
}

async function get<T>(path: string, params?: Record<string, string | number | boolean | undefined>): Promise<T> {
  const url = new URL(path, window.location.origin)
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined) url.searchParams.set(k, String(v))
    }
  }
  const res = await fetch(url.toString(), { credentials: 'same-origin' })
  if (!res.ok) throw new Error(`API ${res.status}: ${path}`)
  return res.json() as Promise<T>
}

async function post<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: body !== undefined ? { 'Content-Type': 'application/json' } : {},
    body: body !== undefined ? JSON.stringify(body) : undefined,
    credentials: 'same-origin',
  })
  if (!res.ok) throw new Error(`API ${res.status}: ${path}`)
  return res.json() as Promise<T>
}

async function patch<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    credentials: 'same-origin',
  })
  if (!res.ok) throw new Error(`API ${res.status}: ${path}`)
  return res.json() as Promise<T>
}

async function del(path: string): Promise<void> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'DELETE',
    credentials: 'same-origin',
  })
  if (!res.ok) throw new Error(`API ${res.status}: ${path}`)
}

async function uploadFile<T>(path: string, file: File): Promise<T> {
  const form = new FormData()
  form.append('file', file)
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    body: form,
    credentials: 'same-origin',
  })
  if (!res.ok) throw new Error(`API ${res.status}: ${path}`)
  return res.json() as Promise<T>
}

export const api = {
  listings: {
    list: (params: ListingsParams) =>
      get<ListingsResponse>(`${BASE}/listings`, {
        buyEnabled: params.buyEnabled,
        rentEnabled: params.rentEnabled,
        location: params.location,
        page: params.page ?? 1,
        limit: params.limit ?? 6,
      }),

    get: (id: string) => get<PublicListingDTO>(`${BASE}/listings/${id}`),

    recommendations: (id: string) => get<PublicListingDTO[]>(`${BASE}/listings/${id}/recommendations`),
  },

  admin: {
    login: (username: string, password: string) =>
      post<{ ok: boolean }>('/admin/login', { username, password }),

    me: () => get<AdminMe>(`${BASE}/admin/me`),

    logout: () => post<{ ok: boolean }>('/admin/logout'),

    listings: {
      list: (params?: AdminListingsParams) =>
        get<AdminListingsResponse>(`${BASE}/admin/listings`, params as Record<string, string | number | boolean | undefined>),

      get: (id: string) => get<AdminListingDTO>(`${BASE}/admin/listings/${id}`),

      create: (data: unknown) => post<AdminListingDTO>('/admin/listings', data),

      update: (id: string, data: unknown) => patch<AdminListingDTO>(`/admin/listings/${id}`, data),

      updateStatus: (id: string, status: ListingStatus) =>
        patch<{ id: string; status: string }>(`/admin/listings/${id}/status`, { status }),

      uploadImage: (id: string, file: File) =>
        uploadFile<AdminListingDTO['images']>(`/admin/listings/${id}/images`, file),

      deleteImage: (listingId: string, imageId: string) =>
        del(`/admin/listings/${listingId}/images/${imageId}`),
    },

    history: {
      list: (listingId: string, page = 1) =>
        get<ActionHistoryResponse>(`${BASE}/admin/action-history`, { listingId, page, limit: 20 }),
    },
  },
}
