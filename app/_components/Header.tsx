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
          {isProjectPage && (
            <Link
              href="/"
              className="flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary transition-colors"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M10 12L6 8L10 4"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              All Projects
            </Link>
          )}
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
