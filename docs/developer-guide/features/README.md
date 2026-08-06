# Features

Technical documentation for each KaGet feature.

These docs describe the **local domain model** (Dexie / `*.services.ts`): shapes, invariants, and operations. They are **not** a Postgres schema. Persistence of this ledger on KaGet servers is forbidden — see [ADR-007](../adr/007-local-first-drive-custodian-boundary.md) and [PRD 001](../prd/001-local-first-drive-sync.md).

SQL-looking field tables in older pages are **logical** models for the client (and the Drive/export JSON), not API tables.

## Adding a Dexie-backed feature

1. Zod schemas in `features/{feature}/data/{feature}.schemas.ts`
2. Dexie logic in `features/{feature}/data/{feature}.services.ts` only
3. `queryOptions` + hooks in `*.queries.ts` / `*.mutations.ts`
4. UI in `features/{feature}/components/` and `pages/`
5. Thin route file under `apps/web/src/routes/…/*.route.tsx` → `bun run gen:routes` if types break
6. Document here under `features/{feature}/` when non-trivial

## Contents

- [Onboarding](./onboarding/) — First-time setup and currency selection
- [Wallets](./wallets/) — Wallet data model and operations
- [Records](./records/) — Record data model and operations
- [Budgets](./budgets/) — Budget and goal data model and operations
- [Transfers](./transfers/) — Transfer data model and double-entry system
- [Settings](./settings/) — Settings, import/export, Drive document
- [Debts & Loans](./debts-loans/) — Debt/loan tracking and record integration
