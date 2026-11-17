# Hub code review — wandering-parker

- **Ticket:** #36
- **Date:** 2026-11-17
- **Scope:** every tracked source file on `main` at `66f7a1a` (app, lib, proxy, config,
  data). Sibling repos were read only to confirm how they call the hub.
- **Checks:** `npm run lint`, `tsc --noEmit` and `npm run build` all pass with no warnings.

Findings are ordered most-severe first. Each one says how sure I am:
**Confirmed** (reproduced or follows directly from the code) or **Likely** (depends on
behaviour outside this repo that I couldn't run).

---

## High

### H1. The `return_url` check allows XSS and an open redirect — Confirmed — ✅ Fixed
> **Fixed 2026-11-17 (with H2):** the check moved to the server.
> `lib/returnUrl.ts` (`getSafeReturnUrl`) runs in `app/login/page.tsx` and allows only
> paths on the hub, `https://` on `wanderingparker.com` / `*.wanderingparker.com`, and
> `localhost` outside production. Anything else is dropped and sign-in goes to `/`.
> `SignInCard` only receives the checked value.

`app/login/SignInCard.tsx:19-27`, used at line 49.

`isSafeReturnUrl` passes two kinds of hostile input, and the result goes straight into
`window.location.href`:

| `return_url` | Why it passes | Effect after sign-in |
|---|---|---|
| `javascript://localhost/%0Aalert(document.domain)` | `new URL()` reports hostname `localhost`; the scheme is never checked | Runs script on the hub's origin |
| `//evil.example` | starts with `/` | Protocol-relative URL: goes to `evil.example` |

Verified with `new URL()` in Node. Anyone can send a victim
`https://wanderingparker.com/login?return_url=...`; the victim signs in normally and the
payload fires. The `auth_token` cookie is `httpOnly`, so script can't read it, but it can
make requests as the signed-in user.

**Fix direction:** parse with `new URL(returnUrl, window.location.origin)`, require
`protocol` to be `http:`/`https:`, and compare `hostname` against an allow-list. Doing
the check on the server (in `login/page.tsx`, before the value reaches the client) is
cleaner still.

### H2. Returning to an app after sign-in is broken in production — Confirmed — ✅ Fixed
> **Fixed 2026-11-17** by the same change as H1.

Same function. The sibling apps' proxies (sharpener, no-file-no-mile,
fly-fishing-tracker) send `return_url=https://<app>.wanderingparker.com`. That's neither
a `/` path nor `localhost`, so it's rejected and the user lands on the hub's `/` instead
of the app they came from. It only works locally. The fix for H1 (an allow-list
including `*.wanderingparker.com`) fixes this too.

### H3. Auth rate limiting counts the wrong client, and its counters don't persist — Likely — 🎫 Ticketed as #53
> **Decided 2026-11-17:** fix problem 1 with the "count the real visitor" option, tracked
> in #53. Problem 2 stays as is: in-memory counters are accepted as best-effort.

Hub side: `app/api/auth/login/route.ts:8`, `guest/route.ts:17`, `register/route.ts:17`,
`forgot-password/route.ts:14`. Auth-service side: `auth-wandering-parker/src/auth.ts`
(`rateLimit`).

The auth service (Better Auth 1.6.18) limits `/sign-in/email` to 10/min,
`/sign-up/email` to 5/min and `/request-password-reset` to 5/min, keyed by client IP.
There are two separate problems:

**1. Every hub visitor counts as the same client.** Better Auth reads the client IP from
`x-forwarded-for` (its default, confirmed in the installed package). Visitors never call
the auth service directly: the hub's route handlers relay each request with
server-side `fetch`. So the IP the auth service sees is the **hub's outbound IP**, the
same for every visitor. The intended "10 sign-ins per minute per visitor" becomes
"10 per minute for everyone on the hub". The "View as guest" button also calls
`/sign-in/email`, so it draws on the same allowance.

**2. The counters live in memory on each serverless instance.** `rateLimit.storage` isn't
set and there's no `secondaryStorage`, so Better Auth falls back to `"memory"`
(confirmed in the package source). On Vercel each running copy of the function keeps its
own counters, and they're lost whenever an idle copy shuts down. That makes problem 1
erratic: unlikely at low traffic, but a burst of visitors (a recruiter sharing the link)
could get 429s. It also weakens the limits for **every** app: a bot spread across fresh
copies keeps getting new allowances.

**What visitors see:** because of M1, a 429 on sign-in reads "Invalid email or
password", even with the right password. The guest button shows "Guest access is
unavailable right now". Nothing says the problem is temporary.

**Not verified against production.** To check, look at which IP Better Auth records for
sign-ins that come through the hub.

**Fix options** (not decided):
- **Count the real visitor:** the hub sends the visitor's IP in a custom header along
  with a shared secret. The auth service trusts that header only when the secret matches
  (`advanced.ipAddress.ipAddressHeaders`). Plain `x-forwarded-for` probably won't
  survive, because Vercel's edge overwrites it.
- **Limit at the hub's edge instead:** a firewall rate-limit rule on the hub's
  `/api/auth/*` routes sees the real visitor IP with no code. It needs a hosting plan
  that includes rate-limit rules (not checked).
- **Shared counters:** set `rateLimit.storage` to `"database"` (one small table, a read
  and a write per auth request) or use a Redis-style store such as Upstash.
- **Accept it:** signup already requires email verification and Turnstile, so the
  in-memory limiter can stay best-effort. M1 should still be fixed so a 429 isn't
  reported as a wrong password.

---

## Medium

> **M1–M5 and M7 fixed 2026-11-17; M6 withdrawn (see its note).** Sign-in for login and
> guest now goes through one shared flow, `lib/signIn.ts`, which returns a result type
> (success / invalid credentials / not verified / rate limited / unavailable). Each route
> words its own message. New helpers: `lib/authCookie.ts` (the only copy of the cookie
> rules), `lib/authService.ts` (`AUTH_SERVICE_URL` and the app-URL fallback, read once),
> `lib/requestBody.ts` (safe JSON body reading), and `tooManyRequests` /
> `serviceUnavailable` in `lib/apiResponses.ts`. Tested in the browser with the auth
> service both stopped and running.

### M1. Any sign-in failure is reported as "Invalid email or password" — Confirmed — ✅ Fixed
`app/api/auth/login/route.ts:17-22`. Everything except 403 maps to 401 with that text,
including 429 (rate limited, see H3) and 5xx (auth service down). Users retry a correct
password and get locked out further. Map 429 and 5xx to their own messages.

### M2. Route handlers crash on a bad request body — Confirmed — ✅ Fixed
Every route calls `await request.json()` unguarded (`login:5`, `register:5`,
`forgot-password:5`, `reset-password:5`). A malformed or empty body throws, producing an
unhandled 500 instead of a 400. `login` also doesn't check that `email`/`password` exist,
unlike the other routes. A small `readJsonBody()` helper returning `badRequest(...)` would
cover all four.

### M3. Inconsistent handling of auth-service network errors — Confirmed — ✅ Fixed
`forgot-password` and `reset-password` wrap `fetch` in try/catch and return a clean
`serverError`. `login` and `guest` don't, so an unreachable auth service is an unhandled
500 there. (`register` had the same gap and is fixed too. All four now return 503.)

### M4. Home page fails if the auth service is down or returns an unexpected shape — Confirmed — ✅ Fixed
`app/page.tsx:7-15`. `getAccessibleApps` has no try/catch around `fetch`, and
`data.apps as string[]` is an unchecked cast. If `apps` is missing, `.includes` at line
26 throws. Both turn the whole home page into an error page rather than the existing
"No projects available" empty state.

### M5. Session cookie extraction is fragile — Confirmed (code), Likely (impact) — ✅ Fixed
`login/route.ts:25-26`, `guest/route.ts:30-31`. `headers.get('set-cookie')` joins every
`Set-Cookie` header into one string, and `.split(';')[0]` keeps only the first cookie's
name=value. That works only while Better Auth sends the session cookie **first**. If
a cookie is added or reordered (e.g. turning on `cookieCache`, which adds a
`session_data` cookie), `/api/auth/token` gets the wrong cookie and sign-in fails with
"Sign-in failed". `Headers.getSetCookie()` returns them separately so the right one can
be picked by name. Also, `{ token }` from the token response isn't checked before
`cookies.set`.

### M6. Registration errors reveal whether an email is registered — ❌ Withdrawn
> **Withdrawn 2026-11-17:** this was wrong. With `requireEmailVerification` on, Better
> Auth 1.6.18 answers a signup for an existing email with the same success response as a
> new signup, and hashes the password anyway so both take the same time (see
> `shouldReturnGenericDuplicateResponse` in its `sign-up` route). The messages the hub
> passes through are validation errors (password length, invalid email, captcha), which
> are safe to show. No change needed; `register/route.ts` now has a comment saying so.

Original finding:
`app/api/auth/register/route.ts:33-34` passes Better Auth's `message` straight to the
client (e.g. "User already exists"). `forgot-password/route.ts:26-28` deliberately hides
this for account-enumeration protection. One door undoes the other. Decide which stance
you want; if hiding, map known upstream errors to generic text.

### M7. Cookie options are duplicated in four places — Confirmed — ✅ Fixed
> Only covers the hub. The sibling apps still copy the cookie rule in their own
> `proxy.ts` and logout routes; sharing it would belong in `wandering-parker-server`.

`login/route.ts:42-49`, `guest/route.ts:47-54`, `logout/route.ts:8-12`, `proxy.ts:24-28`
each repeat the name, path and the `NODE_ENV === 'production' ? '.wanderingparker.com'`
domain rule. The comments already warn that these must match, which is the sign it
should be one helper in `lib/` (e.g. `setAuthCookie(response, token)` /
`clearAuthCookie(response)`). Same for the
`process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'` fallback (5 copies) and
`process.env.AUTH_SERVICE_URL!` (6 copies).

---

## Low

> **L1, L2, L4, L5, L6 and C1–C8 fixed 2026-11-17.** L4's anchored matcher was tested
> against real paths: `/loginx`, `/register-anything` and `/api/authz` now go through
> the proxy; the public pages and `/api/auth/*` still skip it. For L5, the guest button
> now also honours `return_url` (it used to always go to `/`).

### L1. Stale captcha token after a failed registration — Confirmed — ✅ Fixed
`app/register/page.tsx:42,47`. On failure `resetKey` bumps (resetting the widget) but
`captchaToken` keeps the used token, so the button re-enables and a second submit sends
a spent token. Clear `captchaToken` alongside the reset.

### L2. Reset-password error parse can mislabel the failure — Confirmed — ✅ Fixed
`app/reset-password/ResetPasswordForm.tsx:45`. `await res.json()` has no `.catch`, unlike
every other form. A non-JSON error response falls into the outer catch and shows "Could
not reach the server".

### L3. `lib/auth.ts` builds the JWKS URL at import time — Confirmed — ✅ Fixed (with M7)
> `getAuthJwks()` now builds the key set on first use, and `lib/authService.ts` throws a
> clear "AUTH_SERVICE_URL is not set" error instead of building `undefined/...` URLs.
> The root layout still needs the variable for the contact form endpoint.

`lib/auth.ts:3-5`. If `AUTH_SERVICE_URL` is unset, `new URL('undefined/api/auth/jwks')`
throws while loading the module, which takes down every page (including `/login`) with
an unhelpful error, even when `DISABLE_AUTH=true` means it would never be used. Either
fail with a clear message or create it lazily. The sibling apps default to
`http://localhost:3001`; the hub doesn't.

### L4. Proxy matcher exclusions are prefixes, not path segments — Confirmed — ✅ Fixed
`proxy.ts:38`. `(?!login|register|...|api/auth)` skips auth for any path that **starts**
with those words, e.g. `/loginx`, `/register-anything`, `/api/authz`. Nothing exists at
those paths today, so it's harmless now, but a future route like `/api/authors` would
silently be public. Anchor each with `(?:/|$)`.

### L5. Redirect to `/login` drops where the user was going — Confirmed — ✅ Fixed
`proxy.ts:13,20`. The hub's own proxy doesn't set `return_url`, so a signed-out visit to
`/resume` lands on `/` after sign-in.

### L6. Unchecked casts of JWT claims — Confirmed — ✅ Fixed
`lib/auth.ts:31-32`. `payload.email as string | undefined` and `payload.name as string`
trust the claim types. A `typeof` check keeps the "strongly typed everywhere" rule honest.

---

## Cleanup and patterns

- **C1. Dead data:** `Project.skills` is parsed in `lib/getProjects.ts:34` but never
  rendered.
  ✅ *Fixed: each project card now shows its skills as badges.*
- **C2. Orphaned art / missing project:** `lib/projectArt.ts:16` registers
  `good-bad-calendar` art and `package.json`'s `dev:all` runs that app, but
  `data/projects.json` has no Good Bad Calendar entry, so it never appears on the hub.
  Intentional?
  ✅ *Fixed: it was removed on purpose (commit `2ff9e97`) and its repo is gone, so
  `GoodBadCalendarArt` and its registry entry are deleted and `dev:all` no longer starts
  it. Both can come back from git history.*
- **C3. Unneeded cast:** `lib/getProjects.ts:31` `projectsData as ProjectData[]`.
  `resolveJsonModule` already types the import; the cast would hide a mismatch.
  `getResume.ts` does this right.
  ✅ *Fixed: replaced with a typed assignment.*
- **C4. Page structure is inconsistent:** `/login` and `/reset-password` are server pages
  that pass `searchParams` into a client component; `/register` and `/forgot-password`
  are `'use client'` at the page level. Pick one pattern.
  ✅ *Fixed: all four are now server pages rendering a client form
  (`RegisterForm`, `ForgotPasswordForm`).*
- **C5. Read-only guard:** decision 0002 says `enforceReadOnly` is wired into *every*
  app's `proxy.ts`. The hub's isn't. The hub has no write routes a guest can reach today
  (the auth routes are excluded from the proxy), so this is a doc/decision mismatch
  rather than a hole. Either wire it in for defence in depth or note the exception in
  0002.
  ✅ *Fixed: decision 0002 now records the hub as an exception.*
- **C6. Local files tracked in git:** `.claude/settings.local.json` is meant to be
  per-machine and it's committed. `.vscode/settings.json` is committed but empty
  (`{}`).
  ✅ *Fixed: both untracked and added to `.gitignore`; local copies stay on disk.*
- **C7. Logout doesn't end the session server-side:** `logout/route.ts` only clears the
  cookie. The JWT stays valid until it expires (1 day). That's normal for stateless JWTs;
  just worth knowing.
  ✅ *Accepted: documented in a comment on the logout route.*
- **C8. Formatting nits:** `app/resume/page.tsx:61` `downloadLinkCls ='…` (missing
  space); `app/page.tsx:55-57` copy has trailing double spaces and a typo
  ("architectual").
  ✅ *Fixed.*

## What looked good

- Signature verification happens in both `proxy.ts` and `getVerifiedAuthUser`, with a
  comment explaining why, so the layout never trusts an unverified cookie.
- `isAuthDisabled()` can't switch on in a production build.
- `lib/apiResponses.ts` helpers are used consistently.
- Guest credentials stay server-side; the client only POSTs an empty body.
- `projectArt.ts` uses `satisfies` + a runtime type guard: good typing of JSON-driven
  keys.
- The comments explain *why* (cookie domain matching, full-page navigation after guest
  sign-in) rather than *what*.
