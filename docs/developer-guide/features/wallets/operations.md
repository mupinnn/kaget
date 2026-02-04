# Wallet Operations

Technical documentation for wallet CRUD operations and business logic.

## Overview

Wallet operations follow these principles:

- Balance is updated atomically with transactions, never directly
- Initial balance is stored as an "Opening Balance" record
- Deletion cascades to all related records and transfers

## Create Wallet

### Flow

```
┌─────────────────┐
│  Create Request │
│  (name, type,   │
│   initialBalance)│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Validate Input │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Create Wallet  │
│  (balance = 0)  │
└────────┬────────┘
         │
         ▼
    ┌────┴────┐
    │ Initial │
    │ Balance │
    │   > 0?  │
    └────┬────┘
     Yes │ No
    ┌────┴────┐
    │         │
    ▼         ▼
┌─────────┐  Done
│ Create  │
│ Opening │
│ Balance │
│ Record  │
└────┬────┘
     │
     ▼
   Done
```

### Initial Balance Handling

When `initialBalance > 0`:

1. Create wallet with `balance = 0`
2. Create an "Opening Balance" record:
   ```
   wallet_id: <new_wallet_id>
   type: INCOME
   amount: <initialBalance>
   category: "Opening Balance" (system category)
   note: "Initial balance"
   date: <wallet.created_at>
   ```
3. Update wallet `balance = initialBalance` (via record creation trigger)

This ensures all balance changes are tracked as records.

### Validation

| Field            | Rules                                 |
| ---------------- | ------------------------------------- |
| `name`           | Required, 1-255 chars, trimmed        |
| `type`           | Required, must be `CASH` or `DIGITAL` |
| `initialBalance` | Optional, must be ≥ 0 if provided     |

### Error Cases

| Condition                | Error                                                  |
| ------------------------ | ------------------------------------------------------ |
| Empty name               | `VALIDATION_ERROR: Name is required`                   |
| Invalid type             | `VALIDATION_ERROR: Type must be CASH or DIGITAL`       |
| Negative initial balance | `VALIDATION_ERROR: Initial balance cannot be negative` |

## Read Wallet

### Get Single Wallet

Returns wallet with current balance.

**Response includes:**

- Wallet metadata (id, name, type, timestamps)
- Current balance (from denormalized cache)

### Get Wallet Details

Returns wallet with related data for the details screen.

**Response includes:**

- Wallet metadata
- Current balance
- Recent records (paginated)
- Recent transfers (paginated)

### List Wallets

Returns all wallets for the authenticated user.

**Response includes:**

- Array of wallets with balances
- Sorted by creation date (or user preference)

## Update Wallet

### Allowed Updates

| Field     | Updatable | Notes                    |
| --------- | --------- | ------------------------ |
| `name`    | ✅ Yes    | Validation applies       |
| `type`    | ❌ No     | Immutable after creation |
| `balance` | ❌ No     | Managed via records only |

### Flow

```
┌─────────────────┐
│  Update Request │
│  (name)         │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Validate Input  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Update Wallet  │
│  Set updated_at │
└────────┬────────┘
         │
         ▼
       Done
```

### Error Cases

| Condition                 | Error                                           |
| ------------------------- | ----------------------------------------------- |
| Wallet not found          | `NOT_FOUND: Wallet does not exist`              |
| Empty name                | `VALIDATION_ERROR: Name is required`            |
| Attempt to update balance | `FORBIDDEN: Balance cannot be updated directly` |
| Attempt to update type    | `FORBIDDEN: Wallet type cannot be changed`      |

## Delete Wallet

### Flow

```
┌─────────────────┐
│  Delete Request │
│  (wallet_id)    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Begin          │
│  Transaction    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Delete Related  │
│ Transfers       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Delete Related  │
│ Records         │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Update Budget   │
│ References      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Delete Wallet   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Commit         │
│  Transaction    │
└────────┬────────┘
         │
         ▼
       Done
```

### Cascade Behavior

All operations happen in a single transaction:

| Step | Action                                                 | Rationale                                  |
| ---- | ------------------------------------------------------ | ------------------------------------------ |
| 1    | Delete transfers where wallet is source or destination | Transfers require both wallets to exist    |
| 2    | Delete all records for this wallet                     | Records belong to wallet                   |
| 3    | Remove wallet references from budgets                  | Budgets can exist without wallet reference |
| 4    | Delete wallet                                          | Main entity                                |

### Impact on Other Wallets

When deleting a wallet involved in transfers:

- The transfer is deleted entirely
- The **other wallet's balance is recalculated** (transfer amount restored)

Example:

- Wallet A has $100, Wallet B has $50
- Transfer $20 from A to B → A=$80, B=$70
- Delete Wallet A → Transfer deleted → B recalculates → B=$50

### Error Cases

| Condition           | Error                                       |
| ------------------- | ------------------------------------------- |
| Wallet not found    | `NOT_FOUND: Wallet does not exist`          |
| Transaction failure | Rollback all changes, return `SERVER_ERROR` |

## Balance Recalculation

For data integrity verification or recovery, balance can be recalculated from records:

```sql
SELECT
  COALESCE(SUM(
    CASE
      WHEN type = 'INCOME' THEN amount
      WHEN type = 'EXPENSE' THEN -amount
    END
  ), 0) +
  COALESCE((
    SELECT SUM(CASE WHEN to_wallet_id = w.id THEN amount ELSE -amount END)
    FROM transfers
    WHERE from_wallet_id = w.id OR to_wallet_id = w.id
  ), 0) as calculated_balance
FROM records r
WHERE r.wallet_id = w.id
```

This should match `wallet.balance`. If not, trigger investigation or repair.

## Related

- [Data Model](./data-model.md) — Schema and relationships
- [ADR-002: Balance as Denormalized Cache](../../adr/002-balance-as-denormalized-cache.md)
- [ADR-003: Cascade Delete on Wallet Removal](../../adr/003-cascade-delete-on-wallet-removal.md)
