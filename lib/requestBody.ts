// Reading JSON request bodies in route handlers. request.json() throws on a
// malformed or empty body, and its result is untyped; these helpers turn
// both into a plain undefined so the route can answer 400.

export type JsonObject = Record<string, unknown>

export async function readJsonObject(request: Request): Promise<JsonObject | undefined> {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return undefined
  }

  const isObject = typeof body === 'object' && body !== null && !Array.isArray(body)
  return isObject ? (body as JsonObject) : undefined
}

// A non-empty string field, or undefined.
export function readStringField(body: JsonObject, field: string): string | undefined {
  const value = body[field]
  return typeof value === 'string' && value.length > 0 ? value : undefined
}
