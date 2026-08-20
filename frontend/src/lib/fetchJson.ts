const BASE = import.meta.env.VITE_API_URL || '/api'

export class ApiError extends Error {
  status?: number
  constructor(message: string, status?: number) {
    super(message)
    this.status = status
  }
}

export async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  let res: Response
  try {
    res = await fetch(`${BASE}${url}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    })
  } catch {
    throw new ApiError('NETWORK_ERROR')
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    const detail = body?.detail
    const message = typeof detail === 'string' ? detail : `API error: ${res.status}`
    throw new ApiError(message, res.status)
  }

  return res.json()
}
