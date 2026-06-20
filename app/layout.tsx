import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import { decodeJwt } from 'jose'
import './globals.css'
import Header from './_components/Header'

export const metadata: Metadata = {
  title: 'WanderingParker',
  description: 'A collection of interactive projects and experiments.',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth_token')?.value
  let userName: string | undefined
  if (token) {
    try {
      const payload = decodeJwt(token)
      userName = (payload.name as string) || (payload.email as string) || undefined
    } catch {
      // token malformed — show nothing
    }
  }

  return (
    <html lang="en">
      <body className="min-h-screen bg-background text-text-primary">
        <Header userName={userName} />
        <main className="max-w-6xl mx-auto px-4 py-8">{children}</main>
      </body>
    </html>
  )
}
