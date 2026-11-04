import Link from 'next/link'
import { SiteNav, DynamicHeader } from '@parkerburgess/wandering-parker-ui'
import type { SiteNavItem } from '@parkerburgess/wandering-parker-ui'
import HeaderUserMenu from './HeaderUserMenu'

const navItems: SiteNavItem[] = [
  { label: 'Projects', href: '/' },
  { label: 'Resume', href: '/resume' },
]

interface HeaderProps {
  userName?: string
}

export default function Header({ userName }: HeaderProps) {
  // #region Tailwind utility consts
  // Background hardcoded to lightslategray (fixed, does not follow the theme).
  const headerCls = 'bg-[lightslategray] sticky top-0 z-50'
  // @container makes this the sizing reference for the banner's cqi units.
  const innerCls =
    '@container max-w-6xl mx-auto px-4 py-4 grid grid-cols-[1fr_auto_1fr] items-center'
  const brandCls = 'col-start-2 block cursor-pointer'
  // Font-size scales with the header width (cqi) so the 15 tiles always fit
  // on one line, down to a floor on phones and capped so desktop is unchanged.
  const wordmarkCls = 'text-[clamp(0.5rem,3.1cqi,2rem)]'
  const menuSlotCls = 'justify-self-end'
  // #endregion

  return (
    <header className={headerCls}>
      <div className={innerCls}>
        <Link href="/" className={brandCls}>
          <DynamicHeader text="Wandering Parker" className={wordmarkCls} />
        </Link>
        <div className={menuSlotCls}>
          {userName && <HeaderUserMenu userName={userName} />}
        </div>
      </div>
      {/* Signed-out visitors only see login/register, so nothing to navigate. */}
      {userName && <SiteNav items={navItems} />}
    </header>
  )
}
