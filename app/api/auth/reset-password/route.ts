import { NextRequest, NextResponse } from 'next/server'
import { badRequest, serviceUnavailable } from '@/lib/apiResponses'
import { getAppUrl, getAuthServiceUrl } from '@/lib/authService'
import { readJsonObject, readStringField } from '@/lib/requestBody'

export async function POST(request: NextRequest) {
  const body = await readJsonObject(request)
  if (!body) {
    return badRequest('Invalid request.')
  }

  const token = readStringField(body, 'token')
  const newPassword = readStringField(body, 'newPassword')
  if (!token || !newPassword) {
    return badRequest('A reset token and new password are required.')
  }

  let resetRes: Response
  try {
    resetRes = await fetch(getAuthServiceUrl('/api/auth/reset-password'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': getAppUrl(),
      },
      body: JSON.stringify({ token, newPassword }),
    })
  } catch {
    return serviceUnavailable('Could not reach the authentication service.')
  }

  if (!resetRes.ok) {
    return badRequest('This reset link is invalid or has expired. Please request a new one.')
  }

  return NextResponse.json({ ok: true })
}
