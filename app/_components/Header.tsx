import Link from 'next/link'
import HeaderUserMenu from './HeaderUserMenu'
import WanderingParkerWordmark from './project-art/WanderingParkerWordmark'

interface HeaderProps {
  userName?: string
}

export default function Header({ userName }: HeaderProps) {
  // #region Tailwind utility consts
  // The wordmark is transparent, so bg-primary-600 (the theme's --primary)
  // shows through and follows the palette.
  const headerCls = 'bg-primary-600 sticky top-0 z-50'
  // Equal 1fr side columns keep the banner centered whether or not the
  // user menu is present.
  const innerCls =
    'max-w-6xl mx-auto px-4 h-20 grid grid-cols-[1fr_auto_1fr] items-center'
  const brandCls = 'col-start-2 block w-56 sm:w-72 cursor-pointer'
  const wordmarkCls = 'block w-full h-auto'
  const menuSlotCls = 'justify-self-end'
  // #endregion

  return (
    <header className={headerCls}>
      <div className={innerCls}>
        <Link href="/" className={brandCls}>
          <WanderingParkerWordmark className={wordmarkCls} />
        </Link>
        <div className={menuSlotCls}>
          {userName && <HeaderUserMenu userName={userName} />}
        </div>
      </div>
    </header>
  )
}
