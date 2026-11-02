import { NextRequest, NextResponse } from 'next/server'
import { badRequest, serverError } from '@/lib/apiResponses'

export async function POST(request: NextRequest) {
  const { token, newPassword } = await request.json()
  if (!token || !newPassword) {
    return badRequest('A reset token and new password are required.')
  }

  const authUrl = process.env.AUTH_SERVICE_URL!
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  let resetRes: Response
  try {
    resetRes = await fetch(`${authUrl}/api/auth/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': appUrl,
      },
      body: JSON.stringify({ token, newPassword }),
    })
  } catch {
    return serverError('Could not reach the authentication service.')
  }

  if (!resetRes.ok) {
    return badRequest('This reset link is invalid or has expired. Please request a new one.')
  }

  return NextResponse.json({ ok: true })
}
