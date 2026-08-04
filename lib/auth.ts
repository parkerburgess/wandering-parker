import { createRemoteJWKSet, jwtVerify } from 'jose'

export const authJwks = createRemoteJWKSet(
  new URL(`${process.env.AUTH_SERVICE_URL}/api/auth/jwks`)
)

export async function getVerifiedAuthName(
  token: string | undefined
): Promise<string | undefined> {
  if (!token) return undefined

  try {
    const { payload } = await jwtVerify(token, authJwks)
    return (payload.name as string) || (payload.email as string) || undefined
  } catch {
    return undefined
  }
}
