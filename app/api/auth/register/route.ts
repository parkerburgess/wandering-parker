import { NextRequest, NextResponse } from 'next/server'
import { badRequest } from '@/lib/apiResponses'

export async function POST(request: NextRequest) {
  const { email, password, name, captchaToken } = await request.json()
  if (!email || !password || !name) {
    return badRequest('Name, email, and password are required.')
  }

  const authUrl = process.env.AUTH_SERVICE_URL!
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  // Single signup door: Better Auth creates the user (firing the app-access
  // grant hook) and sends a verification email. The captcha token rides in the
  // x-captcha-response header the plugin expects. No session is issued until the
  // user verifies, so there's no auto sign-in here.
  const signUpRes = await fetch(`${authUrl}/api/auth/sign-up/email`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Origin': appUrl,
      'x-captcha-response': captchaToken ?? '',
    },
    body: JSON.stringify({
      email,
      password,
      name,
      callbackURL: `${appUrl}/login?verified=1`,
    }),
  })

  if (!signUpRes.ok) {
    const data = await signUpRes.json().catch(() => null)
    return badRequest(data?.message ?? 'Registration failed. Please try again.')
  }

  return NextResponse.json({ ok: true })
}
