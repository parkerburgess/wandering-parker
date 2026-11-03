'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Button,
  Card,
  Input,
  PasswordInput,
  SlowRequestNotice,
  useSlowRequestNotice,
} from '@parkerburgess/wandering-parker-ui'

interface Props {
  returnUrl?: string
  verified?: boolean
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

export default function SignInCard({ returnUrl, verified }: Props) {
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
        const data = await res.json().catch(() => null)
        setError(data?.error ?? 'Invalid email or password.')
        setLoading(false)
      }
    } catch {
      setError('Could not reach the server. Please try again.')
      setLoading(false)
    }
  }

  // #region Tailwind utility consts
  const signInCardCls = 'grid gap-4'
  const titleCls = 'text-xl font-semibold text-neutral-800'
  const verifiedNoticeCls = 'text-sm text-primary-700'
  const formCls = 'grid gap-4'
  const errorTextCls = 'text-sm text-danger-700'
  const submitBtnCls = 'w-full'
  const linksCls = 'grid gap-2 text-center text-sm'
  const forgotLinkCls = 'text-primary-600 hover:underline'
  const registerPromptCls = 'text-neutral-500'
  const registerLinkCls = 'text-primary-600 hover:underline'
  // #endregion

  return (
    <Card className={signInCardCls}>
      <h2 className={titleCls}>Sign in</h2>
      {verified && (
        <p className={verifiedNoticeCls}>
          Your email is verified — please sign in.
        </p>
      )}
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
      <div className={linksCls}>
        <Link href="/forgot-password" className={forgotLinkCls}>
          Forgot your password?
        </Link>
        <p className={registerPromptCls}>
          Don&apos;t have an account?{' '}
          <Link href="/register" className={registerLinkCls}>
            Create one
          </Link>
        </p>
      </div>
    </Card>
  )
}
