# KaGet Documentation

KaGet (Kawan Budget) is a personal budgeting app built on **envelope allocation**: money moves from a **Wallet** into a **Budget** or **Goal** before it is spent. Budgets are funded pools, not soft category limits on a shared balance.

Domain language: [`CONTEXT.md`](../CONTEXT.md).

## Product architecture (short)

| Layer | Holds |
|-------|--------|
| **Device (Dexie)** | Working ledger — canonical while you use the app |
| **Your Google Drive** (optional) | Durable JSON copy of the same ledger |
| **KaGet API** | Google sign-in + Drive access broker only — **not** your transactions |

See [PRD: Local-first + Drive sync](./developer-guide/prd/001-local-first-drive-sync.md) and [ADR-007](./developer-guide/adr/007-local-first-drive-custodian-boundary.md).

## Documentation structure

### [User Guide](./user-guide/)

Task-oriented docs for people using KaGet.

- [Onboarding](./user-guide/onboarding/) — Get started (no account required)
- [Wallets](./user-guide/wallets/) — Real-world money accounts
- [Records](./user-guide/records/) — Income and expenses
- [Budgets](./user-guide/budgets/) — Spending envelopes and saving goals
- [Transfers](./user-guide/transfers/) — Move money between wallets and budgets
- [Debts & Loans](./user-guide/debts-loans/) — Money borrowed or lent
- [Settings](./user-guide/settings/) — Preferences, import/export, Drive sync

### [Developer Guide](./developer-guide/)

- [PRDs](./developer-guide/prd/) — Product requirements for major changes
- [Features](./developer-guide/features/) — Local domain models and operations
- [ADRs](./developer-guide/adr/) — Architecture decisions

## Features

| Feature | User Guide | Developer Guide |
| -------- | ---------- | ---------------- |
| Onboarding | [Getting Started](./user-guide/onboarding/getting-started.md) | [Flow](./developer-guide/features/onboarding/flow.md) |
| Wallets | [Managing Wallets](./user-guide/wallets/) | [Data Model](./developer-guide/features/wallets/data-model.md), [Operations](./developer-guide/features/wallets/operations.md) |
| Records | [Creating Records](./user-guide/records/) | [Data Model](./developer-guide/features/records/data-model.md), [Operations](./developer-guide/features/records/operations.md) |
| Budgets | [Using Budgets](./user-guide/budgets/) | [Data Model](./developer-guide/features/budgets/data-model.md), [Operations](./developer-guide/features/budgets/operations.md) |
| Transfers | [Creating Transfers](./user-guide/transfers/) | [Data Model](./developer-guide/features/transfers/data-model.md), [Operations](./developer-guide/features/transfers/operations.md) |
| Settings | [App Settings](./user-guide/settings/) | [Data Model](./developer-guide/features/settings/data-model.md), [Operations](./developer-guide/features/settings/operations.md) |
| Debts & Loans | [Managing Debts & Loans](./user-guide/debts-loans/) | [Data Model](./developer-guide/features/debts-loans/data-model.md), [Operations](./developer-guide/features/debts-loans/operations.md) |
