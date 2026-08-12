'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Button,
  Input,
  PasswordInput,
  SlowRequestNotice,
  useSlowRequestNotice,
} from '@parkerburgess/wandering-parker-ui'

interface Props {
  authServiceUrl: string
  returnUrl?: string
}

function isSafeReturnUrl(url: string | undefined): url is string {
  if (!url) return false
  if (url.startsWith('/')) return true
  try {
    return new URL(url).hostname === 'localhost'
  } catch {
    return false
  }
}

export default function LoginForm({ authServiceUrl, returnUrl }: Props) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const slowMessage = useSlowRequestNotice(loading)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      if (res.ok) {
        window.location.href = isSafeReturnUrl(returnUrl) ? returnUrl : '/'
      } else {
        setError('Invalid email or password.')
        setLoading(false)
      }
    } catch {
      setError('Could not reach the server. Please try again.')
      setLoading(false)
    }
  }

  // #region Tailwind utility consts
  const pageCls = 'min-h-[calc(100vh-3.5rem)] flex items-center justify-center'
  const cardCls = 'w-full max-w-sm'
  const titleCls = 'text-2xl font-bold text-neutral-800 mb-8 text-center'
  const formCls = 'space-y-4'
  const errorTextCls = 'text-sm text-incorrect-600'
  const submitBtnCls = 'w-full'
  const registerPromptCls = 'mt-6 text-center text-sm text-neutral-500'
  const registerLinkCls = 'text-brand-600 hover:underline'
  const guestBoxCls =
    'mt-8 p-3 rounded-lg border border-neutral-200 bg-card text-xs text-neutral-500 font-mono'
  // #endregion

  return (
    <div className={pageCls}>
      <div className={cardCls}>
        <h1 className={titleCls}>
          Sign in
        </h1>
        <form onSubmit={handleSubmit} className={formCls}>
          <Input
            id="email"
            label="Email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <PasswordInput
            id="password"
            label="Password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error && <p className={errorTextCls}>{error}</p>}
          <Button type="submit" disabled={loading} className={submitBtnCls}>
            {loading ? 'Signing in…' : 'Sign in'}
          </Button>
          <SlowRequestNotice message={slowMessage} />
        </form>
        <p className={registerPromptCls}>
          Don&apos;t have an account?{' '}
          <Link href="/register" className={registerLinkCls}>
            Create one
          </Link>
        </p>
        <div className={guestBoxCls}>
          <p>guest access with username/password:</p>
          <p>guest@gmail.com/guest</p>
        </div>
      </div>
    </div>
  )
}
