// Checks the login page's ?return_url= before anything navigates to it.
// The sibling apps send their own origin (e.g.
// https://sharpener.wanderingparker.com) so the visitor goes back there
// after sign-in; anything else is ignored and sign-in lands on '/'.

const SITE_DOMAIN = 'wanderingparker.com'

// Placeholder origin for resolving relative values. '.invalid' is reserved
// and never resolves, so it can't collide with a real host.
const PLACEHOLDER_BASE = 'http://return-url.invalid'

function isSiteHost(hostname: string): boolean {
  return hostname === SITE_DOMAIN || hostname.endsWith(`.${SITE_DOMAIN}`)
}

function isAllowedAbsoluteUrl(url: URL): boolean {
  const isHttps = url.protocol === 'https:'
  if (isHttps && isSiteHost(url.hostname)) return true

  // Local dev runs every app on localhost with its own port, over http.
  if (process.env.NODE_ENV === 'production') return false
  const isHttp = url.protocol === 'http:'
  return (isHttp || isHttps) && url.hostname === 'localhost'
}

// Returns a URL that is safe to navigate to, or undefined.
//
// Parsing with the URL class (rather than string checks) means the value is
// read exactly the way the browser will read it: '//host', '/\host' and
// tab/newline tricks all resolve to another host here too, and any scheme
// other than http/https (javascript:, data:, ...) is rejected.
export function getSafeReturnUrl(
  value: string | string[] | undefined
): string | undefined {
  // A repeated ?return_url= arrives as an array; ignore it rather than guess.
  if (typeof value !== 'string' || value.length === 0) return undefined

  let parsed: URL
  try {
    parsed = new URL(value, PLACEHOLDER_BASE)
  } catch {
    return undefined
  }

  // Still on the placeholder origin: a path on the hub itself. Return the
  // normalised path, not the raw input.
  if (parsed.origin === PLACEHOLDER_BASE) {
    return `${parsed.pathname}${parsed.search}${parsed.hash}`
  }

  return isAllowedAbsoluteUrl(parsed) ? parsed.href : undefined
}
