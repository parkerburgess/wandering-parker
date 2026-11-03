import { NextRequest, NextResponse } from 'next/server'
import { badRequest, serverError } from '@/lib/apiResponses'

export async function POST(request: NextRequest) {
  const { email, password, name } = await request.json()
  if (!email || !password || !name) {
    return badRequest('Name, email, and password are required.')
  }

  const authUrl = process.env.AUTH_SERVICE_URL!
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  // Register through Better Auth's own signup endpoint — the single signup door.
  // Creating the user fires the databaseHooks grant on the auth service, and the
  // response carries the session cookie we exchange for a JWT below.
  const signUpRes = await fetch(`${authUrl}/api/auth/sign-up/email`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Origin': appUrl,
    },
    body: JSON.stringify({ email, password, name }),
  })

  if (!signUpRes.ok) {
    const data = await signUpRes.json().catch(() => null)
    return badRequest(data?.message ?? 'Registration failed. Please try again.')
  }

  const setCookieHeader = signUpRes.headers.get('set-cookie') ?? ''
  const sessionCookiePart = setCookieHeader.split(';')[0]

  const tokenRes = await fetch(`${authUrl}/api/auth/token`, {
    headers: {
      'Cookie': sessionCookiePart,
      'Origin': appUrl,
    },
  })

  if (!tokenRes.ok) {
    return serverError('Account created, but sign-in failed. Try signing in.')
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
