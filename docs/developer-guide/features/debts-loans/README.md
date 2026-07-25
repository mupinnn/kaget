# Debts & Loans

Technical documentation for the Debts & Loans feature.

## Overview

Debts & Loans tracks money borrowed or lent, integrated with Wallets and Records for proper balance management.

- **Debt** — User borrowed money (payable)
- **Loan** — User lent money (receivable)

Each debt/loan creates records that affect wallet balances.

## Contents

- [Data Model](./data-model.md) — Schema and relationships
- [Operations](./operations.md) — CRUD operations, business logic, and REST API

## Key Concepts

### Record Types

Four new record types support debts & loans:

| Record Type       | When Created | Balance Impact |
| ----------------- | ------------ | -------------- |
| `DEBT`            | Create debt  | + (increase)   |
| `DEBT_REPAYMENT`  | Resolve debt | − (decrease)   |
| `LOAN`            | Create loan  | − (decrease)   |
| `LOAN_COLLECTION` | Resolve loan | + (increase)   |

### State Machine

```
┌──────────────┐
│   PENDING    │ ← Created with initial record
└──────┬───────┘
       │ Mark as done
       ▼
┌──────────────┐
│   RESOLVED   │ ← resolved_at set, resolution record created
└──────────────┘
```

### Integration with Records

Each DebtLoan links to:

1. `initial_record_id` — Created when debt/loan is created
2. `resolved_record_id` — Created when marked as done

### Edit Behavior

Pending debts and loans can be updated (`note`, `other_party`, `amount`, `occurred_at`). Amount changes recalculate wallet balance and sync the initial record. Resolved debts and loans are immutable.

### Delete Behavior

Unlike Transfers (immutable), Debts & Loans can be deleted:

- Deletes associated records
- Reverses balance changes
- Removes the DebtLoan entity

## Related

- [Record Data Model](../records/data-model.md) — Record types including DEBT/LOAN
- [Wallet Data Model](../wallets/data-model.md) — Balance updates
