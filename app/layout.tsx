import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import { ThemeProvider } from '@parkerburgess/wandering-parker-ui'
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

  // #region Tailwind utility consts
  const bodyCls = 'min-h-screen'
  const mainCls = 'max-w-6xl mx-auto px-4 py-8'
  // #endregion

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={bodyCls}>
        <ThemeProvider>
          <Header userName={userName} />
          <main className={mainCls}>{children}</main>
        </ThemeProvider>
      </body>
    </html>
  )
}
