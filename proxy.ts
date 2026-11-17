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
    return NextResponse.redirect(buildLoginUrl(request))
  }

  try {
    await jwtVerify(token, getAuthJwks())
    return NextResponse.next()
  } catch {
    const response = NextResponse.redirect(buildLoginUrl(request))
    clearAuthCookie(response)
    return response
  }
}

// Sends the visitor back to the page they asked for after sign-in. The login
// page re-checks return_url with getSafeReturnUrl before using it.
function buildLoginUrl(request: NextRequest): URL {
  const loginUrl = new URL('/login', request.url)
  const requestedPath = `${request.nextUrl.pathname}${request.nextUrl.search}`
  if (requestedPath !== '/') {
    loginUrl.searchParams.set('return_url', requestedPath)
  }
  return loginUrl
}

// Public pages and the auth API skip the proxy. Each is matched as a whole
// path segment ((?:/|$)), so /login and /login/... skip but /loginx doesn't.
// Static images in public/ also skip auth: the header banner shows on the
// signed-out login page, and next/image's optimizer fetches its source
// without the visitor's cookie, so a redirect here breaks every <Image>.
export const config = {
  matcher: [
    '/((?!(?:login|register|forgot-password|reset-password|api/auth)(?:/|$)|_next/static|_next/image|favicon.ico|.*\\.(?:jpg|jpeg|png|gif|svg|webp)$).*)',
  ],
}
