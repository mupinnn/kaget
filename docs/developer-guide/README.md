# Developer Guide

Technical documentation for engineers working on KaGet.

## Contents

### API

- [API Route Handlers](./api-route-handlers.md) — Error handling, validation, and wide-event logging conventions
- [API Testing](./testing.md) — PGlite, testClient, and assertion helpers

### Features

Technical flows and implementation details for each feature.

- [Onboarding](./features/onboarding/) — Onboarding flow and locale handling
- [Wallets](./features/wallets/) — Wallet data model and operations
- [Records](./features/records/) — Record data model and operations
- [Budgets](./features/budgets/) — Budget and goal data model and operations
- [Transfers](./features/transfers/) — Transfer data model and double-entry system
- [Settings](./features/settings/) — Settings data model and import/export
- [Debts & Loans](./features/debts-loans/) — Debt/loan tracking and record integration

### Architecture Decision Records

Key technical decisions and their rationale.

- [ADR-001: Locale and Currency Handling](./adr/001-locale-and-currency-handling.md)
- [ADR-002: Balance as Denormalized Cache](./adr/002-balance-as-denormalized-cache.md)
- [ADR-003: Cascade Delete on Wallet Removal](./adr/003-cascade-delete-on-wallet-removal.md)
- [ADR-004: Tooling Stack Migration](./adr/004-tooling-stack-migration.md)

## Contributing

See the main repository for contribution guidelines.
