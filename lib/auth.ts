import { createRemoteJWKSet, jwtVerify } from 'jose'

export const authJwks = createRemoteJWKSet(
  new URL(`${process.env.AUTH_SERVICE_URL}/api/auth/jwks`)
)

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

// Verifies the signature itself rather than trusting proxy.ts: the layout
// also renders on the public pages the proxy skips (login, register, ...).
export async function getVerifiedAuthUser(
  token: string | undefined
): Promise<VerifiedAuthUser | undefined> {
  if (isAuthDisabled()) return { name: DEV_USER_NAME }
  if (!token) return undefined

  try {
    const { payload } = await jwtVerify(token, authJwks)
    const email = payload.email as string | undefined
    const name = (payload.name as string) || email
    if (!name) return undefined
    const isGuest = email === process.env.GUEST_EMAIL
    return { name, email: isGuest ? undefined : email }
  } catch {
    return undefined
  }
}
