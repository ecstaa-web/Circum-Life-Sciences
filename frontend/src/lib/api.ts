export interface Listing {
  id: number
  title: string
  title_en: string
  description: string
  description_en: string
  console: string
  brand: string
  listing_type: 'sell' | 'buy'
  condition: string
  price: number
  currency: string
  location: string
  image_url: string
  is_collectible: boolean
  is_featured: boolean
  source: string
  owner_id: number | null
  created_at: string
}

export interface Stats {
  total_listings: number
  total_consoles: number
  avg_price: number
  new_today: number
  collectors_items: number
}

export interface Alert {
  id: number
  console: string
  max_price: number
  listing_type: string
  active: boolean
  created_at: string
}

export interface User {
  id: number
  email: string
  name: string
  plan: string
}

const BASE = '/api'

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${url}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  return res.json()
}

export const api = {
  getStats: () => fetchJson<Stats>('/stats'),
  getListings: (params?: Record<string, string | number | boolean | undefined>) => {
    const qs = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== '' && v !== false) qs.set(k, String(v))
      })
    }
    return fetchJson<Listing[]>(`/listings?${qs}`)
  },
  getListing: (id: number) => fetchJson<Listing>(`/listings/${id}`),
  getConsoles: () => fetchJson<{ name: string; count: number }[]>('/consoles'),
  getBrands: () => fetchJson<{ name: string; count: number }[]>('/brands'),
  createListing: (data: Partial<Listing>) =>
    fetchJson<Listing>('/listings', { method: 'POST', body: JSON.stringify(data) }),
  login: (email: string, password: string) =>
    fetchJson<User>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  register: (email: string, password: string, name: string) =>
    fetchJson<User>('/auth/register', { method: 'POST', body: JSON.stringify({ email, password, name }) }),
  getAlerts: () => fetchJson<Alert[]>('/alerts'),
  createAlert: (data: { console: string; max_price: number; listing_type: string }) =>
    fetchJson<Alert>('/alerts', { method: 'POST', body: JSON.stringify(data) }),
  deleteAlert: (id: number) => fetchJson<{ ok: boolean }>(`/alerts/${id}`, { method: 'DELETE' }),
  getWatchlist: () => fetchJson<Listing[]>('/watchlist'),
  addToWatchlist: (listingId: number) =>
    fetchJson<{ ok: boolean }>(`/watchlist/${listingId}`, { method: 'POST' }),
}

export function getLocalizedTitle(listing: Listing, lang: string) {
  return lang === 'en' ? listing.title_en : listing.title
}

export function getLocalizedDescription(listing: Listing, lang: string) {
  return lang === 'en' ? listing.description_en : listing.description
}
