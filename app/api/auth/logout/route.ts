import { NextResponse } from 'next/server'

export async function POST() {
  const response = NextResponse.json({ ok: true })
  // Must match the domain/path the cookie was set with (see login/route.ts) —
  // a delete() with no domain clears a different, host-only cookie and
  // leaves the real .wanderingparker.com-scoped session cookie in place.
  response.cookies.delete({
    name: 'auth_token',
    path: '/',
    domain: process.env.NODE_ENV === 'production' ? '.wanderingparker.com' : undefined,
  })
  return response
}
