import { createRemoteJWKSet, jwtVerify } from 'jose'
import type { JWTPayload } from 'jose'
import { getAuthServiceUrl } from './authService'

type AuthJwks = ReturnType<typeof createRemoteJWKSet>

let authJwks: AuthJwks | undefined

// Built on first use, not at import: a missing AUTH_SERVICE_URL then fails
// with a clear error when a token is actually checked, instead of crashing
// every page on load (including with DISABLE_AUTH on). The key set is cached
// for the life of the server instance.
export function getAuthJwks(): AuthJwks {
  authJwks ??= createRemoteJWKSet(new URL(getAuthServiceUrl('/api/auth/jwks')))
  return authJwks
}

const DEV_USER_NAME = 'Dev User (Parker)'

// Same guard as the shared wandering-parker-server package: the bypass can
// never switch on in a production build, whatever the env var says.
export function isAuthDisabled(): boolean {
  return process.env.DISABLE_AUTH === 'true' && process.env.NODE_ENV !== 'production'
}

export interface VerifiedAuthUser {
  name: string
  /** Undefined for the shared Guest account, so forms ask for an address. */
  email?: string
}

// JWT claims are untyped; anything that isn't a non-empty string is ignored.
function readStringClaim(payload: JWTPayload, claim: string): string | undefined {
  const value = payload[claim]
  return typeof value === 'string' && value.length > 0 ? value : undefined
}

// Verifies the signature itself rather than trusting proxy.ts: the layout
// also renders on the public pages the proxy skips (login, register, ...).
export async function getVerifiedAuthUser(
  token: string | undefined
): Promise<VerifiedAuthUser | undefined> {
  if (isAuthDisabled()) return { name: DEV_USER_NAME }
  if (!token) return undefined

  try {
    const { payload } = await jwtVerify(token, getAuthJwks())
    const email = readStringClaim(payload, 'email')
    const name = readStringClaim(payload, 'name') ?? email
    if (!name) return undefined
    const isGuest = email === process.env.GUEST_EMAIL
    return { name, email: isGuest ? undefined : email }
  } catch {
    return undefined
  }
}
