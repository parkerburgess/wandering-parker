'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

interface HeaderProps {
  userName?: string
}

export default function Header({ userName }: HeaderProps) {
  const pathname = usePathname()
  const router = useRouter()
  const isProjectPage = pathname.startsWith('/projects/')

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  return (
    <header className="border-b border-border bg-surface/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link
          href="/"
          className="text-accent font-semibold text-lg tracking-wide hover:text-accent/80 transition-colors"
        >
          WanderingParker
        </Link>

        <div className="flex items-center gap-4">
          {userName && (
            <span className="text-sm text-text-muted">{userName}</span>
          )}
          <button
            onClick={handleLogout}
            className="text-sm text-text-muted hover:text-text-primary transition-colors"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  )
}
