# Architecture Decision Records

This directory contains Architecture Decision Records (ADRs) for KaGet.

## What is an ADR?

An ADR documents a significant architectural decision made during the project, including the context, the decision itself, and its consequences.

## ADR Template

Each ADR follows this structure:

- **Status** — Proposed, Accepted, Deprecated, Superseded
- **Date** — When the decision was made
- **Context** — The situation and problem being addressed
- **Decision** — What was decided
- **Consequences** — Positive, negative, and neutral outcomes
- **Alternatives Considered** — Other options that were evaluated

## Index

| ADR                                              | Title                            | Status   | Date       |
| ------------------------------------------------ | -------------------------------- | -------- | ---------- |
| [001](./001-locale-and-currency-handling.md)     | Locale and Currency Handling     | Accepted | 2026-02-04 |
| [002](./002-balance-as-denormalized-cache.md)    | Balance as Denormalized Cache    | Accepted | 2026-02-04 |
| [003](./003-cascade-delete-on-wallet-removal.md) | Cascade Delete on Wallet Removal | Accepted | 2026-02-04 |
| [004](./004-tooling-stack-migration.md)       | Tooling Stack Migration          | Accepted | 2026-06-02 |
| [005](./005-release-and-versioning-strategy.md) | Release and Versioning Strategy | Accepted | 2026-07-22 |
| [006](./006-vps-deployment-via-parachute.md)  | VPS Deployment via parachute     | Accepted | 2026-07-22 |
| [007](./007-local-first-drive-custodian-boundary.md) | Local-first + Drive; API not a ledger custodian | Accepted | 2026-08-01 |

**Note:** ADR-002 and ADR-003 apply to the **client** domain engine (Dexie). ADR-007 forbids persisting that ledger in Postgres. ADR-006’s `db` service remains for **auth/token/pointer** data only after the Drive revamp.
