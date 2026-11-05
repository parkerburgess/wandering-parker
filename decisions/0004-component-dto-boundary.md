# 0004 — Component DTO Boundary: Components Know Nothing About the Data Source

- **Status:** Accepted
- **Date:** 2026-11-04
- **Deciders:** Parker Burgess

########################################################################################
## TLDR: Non-Claude summary
_To be written by Parker._
########################################################################################



## Context

Issue #43: every app should keep its UI components completely separate from the data
source, so a component can be hydrated by anything — the SQL DAL, mock data, another API,
a component gallery.

The problem surfaced in fly-fishing-tracker. Its outings table sorted by clicking a
column header; the header's key went into the URL, the page cast it (unvalidated) to the
DAL's `OutingSortField`, and `SqlDataAccess` mapped it through a `SORT_COLUMNS` record to
a SQL column for `ORDER BY`. The column names themselves never reached the UI, but the
**contract between the table and the DAL was untyped strings that only worked by
coincidence** — and three headers (Caught, Lost, Missed) had no matching DAL key, so they
silently sorted by date.

Looking wider, the coupling was structural, not a single bug:

- **The DAL carried UI needs.** Every new sortable column meant a change to the data
  layer and its interface.
- **Components had no named contract.** Each one declared a private props interface, and
  each page built matching objects inline from domain types. Hydrating a component from
  anywhere else meant copying a shape that had no name.
- **Business logic was scattered.** Ordering lived in the DAL, "show only mine" filtering
  lived in pages, and `DeleteOutingButton` imported a server action directly.

The underlying principle being settled: **sorting, filtering and any data manipulation
beyond casting is business logic, and the DAL should know nothing about it.** In .NET
terms, the DAL is a repository that returns entities; components bind to view models
(here, DTOs) and never see an entity.

## Options Considered

### A — Status quo

DAL accepts sort parameters and builds `ORDER BY`; components declare their own prop
shapes; pages map inline.

- **For:** Fewest moving parts. The database does the sorting, which is efficient with an
  index and is where sorting has to happen if paging is ever added. `SORT_COLUMNS` was a
  type-checked whitelist, so the interpolated `ORDER BY` was injection-safe.
- **Against:** Every problem in Context: untyped sort contract, broken columns, DAL shaped
  by UI needs, no named component contract, unvalidated URL input.

### B — Tighten the contract, keep sorting in the DAL

Define one typed list of sort fields shared by the UI and the DAL, validate `searchParams`
against it, and type the component props with it. The DAL still owns `ORDER BY`.

- **For:** Small change. Fixes the broken columns and the unvalidated cast. Keeps
  database-side sorting.
- **Against:** Treats the symptom. The UI and the DAL still share a sort vocabulary, so
  the DAL still changes whenever the UI wants a new sort, and components still aren't
  hydratable from anything else. It also requires maintaining a list of sortable fields.

### C — DTO boundary, logic in components (chosen)

Four layers with one job each:

```
DAL                read the data source, cast rows → domain types. No sort, no filter.
Hydration layer    map + cast domain types → DTOs. Nothing else.
DTOs               plain, serializable, per-component contracts.
Components         import only DTOs; sort, filter and present them.
Pages              composition root: call DAL → hydrate → render.
```

Sorting works on **any DTO property**: the component's column definitions name a
`sortKey: keyof RowDto`, and one generic comparator sorts on whichever key is chosen.
There is no list of sortable fields to maintain. Behavior (server actions) is passed into
components as props rather than imported.

- **For:** Components depend on nothing but their DTO. The DAL never changes for UI
  reasons. Adding a sortable column is a one-line change in the component. Every layer's
  responsibility is obvious, so logic is easy to find.
- **Against:** More files and a third representation of the data (SQL row, domain type,
  DTO). Sorting moves to the browser, which assumes all rows are loaded. Details in
  Consequences.

### Comparison

|                                   | A — Status quo | B — Typed contract | C — DTO boundary |
|-----------------------------------|----------------|--------------------|------------------|
| Components know the data source   | Indirectly     | Indirectly         | No               |
| DAL changes for a new sort column | Yes            | Yes                | No               |
| Sort contract type-checked        | No             | Yes                | Yes              |
| Components hydratable elsewhere   | Only by copying shapes | Only by copying shapes | Yes, by named DTO |
| Where sorting runs                | Database       | Database           | Browser          |
| Works with paging as-is           | Yes            | Yes                | No (see below)   |
| Files / representations           | Fewest         | Fewest             | Most             |

## Decision

**Adopt option C. Components bind only to per-component DTOs; the DAL performs I/O and
casting only; the hydration layer maps and casts only; sorting, filtering and other
business logic live in the component — or, when that gets heavy, in a logic / viewmodel
layer that backs the component.**

The rules:

1. **DAL:** reads and writes the data source and casts rows to domain types. No
   `ORDER BY` for presentation, no filtering for presentation, no sort parameters.
   Choosing *which records to read* — by id, by owner — is data access and stays in the
   DAL (it is also an authorization boundary, e.g. `WHERE UserId = @userId` on updates).
   Reordering or narrowing a result set for display is not.
2. **Hydrators:** pure functions from domain types to DTOs (e.g. ids → `string`,
   dates → strings). No sorting, filtering or other logic.
3. **DTOs:** one per component (not one shared DTO per entity, which would re-couple the
   components that use it). Plain and serializable so they cross the server → client
   boundary safely.
4. **Components:** import only DTO types — never domain types, the DAL, or server
   actions. Actions arrive as props. Any DTO property can be a sort key.

The reasoning, in order of weight:

1. **The goal is substitutability.** A component that depends only on its DTO can be fed
   by anything; that is the requirement in #43, and only C meets it.
2. **The DAL should change for data reasons, not UI reasons.** Under A and B, a new
   sortable column is a data-layer change. Under C it never is.
3. **Business logic needs one home.** Splitting ordering, filtering and action calls
   across the DAL, pages and components made the outings bug possible. C puts it all in
   the component, with a clear upgrade path (a backing viewmodel) when it grows.
4. **The cost is acceptable at current scale.** The apps load hundreds of rows, not
   hundreds of thousands, so browser-side sorting is instant.

## Consequences

**Positive**

- Components are hydratable from any source and testable with plain objects.
- Fly-fishing-tracker's Caught / Lost / Missed columns sort correctly; bad sort values in
  the URL fall back safely.
- New sortable columns need no DAL, type or page changes.
- Pages become short composition roots: DAL call → hydrate → render.

**Trade-offs accepted**

- **All rows go to the browser.** Fine today. If paging is ever needed, sorting can't stay
  in the component alone — sorting one page isn't sorting the data. See What Would Change
  This.
- **The URL now names DTO properties** (`?sort=dateKey`, `?sort=userName`). Renaming a DTO
  field breaks bookmarked links — a small version of the original leak. A `urlKey` on each
  column definition would decouple them.
- **The generic comparator is looser than it looks.** It accepts any key and casts the
  value to `string | number | null`; a boolean or object field would compile and sort
  oddly. Constraining keys to sortable value types fixes it.
- **Hydrators make display decisions.** Date format strings (`"MMM d, yyyy"`) are
  presentation, not casting, and any other hydrator has to reproduce them. The alternative
  is ISO dates in DTOs with formatting in the component.
- **More code and some duplication:** three representations of each entity, and
  hydrators that repeat date formatting and field copying.

**Follow-up (slice status)**

- [x] **fly-fishing-tracker** — implemented in `b31f0b1` (`Refs #43`): `src/dto`,
  `src/lib/hydrate`, sort-free DAL, component-side sorting and filtering.
  Remaining there:
  - `OutingForm` still imports `@/lib/constants` and `@/lib/scoring` (pure, no data source).
  - `PhotoUploader` still posts to `/api/upload` directly (could take an `onUpload` prop).
  - The outing detail and user pages render domain objects directly rather than through
    DTO-driven components.
- [ ] **no-file-no-mile**
- [ ] **sharpener**
- [ ] **hub (`wandering-parker`)**
- [ ] **Optional hardening** — `urlKey` on column definitions, constrain comparator keys to
  sortable types, share date formatting across hydrators.

## What Would Change This

- **Data grows or paging is needed** → this rule is under real tension and must be
  revisited. Correct paging needs the full set ordered before it is sliced. Either a
  query / viewmodel layer loads all rows and sorts and pages them in memory (keeps the
  rule, costs memory and transfer), or the DAL accepts a neutral query spec — sort key,
  direction, page — and lets the database order it (bends the rule for scale). Decide
  then, with real row counts.
- **A component moves into the shared `wp-ui` package** → its DTO moves with it, so every
  app hydrates the same contract.
- **Components become server-only** → the serializable constraint relaxes (e.g. real
  `Date` objects in DTOs), and formatting can move out of hydrators.
