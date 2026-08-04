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
    response.cookies.delete('auth_token')
    return response
  }
}

export const config = {
  matcher: ['/((?!login|register|_next/static|_next/image|favicon.ico|api/auth).*)'],
}
