# 0001 — Database Hosting Platform

- **Status:** Accepted
- **Date:** 2026-10-31
- **Deciders:** Parker Burgess

########################################################################################
## TLDR: Non-Claude summary
I'm on a serverless Azure db and it's costing me $30 a month now.
Neon/postgres is a nice idea but more work and other things take priority.
I'm going with an Azure Standard S0 (10 DTU and 30gb) db to reduce cost, improve UX, and simplify code
########################################################################################



## Context

The platform's data currently lives in a single **Azure SQL Database** on the
**serverless** compute tier. It started on free Azure credits; with those spent,
it now costs roughly **$30/month**, and usage is expected to grow modestly.

Two problems drove this decision:

1. **Cost.** $30/month for the current workload is more than it should be, and
   the trend is upward.
2. **Cold starts.** The serverless tier auto-pauses after a period of
   inactivity to save money. Resuming takes ~30–60 seconds, during which
   connections fail. This produces a poor first-request user experience *and*
   forces extra warm-up/retry code into the data layer that exists only to
   paper over the pause.

The underlying tension is inherent to serverless compute: **auto-pause makes it
cheap but introduces cold starts; keeping it always-on removes cold starts but
you pay around the clock.** A wider survey of hosting options (managed Postgres
on several platforms, self-hosting, SQLite-based services) was done; this record
documents the two finalists that best fit the platform's actual needs.

## Options Considered

### Option A — Azure SQL Database, Standard S0 (provisioned, DTU model)

Stay on the current engine, but switch from the serverless tier to a
**provisioned** tier billed at a flat rate.

- **Cost:** ~$15/month, flat and predictable *(as of October 2026)*.
- **Cold starts:** None. The database is always on.
- **Capacity:** 10 DTU, 250 GB — comfortable headroom for modest growth.
- **Migration effort:** Effectively zero. Same engine (SQL Server), same
  dialect, same tooling, same connection code.
- **Trade-off:** You pay 24/7 even while idle — but at S0's low flat rate that
  is cheaper than today's serverless bill.

### Option B — Neon (serverless Postgres)

Move to a modern serverless Postgres platform.

- **Cost:** ~$5–19/month depending on usage; an idle database costs ~$0
  *(as of October 2026)*.
- **Cold starts:** Scale-to-zero like Azure's serverless tier, **but resume is
  sub-second** rather than 30–60 seconds — small enough that the warm-up code
  could largely be removed. Scale-to-zero can also be disabled outright.
- **Developer experience:** Genuinely strong — first-class serverless driver
  for Next.js, and database branching that maps cleanly onto preview
  deployments.
- **Migration effort:** Non-trivial. It's a different engine (PostgreSQL), which
  means a dialect migration and adopting an unfamiliar platform.

Neon is a legitimately good option. It arguably has the better long-term
economics (near-zero cost when idle without the painful cold start) and the
nicer developer experience. The decision below is **not** "Neon is worse" — it's
a judgment about switching cost and timing.

### Comparison

| Dimension            | Azure SQL S0                | Neon                              |
|----------------------|-----------------------------|-----------------------------------|
| Monthly cost\*       | ~$15 flat                   | ~$5–19 (≈$0 when idle)            |
| Cold start           | None (always on)            | Sub-second (or disable scale-to-zero) |
| Migration effort     | None                        | Dialect migration + new platform  |
| Engine / dialect     | SQL Server (unchanged)      | PostgreSQL (new)                   |
| Vendor footprint     | Stays all-Azure             | Adds a second vendor              |
| Developer experience | Familiar                    | Modern, Next.js-friendly, branching |

\* As of October 2026. Prices change; this decision rests on the reasoning
below, not on these figures.

## Decision

**Adopt Azure SQL Database, Standard S0 (provisioned).**

The reasoning, in order of weight:

1. **It is the simplest path right now.** No migration, no dialect change, no
   new platform to learn. The only code change is *deleting* the warm-up/retry
   logic — the switch from serverless to provisioned is a configuration change.
2. **It fixes the cold-start problem outright.** An always-on tier means no
   auto-pause, so the poor first-request experience disappears completely.
3. **It costs less than today and stays predictable.** ~$15/month flat versus
   ~$30 on serverless, with ample capacity for the expected modest growth.
4. **Opportunity cost is the deciding factor.** There is a backlog of
   higher-priority work. Neon would add a migration and a new-platform learning
   curve; even assuming that curve is shallow, now is not the right time to
   spend attention there. The platform does not yet use PostgreSQL, and this
   decision deliberately avoids taking that on today.

In short: Neon is the more interesting long-term bet, but Azure S0 is the
lower-cost, lower-risk, lower-effort move *for the situation right now*, and it
resolves both of the problems that triggered this decision.

## Consequences

**Positive**

- Monthly cost drops from ~$30 to ~$15.
- Cold starts are eliminated; the warm-up/retry code can be removed, simplifying
  the data layer.
- No migration risk; tooling and team knowledge (SQL Server) stay intact.
- Single-vendor simplicity is preserved.

**Trade-offs accepted**

- Compute is billed 24/7 even when idle (acceptable at S0's flat rate).
- The platform stays on a single cloud vendor rather than diversifying.
- The benefits of serverless-Postgres economics and developer experience are
  deferred, not rejected.

**Follow-up**

- Remove the serverless warm-up/retry code once the tier switch is live.
- Monitor DTU utilization so the next tier step (S1/S2) is a deliberate choice,
  not a surprise.

## What Would Change This

This decision should be revisited if any of the following becomes true:

- Growth pushes the workload past S0's headroom in a way where serverless
  autoscaling would be more cost-effective than stepping up DTU tiers.
- A **greenfield** service is added where there is no existing schema to
  migrate — removing the main cost of choosing Postgres.
- Time becomes available to invest in PostgreSQL and its ecosystem, at which
  point Neon's branching-per-preview-deploy workflow becomes attractive on its
  own merits.
- Azure SQL pricing changes in a way that erodes the flat-rate advantage.
