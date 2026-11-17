import type { NextResponse } from 'next/server'

// The one place that knows how the hub's session cookie is set. login,
// guest, logout and proxy.ts all go through here, because a delete() whose
// domain/path differs from the set() clears a different, host-only cookie
// and leaves the real session cookie in place.

const AUTH_COOKIE_NAME = 'auth_token'

// Matches the JWT's expiry in the auth service.
const AUTH_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24

// In production the cookie is shared with every *.wanderingparker.com app;
// locally it stays host-only.
function getAuthCookieDomain(): string | undefined {
  return process.env.NODE_ENV === 'production' ? '.wanderingparker.com' : undefined
}

// Both RequestCookies (proxy.ts) and the cookies() store (server components)
// have this shape.
interface CookieReader {
  get(name: string): { value: string } | undefined
}

export function readAuthToken(cookies: CookieReader): string | undefined {
  return cookies.get(AUTH_COOKIE_NAME)?.value
}

export function setAuthCookie(response: NextResponse, token: string): void {
  response.cookies.set(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    domain: getAuthCookieDomain(),
    maxAge: AUTH_COOKIE_MAX_AGE_SECONDS,
  })
}

export function clearAuthCookie(response: NextResponse): void {
  response.cookies.delete({
    name: AUTH_COOKIE_NAME,
    path: '/',
    domain: getAuthCookieDomain(),
  })
}
