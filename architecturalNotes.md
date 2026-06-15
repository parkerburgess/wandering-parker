# Data Access Architecture Options

## Context

The parent site (`wanderingparker`) links to child project subdomains. Auth is centralized
in a standalone service (`auth-wandering-parker`, Express + Better Auth). Each child app
currently manages its own data access. These notes capture the options considered for
evolving that structure.

---

## Database Schema Organization

All services share a single SQL Server instance. The recommended layout uses SQL Server
schemas as namespace boundaries:

| Schema | Owner | Tables |
|---|---|---|
| `dbo` | Auth service | `user`, `session`, `account`, `AppAccess`, Better Auth internals |
| `wanderingparker` | Parent site | `Project`, any parent-level metadata |
| `talent_position_tracker` | That child app | `Category`, `Job`, `Scale`, `Talent` |
| `patan`, `flash_cards`, etc. | Each child | Their own tables |

`AppAccess` stays in `dbo` even though it references `wanderingparker.Project` — it is
an auth concept (who can access what), not a project concept. SQL Server supports
cross-schema FKs without issues.

---

## ORM Options

### Prisma (current)
- Schema defined in a proprietary `.prisma` DSL, client is generated
- Queries are abstracted: `prisma.user.findMany({ where: { ... } })`
- Multi-schema support exists but is a **preview feature** (`multiSchema`) — stable in
  practice, but API may change before GA
- Cross-schema FK relationships cannot be modeled in Prisma's type system; must be
  handled with raw SQL
- Best fit: single-schema apps, rapid development

### Drizzle
- Schema defined in TypeScript; queries read like SQL:
  `db.select().from(appAccess).where(eq(appAccess.userId, id))`
- Multi-schema support is first-class, no preview flag required
- Migrations are plain `.sql` files the developer owns
- Better Auth has an official Drizzle adapter (`better-auth/adapters/drizzle`)
- Best fit: projects where explicit SQL control and multi-schema are priorities

### MikroORM
- Closest JS equivalent to EFCore: decorator-based entities, Unit of Work, Identity Map,
  change tracking, code-first migrations
- `EntityManager` ≈ `DbContext`; `EntityRepository<T>` ≈ `DbSet<T>`
- SQL Server is supported
- No official Better Auth adapter — would require a custom adapter or the generic adapter
- Best fit: developers with EFCore background who want familiar patterns

### TypeORM
- Decorator-based, EFCore-inspired, widely known
- Has stagnated; accumulated rough edges; most teams have moved to Drizzle or MikroORM
- Not recommended for new projects

---

## Service Architecture Options

### Option A — Direct DB access in Next.js (current direction)
Each child app is a full-stack Next.js application. Server Components and Server Actions
query the database directly. The auth service is the only separate process.

- Pros: idiomatic Next.js, lowest latency, least infrastructure
- Cons: all child apps must use a JS/TS ORM; no polyglot backends

### Option B — External service per subdomain
Each child app gets a dedicated backend service at `service.{subdomain}.wanderingparker.com`.
The Next.js app becomes a thin UI layer that calls this service for data.

- Pros: full technology freedom — one service could use EFCore (.NET), another Drizzle,
  another Prisma; independent deployment and scaling
- Cons: adds a network hop on every data request (Next.js server → service → DB);
  fights Next.js's full-stack grain; significant infrastructure overhead per child app;
  requires auth token forwarding on every request

### Option C — Shared DB, each app owns its schema (recommended middle ground)
Each child Next.js app accesses only its own SQL Server schema directly. The `wanderingparker`
schema holds shared parent-site metadata. No external service tier needed.

- Pros: retains Next.js's direct DB access benefits; clean namespace isolation;
  per-app Prisma clients scoped to their schema
- Cons: all apps remain JS/TS; cross-schema queries require raw SQL or careful coordination

---

## Auth Service DAL

The auth service (`auth-wandering-parker`) should keep its data access internal regardless
of which option is chosen above. It is a security-critical, narrow-purpose service.
Exposing a separate data tier for auth adds failure points to the most critical path in
the system. Better Auth is designed to own its persistence directly.
