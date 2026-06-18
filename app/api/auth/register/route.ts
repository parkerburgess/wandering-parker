import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const { email, password, name } = await request.json()
  const authUrl = process.env.AUTH_SERVICE_URL!
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  const registerRes = await fetch(`${authUrl}/api/user/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, name }),
  })

  if (!registerRes.ok) {
    const data = await registerRes.json()
    return NextResponse.json({ error: data.error ?? 'Registration failed' }, { status: registerRes.status })
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
    return NextResponse.json({ error: 'Account created but sign-in failed' }, { status: 500 })
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
    return NextResponse.json({ error: 'Account created but token fetch failed' }, { status: 500 })
  }

  const { token } = await tokenRes.json()

  const response = NextResponse.json({ ok: true })
  response.cookies.set('auth_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  })

  return response
}
