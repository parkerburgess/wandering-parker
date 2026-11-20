# 0005 — Move Hosting and CI/CD from Vercel to Azure DevOps + Azure

- **Status:** Proposed — in discussion, no final decision made
- **Date:** 2026-11-18
- **Deciders:** Parker Burgess

########################################################################################
## TLDR: Non-Claude summary
_To be written by Parker._
########################################################################################



> **This record is a draft.** Every sub-decision below is either **Leaning**
> (a preferred option exists but isn't committed) or **Open** (no preference
> yet). Nothing here authorizes irreversible steps such as DNS cutovers or
> deleting Vercel projects. When the decisions settle, update each one's status
> and the record's status to `Accepted`. If the direction changes substantially,
> write a new record and mark this one `Superseded`.

## Context

Today every project is a Next.js app deployed to Vercel through its Git
integration (push to `main` → auto-deploy). Source lives on GitHub. Each app has
its own `*.wanderingparker.com` subdomain:

- **Hub** (`wandering-parker`): project cards, résumé, login. No database.
- **Auth** (`auth-wandering-parker`): sign-in, one JWT cookie shared across
  every subdomain. Every app depends on it.
- **Child apps:** Sharpener, No File No Mile, Fly Fisher Tracking.
- **Shared packages:** `@parkerburgess/wandering-parker-ui` (wp-ui) and
  wp-server, published to **GitHub Packages** (`npm.pkg.github.com`).
- **Data:** one Azure SQL database (Standard S0, per decision 0001) with one
  schema per app, accessed through `mssql`.
- **Domain:** `wanderingparker.com` was recently transferred to Vercel as
  registrar (~Nov 2026). DNS is presumed to be at Vercel as well (unverified).
- **Planned:** a new Blazor/ASP.NET app. Nothing exists yet.

**Why consider moving:**

1. **Learning (primary).** Get hands-on Azure DevOps (ADO) experience with
   multi-stage YAML pipelines, environments and approvals, templates, variable
   groups with Key Vault, service connections, Boards, and Artifacts. Running
   real projects through it is the best way to learn it.
2. **Low cost (secondary).** Keep the monthly bill small and predictable.
3. **One cloud.** The database is already on Azure. Hosting there puts compute
   next to data and enables managed-identity database access with no passwords.

**What Vercel provides today that would have to be rebuilt:** auto-deploy on
push, PR preview deploys, an edge network/CDN, image optimization, and
zero-config Next.js hosting. That cost is the main argument against moving.

The working plan behind this record is the handoff document
*azure-devops-migration-plan.md* (2026-11-18). This record captures the choices
and their reasoning. Implementation steps (cutover runbooks, YAML snippets) stay
in the plan.

## Decisions at a Glance

| #  | Decision                                  | Status  | Current lean                                   |
|----|-------------------------------------------|---------|------------------------------------------------|
| 1  | Move off Vercel at all                    | Leaning | Yes, for learning value                        |
| 2  | Hosting target per app                    | Leaning | Mixed: App Service + Container Apps            |
| 3  | App Service tier                          | Leaning | B1, scale to B2 in place if memory is tight    |
| 4  | Pipeline agents                           | Leaning | Self-hosted now; request the hosted grant      |
| 5  | Source control                            | Leaning | Stay on GitHub, build from ADO (hybrid)        |
| 6  | Shared package registry                   | Open    | GitHub Packages vs Azure Artifacts             |
| 7  | Database authentication                   | Leaning | Managed identity, no SQL passwords             |
| 8  | Infrastructure as code                    | Leaning | Bicep, deployed from ADO                       |
| 9  | DNS and registrar                         | Leaning | Stay on Vercel DNS for now; no registrar move yet |
| 10 | Blazor hosting model                      | Open    | Depends on what the app does                   |
| 11 | Pilot app                                 | Open    | See the inconsistency noted below              |

## Options Considered

### 1. Move off Vercel at all

- **A — Stay on Vercel, learn ADO separately.** Keep hosting as is. Use ADO only
  for Boards or a side project, or drive Vercel deploys from ADO with the Vercel
  CLI. Lowest risk, but no real Azure hosting experience.
- **B — Move hosting to Azure, CI/CD to ADO.** Real production pipelines against
  real targets. Costs migration effort and loses Vercel's built-in features.
- **C — Hybrid during transition.** Move apps one at a time. Any app still on
  Vercel deploys from ADO through the Vercel CLI, with Vercel's Git auto-deploy
  turned off (`"git": { "deploymentEnabled": false }`) to avoid double deploys.

**Lean:** B, reached through C (one app at a time).

### 2. Hosting target per app

- **A — Mixed (proposed):**

  | App                 | Host                          | Scaling        | Why                                                      |
  |---------------------|-------------------------------|----------------|----------------------------------------------------------|
  | Hub                 | App Service (Linux, Node)     | Always on      | Main entry point                                         |
  | Auth                | App Service (Linux, Node)     | Always on      | A cold start during a login redirect would break the UX  |
  | Blazor (new)        | App Service (Linux, .NET)     | Always on      | Interactive Server needs a persistent SignalR connection |
  | Sharpener           | Container Apps                | Scale to zero  | Occasional use                                           |
  | No File No Mile     | Container Apps                | Scale to zero  | Occasional use                                           |
  | Fly Fisher Tracking | Container Apps                | Scale to zero  | Occasional use                                           |

  Teaches both App Service and Container Apps, and gives one ADO template per
  target type.
- **B — Everything on Container Apps.** `minReplicas: 1` for Hub, Auth and
  Blazor. Simpler and similar in cost, but less to learn.
- **C — Azure Static Web Apps for Next.js.** Rejected for now: hybrid Next.js
  support on SWA is still in preview. SWA stays an option for a *standalone
  Blazor WebAssembly* app.

**Lean:** A. All resources go in the same region as the SQL database.

### 3. App Service tier

- **F1 (Free):** rejected. CPU quotas, no SLA, no custom-domain SSL.
- **B1:** ~$13/month, 1 vCPU, 1.75 GB, billed per plan instance (not per app).
  Three apps (2 Node + 1 .NET) is tight on memory.
- **B2:** ~$26/month, 3.5 GB. Scale up in place from B1 if needed.
- **S1+:** adds deployment slots (staging slot + swap, slot-based PR previews)
  at a higher price.

**Lean:** start on B1 and scale to B2 if memory pressure appears. Basic tiers
have **no deployment slots**, so production deploys go direct, behind an ADO
Environment approval check.

### 4. Pipeline agents

New ADO organizations do **not** get free Microsoft-hosted parallel jobs
automatically. The grant request takes ~2–3 business days, sometimes longer.
Once approved: 1 job, 60 min/run, 1,800 min/month for private projects.

- **A — Wait for the hosted grant.**
- **B — Self-hosted agent on Parker's machine.** Every org gets 1 free
  self-hosted parallel job with unlimited minutes. Usable right away. Pipelines
  run only while the machine is on.

**Lean:** do both. Request the grant on day one and run self-hosted until it
arrives.

### 5. Source control

- **A — Move repos to Azure Repos.** Teaches branch policies, build validation
  and native work-item linking. Disrupts the current GitHub board and issue
  workflow (see `github-workflow` conventions) and the `/git-start` and
  `/git-complete` commands.
- **B — Keep GitHub, build from ADO (hybrid).** Common in industry. No change to
  the issue, branch or merge workflow.

**Lean:** B first, A optionally later. Related open point: whether ADO Boards
would *replace* the GitHub project board or only track this migration. Running
two trackers long-term is a cost.

### 6. Shared package registry (wp-ui, wp-server)

The plan proposed publishing the shared UI library to an Azure Artifacts npm
feed. In fact **both** shared packages already publish to GitHub Packages, and
every app authenticates with `WANDERING_PARKER_PACKAGES_TOKEN` in `.npmrc`.

- **A — Keep GitHub Packages.** ADO pipelines just need the token in a variable
  group. No change to `/bump-wp-ui` or the publish-from-`main` rule.
- **B — Move both packages to Azure Artifacts.** Teaches feeds, upstream sources
  and feed views (prerelease vs release). Requires changing every repo's
  `.npmrc`, local dev auth, the publish flow and `/bump-wp-ui`.

**Open.** B has real learning value but touches every repo. It fits better once
the source-control decision (5) is settled.

### 7. Database authentication

- **A — Keep SQL logins**, moving the passwords from Vercel env vars to Key
  Vault.
- **B — Managed identity.** System-assigned identity per App Service /
  Container App, `CREATE USER [<app>] FROM EXTERNAL PROVIDER`, scoped to that
  app's schema. Node uses `azure-active-directory-default`. .NET uses
  `Authentication=Active Directory Default`.

**Lean:** B. It removes secrets entirely and is only possible once compute is on
Azure. It applies to Auth and the child apps; the Hub has no database. It
probably needs a change in wp-server, which owns the SQL pool.

### 8. Infrastructure as code

- **A — Portal / CLI by hand.**
- **B — Bicep, deployed from an ADO pipeline:** resource group, App Service
  Plan, Container Apps environment, ACR, Key Vault, and later the DNS zone.

**Lean:** B. It's reproducible, reviewable, and part of the learning goal.

### 9. DNS and registrar

These are three separate layers: registrar (Vercel), DNS (presumed Vercel), and
hosting (Azure).

- **Registrar:** a transfer can be denied within 60 days of the previous
  inter-registrar transfer, and the domain just moved to Vercel. Azure can't be
  the registrar (App Service Domains don't support transfer-in). If the
  registration moves later, candidates are Cloudflare, Porkbun or Namecheap.
  A transfer adds a year to the expiration, so nothing is lost by waiting.
- **DNS:** no lock. Options are to stay on Vercel DNS and point CNAMEs at Azure
  per subdomain, or to move to an Azure DNS zone (~$6–7/year) once nothing is
  hosted on Vercel.

**Lean:** cut over subdomain by subdomain using CNAMEs in Vercel DNS. Consider
Azure DNS (in Bicep) only after all apps are off Vercel. No registrar move
before 60+ days, ideally around renewal.

### 10. Blazor hosting model

- **Interactive Server:** App Service, always on, Web Sockets enabled. On
  Container Apps it would need `minReplicas: 1`, because scale-to-zero drops
  SignalR circuits.
- **Auto / WebAssembly with server:** App Service or Container Apps.
- **Standalone WebAssembly:** Static Web Apps (free tier) plus a separate API.

**Open.** It depends on what the app does, which hasn't been decided.

### 11. Pilot app

The plan says to pilot "one low-risk app" on App Service first. **That's
internally inconsistent.** The low-risk apps (Sharpener, NFNM, FFT) are slated
for Container Apps. The only App Service apps are Hub and Auth, both high-risk,
plus a Blazor app that doesn't exist yet.

- **A — Pilot Hub on App Service.** No database, so no managed-identity work.
  But it's the main entry point.
- **B — Pilot a low-risk app on Container Apps first.** Reverses the phase
  order: the container template comes before the App Service template.
- **C — Temporarily host one low-risk app on App Service,** then move it to
  Container Apps in phase 2. Low risk, but some work is thrown away.

**Open.** Hub (A) is a reasonable middle ground because it has no database and
is easy to roll back with a CNAME revert. Auth should not go first under any
option.

## Decision

**None yet.** The record stays `Proposed` until the open items (6, 10, 11) are
settled and the leaning items are confirmed.

## Consequences (if adopted as currently leaning)

**Positive**

- Real experience with ADO pipelines, environments, templates, Key Vault,
  workload-identity service connections, Bicep, App Service and Container Apps.
- No database passwords anywhere, through managed identity.
- Compute in the same region as the database.
- Predictable cost: roughly $13–26/month for the App Service plan, plus a few
  dollars for Container Apps, ACR Basic, and optionally Azure DNS
  *(Nov 2026 East US estimates; verify in the Azure pricing calculator)*.

**Trade-offs accepted**

- **Lost Vercel features:** PR previews must be rebuilt as a pipeline stage.
  There's no edge CDN or image optimization unless Front Door or Cloudflare is
  added later.
- **Cold starts** on scale-to-zero child apps. Mitigate with `minReplicas: 1`
  if they annoy.
- **ISR and the data cache are per instance.** Keep one replica per app, or add
  a shared cache before scaling out.
- **Self-hosted agent dependency** until the hosted grant arrives.
- **Two places to look** (GitHub for code, ADO for pipelines) under the hybrid
  model.

**Risks to manage**

- **Auth cutover:** the cross-subdomain JWT cookie domain and redirect URIs
  must keep working while apps are split across Vercel and Azure. Check
  `proxy.ts` and other Vercel-specific behavior (edge runtime, env var names)
  before moving Auth.
- **Domain claims:** remove each subdomain from its Vercel project's Domains
  settings before cutover so Vercel stops claiming it.

**Required code changes**

- `output: "standalone"` in each app's `next.config` (needed for zip-deploy and
  small Docker images).
- Dockerfiles for the Container Apps targets.
- A managed-identity option in wp-server's SQL pool.

## Open Questions

- Which app is the pilot (see 11)?
- Blazor hosting model, and what the app will do (see 10)?
- Keep the shared packages on GitHub Packages or move them to Azure Artifacts
  (see 6)?
- Would ADO Boards replace the GitHub project board, or only track this
  migration?
- Confirm where DNS currently lives (Vercel DNS vs elsewhere).
- Which Azure region holds the SQL database? All new resources should match it.
- Does Auth rely on Vercel-specific features (edge middleware, env var naming)?

## What Would Change This

- **The learning goal fades** or the time cost becomes too high. Staying on
  Vercel (option 1A) is then the better trade.
- **Azure costs land well above estimates**, especially if B1 isn't enough and
  the plan needs S1+ for slots.
- **Static Web Apps' hybrid Next.js support reaches GA,** which would reopen
  SWA as a cheaper App Service alternative.
- **Usage grows** enough that per-instance ISR caching or scale-to-zero cold
  starts become real problems.
