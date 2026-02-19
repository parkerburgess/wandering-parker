import type { Metadata } from 'next'
import './globals.css'
import Header from './_components/Header'

export const metadata: Metadata = {
  title: 'WanderingParker',
  description: 'A collection of interactive projects and experiments.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background text-text-primary">
        <Header />
        <main className="max-w-6xl mx-auto px-4 py-8">{children}</main>
      </body>
    </html>
  )
}
