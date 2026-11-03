import { NextRequest, NextResponse } from 'next/server'
import { unauthorized, forbidden, serverError } from '@/lib/apiResponses'

export async function POST(request: NextRequest) {
  const { email, password } = await request.json()
  const authUrl = process.env.AUTH_SERVICE_URL!

  const signInRes = await fetch(`${authUrl}/api/auth/sign-in/email`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Origin': process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
    },
    body: JSON.stringify({ email, password }),
  })

  if (!signInRes.ok) {
    if (signInRes.status === 403) {
      return forbidden('Please verify your email before signing in — we just sent a fresh link.')
    }
    return unauthorized('Invalid email or password.')
  }

  // Extract the session cookie returned by the auth service
  const setCookieHeader = signInRes.headers.get('set-cookie') ?? ''
  const sessionCookiePart = setCookieHeader.split(';')[0]

  const tokenRes = await fetch(`${authUrl}/api/auth/token`, {
    headers: {
      'Cookie': sessionCookiePart,
      'Origin': process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
    },
  })

  if (!tokenRes.ok) {
    return serverError('Sign-in failed. Please try again.')
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
