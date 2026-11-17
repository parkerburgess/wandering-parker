// Settings for calling the auth service (auth-wandering-parker), read in one
// place instead of in every route.

// Thrown with a clear message instead of building 'undefined/api/...' URLs.
function getAuthServiceBaseUrl(): string {
  const baseUrl = process.env.AUTH_SERVICE_URL
  if (!baseUrl) {
    throw new Error(
      'AUTH_SERVICE_URL is not set. Add it to .env.local (e.g. http://localhost:3001).'
    )
  }
  return baseUrl
}

// e.g. getAuthServiceUrl('/api/auth/jwks')
export function getAuthServiceUrl(path: string): string {
  return `${getAuthServiceBaseUrl()}${path}`
}

// The hub's own public URL. Sent as the Origin header (the auth service
// checks it against its trusted origins) and used to build links in emails.
export function getAppUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
}
