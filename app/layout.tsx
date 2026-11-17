import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import { ThemeProvider, Header } from '@parkerburgess/wandering-parker-ui'
import type {
  SiteNavItem,
  ContactConfig,
} from '@parkerburgess/wandering-parker-ui'
import './globals.css'
import { getVerifiedAuthUser } from '@/lib/auth'
import { readAuthToken } from '@/lib/authCookie'
import { getAuthServiceUrl } from '@/lib/authService'

const navItems: SiteNavItem[] = [
  { label: 'Projects', href: '/' },
  { label: 'Resume', href: '/resume' },
]

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
  const token = readAuthToken(cookieStore)
  const authUser = await getVerifiedAuthUser(token)
  const contact: ContactConfig = {
    endpoint: getAuthServiceUrl('/api/contact'),
    sourceApp: 'Wandering Parker',
    turnstileSiteKey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
    userEmail: authUser?.email,
  }

  // #region Tailwind utility consts
  const bodyCls = 'min-h-screen'
  const mainCls = 'max-w-6xl mx-auto px-4 py-8'
  // #endregion

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={bodyCls}>
        <ThemeProvider>
          <Header
            userName={authUser?.name}
            brandText="Wandering Parker"
            navItems={navItems}
            contact={contact}
          />
          <main className={mainCls}>{children}</main>
        </ThemeProvider>
      </body>
    </html>
  )
}
