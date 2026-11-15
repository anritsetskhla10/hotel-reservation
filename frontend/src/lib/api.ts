export async function getJson<T>(path: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(path, {
    signal: signal ?? null,
    headers: { Accept: 'application/json' },
  })

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`)
  }

  return response.json()
}

export function postWithCsrf(path: string, data: object): Promise<Response> {
  return sendWithCsrf(path, 'POST', data)
}

export async function sendWithCsrf(
  path: string,
  method: 'POST' | 'PATCH' | 'DELETE',
  data?: object,
): Promise<Response> {
  const { csrfToken } = await getJson<{ csrfToken: string }>('/api/auth/csrf/')
  const isFormData = data instanceof FormData

  return fetch(path, {
    method,
    credentials: 'same-origin',
    headers: {
      Accept: 'application/json',
      ...(data !== undefined && !isFormData ? { 'Content-Type': 'application/json' } : {}),
      'X-CSRFToken': csrfToken,
    },
    body: isFormData ? data : JSON.stringify(data) ?? null,
  })
}
