import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import { authJwks, isAuthDisabled } from '@/lib/auth'

export async function proxy(request: NextRequest) {
  if (isAuthDisabled()) {
    return NextResponse.next()
  }

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

// Static images in public/ skip auth: the header banner shows on the
// signed-out login page, and next/image's optimizer fetches its source
// without the visitor's cookie, so a redirect here breaks every <Image>.
export const config = {
  matcher: [
    '/((?!login|register|_next/static|_next/image|favicon.ico|api/auth|.*\\.(?:jpg|jpeg|png|gif|svg|webp)$).*)',
  ],
}
