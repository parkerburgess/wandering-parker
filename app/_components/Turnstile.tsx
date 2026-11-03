'use client'

import { useEffect, useRef } from 'react'

const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js'

interface TurnstileApi {
  render: (
    el: HTMLElement,
    opts: {
      sitekey: string
      callback: (token: string) => void
      'expired-callback'?: () => void
      'error-callback'?: () => void
    },
  ) => string
  remove: (id: string) => void
  reset: (id: string) => void
}

declare global {
  interface Window {
    turnstile?: TurnstileApi
  }
}

interface Props {
  onToken: (token: string) => void
  // Bump this to reset the widget (Turnstile tokens are single-use, so a retry
  // after a failed submit needs a fresh one).
  resetKey?: number
}

// Renders a Cloudflare Turnstile widget and hands its token back via onToken.
// Renders nothing when no site key is configured, so the form still works in
// environments where Turnstile isn't set up.
export default function Turnstile({ onToken, resetKey }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const widgetIdRef = useRef<string | null>(null)

  useEffect(() => {
    const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY
    if (!siteKey) return

    function clearToken() {
      onToken('')
    }

    function render() {
      if (!containerRef.current || !window.turnstile || widgetIdRef.current) return
      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: siteKey!,
        callback: onToken,
        'expired-callback': clearToken,
        'error-callback': clearToken,
      })
    }

    if (window.turnstile) {
      render()
      return
    }

    const existing = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT_SRC}"]`)
    if (existing) {
      existing.addEventListener('load', render)
      return () => existing.removeEventListener('load', render)
    }

    const script = document.createElement('script')
    script.src = SCRIPT_SRC
    script.async = true
    script.defer = true
    script.addEventListener('load', render)
    document.head.appendChild(script)
  }, [onToken])

  useEffect(() => {
    if (!resetKey) return
    if (window.turnstile && widgetIdRef.current) {
      window.turnstile.reset(widgetIdRef.current)
      onToken('')
    }
  }, [resetKey, onToken])

  return <div ref={containerRef} />
}
