'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button, Input, SlowRequestNotice, useSlowRequestNotice } from '@parkerburgess/wandering-parker-ui'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const slowMessage = useSlowRequestNotice(loading)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      if (res.ok) {
        setSubmitted(true)
      } else {
        setError('Something went wrong. Please try again.')
      }
    } catch {
      setError('Could not reach the server. Please try again.')
    }

    setLoading(false)
  }

  // #region Tailwind utility consts
  const pageCls = 'min-h-[calc(100vh-5rem)] flex items-center justify-center'
  const cardCls = 'w-full max-w-sm'
  const titleCls = 'text-2xl font-bold text-neutral-800 mb-8 text-center'
  const formCls = 'space-y-4'
  const introCls = 'text-sm text-neutral-500 mb-6 text-center'
  const errorTextCls = 'text-sm text-danger-700'
  const successTextCls = 'text-sm text-neutral-600 text-center leading-relaxed'
  const submitBtnCls = 'w-full'
  const backPromptCls = 'mt-6 text-center text-sm text-neutral-500'
  const backLinkCls = 'text-primary-600 hover:underline'
  // #endregion

  return (
    <div className={pageCls}>
      <div className={cardCls}>
        <h1 className={titleCls}>
          Reset password
        </h1>
        {submitted ? (
          <p className={successTextCls}>
            If an account exists for that email, a password reset link is on its way.
            Check your inbox and spam folder.
          </p>
        ) : (
          <>
            <p className={introCls}>
              Enter your email and we&apos;ll send you a link to reset your password.
            </p>
            <form onSubmit={handleSubmit} className={formCls}>
              <Input
                id="email"
                label="Email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              {error && <p className={errorTextCls}>{error}</p>}
              <Button type="submit" disabled={loading} className={submitBtnCls}>
                {loading ? 'Sending…' : 'Send reset link'}
              </Button>
              <SlowRequestNotice message={slowMessage} />
            </form>
          </>
        )}
        <p className={backPromptCls}>
          <Link href="/login" className={backLinkCls}>
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
