'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button, Input, PasswordInput } from '@parkerburgess/wandering-parker-ui'

export default function RegisterPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      })

      if (res.ok) {
        router.push('/')
        router.refresh()
      } else {
        const data = await res.json()
        setError(data.error ?? 'Registration failed. Please try again.')
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
  const loginPromptCls = 'mt-6 text-center text-sm text-neutral-500'
  const loginLinkCls = 'text-brand-600 hover:underline'
  // #endregion

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
          {error && <p className={errorTextCls}>{error}</p>}
          <Button type="submit" disabled={loading} className={submitBtnCls}>
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
