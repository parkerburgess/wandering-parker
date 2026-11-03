import { NextResponse } from 'next/server'
import { serverError } from '@/lib/apiResponses'

// Signs the visitor in as the shared read-only guest. The guest credentials are
// held server-side (env) and never sent to the client — the browser only POSTs
// here with an empty body.
export async function POST() {
  const authUrl = process.env.AUTH_SERVICE_URL!
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const email = process.env.GUEST_EMAIL
  const password = process.env.GUEST_PASSWORD

  if (!email || !password) {
    return serverError('Guest access is not configured.')
  }

  const signInRes = await fetch(`${authUrl}/api/auth/sign-in/email`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Origin': appUrl,
    },
    body: JSON.stringify({ email, password }),
  })

  if (!signInRes.ok) {
    return serverError('Guest sign-in failed.')
  }

  const setCookieHeader = signInRes.headers.get('set-cookie') ?? ''
  const sessionCookiePart = setCookieHeader.split(';')[0]

  const tokenRes = await fetch(`${authUrl}/api/auth/token`, {
    headers: {
      'Cookie': sessionCookiePart,
      'Origin': appUrl,
    },
  })

  if (!tokenRes.ok) {
    return serverError('Guest sign-in failed.')
  }

  const { token } = await tokenRes.json()

  const response = NextResponse.json({ ok: true })
  response.cookies.set('auth_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    domain: process.env.NODE_ENV === 'production' ? '.wanderingparker.com' : undefined,
    maxAge: 60 * 60 * 24 * 7,
  })

  return response
}
