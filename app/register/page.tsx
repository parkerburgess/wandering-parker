'use client'

import { useCallback, useState } from 'react'
import Link from 'next/link'
import { Button, Input, PasswordInput } from '@parkerburgess/wandering-parker-ui'
import Turnstile from '@/app/_components/Turnstile'

export default function RegisterPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [captchaToken, setCaptchaToken] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [resetKey, setResetKey] = useState(0)

  const captchaRequired = Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY)
  const handleToken = useCallback((token: string) => setCaptchaToken(token), [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, captchaToken }),
      })

      if (res.ok) {
        setSubmitted(true)
      } else {
        const data = await res.json().catch(() => null)
        setError(data?.error ?? 'Registration failed. Please try again.')
        setResetKey((k) => k + 1)
        setLoading(false)
      }
    } catch {
      setError('Could not reach the server. Please try again.')
      setResetKey((k) => k + 1)
      setLoading(false)
    }
  }

  // #region Tailwind utility consts
  const pageCls = 'min-h-[calc(100vh-5rem)] flex items-center justify-center'
  const cardCls = 'w-full max-w-sm'
  const titleCls = 'text-2xl font-bold text-neutral-800 mb-8 text-center'
  const formCls = 'space-y-4'
  const errorTextCls = 'text-sm text-danger-700'
  const messageTextCls = 'text-sm text-neutral-600 text-center leading-relaxed'
  const submitBtnCls = 'w-full'
  const loginPromptCls = 'mt-6 text-center text-sm text-neutral-500'
  const loginLinkCls = 'text-primary-600 hover:underline'
  // #endregion

  if (submitted) {
    return (
      <div className={pageCls}>
        <div className={cardCls}>
          <h1 className={titleCls}>
            Check your email
          </h1>
          <p className={messageTextCls}>
            We&apos;ve sent a verification link to <strong>{email}</strong>. Click it to
            activate your account, then sign in.
          </p>
          <p className={loginPromptCls}>
            <Link href="/login" className={loginLinkCls}>
              Back to sign in
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
          Create account
        </h1>
        <form onSubmit={handleSubmit} className={formCls}>
          <Input
            id="name"
            label="Name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
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
            minLength={5}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {captchaRequired && <Turnstile onToken={handleToken} resetKey={resetKey} />}
          {error && <p className={errorTextCls}>{error}</p>}
          <Button
            type="submit"
            disabled={loading || (captchaRequired && !captchaToken)}
            className={submitBtnCls}
          >
            {loading ? 'Creating account…' : 'Create account'}
          </Button>
        </form>
        <p className={loginPromptCls}>
          Already have an account?{' '}
          <Link href="/login" className={loginLinkCls}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
