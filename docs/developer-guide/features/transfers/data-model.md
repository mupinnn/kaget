# Transfers Data Model

Technical documentation for the transfer data structure and relationships.

## Schema

```
Transfer
├── id                  UUID        PK
├── note                VARCHAR     Optional
├── amount              DECIMAL     Transfer amount
├── fee                 DECIMAL     Optional, default 0
├── source_id           UUID        FK (polymorphic) — Owner of this record
├── source_type         ENUM        (WALLET, BUDGET)
├── source_name         VARCHAR     Snapshot of owner name
├── destination_id      UUID        FK (polymorphic) — Counterparty
├── destination_type    ENUM        (WALLET, BUDGET)
├── destination_name    VARCHAR     Snapshot of counterparty name
├── type                ENUM        (INCOMING, OUTGOING)
├── ref_id              UUID        Links paired transfers
├── created_at          TIMESTAMP
├── updated_at          TIMESTAMP
└── transferred_at      TIMESTAMP   User-specified date
```

## Field Details

| Field              | Type          | Constraints              | Description                                          |
| ------------------ | ------------- | ------------------------ | ---------------------------------------------------- |
| `id`               | UUID          | PK, NOT NULL             | Unique identifier                                    |
| `note`             | VARCHAR(500)  | NULL                     | Optional description                                 |
| `amount`           | DECIMAL(19,4) | NOT NULL, > 0            | Amount transferred                                   |
| `fee`              | DECIMAL(19,4) | NOT NULL, DEFAULT 0, ≥ 0 | Transaction fee                                      |
| `source_id`        | UUID          | NOT NULL                 | **Owner** of this record (whose list it appears in)  |
| `source_type`      | ENUM          | NOT NULL                 | Owner's entity type: `WALLET` or `BUDGET`            |
| `source_name`      | VARCHAR(255)  | NOT NULL                 | Snapshot of owner name at transfer time              |
| `destination_id`   | UUID          | NOT NULL                 | **Counterparty** entity reference                    |
| `destination_type` | ENUM          | NOT NULL                 | Counterparty's entity type: `WALLET` or `BUDGET`     |
| `destination_name` | VARCHAR(255)  | NOT NULL                 | Snapshot of counterparty name at transfer time       |
| `type`             | ENUM          | NOT NULL                 | `OUTGOING` = owner sent, `INCOMING` = owner received |
| `ref_id`           | UUID          | NOT NULL                 | Links paired INCOMING/OUTGOING records               |
| `created_at`       | TIMESTAMP     | NOT NULL                 | Record creation timestamp                            |
| `updated_at`       | TIMESTAMP     | NOT NULL                 | Last modification timestamp                          |
| `transferred_at`   | TIMESTAMP     | NOT NULL                 | User-specified transfer date                         |

## Double-Entry System

Each user-initiated transfer creates **two records** linked by `ref_id`:

```
┌─────────────────────────────────────────────────────────┐
│                    User Action                          │
│              "Transfer $100 from A to B"                │
└─────────────────────────┬───────────────────────────────┘
                          │
           ┌──────────────┴──────────────┐
           │                             │
           ▼                             ▼
┌─────────────────────────┐       ┌─────────────────────────┐
│  Transfer Record 1      │       │  Transfer Record 2      │
│  (A's record)           │       │  (B's record)           │
├─────────────────────────┤       ├─────────────────────────┤
│ type: OUTGOING          │       │ type: INCOMING          │
│ source: A (owner)       │       │ source: B (owner)       │
│ source_name: "A"        │       │ source_name: "B"        │
│ destination: B          │       │ destination: A          │
│ dest_name: "B"          │       │ dest_name: "A"          │
│ amount: 100             │       │ amount: 100             │
│ ref_id: xyz             │◄─────►│ ref_id: xyz             │
└─────────────────────────┘       └─────────────────────────┘
        │                             │
        │                             │
        ▼                             ▼
   Shown in A's                  Shown in B's
   transfer list                 transfer list
   ("Sent to B")                 ("Received from A")
```

### Field Semantics

| Field              | Meaning                                             |
| ------------------ | --------------------------------------------------- |
| `source_id`        | **Owner** of this record — whose list it appears in |
| `source_name`      | Snapshot of owner's name (avoids extra query)       |
| `destination_id`   | **Counterparty** — the other party                  |
| `destination_name` | Snapshot of counterparty's name                     |
| `type`             | Direction from owner's perspective                  |

### Why Double-Entry?

| Benefit                   | Explanation                                             |
| ------------------------- | ------------------------------------------------------- |
| **Per-account views**     | Each account sees its relevant transfers                |
| **Cascade delete safety** | Deleting wallet A removes A's records; B keeps its view |
| **Simpler queries**       | No complex joins to show "my transfers"                 |
| **Audit trail**           | Both sides preserved independently                      |

## Snapshot Fields

`source_name` and `destination_name` capture entity names at transfer time.

### Purpose

| Field              | Purpose                                                   |
| ------------------ | --------------------------------------------------------- |
| `source_name`      | Display owner's name in transfer list without extra query |
| `destination_name` | Display counterparty's name (may be deleted/renamed)      |

| Scenario       | Behavior                          |
| -------------- | --------------------------------- |
| Normal display | Show names from snapshots         |
| Entity renamed | Snapshot preserves original name  |
| Entity deleted | Snapshot still displays correctly |

### When Captured

Snapshots are set at transfer creation and never updated.

```javascript
// A sends $100 to B
outgoing.source_name = A.name; // A's record snapshots A's name
outgoing.destination_name = B.name; // A's record snapshots B's name

incoming.source_name = B.name; // B's record snapshots B's name
incoming.destination_name = A.name; // B's record snapshots A's name
```

## Polymorphic Owner/Counterparty

Transfer records can be owned by (and reference) wallets or budgets:

```
┌─────────────────────┐
│      Transfer       │
├─────────────────────┤
│ source_id (owner)   │──────┐
│ source_type         │      │
│ destination_id      │──────┼──────┐
│ destination_type    │      │      │
└─────────────────────┘      │      │
                             │      │
            ┌────────────────┴──────┴────────────────┐
            │                                        │
            ▼                                        ▼
       ┌─────────┐                              ┌─────────┐
       │ Wallet  │                              │ Budget  │
       └─────────┘                              └─────────┘
```

### Allowed Transfer Directions

When user transfers from entity X to entity Y:

| From (sender) | To (receiver) | Allowed | Use Case              |
| ------------- | ------------- | ------- | --------------------- |
| WALLET        | WALLET        | ✅ Yes  | Move between accounts |
| WALLET        | BUDGET        | ✅ Yes  | Add funds to budget   |
| BUDGET        | WALLET        | ✅ Yes  | Refund from budget    |
| BUDGET        | BUDGET        | ❌ No   | Not supported         |

### Validation

| Constraint         | Check                          |
| ------------------ | ------------------------------ |
| Sender ≠ Receiver  | Cannot transfer to self        |
| No BUDGET → BUDGET | Budget-to-budget not supported |

## Fee Handling

Transfer fees are tracked separately and become expense records on the **sender**.

### Balance Impact

```
sender.balance   -= (amount + fee)
receiver.balance += amount
fee              → expense record on sender
```

### Fee Expense Record

When `fee > 0`, an expense record is created on the sender:

```javascript
// User transfers from A to B with fee
{
  source_id: A.id,          // Fee charged to sender
  source_type: A.type,
  record_type: 'EXPENSE',
  amount: fee,
  note: `Transfer fee to ${B.name}`,
  recorded_at: transfer.transferred_at,
  items: [{ amount: fee, note: 'Transfer fee' }]
}
```

## Relationships

```
┌─────────────┐       ┌─────────────┐
│   Wallet    │───1:N─│  Transfer   │ (as owner via source_id)
└─────────────┘       └──────┬──────┘
                             │
┌─────────────┐              │
│   Budget    │───1:N────────┘ (as owner via source_id)
└─────────────┘

┌─────────────────┐       ┌─────────────────┐
│    Transfer     │──ref──│    Transfer     │
│ source: A       │  id   │ source: B       │
│ destination: B  │       │ destination: A  │
│ type: OUTGOING  │       │ type: INCOMING  │
└─────────────────┘       └─────────────────┘
```

## Cascade Behavior

### On Wallet Delete

```sql
-- Simple: delete all transfers owned by this wallet
DELETE FROM transfers WHERE source_id = :wallet_id AND source_type = 'WALLET';
```

| Entity                                              | Behavior                                      |
| --------------------------------------------------- | --------------------------------------------- |
| Transfers owned by wallet (`source_id = wallet.id`) | Cascade delete                                |
| Paired transfer (counterparty's record)             | **Preserved** — counterparty keeps their view |

### Example

```
Wallet A transfers $100 to Wallet B
├── Record 1: source=A, dest=B, type=OUTGOING (A owns)
└── Record 2: source=B, dest=A, type=INCOMING (B owns)

When A is deleted:
├── Record 1: DELETED (A owned it)
└── Record 2: PRESERVED (B still sees "Received $100 from A")
           └── destination_name = "Wallet A" (snapshot)
```

### On Budget Delete

Same as wallet — budget's transfers (where `source_id = budget.id`) deleted, counterparty records preserved.

## Indexes

| Index        | Columns                  | Purpose                 |
| ------------ | ------------------------ | ----------------------- |
| Primary      | `id`                     | Transfer lookup         |
| Ref lookup   | `ref_id`                 | Find paired transfer    |
| Owner lookup | `source_type, source_id` | List entity's transfers |
| Date range   | `transferred_at`         | Query by date           |

> **Note:** No index on `destination_id` needed. Each entity queries only its owned records via `source_id`.

## Immutability

Transfers cannot be updated or deleted after creation.

### Rationale

| Concern                 | Explanation                               |
| ----------------------- | ----------------------------------------- |
| **Balance integrity**   | Both source and destination affected      |
| **Cascade complexity**  | Rolling back may involve deleted entities |
| **Audit trail**         | Financial records should be immutable     |
| **Real-world parallel** | Bank transfers can't be "deleted"         |

### Alternative: Reverse Transfer

To "undo" a transfer, create a new transfer in the opposite direction.

## Related

- [Operations](./operations.md) — Transfer creation logic
- [Wallet Data Model](../wallets/data-model.md) — Wallet balance updates
- [Budget Data Model](../budgets/data-model.md) — Budget balance updates
- [Record Data Model](../records/data-model.md) — Fee expense records
