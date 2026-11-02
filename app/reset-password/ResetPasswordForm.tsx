'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button, PasswordInput, SlowRequestNotice, useSlowRequestNotice } from '@parkerburgess/wandering-parker-ui'

interface Props {
  token?: string
  linkError?: string
}

export default function ResetPasswordForm({ token, linkError }: Props) {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(false)
  const slowMessage = useSlowRequestNotice(loading)

  const linkIsValid = Boolean(token) && !linkError

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: password }),
      })

      if (res.ok) {
        setDone(true)
      } else {
        const data = await res.json()
        setError(data.error ?? 'Something went wrong. Please try again.')
        setLoading(false)
      }
    } catch {
      setError('Could not reach the server. Please try again.')
      setLoading(false)
    }
  }

  function goToSignIn() {
    router.push('/login')
  }

  // #region Tailwind utility consts
  const pageCls = 'min-h-[calc(100vh-5rem)] flex items-center justify-center'
  const cardCls = 'w-full max-w-sm'
  const titleCls = 'text-2xl font-bold text-neutral-800 mb-8 text-center'
  const formCls = 'space-y-4'
  const errorTextCls = 'text-sm text-danger-700'
  const messageTextCls = 'text-sm text-neutral-600 text-center leading-relaxed'
  const submitBtnCls = 'w-full'
  const linkPromptCls = 'mt-6 text-center text-sm text-neutral-500'
  const linkCls = 'text-primary-600 hover:underline'
  // #endregion

  if (done) {
    return (
      <div className={pageCls}>
        <div className={cardCls}>
          <h1 className={titleCls}>
            Password updated
          </h1>
          <p className={messageTextCls}>
            Your password has been reset. You can now sign in with your new password.
          </p>
          <div className="mt-8">
            <Button type="button" onClick={goToSignIn} className={submitBtnCls}>
              Go to sign in
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (!linkIsValid) {
    return (
      <div className={pageCls}>
        <div className={cardCls}>
          <h1 className={titleCls}>
            Link expired
          </h1>
          <p className={messageTextCls}>
            This password reset link is invalid or has expired.
          </p>
          <p className={linkPromptCls}>
            <Link href="/forgot-password" className={linkCls}>
              Request a new link
            </Link>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={pageCls}>
      <div className={cardCls}>
        <h1 className={titleCls}>
          Choose a new password
        </h1>
        <form onSubmit={handleSubmit} className={formCls}>
          <PasswordInput
            id="password"
            label="New password"
            required
            minLength={5}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <PasswordInput
            id="confirm"
            label="Confirm new password"
            required
            minLength={5}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
          {error && <p className={errorTextCls}>{error}</p>}
          <Button type="submit" disabled={loading} className={submitBtnCls}>
            {loading ? 'Updating…' : 'Update password'}
          </Button>
          <SlowRequestNotice message={slowMessage} />
        </form>
      </div>
    </div>
  )
}
