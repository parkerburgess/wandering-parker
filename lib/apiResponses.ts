import { NextResponse } from 'next/server'

// Named helpers so route handlers never inline error-response construction.
export function badRequest(error: string) {
  return NextResponse.json({ error }, { status: 400 })
}

export function unprocessable(error: string) {
  return NextResponse.json({ error }, { status: 422 })
}

export function unauthorized(error: string) {
  return NextResponse.json({ error }, { status: 401 })
}

export function forbidden(error: string) {
  return NextResponse.json({ error }, { status: 403 })
}

export function serverError(error = 'Something went wrong. Please try again.') {
  return NextResponse.json({ error }, { status: 500 })
}
