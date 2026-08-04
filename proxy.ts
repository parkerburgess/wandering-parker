import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import { authJwks } from '@/lib/auth'

export async function proxy(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value

  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  try {
    await jwtVerify(token, authJwks)
    return NextResponse.next()
  } catch {
    const response = NextResponse.redirect(new URL('/login', request.url))
    // Must match the domain/path the cookie was set with (see
    // app/api/auth/login/route.ts) or this clears a different, host-only
    // cookie and leaves the real session cookie in place.
    response.cookies.delete({
      name: 'auth_token',
      path: '/',
      domain: process.env.NODE_ENV === 'production' ? '.wanderingparker.com' : undefined,
    })
    return response
  }
}

export const config = {
  matcher: ['/((?!login|register|_next/static|_next/image|favicon.ico|api/auth).*)'],
}
