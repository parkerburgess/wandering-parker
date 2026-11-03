'use client'

import { useState } from 'react'
import {
  Button,
  Card,
  SlowRequestNotice,
  useSlowRequestNotice,
} from '@parkerburgess/wandering-parker-ui'

export default function GuestAccessCard() {
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const slowMessage = useSlowRequestNotice(loading)

  async function handleGuest() {
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/guest', { method: 'POST' })
      if (res.ok) {
        // Full navigation, not router.push: the client router may still hold
        // a prefetch of '/' from before sign-in that redirects back here.
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination
        window.location.href = '/'
      } else {
        setError('Guest access is unavailable right now.')
        setLoading(false)
      }
    } catch {
      setError('Could not reach the server. Please try again.')
      setLoading(false)
    }
  }

  // #region Tailwind utility consts
  const guestCardCls = 'grid gap-4'
  const titleCls = 'text-xl font-semibold text-neutral-800'
  const perksListCls = 'grid gap-1 list-disc pl-5 text-sm text-neutral-800'
  const errorTextCls = 'text-sm text-danger-700'
  const guestBtnCls = 'w-full'
  // #endregion

  return (
    <Card className={guestCardCls}>
      <h2 className={titleCls}>Explore as a guest</h2>
      <ul className={perksListCls}>
        <li>Read Only</li>
        <li>No Account Needed</li>
        <li>Full Project Access</li>
      </ul>
      {error && <p className={errorTextCls}>{error}</p>}
      <Button
        type="button"
        onClick={handleGuest}
        disabled={loading}
        className={guestBtnCls}
      >
        {loading ? 'Opening…' : 'View as guest'}
      </Button>
      <SlowRequestNotice message={slowMessage} />
    </Card>
  )
}
