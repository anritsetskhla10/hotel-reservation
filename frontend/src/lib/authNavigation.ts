export function getRoomReturnPath(value: string | null): string | null {
  if (!value) return null

  const roomPath = /^\/rooms\/[1-9]\d*(?:\?[^#\\\r\n]*)?$/
  return roomPath.test(value) ? value : null
}

export function buildAuthPath(
  path: '/login' | '/register',
  returnPath: string | null,
): string {
  if (!returnPath) return path

  return `${path}?${new URLSearchParams({ next: returnPath })}`
}