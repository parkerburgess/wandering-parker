# 0003 — Contact Form: Where the Send Endpoint Lives

- **Status:** Proposed
- **Date:** 2026-11-03
- **Deciders:** Parker Burgess

########################################################################################
## TLDR: Non-Claude summary
_To be written once the decision is made._
########################################################################################



## Context

Issue #41 extracts `SiteNav` into the shared `wp-ui` package so every app gets the same
navigation. Every app's nav should also have a **Contact Me** item that opens a modal with
name and email (both required), a short note, a **Cloudflare Turnstile** check, and
Send / Cancel buttons. A submission emails Parker at a fixed address through **Resend**
(the provider chosen in [0002](0002-auth-hardening.md)), sent from
`contact@wanderingparker.com` with `replyTo` set to the visitor so replies go straight
back to them.

The UI half is settled: the contact modal and the Turnstile widget move into `wp-ui`
because every app shows them. The open question is the **server half**, which has to:

1. Verify the Turnstile token with Cloudflare (needs `TURNSTILE_SECRET_KEY`).
2. Validate the fields and send the email through Resend (needs `RESEND_API_KEY`).

Those are secrets, so this code can't run in the browser, and **it can't live in a shared
package on its own either**. `wp-ui` and `wp-server` are libraries: their code is bundled
into each consuming app and runs inside that app's process, reading that app's
environment. A library has no deployment and no environment of its own — the same way a
.NET class library reads the host app's `IConfiguration` rather than carrying its own
`appsettings.json`. Baking the keys into the package would put them in every install and
lockfile cache, and rotating one would mean a republish and a bump in every app.

So the real choice is: **shared code with secrets copied into every app**, or **one
deployed service that holds the secrets once** and that every app calls.

Spam is the main risk. Guest sign-in (`/api/auth/guest`) issues a session from an empty
POST with no challenge, so being signed in isn't a gate — the endpoint must verify
Turnstile itself. The worst case is junk in Parker's inbox and burning the Resend daily
quota; the endpoint only ever sends to one fixed address, so it can't be used to email
anyone else.

## Options Considered

### A — Endpoint on the auth service (`auth-wandering-parker`)

Add `POST /api/contact` to the existing Express service. Every app's contact modal posts
to it cross-origin.

- **For:** It already has everything this needs — the Resend client and `sendEmail`
  helper (`src/email.ts`), `RESEND_API_KEY`, `TURNSTILE_SECRET_KEY`, and CORS configured
  for all app origins (`ALLOWED_ORIGINS`). No new secrets, dependencies or env vars in
  any app. One deployment to change, monitor or rotate keys on.
- **Against:** Puts a non-auth feature in the auth service, widening the surface of the
  most security-sensitive deployment. The browser makes a cross-origin call, so every
  app origin must stay listed in `ALLOWED_ORIGINS` (already true today). The contact
  modal needs the auth service's URL, so it's passed in as a prop or public env var.

### B — Handler factory in `wp-server`

`wp-server` exports something like `createContactHandler()`; each app adds a one-line
`app/api/contact/route.ts` that re-exports it as `POST`.

- **For:** Same-origin calls, no CORS. Keeps the auth service focused on auth. Matches
  0002's stated trigger — *"another app needs to send email → promote the email helper
  out of the auth service into shared wp-server"*.
- **Against:** Shared code but **not** shared secrets — every app needs
  `RESEND_API_KEY`, `TURNSTILE_SECRET_KEY`, `CONTACT_TO_EMAIL` and `EMAIL_FROM` set in its
  own Vercel project (six apps today, more later). `wp-server` gains a `resend`
  dependency and a release, and every app needs a dependency bump plus the route file.
  A key rotation touches every project.

### C — Endpoint on the hub (`wandering-parker`)

Add `app/api/contact/route.ts` to the hub app only; every other app's modal posts to the
hub cross-origin.

- **For:** One deployment holds the secrets, like A, while keeping email-for-humans out
  of the auth service. The hub is the public "front door" of the site, so a contact
  endpoint fits there naturally. The hub already has the Turnstile site key.
- **Against:** The hub needs `RESEND_API_KEY`, `TURNSTILE_SECRET_KEY` and the `resend`
  dependency added (it has neither today). Next.js route handlers don't do CORS for you,
  so the route needs its own `OPTIONS` handler and an allowed-origins list — a second
  copy of what the auth service already maintains. Every other app now depends on the
  hub being up to send a message.

### D — A new dedicated email service

Stand up a small standalone service (e.g. `mail-wandering-parker` on its own subdomain),
built the same way as the auth service (Express on Vercel), whose job is sending email.
`POST /api/contact` is its first endpoint; every app's modal posts to it cross-origin.

- **For:** One deployment holds the secrets, like A and C, with a single responsibility —
  the auth service stays auth-only and the hub stays an ordinary app. It's a natural
  home for *all* outbound email: the auth service's reset and verification emails could
  move here later, which is the "another app needs to send email" trigger in 0002
  answered with a service rather than a library. Each concern deploys and fails
  independently.
- **Against:** The most setup for a single form: a new repo, Vercel project, subdomain
  and DNS, its own `RESEND_API_KEY` / `TURNSTILE_SECRET_KEY` / `CONTACT_TO_EMAIL` /
  `EMAIL_FROM`, and a third copy of the allowed-origins CORS list. Another deployment to
  keep patched, monitored and paid for, serving one endpoint until other email features
  exist.

### Comparison

|                               | A — Auth service | B — wp-server     | C — Hub          | D — New service   |
|-------------------------------|------------------|-------------------|------------------|-------------------|
| Places secrets are configured | 1 (already done) | Every app         | 1 (new)          | 1 (new)           |
| New dependencies              | None             | `resend` in wp-server | `resend` in hub | New project   |
| Cross-origin call             | Yes (CORS exists)| No                | Yes (CORS to build) | Yes (CORS to build) |
| Package releases needed       | wp-ui            | wp-ui + wp-server | wp-ui            | wp-ui             |
| Per-app work                  | None             | Route file + env + bump | None       | None              |
| Keeps auth service auth-only  | No               | Yes               | Yes              | Yes               |
| New infrastructure            | None             | None              | None             | Repo, project, subdomain |

Because the `wp-ui` contact modal takes the endpoint URL as a prop, moving between A,
C and D later is a configuration change in each app, not a rewrite.

### Common to every option

- **From address:** `Wandering Parker Contact <contact@wanderingparker.com>`, behind an
  `EMAIL_FROM` override. This requires `wanderingparker.com` to be verified in Resend
  (SPF/DKIM DNS records), which was still outstanding when 0002 was written. Until then,
  non-production falls back to `onboarding@resend.dev`, which only delivers to the
  Resend account owner — and since that is Parker's own address, this works for testing.
- **Recipient:** `CONTACT_TO_EMAIL` env var rather than a constant in source.
- **Turnstile hostnames:** the Cloudflare widget must list every app's hostname (or the
  `wanderingparker.com` domain), or it fails on apps other than the hub.
- **Turnstile in local dev:** the check is skipped when no secret is configured, matching
  how the register page behaves without a site key.

## Decision

_Pending._

## Consequences

_To be filled in once an option is chosen._

## What Would Change This

- **More apps start sending email** (notifications, digests) → a dedicated email service
  (D) earns its setup cost, and the auth service's emails move there too.
- **The auth service is locked down further** (e.g. moved behind a private network or
  stricter origins) → A stops being viable and the endpoint moves to C.
- **Spam gets past Turnstile** → add per-IP rate limiting at the endpoint, or remove the
  form from guest sessions.
