# 0002 — Authentication Hardening: Email, Anti-Bot Signup & Guest Access

- **Status:** Accepted
- **Date:** 2026-11-02
- **Deciders:** Parker Burgess

########################################################################################
## TLDR: Non-Claude summary
This started as a review of the password process and grew into a more complete
process with account verification with both Cloudflare and email.
there is an email password reset process now too.
there is a read only guest access path.
more work than previously expected but all valid and worth the time.
########################################################################################



## Context

The platform uses a standalone **Better Auth** service (`auth-wandering-parker`,
Express on Vercel, SQL Server) that the apps authenticate against via signed JWTs.
Three problems and one goal drove this decision, all tracked under issue #12:

1. **No password reset.** `emailAndPassword` was enabled but no reset flow existed —
   a locked-out user had no self-service recovery.
2. **Bot signups.** Open, unverified registration was being exploited daily to create
   junk accounts (random names, Gmail dot-trick addresses, `EmailVerified = 0`). There
   were in fact *two* ungated signup entry points — a custom `/api/user/register` route
   and Better Auth's built-in `/api/auth/sign-up/email`.
3. **Hard for a hiring manager to look around.** This is a skills/code demo site; the
   intended audience should be able to see the apps working without creating an account.

Addressing any of these means sending transactional email (reset + verification), which
on Vercel's serverless runtime is best done through a provider's HTTPS API rather than
SMTP. That, plus bot mitigation, means taking on external service dependencies — the
reason this is worth recording.

## Options Considered

### Transactional email provider

- **Resend (chosen).** HTTPS API (no serverless SMTP-port issues), tiny TypeScript SDK,
  works the same in the Express service and in Next.js, official Vercel integration,
  React-friendly templates. Free/entry tier comfortably covers this volume.
- **Postmark.** Excellent transactional deliverability, very simple — but pricier past
  the trial and no advantage over Resend for this stack.
- **Amazon SES.** Cheapest at scale, but the most setup (domain verification, sandbox
  removal) and only compelling if already AWS-centric. Overkill here.
- **SendGrid.** Was the default option historically; free tier has weakened and it
  carries more configuration churn.
- **Self-hosted SMTP / Nodemailer against a relay.** Maximum portability, but serverless
  can't host a mail server and SMTP ports are unreliable on Vercel functions.

### Anti-bot signup strategy

- **A — Disable open signup.** Eliminates the spam vector outright; guest access covers
  the demo audience. Rejected only because self-service accounts are still wanted.
- **B — Keep signup, gate it (chosen).** Require **email verification**, add **Cloudflare
  Turnstile**, and **rate-limit**, after **consolidating to a single signup door** so every
  protection applies at once. Bots can't verify, so junk rows never become usable; a sweep
  removes stale unverified rows.
- **C — CAPTCHA only.** Lighter friction, but weaker against determined bots and leaves
  unverified accounts around.
- **D — Invite-only.** Strongest control, most manual overhead; not warranted yet.

### Guest account model

- **Fixed shared guest account (chosen).** One seeded, pre-verified read-only account with
  demo data; a "View as guest" button signs in server-side with server-held credentials.
- **Better Auth anonymous plugin.** Creates a new user row per visitor — ironic given the
  spam concern — and complicates read-only enforcement. Rejected.

### Read-only enforcement placement

- **Central guard in shared wp-server, called from each app's `proxy.ts` (chosen).** One
  rule in one place; catches API routes and server actions (both POST) without editing
  every write path. Costs a wp-server version bump + republish + dependency bumps.
- **Per-route checks in each app.** Faster to start, but duplicated and easy to miss.

## Decision

**Adopt Resend for transactional email; keep open signup but gate it with email
verification + Cloudflare Turnstile + rate limiting behind a single consolidated signup
door; add a fixed, read-only guest account with enforcement centralized in wp-server.**

The reasoning, in order of weight:

1. **The demo goal and the spam fix are complementary, not competing.** Guest access gives
   the real audience (hiring managers) a frictionless path, which makes it acceptable to add
   verification friction to normal signup — the thing that actually stops the bots.
2. **One signup door makes protection tractable.** With a single entry point, verification,
   captcha, and rate limits cover everything; two doors meant protections could be bypassed.
3. **Resend fits the runtime.** An HTTPS API sidesteps serverless SMTP problems and the same
   SDK serves both the Express auth service and the Next.js apps.
4. **Centralized read-only enforcement is safer than per-route.** The guard lives where auth
   is already verified (`proxy.ts` via wp-server), so new write paths are covered by default.

## Consequences

**Positive**

- Self-service password reset exists (slice 1, live in code).
- The daily bot-signup vector is closed once verification + Turnstile + the single door land.
- Hiring managers get one-click, read-only access to the demo apps.
- A single signup path keeps future auth protections simple to apply.

**Trade-offs accepted**

- **Two new external vendors** (Resend, Cloudflare) and the operational surface they bring.
- Email verification adds friction to normal signup — acceptable because guest access
  covers the primary audience.
- The read-only guard requires a **wp-server republish and dependency bumps across the apps**.
- Guest read-only is enforced server-side *and* hidden in the UI (defense in depth), which is
  extra surface to maintain.

**New accounts / secrets introduced**

- **Resend:** account + `RESEND_API_KEY`; a verified sending domain (`wanderingparker.com`)
  for production. Local/dev falls back to Resend's shared `onboarding@resend.dev` sender
  (which only delivers to the account owner's address) via an `EMAIL_FROM` override.
- **Cloudflare Turnstile:** account + site key (public) and secret key (server env).
- **Guest account:** stored credentials (`GUEST_EMAIL` / `GUEST_PASSWORD`) held in env, never
  exposed to the client.

**Follow-up (slice status)**

- [x] **Slice 1 — Password reset.** Resend email helper + Better Auth `sendResetPassword`;
  hub forgot/reset pages and routes. Committed on `password-reset` branches (`Refs #12`),
  not yet merged; sending domain not yet verified in Resend.
- [ ] **Slice 2 — Single signup door.** Move the `DEFAULT_APPS` grant into a
  `databaseHooks.user.create.after` hook, delete `/api/user/register`, register via Better
  Auth directly.
- [ ] **Slice 3 — Verification + anti-bot.** `requireEmailVerification`, verification email,
  Turnstile, rate limiting, and a cron sweep of stale unverified rows.
- [ ] **Slice 4 — Guest access.** Seed the guest account + demo data; `/api/auth/guest` +
  "View as guest" button; `enforceReadOnly` in wp-server wired into every app's `proxy.ts`;
  replace the plaintext guest-credentials box on the login page.

## What Would Change This

- **Bots get through** verification + Turnstile anyway → fall back to disabling open signup
  or invite-only (Options A/D).
- **Another app needs to send email** → promote the email helper out of the auth service into
  shared wp-server.
- **Roles grow beyond "guest"** → replace email-claim-based guest detection with a real role
  column/claim rather than deriving from a known identity.
- **Resend's terms change materially** → reassess the provider (Postmark or SES are the
  nearest alternatives).
