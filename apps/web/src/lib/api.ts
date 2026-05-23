import type { PublicListingDTO } from '@fridge/shared'

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
  },
}
