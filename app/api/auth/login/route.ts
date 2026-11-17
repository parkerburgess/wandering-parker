import { NextRequest, NextResponse } from 'next/server'
import {
  badRequest,
  forbidden,
  serviceUnavailable,
  tooManyRequests,
  unauthorized,
} from '@/lib/apiResponses'
import { setAuthCookie } from '@/lib/authCookie'
import { readJsonObject, readStringField } from '@/lib/requestBody'
import { signInWithEmail } from '@/lib/signIn'

export async function POST(request: NextRequest) {
  const body = await readJsonObject(request)
  if (!body) {
    return badRequest('Invalid request.')
  }

  const email = readStringField(body, 'email')
  const password = readStringField(body, 'password')
  if (!email || !password) {
    return badRequest('Email and password are required.')
  }

  const result = await signInWithEmail(email, password)

  switch (result.kind) {
    case 'success': {
      const response = NextResponse.json({ ok: true })
      setAuthCookie(response, result.token)
      return response
    }
    case 'email-not-verified':
      return forbidden('Please verify your email before signing in — we just sent a fresh link.')
    case 'rate-limited':
      return tooManyRequests('Too many sign-in attempts. Please wait a minute and try again.')
    case 'unavailable':
      return serviceUnavailable('Sign-in is temporarily unavailable. Please try again shortly.')
    case 'invalid-credentials':
      return unauthorized('Invalid email or password.')
  }
}
