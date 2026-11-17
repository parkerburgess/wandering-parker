import { NextRequest, NextResponse } from 'next/server'
import { badRequest, serviceUnavailable, tooManyRequests } from '@/lib/apiResponses'
import { getAppUrl, getAuthServiceUrl } from '@/lib/authService'
import { readJsonObject, readStringField } from '@/lib/requestBody'

interface SignUpRequest {
  email: string
  password: string
  name: string
  captchaToken: string
}

// Single signup door: Better Auth creates the user (firing the app-access
// grant hook) and sends a verification email. The captcha token rides in the
// x-captcha-response header the plugin expects. No session is issued until the
// user verifies, so there's no auto sign-in here.
//
// An already-registered email gets the same success reply as a new one:
// requireEmailVerification makes Better Auth answer duplicates generically,
// so this route can't reveal which emails have accounts.
async function requestSignUp(signUp: SignUpRequest): Promise<Response> {
  const appUrl = getAppUrl()
  return fetch(getAuthServiceUrl('/api/auth/sign-up/email'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Origin': appUrl,
      'x-captcha-response': signUp.captchaToken,
    },
    body: JSON.stringify({
      email: signUp.email,
      password: signUp.password,
      name: signUp.name,
      callbackURL: `${appUrl}/login?verified=1`,
    }),
  })
}

// Better Auth's validation messages (password too short, invalid email,
// captcha failed) are safe to show as-is.
async function readUpstreamMessage(response: Response): Promise<string | undefined> {
  const body: unknown = await response.json().catch(() => undefined)
  if (typeof body !== 'object' || body === null || !('message' in body)) {
    return undefined
  }
  const { message } = body
  return typeof message === 'string' ? message : undefined
}

export async function POST(request: NextRequest) {
  const body = await readJsonObject(request)
  if (!body) {
    return badRequest('Invalid request.')
  }

  const email = readStringField(body, 'email')
  const password = readStringField(body, 'password')
  const name = readStringField(body, 'name')
  if (!email || !password || !name) {
    return badRequest('Name, email, and password are required.')
  }
  const captchaToken = readStringField(body, 'captchaToken') ?? ''

  let signUpResponse: Response
  try {
    signUpResponse = await requestSignUp({ email, password, name, captchaToken })
  } catch {
    return serviceUnavailable('Registration is temporarily unavailable. Please try again shortly.')
  }

  if (signUpResponse.status === 429) {
    return tooManyRequests('Too many sign-up attempts. Please wait a minute and try again.')
  }
  if (signUpResponse.status >= 500) {
    return serviceUnavailable('Registration is temporarily unavailable. Please try again shortly.')
  }
  if (!signUpResponse.ok) {
    const upstreamMessage = await readUpstreamMessage(signUpResponse)
    return badRequest(upstreamMessage ?? 'Registration failed. Please try again.')
  }

  return NextResponse.json({ ok: true })
}
