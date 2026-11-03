'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Button,
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

export default function LoginForm({ returnUrl, verified }: Props) {
  const router = useRouter()
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

  async function handleGuest() {
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/guest', { method: 'POST' })
      if (res.ok) {
        router.push('/')
        router.refresh()
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
  const pageCls = 'min-h-[calc(100vh-5rem)] flex items-center justify-center'
  const cardCls = 'w-full max-w-sm'
  const titleCls = 'text-2xl font-bold text-neutral-800 mb-8 text-center'
  const formCls = 'space-y-4'
  const errorTextCls = 'text-sm text-danger-700'
  const verifiedNoticeCls = 'mb-6 text-sm text-center text-primary-700'
  const submitBtnCls = 'w-full'
  const forgotPromptCls = 'mt-4 text-center text-sm'
  const forgotLinkCls = 'text-primary-600 hover:underline'
  const registerPromptCls = 'mt-6 text-center text-sm text-neutral-500'
  const registerLinkCls = 'text-primary-600 hover:underline'
  const guestSectionCls = 'mt-8 pt-6 border-t border-neutral-200 grid gap-3'
  const guestHintCls = 'text-sm text-center text-neutral-500'
  // #endregion

  return (
    <div className={pageCls}>
      <div className={cardCls}>
        <h1 className={titleCls}>
          Sign in
        </h1>
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
        <p className={forgotPromptCls}>
          <Link href="/forgot-password" className={forgotLinkCls}>
            Forgot your password?
          </Link>
        </p>
        <p className={registerPromptCls}>
          Don&apos;t have an account?{' '}
          <Link href="/register" className={registerLinkCls}>
            Create one
          </Link>
        </p>
        <div className={guestSectionCls}>
          <p className={guestHintCls}>
            Just exploring? Browse the demo apps without an account.
          </p>
          <Button
            type="button"
            variant="secondary"
            onClick={handleGuest}
            disabled={loading}
            className={submitBtnCls}
          >
            View as guest (read-only)
          </Button>
        </div>
      </div>
    </div>
  )
}
