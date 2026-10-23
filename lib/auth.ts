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

export async function getVerifiedAuthName(
  token: string | undefined
): Promise<string | undefined> {
  if (isAuthDisabled()) return DEV_USER_NAME
  if (!token) return undefined

  try {
    const { payload } = await jwtVerify(token, authJwks)
    return (payload.name as string) || (payload.email as string) || undefined
  } catch {
    return undefined
  }
}
