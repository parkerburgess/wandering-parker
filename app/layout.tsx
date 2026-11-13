import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import { ThemeProvider, Header } from '@parkerburgess/wandering-parker-ui'
import type {
  SiteNavItem,
  ContactConfig,
} from '@parkerburgess/wandering-parker-ui'
import './globals.css'
import { getVerifiedAuthUser } from '@/lib/auth'

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
  const token = cookieStore.get('auth_token')?.value
  const authUser = await getVerifiedAuthUser(token)
  const contact: ContactConfig = {
    endpoint: `${process.env.AUTH_SERVICE_URL}/api/contact`,
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
