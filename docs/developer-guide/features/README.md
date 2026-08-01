# Features

Technical documentation for each KaGet feature.

These docs describe the **local domain model** (Dexie / `*.services.ts`): shapes, invariants, and operations. They are **not** a Postgres schema. Persistence of this ledger on KaGet servers is forbidden — see [ADR-007](../adr/007-local-first-drive-custodian-boundary.md) and [PRD 001](../prd/001-local-first-drive-sync.md).

SQL-looking field tables in older pages are **logical** models for the client (and the Drive/export JSON), not API tables.

## Contents

- [Onboarding](./onboarding/) — First-time setup and currency selection
- [Wallets](./wallets/) — Wallet data model and operations
- [Records](./records/) — Record data model and operations
- [Budgets](./budgets/) — Budget and goal data model and operations
- [Transfers](./transfers/) — Transfer data model and double-entry system
- [Settings](./settings/) — Settings, import/export, Drive document
- [Debts & Loans](./debts-loans/) — Debt/loan tracking and record integration
