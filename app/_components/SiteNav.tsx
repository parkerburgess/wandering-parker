'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface NavItem {
  label: string
  href: string
}

const navItems: NavItem[] = [
  { label: 'Projects', href: '/' },
  { label: 'Resume', href: '/resume' },
]

// Client component only so usePathname can mark the current page.
export default function SiteNav() {
  const pathname = usePathname()

  // #region Tailwind utility consts
  const navCls = 'bg-neutral-100 border-b border-neutral-400'
  const innerCls = 'max-w-6xl mx-auto px-4 grid grid-flow-col auto-cols-max gap-8'
  const linkBaseCls =
    'py-2 text-sm font-medium border-b-2 transition-colors cursor-pointer'
  const activeLinkCls = `${linkBaseCls} border-primary-600 text-neutral-900`
  const inactiveLinkCls =
    `${linkBaseCls} border-transparent text-neutral-600 hover:text-neutral-900`
  // #endregion

  return (
    <nav className={navCls}>
      <div className={innerCls}>
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={pathname === item.href ? activeLinkCls : inactiveLinkCls}
            aria-current={pathname === item.href ? 'page' : undefined}
          >
            {item.label}
          </Link>
        ))}
      </div>
    </nav>
  )
}
