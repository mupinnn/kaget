# Budgets Data Model

Technical documentation for the budget data structure and relationships.

## Schema

```
Budget
├── id              UUID        PK
├── name            VARCHAR
├── wallet_id       UUID        FK → Wallet
├── balance         DECIMAL     Current balance
├── total_balance   DECIMAL     Original/target allocation
├── budget_type     ENUM        (BUDGET, GOAL)
├── created_at      TIMESTAMP
├── updated_at      TIMESTAMP
└── archived_at     TIMESTAMP   NULL if active
```

## Field Details

| Field           | Type          | Constraints   | Description                                   |
| --------------- | ------------- | ------------- | --------------------------------------------- |
| `id`            | UUID          | PK, NOT NULL  | Unique identifier                             |
| `name`          | VARCHAR(255)  | NOT NULL      | User-defined budget name                      |
| `wallet_id`     | UUID          | FK, NOT NULL  | Source wallet reference                       |
| `balance`       | DECIMAL(19,4) | NOT NULL, ≥ 0 | Current available balance                     |
| `total_balance` | DECIMAL(19,4) | NOT NULL, > 0 | Original allocation (budget) or target (goal) |
| `budget_type`   | ENUM          | NOT NULL      | `BUDGET` or `GOAL`                            |
| `created_at`    | TIMESTAMP     | NOT NULL      | Creation timestamp                            |
| `updated_at`    | TIMESTAMP     | NOT NULL      | Last modification timestamp                   |
| `archived_at`   | TIMESTAMP     | NULL          | When archived; NULL if active                 |

## Budget Types

### BUDGET (Spending Allocation)

| Aspect        | Behavior                                                  |
| ------------- | --------------------------------------------------------- |
| Initial state | `balance = total_balance` (fully funded)                  |
| Direction     | Decreases as user spends                                  |
| Spending      | Allowed immediately                                       |
| Completion    | `balance = 0` → auto-archive                              |
| Add funds     | Increases balance up to `total_balance` (wallet → budget) |
| Refund        | Decreases balance (budget → wallet)                       |
| Reactivate    | Restore archived budget with same or new allocation       |

### GOAL (Saving Target)

| Aspect        | Behavior                                    |
| ------------- | ------------------------------------------- |
| Initial state | `balance = initial_contribution` (may be 0) |
| Direction     | Increases as user contributes               |
| Spending      | Locked until `balance = total_balance`      |
| Completion    | `balance = total_balance` → unlocked        |
| Contribute    | Increases balance (wallet → goal)           |
| Release       | Returns balance to wallet                   |

## Balance Semantics

| Operation         | Budget Type    | balance           | total_balance | wallet.balance |
| ----------------- | -------------- | ----------------- | ------------- | -------------- |
| Create            | BUDGET         | +amount           | = amount      | −amount        |
| Create            | GOAL           | +initial (or 0)   | = target      | −initial       |
| Add/Contribute    | Both           | +amount (≤ total) | Unchanged     | −amount        |
| Refund/Release    | Both           | −amount           | Unchanged     | +amount        |
| Spend (record)    | BUDGET         | −amount           | Unchanged     | Unchanged      |
| Spend (record)    | GOAL (reached) | −amount           | Unchanged     | Unchanged      |
| Reactivate (same) | Both           | = total_balance   | Unchanged     | −total_balance |
| Reactivate (new)  | Both           | = new_amount      | = new_amount  | −new_amount    |

## Relationships

```
┌─────────────┐       ┌─────────────┐
│   Wallet    │───1:N─│   Budget    │
└─────────────┘       └──────┬──────┘
                             │
                            1:N (via source_type)
                             │
                      ┌──────▼──────┐
                      │   Record    │
                      │source_type: │
                      │   BUDGET    │
                      └─────────────┘
```

### Relationship Details

| Relationship    | Type | Description                                                   |
| --------------- | ---- | ------------------------------------------------------------- |
| Wallet → Budget | 1:N  | Wallet can have many budgets allocated from it                |
| Budget → Record | 1:N  | Budget can have many expense records (via polymorphic source) |

## Record Integration

Records support budgets via polymorphic source:

```
Record
├── source_id       → Budget.id
├── source_type     → 'BUDGET'
└── record_type     → 'EXPENSE' (only expenses from budgets)
```

### Constraints

| Constraint                    | Enforcement       |
| ----------------------------- | ----------------- |
| Only EXPENSE records          | Application layer |
| Only when budget is active    | Application layer |
| Only when balance sufficient  | Application layer |
| GOAL must be reached to spend | Application layer |

## Archive Behavior

### When to Archive

| Condition           | Trigger                   |
| ------------------- | ------------------------- |
| Budget balance = 0  | Auto-archive              |
| Goal fully refunded | Auto-archive              |
| Manual archive      | Not supported (auto only) |

### Archived State

| Property           | Value                    |
| ------------------ | ------------------------ |
| `archived_at`      | Set to current timestamp |
| `balance`          | 0                        |
| Can spend          | ❌ No                    |
| Can add/contribute | ❌ No                    |
| Can refund         | ❌ No                    |
| Can reactivate     | ✅ Yes                   |
| Can view           | ✅ Yes (read-only)       |
| Can delete         | ❌ No                    |

## Cascade Behavior

### On Wallet Delete

Budgets are deleted when their source wallet is deleted (see [ADR-003](../../adr/003-cascade-delete-on-wallet-removal.md)).

| Entity                        | Behavior                    |
| ----------------------------- | --------------------------- |
| Budget                        | Cascade delete              |
| Records (source_type: BUDGET) | Cascade delete (via budget) |

### Budget Deletion

**Budgets cannot be deleted directly.**

Rationale:

- Budgets involve balance transfers (wallet ↔ budget)
- Deletion would create ambiguous balance history
- Archive preserves audit trail

## Indexes

| Index              | Columns                    | Purpose                 |
| ------------------ | -------------------------- | ----------------------- |
| Primary            | `id`                       | Budget lookup           |
| Wallet foreign key | `wallet_id`                | Find budgets for wallet |
| Active budgets     | `wallet_id, archived_at`   | List active budgets     |
| Type filter        | `budget_type, archived_at` | List goals vs budgets   |

## Constraints Summary

| Constraint                  | Type        | Description                          |
| --------------------------- | ----------- | ------------------------------------ |
| `balance ≥ 0`               | Database    | No negative balance                  |
| `total_balance > 0`         | Database    | Must allocate something              |
| No overspend                | Application | Expense ≤ balance                    |
| No over-contribute          | Application | Goal contribution ≤ remaining target |
| No spend on incomplete goal | Application | GOAL spending locked until reached   |
| No delete                   | Application | Archive only                         |

## Related

- [Operations](./operations.md) — CRUD implementation details
- [Record Data Model](../records/data-model.md) — Polymorphic source for budget records
- [Wallet Data Model](../wallets/data-model.md) — Source wallet relationship
- [ADR-003: Cascade Delete on Wallet Removal](../../adr/003-cascade-delete-on-wallet-removal.md)
