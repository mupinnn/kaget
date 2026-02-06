# Transfer Operations

Technical documentation for transfer operations and business logic.

## Overview

Transfer operations follow these principles:

- Each transfer creates two linked records (double-entry)
- Fees create separate expense records on source
- Transfers are immutable (no update or delete)
- Snapshots capture entity names at transfer time

## Create Transfer

### Flow

```
┌─────────────────────────┐
│    Transfer Request     │
│ (sender, receiver,      │
│  amount, fee?, note?)   │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│    Validate Input       │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  Check Sender Balance   │
│  ≥ (amount + fee)       │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  Check Receiver         │
│  Constraints            │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│   Begin Transaction     │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  Generate ref_id        │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  Create OUTGOING        │
│  Transfer Record        │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  Create INCOMING        │
│  Transfer Record        │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  Deduct Sender Balance  │
│  (amount + fee)         │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  Credit Receiver        │
│  Balance (amount)       │
└───────────┬─────────────┘
            │
            ▼
       ┌────┴────┐
       │ Fee > 0 │
       │    ?    │
       └────┬────┘
        Yes │ No
       ┌────┴────┐
       │         │
       ▼         ▼
┌─────────────┐  │
│ Create Fee  │  │
│ Expense     │  │
│ Record      │  │
└──────┬──────┘  │
       │         │
       └────┬────┘
            │
            ▼
┌─────────────────────────┐
│   Commit Transaction    │
└───────────┬─────────────┘
            │
            ▼
          Done
```

### Transfer Record Creation

```javascript
const refId = generateUUID();

// User transfers from 'sender' to 'receiver'
// Create two records: one for each party

// Create OUTGOING record (sender's view)
const outgoing = {
  id: generateUUID(),
  type: "OUTGOING",
  source_id: sender.id, // Owner = sender
  source_type: senderType,
  source_name: sender.name, // Snapshot sender's name
  destination_id: receiver.id, // Counterparty = receiver
  destination_type: receiverType,
  destination_name: receiver.name, // Snapshot receiver's name
  amount: amount,
  fee: fee,
  note: note,
  ref_id: refId,
  transferred_at: transferDate,
  created_at: now(),
  updated_at: now(),
};

// Create INCOMING record (receiver's view)
const incoming = {
  id: generateUUID(),
  type: "INCOMING",
  source_id: receiver.id, // Owner = receiver
  source_type: receiverType,
  source_name: receiver.name, // Snapshot receiver's name
  destination_id: sender.id, // Counterparty = sender
  destination_type: senderType,
  destination_name: sender.name, // Snapshot sender's name
  amount: amount,
  fee: 0, // Fee only on sender's record
  note: note,
  ref_id: refId,
  transferred_at: transferDate,
  created_at: now(),
  updated_at: now(),
};
```

### Balance Updates

```javascript
// Deduct from sender (amount + fee)
sender.balance -= amount + fee;

// Credit to receiver (amount only, fee not included)
receiver.balance += amount;
```

### Fee Expense Record

```javascript
if (fee > 0) {
  const feeRecord = {
    source_id: sender.id,
    source_type: senderType,
    record_type: "EXPENSE",
    amount: fee,
    note: `Transfer fee to ${receiver.name}`,
    recorded_at: transferDate,
    created_at: now(),
    updated_at: now(),
  };

  const feeItem = {
    record_id: feeRecord.id,
    amount: fee,
    note: "Transfer fee",
  };

  // Sender balance already deducted above (includes fee)
  // No additional balance update needed
}
```

### Validation

| Field               | Rules                                                       |
| ------------------- | ----------------------------------------------------------- |
| `sender`            | Required, must exist, must be WALLET or BUDGET              |
| `receiver`          | Required, must exist, must be WALLET or BUDGET              |
| `sender ≠ receiver` | Cannot transfer to self                                     |
| `amount`            | Required, > 0                                               |
| `fee`               | Optional, ≥ 0                                               |
| `sender.balance`    | Must be ≥ (amount + fee)                                    |
| `receiver`          | If BUDGET: must be active, balance + amount ≤ total_balance |

### Receiver Constraints

```javascript
// Budget receiver checks
if (receiverType === "BUDGET") {
  if (receiver.archived_at) {
    throw new ValidationError("Cannot transfer to archived budget");
  }

  const newBalance = receiver.balance + amount;
  if (newBalance > receiver.total_balance) {
    throw new ValidationError("Transfer would exceed budget allocation");
  }
}
```

### Error Cases

| Condition                   | Error                                                        |
| --------------------------- | ------------------------------------------------------------ |
| Sender not found            | `NOT_FOUND: Sender does not exist`                           |
| Receiver not found          | `NOT_FOUND: Receiver does not exist`                         |
| Same sender and receiver    | `VALIDATION_ERROR: Cannot transfer to same account`          |
| Insufficient sender balance | `VALIDATION_ERROR: Insufficient balance`                     |
| Receiver budget archived    | `VALIDATION_ERROR: Cannot transfer to archived budget`       |
| Exceeds budget allocation   | `VALIDATION_ERROR: Transfer would exceed budget allocation`  |
| BUDGET to BUDGET            | `VALIDATION_ERROR: Budget to budget transfers not supported` |
| Amount ≤ 0                  | `VALIDATION_ERROR: Amount must be positive`                  |
| Fee < 0                     | `VALIDATION_ERROR: Fee cannot be negative`                   |

## Read Operations

### Get Single Transfer

Returns transfer details.

**Response includes:**

- Transfer metadata
- Paired transfer (via ref_id lookup)
- Source/destination names (from snapshot)

### List Transfers

Returns transfers filtered by account or date.

**Query parameters:**

| Parameter      | Type | Description                   |
| -------------- | ---- | ----------------------------- |
| `account_id`   | UUID | Filter by wallet or budget ID |
| `account_type` | ENUM | WALLET or BUDGET              |
| `type`         | ENUM | INCOMING or OUTGOING only     |
| `from_date`    | DATE | Transfers on or after         |
| `to_date`      | DATE | Transfers on or before        |
| `limit`        | INT  | Page size                     |
| `offset`       | INT  | Pagination                    |

### Query by Account

```sql
-- All transfers for an account (simple with new model)
SELECT * FROM transfers
WHERE source_id = :account_id
  AND source_type = :account_type
ORDER BY transferred_at DESC;
```

Filter by direction:

```sql
-- Outgoing from this account
SELECT * FROM transfers
WHERE source_id = :account_id
  AND source_type = :account_type
  AND type = 'OUTGOING';

-- Incoming to this account
SELECT * FROM transfers
WHERE source_id = :account_id
  AND source_type = :account_type
  AND type = 'INCOMING';
```

## Update Transfer

**Not supported.** Transfers are immutable.

### Rationale

- Affects two entities (source and destination)
- Balance reconciliation is complex
- May involve deleted entities
- Breaks audit trail

### Alternative

To correct a mistake, create a reverse transfer:

```javascript
// Original: A → B, $100
// Correction: B → A, $100
```

## Delete Transfer

**Not supported.** Transfers are immutable.

### Rationale

- Rolling back requires updating both source and destination
- What if source or destination is deleted?
- Financial records should be permanent
- Real-world transfers can't be "deleted"

### Alternative

Create a reverse transfer to effectively cancel the original.

## Transaction Safety

All transfer operations must be atomic:

```sql
BEGIN TRANSACTION;

-- Create OUTGOING transfer record (sender's view)
INSERT INTO transfers (
  id, type, source_id, source_type, source_name,
  destination_id, destination_type, destination_name,
  amount, fee, note, ref_id, transferred_at
) VALUES (
  :outgoing_id, 'OUTGOING', :sender_id, :sender_type, :sender_name,
  :receiver_id, :receiver_type, :receiver_name,
  :amount, :fee, :note, :ref_id, :transfer_date
);

-- Create INCOMING transfer record (receiver's view)
INSERT INTO transfers (
  id, type, source_id, source_type, source_name,
  destination_id, destination_type, destination_name,
  amount, fee, note, ref_id, transferred_at
) VALUES (
  :incoming_id, 'INCOMING', :receiver_id, :receiver_type, :receiver_name,
  :sender_id, :sender_type, :sender_name,
  :amount, 0, :note, :ref_id, :transfer_date
);

-- Deduct sender balance
UPDATE wallets
SET balance = balance - :total_deduction,  -- amount + fee
    updated_at = NOW()
WHERE id = :sender_id;

-- Or for budget sender
UPDATE budgets
SET balance = balance - :total_deduction,
    updated_at = NOW()
WHERE id = :sender_id;

-- Credit receiver balance
UPDATE wallets
SET balance = balance + :amount,
    updated_at = NOW()
WHERE id = :receiver_id;

-- Or for budget receiver
UPDATE budgets
SET balance = balance + :amount,
    updated_at = NOW()
WHERE id = :receiver_id;

-- Create fee expense record (if fee > 0)
INSERT INTO records (...) VALUES (...);
INSERT INTO record_items (...) VALUES (...);

COMMIT;
```

## Related

- [Data Model](./data-model.md) — Schema and relationships
- [Wallet Operations](../wallets/operations.md) — Wallet balance management
- [Budget Operations](../budgets/operations.md) — Budget balance management
- [Record Operations](../records/operations.md) — Fee expense records
