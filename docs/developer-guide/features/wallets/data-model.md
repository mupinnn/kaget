# Wallets Data Model

Technical documentation for the wallet data structure and relationships.

## Schema

```
Wallet
├── id          UUID        PK
├── name        VARCHAR
├── balance     DECIMAL     Denormalized cache
├── type        ENUM        (CASH, DIGITAL)
├── created_at  TIMESTAMP
└── updated_at  TIMESTAMP
```

### Field Details

| Field        | Type          | Constraints         | Description                 |
| ------------ | ------------- | ------------------- | --------------------------- |
| `id`         | UUID          | PK, NOT NULL        | Unique identifier           |
| `name`       | VARCHAR(255)  | NOT NULL            | User-defined wallet name    |
| `balance`    | DECIMAL(19,4) | NOT NULL, DEFAULT 0 | Denormalized balance cache  |
| `type`       | ENUM          | NOT NULL            | `CASH` or `DIGITAL`         |
| `created_at` | TIMESTAMP     | NOT NULL            | Creation timestamp          |
| `updated_at` | TIMESTAMP     | NOT NULL            | Last modification timestamp |

## Balance as Denormalized Cache

The `balance` column is a **denormalized cache**, not the source of truth.

### Source of Truth

```
Actual Balance = Σ(all records for this wallet)
```

This includes:

- Opening balance record (created when wallet is initialized with balance)
- Income records (+)
- Expense records (−)
- Transfer-in records (+)
- Transfer-out records (−)

### Why Denormalize?

| Approach               | Read Cost    | Write Cost             | Consistency             |
| ---------------------- | ------------ | ---------------------- | ----------------------- |
| Compute on read        | O(n) records | None                   | Always correct          |
| **Denormalized cache** | O(1)         | +1 update per mutation | Requires atomic updates |

Computing balance on every read is expensive for wallets with many transactions. The denormalized `balance` column provides O(1) reads at the cost of updating it on every transaction.

### Update Rules

The `balance` column must be updated **atomically** with every transaction:

| Event                    | Balance Update                                   |
| ------------------------ | ------------------------------------------------ |
| Record created (income)  | `balance += amount`                              |
| Record created (expense) | `balance -= amount`                              |
| Record deleted (income)  | `balance -= amount`                              |
| Record deleted (expense) | `balance += amount`                              |
| Record updated           | `balance += (new_amount - old_amount)` with sign |
| Transfer out             | `balance -= amount`                              |
| Transfer in              | `balance += amount`                              |

> See [ADR-002: Balance as Denormalized Cache](../../adr/002-balance-as-denormalized-cache.md) for rationale.

## Relationships

```
┌─────────────┐       ┌─────────────┐
│   Wallet    │───1:N─│   Record    │
└─────────────┘       └─────────────┘
       │
       │              ┌─────────────┐
       └───────1:N────│  Transfer   │ (as owner via source_id)
                      └─────────────┘
```

### Related Entities

| Entity   | Relationship | Description                                                |
| -------- | ------------ | ---------------------------------------------------------- |
| Record   | 1:N          | Wallet has many records (income/expense) as `source_id`    |
| Transfer | 1:N          | Wallet owns many transfer legs (`source_id`, `source_type = WALLET`) |
| Budget   | 1:N          | Wallet has many budgets (`wallet_id`)                      |

## Cascade Delete

When a wallet is deleted, **wallet-owned data is permanently removed**:

| Entity            | Cascade Behavior                                                              |
| ----------------- | ----------------------------------------------------------------------------- |
| Records           | Deleted — where `source_id = wallet.id` and `source_type = WALLET`            |
| Transfers         | Deleted — **owned** legs only; counterparty legs preserved with name snapshots |
| Budgets           | Cascade deleted — budgets where `wallet_id = wallet.id`                       |

> See [ADR-003: Cascade Delete on Wallet Removal](../../adr/003-cascade-delete-on-wallet-removal.md) for rationale.

## Constraints

### Business Rules

| Rule                          | Enforcement                            |
| ----------------------------- | -------------------------------------- |
| Name required                 | Database NOT NULL                      |
| Name uniqueness               | Application layer (per user)           |
| Balance not directly editable | Application layer (no update endpoint) |
| Type immutable after creation | Application layer                      |

### Validation

| Field     | Validation                        |
| --------- | --------------------------------- |
| `name`    | Non-empty, max 255 chars, trimmed |
| `type`    | Must be `CASH` or `DIGITAL`       |
| `balance` | Managed by system only            |

## Related

- [Operations](./operations.md) — CRUD implementation details
- [ADR-002: Balance as Denormalized Cache](../../adr/002-balance-as-denormalized-cache.md)
- [ADR-003: Cascade Delete on Wallet Removal](../../adr/003-cascade-delete-on-wallet-removal.md)
