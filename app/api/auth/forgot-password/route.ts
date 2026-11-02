import { NextRequest, NextResponse } from 'next/server'
import { badRequest, serverError } from '@/lib/apiResponses'

export async function POST(request: NextRequest) {
  const { email } = await request.json()
  if (!email) {
    return badRequest('Email is required.')
  }

  const authUrl = process.env.AUTH_SERVICE_URL!
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  try {
    await fetch(`${authUrl}/api/auth/request-password-reset`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': appUrl,
      },
      body: JSON.stringify({ email, redirectTo: `${appUrl}/reset-password` }),
    })
  } catch {
    return serverError('Could not reach the authentication service.')
  }

  // Always report success so the response never reveals whether an email is
  // registered (account-enumeration protection).
  return NextResponse.json({ ok: true })
}
