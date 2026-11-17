import { NextRequest, NextResponse } from 'next/server'
import { badRequest, serviceUnavailable } from '@/lib/apiResponses'
import { getAppUrl, getAuthServiceUrl } from '@/lib/authService'
import { readJsonObject, readStringField } from '@/lib/requestBody'

export async function POST(request: NextRequest) {
  const body = await readJsonObject(request)
  if (!body) {
    return badRequest('Invalid request.')
  }

  const email = readStringField(body, 'email')
  if (!email) {
    return badRequest('Email is required.')
  }

  const appUrl = getAppUrl()

  try {
    await fetch(getAuthServiceUrl('/api/auth/request-password-reset'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': appUrl,
      },
      body: JSON.stringify({ email, redirectTo: `${appUrl}/reset-password` }),
    })
  } catch {
    return serviceUnavailable('Could not reach the authentication service.')
  }

  // Always report success so the response never reveals whether an email is
  // registered (account-enumeration protection).
  return NextResponse.json({ ok: true })
}
