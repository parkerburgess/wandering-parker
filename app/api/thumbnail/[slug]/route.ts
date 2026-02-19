import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const SLUG_RE = /^[a-zA-Z0-9_-]+$/
const EXTENSIONS = ['png', 'jpg', 'jpeg', 'webp'] as const
const MIME: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const { slug } = params

  // Path traversal defense
  if (!SLUG_RE.test(slug)) {
    return new NextResponse('Invalid slug', { status: 400 })
  }

  const projectDir = path.join(process.cwd(), 'projects', slug)

  for (const ext of EXTENSIONS) {
    const filePath = path.join(projectDir, `thumbnail.${ext}`)
    if (fs.existsSync(filePath)) {
      const buffer = fs.readFileSync(filePath)
      return new NextResponse(buffer, {
        status: 200,
        headers: {
          'Content-Type': MIME[ext],
          'Cache-Control': 'public, max-age=3600',
          'X-Content-Type-Options': 'nosniff',
        },
      })
    }
  }

  return new NextResponse('Thumbnail not found', { status: 404 })
}
