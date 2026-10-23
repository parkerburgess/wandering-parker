'use client'

import { UserMenu, useTheme } from '@parkerburgess/wandering-parker-ui'

interface HeaderUserMenuProps {
  userName: string
}

// Header stays a server component; the theme toggle needs useTheme, so the
// menu lives in this small client island.
export default function HeaderUserMenu({ userName }: HeaderUserMenuProps) {
  const { resolvedTheme, setTheme } = useTheme()

  function handleToggleTheme() {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')
  }

  return (
    <UserMenu
      userName={userName}
      theme={resolvedTheme}
      onToggleTheme={handleToggleTheme}
    />
  )
}
