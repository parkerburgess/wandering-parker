import { NextResponse } from 'next/server'
import { clearAuthCookie } from '@/lib/authCookie'

// Signs the visitor out of the hub by clearing the cookie. The JWT itself is
// stateless, so a copy of it stays valid until it expires (1 day) — there's
// no server-side revocation list. Accepted for now (review #36, C7).
export async function POST() {
  const response = NextResponse.json({ ok: true })
  clearAuthCookie(response)
  return response
}
