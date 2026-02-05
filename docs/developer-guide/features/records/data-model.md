# Records Data Model

Technical documentation for the record data structure and relationships.

## Schema

### Record

```
Record
├── id              UUID        PK
├── note            VARCHAR     Optional
├── amount          DECIMAL     Computed from items
├── source_id       UUID        FK (polymorphic)
├── source_type     ENUM        (WALLET, ...future)
├── record_type     ENUM        (INCOME, EXPENSE)
├── created_at      TIMESTAMP
├── updated_at      TIMESTAMP
└── recorded_at     TIMESTAMP   User-specified date
```

### Record Item

```
RecordItem
├── id              UUID        PK
├── record_id       UUID        FK → Record
├── note            VARCHAR     Optional
├── amount          DECIMAL
├── created_at      TIMESTAMP
└── updated_at      TIMESTAMP
```

## Field Details

### Record

| Field         | Type          | Constraints   | Description                               |
| ------------- | ------------- | ------------- | ----------------------------------------- |
| `id`          | UUID          | PK, NOT NULL  | Unique identifier                         |
| `note`        | VARCHAR(500)  | NULL          | Optional description                      |
| `amount`      | DECIMAL(19,4) | NOT NULL, > 0 | Total amount (must equal sum of items)    |
| `source_id`   | UUID          | NOT NULL      | Reference to source entity (e.g., wallet) |
| `source_type` | ENUM          | NOT NULL      | Type of source: `WALLET` (extensible)     |
| `record_type` | ENUM          | NOT NULL      | `INCOME` or `EXPENSE`                     |
| `created_at`  | TIMESTAMP     | NOT NULL      | Record creation timestamp                 |
| `updated_at`  | TIMESTAMP     | NOT NULL      | Last modification timestamp               |
| `recorded_at` | TIMESTAMP     | NOT NULL      | User-specified transaction date           |

### Record Item

| Field        | Type          | Constraints   | Description                 |
| ------------ | ------------- | ------------- | --------------------------- |
| `id`         | UUID          | PK, NOT NULL  | Unique identifier           |
| `record_id`  | UUID          | FK, NOT NULL  | Parent record reference     |
| `note`       | VARCHAR(500)  | NULL          | Optional item description   |
| `amount`     | DECIMAL(19,4) | NOT NULL, > 0 | Item amount                 |
| `created_at` | TIMESTAMP     | NOT NULL      | Item creation timestamp     |
| `updated_at` | TIMESTAMP     | NOT NULL      | Last modification timestamp |

## Polymorphic Source

The `source_id` + `source_type` pattern allows records to reference different entity types:

```
┌─────────────┐
│   Record    │
├─────────────┤
│ source_id   │──────┐
│ source_type │      │
└─────────────┘      │
                     │
        ┌────────────┼────────────┐
        │            │            │
        ▼            ▼            ▼
   ┌─────────┐  ┌─────────┐  ┌─────────┐
   │ Wallet  │  │ Budget  │  │ (Future)│
   │  type:  │  │  type:  │  │         │
   │ WALLET  │  │ BUDGET  │  │         │
   └─────────┘  └─────────┘  └─────────┘
```

### Current Source Types

| Type     | Description       | Resolution                     | Allowed record_type |
| -------- | ----------------- | ------------------------------ | ------------------- |
| `WALLET` | Personal wallet   | `wallets` table by `source_id` | INCOME, EXPENSE     |
| `BUDGET` | Budget allocation | `budgets` table by `source_id` | EXPENSE only        |

### Future Extensibility

The polymorphic pattern supports adding new source types without schema changes:

- Shared wallets
- Business accounts
- External accounts

## Amount Computation

`Record.amount` is **computed from items** and must always match:

```
Record.amount = Σ(RecordItem.amount)
```

### Validation Rules

| Rule                         | Enforcement                           |
| ---------------------------- | ------------------------------------- |
| At least one item            | Application layer                     |
| Record.amount = sum of items | Application layer (computed on write) |
| Item amounts > 0             | Database CHECK constraint             |
| Record.amount > 0            | Database CHECK constraint             |

### Single vs. Split Records

| Scenario       | Implementation                                     |
| -------------- | -------------------------------------------------- |
| Single amount  | One RecordItem with that amount                    |
| Multiple items | Multiple RecordItems, amounts sum to Record.amount |

There is no special case—every record has at least one item.

## Relationships

```
┌─────────────┐       ┌─────────────┐
│   Wallet    │───1:N─│   Record    │
└─────────────┘       └──────┬──────┘
                             │
                            1:N
                             │
                      ┌──────▼──────┐
                      │ RecordItem  │
                      └─────────────┘
```

### Relationship Details

| Relationship        | Type | Description                                      |
| ------------------- | ---- | ------------------------------------------------ |
| Wallet → Record     | 1:N  | Wallet has many records (via polymorphic source) |
| Record → RecordItem | 1:N  | Record has one or more items                     |

## Cascade Behavior

### On Record Delete

| Entity         | Behavior                                 |
| -------------- | ---------------------------------------- |
| RecordItem     | Cascade delete (all items removed)       |
| Wallet.balance | Delta update (reverse the record amount) |

### On Wallet Delete

Records are deleted when their source wallet is deleted (see [ADR-003](../../adr/003-cascade-delete-on-wallet-removal.md)).

## Indexes

| Index            | Columns                  | Purpose                   |
| ---------------- | ------------------------ | ------------------------- |
| Primary          | `id`                     | Record lookup             |
| Source lookup    | `source_type, source_id` | Find records for a wallet |
| Date range       | `source_id, recorded_at` | Query records by date     |
| Item foreign key | `record_id`              | Item lookup by record     |

## Opening Balance Record

When a wallet is created with an initial balance, an "Opening Balance" record is created:

| Field         | Value                                       |
| ------------- | ------------------------------------------- |
| `record_type` | `INCOME`                                    |
| `amount`      | Initial balance amount                      |
| `note`        | "Opening Balance" (or localized equivalent) |
| `recorded_at` | Wallet creation timestamp                   |
| `source_id`   | New wallet ID                               |
| `source_type` | `WALLET`                                    |

This is a regular record with no special flags—just a conventional note.

## Related

- [Operations](./operations.md) — CRUD implementation details
- [Wallet Data Model](../wallets/data-model.md) — Wallet schema and balance updates
- [ADR-002: Balance as Denormalized Cache](../../adr/002-balance-as-denormalized-cache.md)
