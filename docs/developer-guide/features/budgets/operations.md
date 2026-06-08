# Budget Operations

Technical documentation for budget CRUD operations and business logic.

## Overview

Budget operations follow these principles:

- Creating/adding/refunding involves atomic wallet ↔ budget transfers
- Spending from budgets creates records with `source_type: BUDGET`
- Goals are locked for spending until `balance = total_balance`
- Budgets auto-archive when `balance = 0`
- No delete operation (archive only)

## Create Budget

### Flow (Single Budget)

```
┌─────────────────────┐
│   Create Request    │
│ (name, wallet_id,   │
│  amount, type)      │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Validate Input     │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Check Wallet       │
│  Balance ≥ Amount   │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Begin Transaction  │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Create Budget      │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Deduct Wallet      │
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

### Initial Balance by Type

| Type   | balance                     | total_balance |
| ------ | --------------------------- | ------------- |
| BUDGET | amount                      | amount        |
| GOAL   | initial_contribution (or 0) | target_amount |

### Bulk Creation Flow

Each budget in a batch specifies its own `wallet_id`. Validation and deduction are grouped by wallet.

```
┌─────────────────────┐
│  Bulk Create Request│
│  (budgets[]:        │
│   {wallet_id,       │
│    name, amount})   │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Validate All       │
│  Inputs             │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Group by Wallet    │
│  Sum per wallet     │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Check Each Wallet  │
│  Balance ≥ Sum      │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Begin Transaction  │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Create All Budgets │
│  (loop)             │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Deduct Each Wallet │
│  by grouped total   │
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

### Grouping Logic

```javascript
// Group budgets by wallet
const byWallet = budgets.reduce((acc, b) => {
  acc[b.wallet_id] = (acc[b.wallet_id] || 0) + b.amount;
  return acc;
}, {});

// Validate each wallet has sufficient balance
for (const [walletId, total] of Object.entries(byWallet)) {
  const wallet = await getWallet(walletId);
  if (wallet.balance < total) {
    throw new ValidationError(`Insufficient balance in wallet ${wallet.name}`);
  }
}
```

### Validation

| Field                  | Rules                                    |
| ---------------------- | ---------------------------------------- |
| `name`                 | Required, 1-255 chars                    |
| `wallet_id`            | Required, must exist                     |
| `amount` / `target`    | Required, > 0                            |
| `budget_type`          | Required, `BUDGET` or `GOAL`             |
| `initial_contribution` | Optional for GOAL, ≥ 0, ≤ wallet balance |

### Error Cases

| Condition                   | Error                                           |
| --------------------------- | ----------------------------------------------- |
| Insufficient wallet balance | `VALIDATION_ERROR: Insufficient wallet balance` |
| Invalid wallet              | `NOT_FOUND: Wallet does not exist`              |
| Amount ≤ 0                  | `VALIDATION_ERROR: Amount must be positive`     |

## Add Funds / Contribute

Transfer additional funds from wallet to budget/goal.

### Flow

```
┌─────────────────────┐
│  Add Funds Request  │
│ (budget_id, amount) │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Load Budget        │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Validate:          │
│  - Not archived     │
│  - Wallet balance   │
│  - ≤ total_balance  │
│  - Goal: ≤ remaining│
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Begin Transaction  │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  budget.balance     │
│  += amount          │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  wallet.balance     │
│  -= amount          │
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

### Goal Contribution Limit

For GOAL type, contribution cannot exceed remaining target:

```javascript
const remaining = goal.total_balance - goal.balance;
if (amount > remaining) {
  throw new ValidationError("Contribution exceeds remaining target");
}
```

### Budget Add Funds Limit

For BUDGET type, balance cannot exceed original allocation:

```javascript
const maxAddable = budget.total_balance - budget.balance;
if (amount > maxAddable) {
  throw new ValidationError("Cannot exceed original allocation");
}
```

### Error Cases

| Condition                           | Error                                                     |
| ----------------------------------- | --------------------------------------------------------- |
| Budget archived                     | `VALIDATION_ERROR: Cannot add to archived budget`         |
| Insufficient wallet balance         | `VALIDATION_ERROR: Insufficient wallet balance`           |
| Budget: exceeds original allocation | `VALIDATION_ERROR: Cannot exceed original allocation`     |
| Goal: exceeds target                | `VALIDATION_ERROR: Contribution exceeds remaining target` |

## Refund / Release

Transfer funds from budget/goal back to wallet.

### Flow

```
┌─────────────────────┐
│  Refund Request     │
│ (budget_id, amount) │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Load Budget        │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Validate:          │
│  - Not archived     │
│  - amount ≤ balance │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Begin Transaction  │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  budget.balance     │
│  -= amount          │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  wallet.balance     │
│  += amount          │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Check Auto-Archive │
│  (balance = 0?)     │
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

### Auto-Archive Check

```javascript
if (budget.balance === 0) {
  budget.archived_at = new Date();
}
```

### Error Cases

| Condition        | Error                                                  |
| ---------------- | ------------------------------------------------------ |
| Budget archived  | `VALIDATION_ERROR: Cannot refund from archived budget` |
| Amount > balance | `VALIDATION_ERROR: Refund amount exceeds balance`      |

## Spend (Create Record from Budget)

On the API, spending is **`POST /api/records`** with `source_type: BUDGET` and `record_type: EXPENSE` — see [Record Operations](../records/operations.md#create-record). Expense history for a budget is **`GET /api/budgets/:id/records`** (see [`apps/api/README.md`](../../../../apps/api/README.md#api-routes)).

Create an expense record that reduces budget balance.

### Flow

```
┌─────────────────────┐
│  Spend Request      │
│ (budget_id,         │
│  amount, items[])   │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Load Budget        │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Validate:          │
│  - Not archived     │
│  - amount ≤ balance │
│  - Goal: is reached │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Begin Transaction  │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Create Record      │
│  source_type:BUDGET │
│  record_type:EXPENSE│
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Create RecordItems │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  budget.balance     │
│  -= amount          │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Check Auto-Archive │
│  (balance = 0?)     │
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

### Goal Spending Check

```javascript
if (budget.budget_type === "GOAL" && budget.balance < budget.total_balance) {
  throw new ValidationError("Goal must be reached before spending");
}
```

### Record Creation

```javascript
const record = {
  source_id: budget.id,
  source_type: "BUDGET",
  record_type: "EXPENSE",
  amount: totalAmount,
  recorded_at: new Date(),
  // ... items
};
```

### Error Cases

| Condition        | Error                                                    |
| ---------------- | -------------------------------------------------------- |
| Budget archived  | `VALIDATION_ERROR: Cannot spend from archived budget`    |
| Amount > balance | `VALIDATION_ERROR: Insufficient budget balance`          |
| Goal not reached | `VALIDATION_ERROR: Goal must be reached before spending` |

## Read Operations

### Get Single Budget

Returns budget with computed fields.

**Response includes:**

- Budget metadata
- Computed: `used_amount` (total_balance - balance)
- Computed: `used_percentage` ((used / total) × 100)
- Computed: `is_reached` (for GOAL: balance = total_balance)

### List Budgets

Returns budgets filtered by state.

**Query parameters:**

| Parameter     | Type    | Description              |
| ------------- | ------- | ------------------------ |
| `wallet_id`   | UUID    | Filter by source wallet  |
| `budget_type` | ENUM    | Filter by BUDGET or GOAL |
| `archived`    | BOOLEAN | Filter by archive state  |

### Get Budget Records

Returns expense records for a budget.

**Query parameters:**

| Parameter   | Type | Description    |
| ----------- | ---- | -------------- |
| `budget_id` | UUID | Required       |
| `from_date` | DATE | Filter by date |
| `to_date`   | DATE | Filter by date |
| `limit`     | INT  | Page size      |
| `offset`    | INT  | Pagination     |

## Update Budget

**Not supported.** Budget properties cannot be modified while active.

Rationale:

- Changing `wallet_id` would require complex balance reconciliation
- Changing `total_balance` mid-period affects spending limits
- Changing `budget_type` changes fundamental behavior

To change allocation, archive the budget (refund all) and reactivate with new amount.

## Reactivate Budget

Restore an archived budget for reuse (e.g., next month).

### Flow

```
┌─────────────────────┐
│  Reactivate Request │
│ (budget_id,         │
│  amount,            │
│  use_same_amount?)  │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Load Budget        │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Validate:          │
│  - Is archived      │
│  - Wallet balance   │
│  - Amount > 0       │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Begin Transaction  │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Update Budget:     │
│  - archived_at=NULL │
│  - balance=amount   │
│  - total_balance=   │
│    amount (if new)  │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Deduct Wallet      │
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

### Reactivation Logic

```javascript
const amount = useSameAmount ? budget.total_balance : newAmount;

// Validate
if (!budget.archived_at) {
  throw new ValidationError("Budget is not archived");
}
if (wallet.balance < amount) {
  throw new ValidationError("Insufficient wallet balance");
}

// Reactivate
budget.archived_at = null;
budget.balance = amount;
if (!useSameAmount) {
  budget.total_balance = amount;
}
wallet.balance -= amount;
```

### Error Cases

| Condition                   | Error                                           |
| --------------------------- | ----------------------------------------------- |
| Budget not archived         | `VALIDATION_ERROR: Budget is not archived`      |
| Insufficient wallet balance | `VALIDATION_ERROR: Insufficient wallet balance` |
| Amount ≤ 0                  | `VALIDATION_ERROR: Amount must be positive`     |

## Delete Budget

**Not supported.** Budgets can only be archived.

Rationale:

- Deletion would orphan balance (where did the money go?)
- Creates ambiguous audit trail
- Archive preserves history while removing from active view

## Transaction Safety

All budget operations that affect balance must be atomic. Create, add funds, refund, and reactivate run inside a database transaction and persist wallet ↔ budget moves as **transfer pairs** (double-entry rows in the `transfer` table via `createTransferPair`), not only raw balance updates.

Spend and auto-archive on zero balance update the budget inside the same transaction as record creation (see [Record Operations](../records/operations.md#create-record)).

The diagram below shows the logical balance effect; the API implementation uses transfers for funding operations:

```sql
BEGIN TRANSACTION;

-- Budget balance update
UPDATE budgets
SET balance = balance + :delta,
    updated_at = NOW()
WHERE id = :budget_id;

-- Wallet balance update (opposite direction)
UPDATE wallets
SET balance = balance - :delta,
    updated_at = NOW()
WHERE id = :wallet_id;

-- Auto-archive check
UPDATE budgets
SET archived_at = NOW()
WHERE id = :budget_id AND balance = 0;

COMMIT;
```

## HTTP API

Domain rules above map to `/api/budgets*` routes. Full method/path/request tables are in [`apps/api/README.md`](../../../../apps/api/README.md#api-routes) — not duplicated here.

| Domain operation | API surface |
| ---------------- | ----------- |
| Create / bulk create | `POST /api/budgets`, `POST /api/budgets/bulk` |
| List / get | `GET /api/budgets`, `GET /api/budgets/:id` |
| Add / refund / reactivate | `POST /api/budgets/:id/add-funds`, `…/refund`, `…/reactivate` |
| Spend | `POST /api/records` (`source_type: BUDGET`) |
| Budget expense history | `GET /api/budgets/:id/records` |

## Related

- [Data Model](./data-model.md) — Schema and relationships
- [Record Operations](../records/operations.md) — Creating records from budgets
- [Wallet Operations](../wallets/operations.md) — Wallet balance management
