# Auth Flow

The browser never talks to better-auth directly to sign in. The hub's
`app/api/auth/*` routes make the calls server-to-server, exchange the auth
service's session for a signed JWT, and set that JWT as the `auth_token` cookie on
`.wanderingparker.com`. From then on every project checks the cookie itself, using
the auth service's public keys (JWKS).

- **Token:** ES256 JWT that lasts 1 day. The cookie's `maxAge` matches it, and
  there is no refresh, so an expired token means signing in again.
- **Cookie:** `httpOnly`, `sameSite=lax`, `secure` in production, and set on
  `.wanderingparker.com` in production so every subdomain gets it.

## 1. Sign in

```mermaid
sequenceDiagram
  autonumber
  actor U as Browser
  participant H as Hub<br/>/api/auth/login
  participant A as Auth service<br/>better-auth
  participant D as Azure SQL<br/>dbo

  U->>H: POST email + password
  H->>A: POST /api/auth/sign-in/email
  A->>D: check User + Account (password hash)
  alt email not verified
    A-->>H: 403 (and sends a fresh verification email)
    H-->>U: 403 "verify your email"
  else wrong credentials
    A-->>H: 401
    H-->>U: 401 "invalid email or password"
  else ok
    A->>D: insert Session
    A-->>H: 200 + better-auth session cookie
    H->>A: GET /api/auth/token (forwards that session cookie)
    A-->>H: signed JWT (ES256, 1 day)
    H-->>U: Set-Cookie auth_token (.wanderingparker.com, httpOnly, 1 day)
    U->>U: go to return_url (or /)
  end
```

The better-auth session cookie stays with the hub's server-side call. The browser
only ever holds `auth_token`.

## 2. Sign up and verify email

```mermaid
sequenceDiagram
  autonumber
  actor U as Browser
  participant H as Hub<br/>/api/auth/register
  participant A as Auth service<br/>better-auth
  participant T as Cloudflare<br/>Turnstile
  participant D as Azure SQL<br/>dbo
  participant R as Resend

  U->>H: POST name + email + password + captcha token
  H->>A: POST /api/auth/sign-up/email (x-captcha-response header)
  A->>T: verify captcha token
  T-->>A: ok
  A->>D: insert User + Account
  A->>D: create hook: insert AppAccess rows (DEFAULT_APPS)
  A->>R: send verification email
  A-->>H: 200 (no session yet)
  H-->>U: "check your email"
  U->>A: click link: GET /api/auth/verify-email?token=…
  A->>D: mark User.EmailVerified
  A-->>U: redirect to hub /login?verified=1
  Note over U,H: The user then signs in as in diagram 1.<br/>There is no auto sign-in after verification.
```

Password reset works the same way. The hub's `/api/auth/forgot-password` calls
`/request-password-reset`, Resend emails a link back to the hub's `/reset-password`
page, and that page posts the new password through `/api/auth/reset-password`.

## 3. Visiting a page in an app

The same flow runs for the hub's own pages and for each child app. The hub's
version redirects to its own `/login`, and the child apps send people to the hub's
`/login` with a `return_url`.

```mermaid
sequenceDiagram
  autonumber
  actor U as Browser
  participant P as App proxy.ts
  participant A as Auth service<br/>/api/auth/jwks
  participant S as App page / API route
  participant H as Hub /login

  U->>P: request (auth_token cookie)
  alt no cookie
    P-->>U: redirect to hub /login?return_url=<app>
  else has cookie
    P->>A: fetch public keys (first time only, then cached)
    A-->>P: JWKS
    P->>P: jwtVerify (signature + expiry)
    alt invalid or expired
      P-->>U: delete auth_token, redirect to hub /login?return_url=<app>
    else guest account making a write (not GET/HEAD/OPTIONS)
      P-->>U: 403 "Guest access is read-only" (wp-server enforceReadOnly)
    else ok
      P->>S: continue
      S->>S: wp-server getUserId() decodes the already-verified JWT (sub claim)
      S-->>U: page / data
    end
  end
  U->>H: (after a redirect) sign in as in diagram 1, then back to return_url
```

## 4. Guest sign-in and sign-out

```mermaid
sequenceDiagram
  autonumber
  actor U as Browser
  participant H as Hub /api/auth/*
  participant A as Auth service

  U->>H: POST /api/auth/guest (empty body)
  H->>A: sign in with GUEST_EMAIL / GUEST_PASSWORD from server env
  A-->>H: session, then JWT (same exchange as diagram 1)
  H-->>U: Set-Cookie auth_token (guest)

  U->>H: POST /api/auth/logout
  H-->>U: delete auth_token (same domain + path it was set with)
```

## App access (AppAccess)

The auth service writes the grants, but each project decides whether to check them:

| Project | Checks `dbo.AppAccess`? | How |
|---|---|---|
| Hub | Yes, for display | `GET /api/user/apps` with the JWT as Bearer; hides cards for apps you don't have |
| no-file-no-mile | Yes, blocks access | `lib/auth.ts` `resolveAthleteAccess` runs from the layout and sends ungranted users back to the hub |
| sharpener | No | a valid JWT is enough |
| fly-fishing-tracker | No | a valid JWT is enough |

So in sharpener and fly-fishing-tracker, a signed-in user without a grant can still
reach the app by typing its URL. This is recorded here, not fixed, under #50.

## Not shown

- **Dev bypass:** when `DISABLE_AUTH=true` and the build isn't production, each
  `proxy.ts` lets every request through, and wp-server's `getUserId()` returns the
  guest's id (`32`). A production build can't turn it on, whatever the env var
  says.
- **Rate limits** (better-auth, production only): sign-up 5 per minute, sign-in 10
  per minute, password reset requests 5 per minute.
- **Contact Me** also uses the auth service and Turnstile, but it has nothing to do
  with identity. See the system overview.
