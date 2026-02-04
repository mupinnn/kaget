# Record Operations

Technical documentation for record CRUD operations and business logic.

## Overview

Record operations follow these principles:

- Every record has at least one item
- `Record.amount` always equals the sum of item amounts
- Wallet balance is updated atomically with record mutations
- Balance updates use delta calculation: `balance += (new - old)`

## Create Record

### Flow

```
┌─────────────────────┐
│   Create Request    │
│ (type, source,      │
│  items[], date)     │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Validate Input     │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Begin Transaction  │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Compute Total      │
│  amount = Σ(items)  │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Create Record      │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Create RecordItems │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Update Wallet      │
│  Balance            │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Commit Transaction │
└──────────┬──────────┘
           │
           ▼
         Done
```

### Balance Update Logic

```javascript
// Determine balance delta
const delta = record.record_type === "INCOME" ? record.amount : -record.amount;

// Update wallet balance atomically
wallet.balance += delta;
```

### Validation

| Field            | Rules                                               |
| ---------------- | --------------------------------------------------- |
| `source_id`      | Required, must exist, must be valid for source_type |
| `source_type`    | Required, must be `WALLET` (for now)                |
| `record_type`    | Required, must be `INCOME` or `EXPENSE`             |
| `recorded_at`    | Required, valid timestamp                           |
| `items`          | At least one item required                          |
| `items[].amount` | Required, must be > 0                               |

### Error Cases

| Condition           | Error                                                     |
| ------------------- | --------------------------------------------------------- |
| No items provided   | `VALIDATION_ERROR: At least one item is required`         |
| Item amount ≤ 0     | `VALIDATION_ERROR: Item amount must be positive`          |
| Invalid source      | `NOT_FOUND: Wallet does not exist`                        |
| Invalid record_type | `VALIDATION_ERROR: Record type must be INCOME or EXPENSE` |

## Read Record

### Get Single Record

Returns record with all items.

**Response includes:**

- Record metadata (id, type, amount, note, dates)
- Source reference (wallet info)
- All record items

### List Records

Returns records for a source (wallet), paginated and filterable.

**Query parameters:**

| Parameter     | Type | Description                    |
| ------------- | ---- | ------------------------------ |
| `source_id`   | UUID | Filter by wallet               |
| `record_type` | ENUM | Filter by INCOME or EXPENSE    |
| `from_date`   | DATE | Records on or after this date  |
| `to_date`     | DATE | Records on or before this date |
| `limit`       | INT  | Page size (default: 20)        |
| `offset`      | INT  | Pagination offset              |

**Response includes:**

- Array of records with items
- Pagination metadata

## Update Record

### Allowed Updates

| Field         | Updatable | Notes                                         |
| ------------- | --------- | --------------------------------------------- |
| `note`        | ✅ Yes    | No balance impact                             |
| `record_type` | ✅ Yes    | Triggers balance recalculation                |
| `source_id`   | ✅ Yes    | Moves record to different wallet              |
| `recorded_at` | ✅ Yes    | No balance impact                             |
| `items`       | ✅ Yes    | Add/remove/edit items; triggers amount recalc |

### Flow

```
┌─────────────────────┐
│   Update Request    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Validate Input     │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Begin Transaction  │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Load Current       │
│  Record State       │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Compute Old Delta  │
│  (for old wallet)   │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Apply Updates      │
│  Recompute amount   │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Compute New Delta  │
│  (for new wallet)   │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Update Wallet(s)   │
│  Balance            │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Sync RecordItems   │
│  (add/update/delete)│
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Commit Transaction │
└──────────┬──────────┘
           │
           ▼
         Done
```

### Balance Delta Calculation

```javascript
// Calculate what the old record contributed to balance
const oldDelta = oldRecord.record_type === "INCOME" ? oldRecord.amount : -oldRecord.amount;

// Calculate what the new record will contribute
const newDelta = newRecord.record_type === "INCOME" ? newRecord.amount : -newRecord.amount;

// Same wallet: apply difference
if (oldRecord.source_id === newRecord.source_id) {
  wallet.balance += newDelta - oldDelta;
}
// Different wallet: reverse old, apply new
else {
  oldWallet.balance -= oldDelta;
  newWallet.balance += newDelta;
}
```

### Wallet Change Scenarios

| Scenario                                  | Old Wallet        | New Wallet      |
| ----------------------------------------- | ----------------- | --------------- |
| Same wallet, same type, amount change     | `+= (new - old)`  | —               |
| Same wallet, type change (income→expense) | `-= 2 × amount`   | —               |
| Same wallet, type change (expense→income) | `+= 2 × amount`   | —               |
| Move to different wallet                  | Reverse old delta | Apply new delta |

### Item Sync Logic

When updating items:

1. **Match by ID** — Items with IDs are updates
2. **New items** — Items without IDs are created
3. **Removed items** — Existing items not in request are deleted

```javascript
// Pseudocode
for (item of requestItems) {
  if (item.id) {
    update(item);
  } else {
    create(item);
  }
}
deleteItemsNotIn(
  record.id,
  requestItems.map(i => i.id)
);
```

### Error Cases

| Condition             | Error                                             |
| --------------------- | ------------------------------------------------- |
| Record not found      | `NOT_FOUND: Record does not exist`                |
| No items after update | `VALIDATION_ERROR: At least one item is required` |
| Invalid source        | `NOT_FOUND: Wallet does not exist`                |

## Delete Record

### Flow

```
┌─────────────────────┐
│   Delete Request    │
│   (record_id)       │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Begin Transaction  │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Load Record        │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Compute Reversal   │
│  Delta              │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Delete RecordItems │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Delete Record      │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Update Wallet      │
│  Balance            │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Commit Transaction │
└──────────┬──────────┘
           │
           ▼
         Done
```

### Balance Reversal

```javascript
// Reverse the record's effect on balance
const reversal =
  record.record_type === "INCOME"
    ? -record.amount // Remove income
    : record.amount; // Restore expense

wallet.balance += reversal;
```

### Error Cases

| Condition           | Error                              |
| ------------------- | ---------------------------------- |
| Record not found    | `NOT_FOUND: Record does not exist` |
| Transaction failure | Rollback, return `SERVER_ERROR`    |

## Transaction Safety

All record operations that affect balance must be atomic:

```sql
BEGIN TRANSACTION;

-- Record mutation (create/update/delete)
...

-- Balance update
UPDATE wallets
SET balance = balance + :delta,
    updated_at = NOW()
WHERE id = :wallet_id;

COMMIT;
```

If any step fails, the entire transaction rolls back.

## Related

- [Data Model](./data-model.md) — Schema and relationships
- [Wallet Operations](../wallets/operations.md) — Wallet balance management
- [ADR-002: Balance as Denormalized Cache](../../adr/002-balance-as-denormalized-cache.md)
