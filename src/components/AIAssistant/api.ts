const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim() || 'http://localhost:5000'

interface ApiOptions {
  timeoutMs?: number
  retries?: number
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export const buildApiUrl = (path: string): string => {
  const normalized = path.startsWith('/') ? path : `/${path}`
  return `${API_BASE_URL}${normalized}`
}

export async function postJson<T>(path: string, body: unknown, options?: ApiOptions): Promise<T> {
  const timeoutMs = options?.timeoutMs ?? 20000
  const retries = options?.retries ?? 1

  let lastError: Error | null = null

  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)

    try {
      const response = await fetch(buildApiUrl(path), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      })

      const data = (await response.json()) as { error?: string } & T

      if (!response.ok) {
        throw new Error(data.error || `Request failed with status ${response.status}`)
      }

      clearTimeout(timer)
      return data
    } catch (error) {
      clearTimeout(timer)
      const message = error instanceof Error ? error.message : 'Unknown request error'
      lastError = new Error(message)

      if (attempt < retries) {
        await wait(300 * (attempt + 1))
      }
    }
  }

  throw lastError || new Error('Request failed')
}

export async function getJson<T>(path: string, options?: ApiOptions): Promise<T> {
  const timeoutMs = options?.timeoutMs ?? 15000
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(buildApiUrl(path), {
      method: 'GET',
      signal: controller.signal,
    })

    const data = (await response.json()) as { error?: string } & T
    if (!response.ok) {
      throw new Error(data.error || `Request failed with status ${response.status}`)
    }

    clearTimeout(timer)
    return data
  } catch (error) {
    clearTimeout(timer)
    throw error instanceof Error ? error : new Error('Request failed')
  }
}
