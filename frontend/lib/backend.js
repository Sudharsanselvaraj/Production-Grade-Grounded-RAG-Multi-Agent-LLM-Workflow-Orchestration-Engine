const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'

export async function backendGet(path) {
  const req = await fetch(`${BACKEND_URL}${path}`, { cache: 'no-store', credentials: 'include' })
  if (!req.ok) {
    throw new Error(`backend GET ${path} failed: ${req.status}`)
  }
  return req.json()
}

export async function backendPost(path, body = {}) {
  const res = await fetch(`${BACKEND_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    throw new Error(`backend POST ${path} failed: ${res.status}`)
  }
  return res.json()
}
