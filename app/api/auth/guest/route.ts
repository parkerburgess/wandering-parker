import { NextResponse } from 'next/server'
import { serverError, serviceUnavailable, tooManyRequests } from '@/lib/apiResponses'
import { setAuthCookie } from '@/lib/authCookie'
import { signInWithEmail } from '@/lib/signIn'

// Signs the visitor in as the shared read-only guest. The guest credentials are
// held server-side (env) and never sent to the client — the browser only POSTs
// here with an empty body.
export async function POST() {
  const email = process.env.GUEST_EMAIL
  const password = process.env.GUEST_PASSWORD

  if (!email || !password) {
    return serverError('Guest access is not configured.')
  }

  const result = await signInWithEmail(email, password)

  switch (result.kind) {
    case 'success': {
      const response = NextResponse.json({ ok: true })
      setAuthCookie(response, result.token)
      return response
    }
    case 'rate-limited':
      return tooManyRequests('Guest access is busy right now. Please wait a minute and try again.')
    case 'unavailable':
      return serviceUnavailable('Guest access is temporarily unavailable. Please try again shortly.')
    // The guest account is seeded and pre-verified, so these mean a
    // configuration problem (wrong env credentials), not a visitor mistake.
    case 'invalid-credentials':
    case 'email-not-verified':
      return serverError('Guest sign-in failed.')
  }
}
