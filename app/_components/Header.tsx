import Image from 'next/image'
import Link from 'next/link'
import HeaderUserMenu from './HeaderUserMenu'

interface HeaderProps {
  userName?: string
}

// Matches brandCls widths: w-56 below sm, w-72 from sm.
const BANNER_SIZES = '(min-width: 640px) 288px, 224px'

export default function Header({ userName }: HeaderProps) {
  // #region Tailwind utility consts
  // bg-primary-600 is the theme's --primary. banner-primary.png is
  // banner-orange.jpg with its background recolored to exactly that value,
  // so the image blends into the row instead of reading as a box.
  const headerCls = 'bg-primary-600 sticky top-0 z-50'
  // Equal 1fr side columns keep the banner centered whether or not the
  // user menu is present.
  const innerCls =
    'max-w-6xl mx-auto px-4 h-20 grid grid-cols-[1fr_auto_1fr] items-center'
  // The source image is 3:2 with the wordmark in the middle third, so a
  // wide, short box with object-cover crops it to a strip around the text.
  const brandCls =
    'col-start-2 relative block w-56 sm:w-72 h-16 overflow-hidden cursor-pointer'
  const bannerImgCls = 'object-cover'
  const menuSlotCls = 'justify-self-end'
  // #endregion

  return (
    <header className={headerCls}>
      <div className={innerCls}>
        <Link href="/" className={brandCls}>
          <Image
            src="/banner-primary.png"
            alt="WanderingParker"
            fill
            sizes={BANNER_SIZES}
            priority
            className={bannerImgCls}
          />
        </Link>
        <div className={menuSlotCls}>
          {userName && <HeaderUserMenu userName={userName} />}
        </div>
      </div>
    </header>
  )
}
