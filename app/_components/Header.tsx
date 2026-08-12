import Link from 'next/link'
import { UserMenu } from '@parkerburgess/wandering-parker-ui'

interface HeaderProps {
  userName?: string
}

export default function Header({ userName }: HeaderProps) {
  // #region Tailwind utility consts
  const headerCls =
    'border-b border-neutral-200 bg-surface/80 backdrop-blur-sm sticky top-0 z-50'
  const innerCls = 'max-w-6xl mx-auto px-4 h-14 flex items-center justify-between'
  const brandCls =
    'text-brand-600 font-semibold text-lg tracking-wide hover:text-brand-700 transition-colors'
  // #endregion

  return (
    <header className={headerCls}>
      <div className={innerCls}>
        <Link href="/" className={brandCls}>
          WanderingParker
        </Link>
        {userName && <UserMenu userName={userName} />}
      </div>
    </header>
  )
}
