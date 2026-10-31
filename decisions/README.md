# Decisions

A log of notable technical decisions made on the Wandering Parker platform,
with the reasoning behind each one.

The goal of this folder is to capture *why* a choice was made — the options on
the table, the trade-offs weighed, and what would cause the decision to be
revisited — not just what was ultimately chosen. Each record is a lightweight
[Architecture Decision Record (ADR)](https://adr.github.io/): a short,
standalone document that stays accurate because it's anchored to reasoning
rather than to details that age (prices, versions, dashboards).

## Records

| #    | Decision                        | Status   | Date       |
|------|-------------------------------------------------where------|----------|------------|
| 0001 | [Database hosting platform](0001-database-hosting.md) | Accepted | 2026-10-31 |

## Adding a record

1. Copy the structure of an existing record.
2. Number it with the next sequential ID (`0002-…`, `0003-…`) and a short,
   kebab-case title.
3. Use the sections: **Status · Context · Options Considered · Decision ·
   Consequences · What Would Change This**.
4. Add a row to the table above.

A decision is never deleted. If it's reversed or replaced, mark its **Status**
as `Superseded by 00NN` and write a new record — the history is part of the
value.
