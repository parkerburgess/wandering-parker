import { getAppUrl, getAuthServiceUrl } from './authService'

// The two-step email sign-in shared by /api/auth/login and /api/auth/guest:
//   1. POST /sign-in/email  -> Better Auth replies with a session cookie
//   2. GET  /token          -> trade that session for the JWT the hub stores
//
// The outcome is returned as a result type rather than an HTTP response so
// each route can word its own messages.

export type SignInResult =
  | { kind: 'success'; token: string }
  | { kind: 'invalid-credentials' }
  | { kind: 'email-not-verified' }
  | { kind: 'rate-limited' }
  // The auth service is unreachable, erroring, or replied in an unexpected way.
  | { kind: 'unavailable' }

// Better Auth names the cookie 'better-auth.session_token', with a
// '__Secure-' prefix when served over https, so match on the ending.
const SESSION_COOKIE_SUFFIX = 'better-auth.session_token'

// Returns the 'name=value' part of the session cookie, or undefined.
// getSetCookie() keeps each Set-Cookie header separate; headers.get() would
// join them all into one comma-separated string.
function findSessionCookie(response: Response): string | undefined {
  for (const setCookieHeader of response.headers.getSetCookie()) {
    const nameValuePair = setCookieHeader.split(';')[0].trim()
    const cookieName = nameValuePair.split('=')[0]
    if (cookieName.endsWith(SESSION_COOKIE_SUFFIX)) {
      return nameValuePair
    }
  }
  return undefined
}

function signInFailure(status: number): SignInResult {
  if (status === 403) return { kind: 'email-not-verified' }
  if (status === 429) return { kind: 'rate-limited' }
  if (status >= 500) return { kind: 'unavailable' }
  // Remaining 4xx: wrong password, unknown email, malformed email.
  return { kind: 'invalid-credentials' }
}

async function readToken(tokenResponse: Response): Promise<string | undefined> {
  const body: unknown = await tokenResponse.json().catch(() => undefined)
  if (typeof body !== 'object' || body === null || !('token' in body)) {
    return undefined
  }
  const { token } = body
  return typeof token === 'string' && token.length > 0 ? token : undefined
}

async function requestSession(email: string, password: string): Promise<Response> {
  return fetch(getAuthServiceUrl('/api/auth/sign-in/email'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Origin': getAppUrl(),
    },
    body: JSON.stringify({ email, password }),
  })
}

async function requestToken(sessionCookie: string): Promise<Response> {
  return fetch(getAuthServiceUrl('/api/auth/token'), {
    headers: {
      'Cookie': sessionCookie,
      'Origin': getAppUrl(),
    },
  })
}

export async function signInWithEmail(
  email: string,
  password: string
): Promise<SignInResult> {
  try {
    const sessionResponse = await requestSession(email, password)
    if (!sessionResponse.ok) return signInFailure(sessionResponse.status)

    const sessionCookie = findSessionCookie(sessionResponse)
    if (!sessionCookie) return { kind: 'unavailable' }

    const tokenResponse = await requestToken(sessionCookie)
    if (!tokenResponse.ok) return { kind: 'unavailable' }

    const token = await readToken(tokenResponse)
    if (!token) return { kind: 'unavailable' }

    return { kind: 'success', token }
  } catch {
    // fetch throws when the auth service can't be reached at all.
    return { kind: 'unavailable' }
  }
}
