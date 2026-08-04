import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import './globals.css'
import Header from './_components/Header'
import { getVerifiedAuthName } from '@/lib/auth'

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
  const userName = await getVerifiedAuthName(token)

  return (
    <html lang="en">
      <body className="min-h-screen bg-background text-text-primary">
        <Header userName={userName} />
        <main className="max-w-6xl mx-auto px-4 py-8">{children}</main>
      </body>
    </html>
  )
}
