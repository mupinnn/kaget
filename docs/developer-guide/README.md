# Developer Guide

Technical documentation for engineers and agents working on KaGet.

## Architecture (read first)

- **Domain language:** [`CONTEXT.md`](../../CONTEXT.md)
- **Product direction:** [PRD 001 — Local-first + Drive sync](./prd/001-local-first-drive-sync.md)
- **Custodian boundary:** [ADR-007](./adr/007-local-first-drive-custodian-boundary.md)

| Concern | Where it lives |
|---------|----------------|
| Envelope rules, balances, CRUD for ledger entities | `apps/web` Dexie + `features/*/data/*.services.ts` |
| Optional durable file | User’s Google Drive (export JSON schema) |
| Google OAuth, token refresh, Drive I/O, `fileId` | `apps/api` + Postgres (**auth/pointer only**) |

Do **not** add server CRUD for Wallets/Records/Budgets/etc. without a new ADR that explicitly reverses ADR-007.

Feature data-model docs describe the **local domain model** (shapes and invariants), not Postgres tables.

## Contents

### Product

- [PRDs](./prd/) — Requirements for major initiatives

### Process

- [Release and deploy](./release-and-deploy.md) — release-please, branch protection, parachute VPS deploy

### API

- [API Route Handlers](./api-route-handlers.md) — Error handling, validation, wide-event logging
- [API Testing](./testing.md) — PGlite, testClient, assertion helpers

API scope after ADR-007: auth, Drive broker, health/me — **not** domain ledgers.

### Features (local domain)

- [Onboarding](./features/onboarding/)
- [Wallets](./features/wallets/)
- [Records](./features/records/)
- [Budgets](./features/budgets/)
- [Transfers](./features/transfers/)
- [Settings](./features/settings/) — import/export + sync document
- [Debts & Loans](./features/debts-loans/)

### Architecture Decision Records

- [ADR index](./adr/)
