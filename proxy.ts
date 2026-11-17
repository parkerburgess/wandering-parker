import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import { getAuthJwks, isAuthDisabled } from '@/lib/auth'
import { clearAuthCookie, readAuthToken } from '@/lib/authCookie'

export async function proxy(request: NextRequest) {
  if (isAuthDisabled()) {
    return NextResponse.next()
  }

  const token = readAuthToken(request.cookies)

  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  try {
    await jwtVerify(token, getAuthJwks())
    return NextResponse.next()
  } catch {
    const response = NextResponse.redirect(new URL('/login', request.url))
    clearAuthCookie(response)
    return response
  }
}

// Static images in public/ skip auth: the header banner shows on the
// signed-out login page, and next/image's optimizer fetches its source
// without the visitor's cookie, so a redirect here breaks every <Image>.
export const config = {
  matcher: [
    '/((?!login|register|forgot-password|reset-password|_next/static|_next/image|favicon.ico|api/auth|.*\\.(?:jpg|jpeg|png|gif|svg|webp)$).*)',
  ],
}
