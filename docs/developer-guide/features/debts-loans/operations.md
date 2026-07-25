# Debts & Loans Operations

Technical documentation for debt/loan operations and business logic.

## Overview

Operations follow these principles:

- Creating a debt/loan always creates a record
- Resolving always creates a resolution record
- Deleting removes associated records and reverses balances
- All operations are transactional

## Create Debt

### Flow

```
┌─────────────────────────┐
│    Create Debt          │
│    Request              │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  Validate Input         │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  Begin Transaction      │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  Create DEBT Record     │
│  (wallet +)             │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  Update Wallet Balance  │
│  += amount              │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  Create DebtLoan        │
│  Entity                 │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  Commit Transaction     │
└───────────┬─────────────┘
            │
            ▼
          Done
```

### Implementation

```javascript
async function createDebt({ walletId, amount, otherParty, note, occurredAt }) {
  return await db.$transaction(async tx => {
    const wallet = await tx.wallets.findUnique({ where: { id: walletId } });
    if (!wallet) throw new NotFoundError("Wallet not found");

    // Create DEBT record (money received)
    const record = await tx.records.create({
      data: {
        id: generateUUID(),
        source_id: walletId,
        source_type: "WALLET",
        record_type: "DEBT",
        amount: amount,
        note: note || `Borrowed from ${otherParty}`,
        recorded_at: occurredAt,
        created_at: now(),
        updated_at: now(),
      },
    });

    // Create record item
    await tx.recordItems.create({
      data: {
        id: generateUUID(),
        record_id: record.id,
        amount: amount,
        note: note || `Borrowed from ${otherParty}`,
      },
    });

    // Update wallet balance (+)
    await tx.wallets.update({
      where: { id: walletId },
      data: {
        balance: wallet.balance + amount,
        updated_at: now(),
      },
    });

    // Create DebtLoan entity
    const debtLoan = await tx.debtLoans.create({
      data: {
        id: generateUUID(),
        note: note,
        other_party: otherParty,
        amount: amount,
        type: "DEBT",
        source_id: walletId,
        source_type: "WALLET",
        initial_record_id: record.id,
        occurred_at: occurredAt,
        created_at: now(),
        updated_at: now(),
      },
    });

    return debtLoan;
  });
}
```

## Create Loan

### Flow

```
┌─────────────────────────┐
│    Create Loan          │
│    Request              │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  Validate Input         │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  Check Wallet Balance   │
│  >= amount              │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  Begin Transaction      │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  Create LOAN Record     │
│  (wallet −)             │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  Update Wallet Balance  │
│  −= amount              │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  Create DebtLoan        │
│  Entity                 │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  Commit Transaction     │
└───────────┬─────────────┘
            │
            ▼
          Done
```

### Implementation

```javascript
async function createLoan({ walletId, amount, otherParty, note, occurredAt }) {
  return await db.$transaction(async tx => {
    const wallet = await tx.wallets.findUnique({ where: { id: walletId } });
    if (!wallet) throw new NotFoundError("Wallet not found");

    // Check sufficient balance
    if (wallet.balance < amount) {
      throw new ValidationError("Insufficient balance");
    }

    // Create LOAN record (money out)
    const record = await tx.records.create({
      data: {
        id: generateUUID(),
        source_id: walletId,
        source_type: "WALLET",
        record_type: "LOAN",
        amount: amount,
        note: note || `Lent to ${otherParty}`,
        recorded_at: occurredAt,
        created_at: now(),
        updated_at: now(),
      },
    });

    // Create record item
    await tx.recordItems.create({
      data: {
        id: generateUUID(),
        record_id: record.id,
        amount: amount,
        note: note || `Lent to ${otherParty}`,
      },
    });

    // Update wallet balance (−)
    await tx.wallets.update({
      where: { id: walletId },
      data: {
        balance: wallet.balance - amount,
        updated_at: now(),
      },
    });

    // Create DebtLoan entity
    const debtLoan = await tx.debtLoans.create({
      data: {
        id: generateUUID(),
        note: note,
        other_party: otherParty,
        amount: amount,
        type: "LOAN",
        source_id: walletId,
        source_type: "WALLET",
        initial_record_id: record.id,
        occurred_at: occurredAt,
        created_at: now(),
        updated_at: now(),
      },
    });

    return debtLoan;
  });
}
```

## Resolve Debt (Mark as Paid)

### Flow

```
┌─────────────────────────┐
│    Resolve Debt         │
│    Request              │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  Validate DebtLoan      │
│  (exists, is DEBT,      │
│   not resolved)         │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  Check Wallet Balance   │
│  >= amount              │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  Begin Transaction      │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  Create DEBT_REPAYMENT  │
│  Record (wallet −)      │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  Update Wallet Balance  │
│  −= amount              │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  Update DebtLoan        │
│  (resolved_at,          │
│   resolved_record_id)   │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  Commit Transaction     │
└───────────┬─────────────┘
            │
            ▼
          Done
```

### Implementation

```javascript
async function resolveDebt(debtLoanId) {
  return await db.$transaction(async tx => {
    const debtLoan = await tx.debtLoans.findUnique({
      where: { id: debtLoanId },
    });

    if (!debtLoan) throw new NotFoundError("Debt not found");
    if (debtLoan.type !== "DEBT") throw new ValidationError("Not a debt");
    if (debtLoan.resolved_at) throw new ValidationError("Already resolved");

    const wallet = await tx.wallets.findUnique({
      where: { id: debtLoan.source_id },
    });

    // Check sufficient balance for repayment
    if (wallet.balance < debtLoan.amount) {
      throw new ValidationError("Insufficient balance for repayment");
    }

    // Create DEBT_REPAYMENT record
    const record = await tx.records.create({
      data: {
        id: generateUUID(),
        source_id: debtLoan.source_id,
        source_type: "WALLET",
        record_type: "DEBT_REPAYMENT",
        amount: debtLoan.amount,
        note: `Repaid ${debtLoan.other_party}`,
        recorded_at: now(),
        created_at: now(),
        updated_at: now(),
      },
    });

    // Create record item
    await tx.recordItems.create({
      data: {
        id: generateUUID(),
        record_id: record.id,
        amount: debtLoan.amount,
        note: `Repaid ${debtLoan.other_party}`,
      },
    });

    // Update wallet balance (−)
    await tx.wallets.update({
      where: { id: debtLoan.source_id },
      data: {
        balance: wallet.balance - debtLoan.amount,
        updated_at: now(),
      },
    });

    // Update DebtLoan
    const updated = await tx.debtLoans.update({
      where: { id: debtLoanId },
      data: {
        resolved_at: now(),
        resolved_record_id: record.id,
        updated_at: now(),
      },
    });

    return updated;
  });
}
```

## Resolve Loan (Mark as Collected)

### Implementation

```javascript
async function resolveLoan(debtLoanId) {
  return await db.$transaction(async tx => {
    const debtLoan = await tx.debtLoans.findUnique({
      where: { id: debtLoanId },
    });

    if (!debtLoan) throw new NotFoundError("Loan not found");
    if (debtLoan.type !== "LOAN") throw new ValidationError("Not a loan");
    if (debtLoan.resolved_at) throw new ValidationError("Already resolved");

    const wallet = await tx.wallets.findUnique({
      where: { id: debtLoan.source_id },
    });

    // Create LOAN_COLLECTION record
    const record = await tx.records.create({
      data: {
        id: generateUUID(),
        source_id: debtLoan.source_id,
        source_type: "WALLET",
        record_type: "LOAN_COLLECTION",
        amount: debtLoan.amount,
        note: `Collected from ${debtLoan.other_party}`,
        recorded_at: now(),
        created_at: now(),
        updated_at: now(),
      },
    });

    // Create record item
    await tx.recordItems.create({
      data: {
        id: generateUUID(),
        record_id: record.id,
        amount: debtLoan.amount,
        note: `Collected from ${debtLoan.other_party}`,
      },
    });

    // Update wallet balance (+)
    await tx.wallets.update({
      where: { id: debtLoan.source_id },
      data: {
        balance: wallet.balance + debtLoan.amount,
        updated_at: now(),
      },
    });

    // Update DebtLoan
    const updated = await tx.debtLoans.update({
      where: { id: debtLoanId },
      data: {
        resolved_at: now(),
        resolved_record_id: record.id,
        updated_at: now(),
      },
    });

    return updated;
  });
}
```

## Delete Debt/Loan

### Flow

```
┌─────────────────────────┐
│    Delete DebtLoan      │
│    Request              │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  Fetch DebtLoan         │
│  with records           │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  Begin Transaction      │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  Delete resolved_record │
│  (if exists)            │
│  Reverse balance        │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  Delete initial_record  │
│  Reverse balance        │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  Delete DebtLoan        │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  Commit Transaction     │
└───────────┬─────────────┘
            │
            ▼
          Done
```

### Implementation

```javascript
async function deleteDebtLoan(debtLoanId) {
  return await db.$transaction(async tx => {
    const debtLoan = await tx.debtLoans.findUnique({
      where: { id: debtLoanId },
    });

    if (!debtLoan) throw new NotFoundError("Debt/Loan not found");

    const wallet = await tx.wallets.findUnique({
      where: { id: debtLoan.source_id },
    });

    let balanceAdjustment = 0;

    // Delete resolved record (if exists)
    if (debtLoan.resolved_record_id) {
      await tx.recordItems.deleteMany({
        where: { record_id: debtLoan.resolved_record_id },
      });
      await tx.records.delete({
        where: { id: debtLoan.resolved_record_id },
      });

      // Reverse resolution balance impact
      if (debtLoan.type === "DEBT") {
        // DEBT_REPAYMENT was −, so reverse is +
        balanceAdjustment += debtLoan.amount;
      } else {
        // LOAN_COLLECTION was +, so reverse is −
        balanceAdjustment -= debtLoan.amount;
      }
    }

    // Delete initial record
    await tx.recordItems.deleteMany({
      where: { record_id: debtLoan.initial_record_id },
    });
    await tx.records.delete({
      where: { id: debtLoan.initial_record_id },
    });

    // Reverse initial balance impact
    if (debtLoan.type === "DEBT") {
      // DEBT was +, so reverse is −
      balanceAdjustment -= debtLoan.amount;
    } else {
      // LOAN was −, so reverse is +
      balanceAdjustment += debtLoan.amount;
    }

    // Update wallet balance
    await tx.wallets.update({
      where: { id: debtLoan.source_id },
      data: {
        balance: wallet.balance + balanceAdjustment,
        updated_at: now(),
      },
    });

    // Delete DebtLoan
    await tx.debtLoans.delete({ where: { id: debtLoanId } });
  });
}
```

### Delete Balance Impact Summary

| Scenario              | Type | Initial Reverse | Resolution Reverse | Net     |
| --------------------- | ---- | --------------- | ------------------ | ------- |
| Pending DEBT deleted  | DEBT | −amount         | N/A                | −amount |
| Resolved DEBT deleted | DEBT | −amount         | +amount            | 0       |
| Pending LOAN deleted  | LOAN | +amount         | N/A                | +amount |
| Resolved LOAN deleted | LOAN | +amount         | −amount            | 0       |

## Update Debt/Loan

Pending debts and loans can be edited. Resolved debts and loans are immutable.

### Editable Fields

| Field         | Balance impact | Notes                                      |
| ------------- | -------------- | ------------------------------------------ |
| `note`        | No             | Optional; `null` clears                    |
| `other_party` | No             | Required when provided                     |
| `amount`      | Yes            | Recalculates wallet balance and record     |
| `occurred_at` | No             | Updates debt/loan and initial record date  |

`type` and `wallet_id` are **not** editable — delete and recreate instead.

### Flow

```
┌─────────────────────────┐
│    Update DebtLoan      │
│    Request              │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  Validate Pending       │
│  (not resolved)         │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  Begin Transaction      │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  If amount changed:     │
│  Apply balance delta    │
│  (LOAN: check balance)  │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  Update DebtLoan        │
│  Update initial record  │
│  Update record item     │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  Commit Transaction     │
└─────────────────────────┘
```

### Implementation

```javascript
async function updateDebtLoan(debtLoanId, { note, otherParty, amount, occurredAt }) {
  return await db.$transaction(async tx => {
    const debtLoan = await tx.debtLoans.findUnique({ where: { id: debtLoanId } });
    if (!debtLoan) throw new NotFoundError("Debt/Loan not found");
    if (debtLoan.resolved_at) throw new ValidationError("Already resolved");

    const wallet = await tx.wallets.findUnique({ where: { id: debtLoan.source_id } });
    const oldAmount = debtLoan.amount;
    const newAmount = amount ?? oldAmount;

    if (amount !== undefined && newAmount !== oldAmount) {
      const oldDelta = getBalanceDelta(debtLoan.type, oldAmount);
      const newDelta = getBalanceDelta(debtLoan.type, newAmount);
      const netDelta = newDelta - oldDelta;

      if (debtLoan.type === "LOAN" && netDelta < 0 && wallet.balance < Math.abs(netDelta)) {
        throw new ValidationError("Insufficient balance");
      }

      await tx.wallets.update({
        where: { id: debtLoan.source_id },
        data: { balance: wallet.balance + netDelta },
      });
    }

    const newOtherParty = otherParty ?? debtLoan.other_party;
    const newNote = note !== undefined ? note : debtLoan.note;
    const newOccurredAt = occurredAt ?? debtLoan.occurred_at;
    const recordNote = newNote ?? getDefaultNote(debtLoan.type, newOtherParty);

    await tx.debtLoans.update({
      where: { id: debtLoanId },
      data: {
        note: newNote,
        other_party: newOtherParty,
        amount: newAmount,
        occurred_at: newOccurredAt,
        updated_at: now(),
      },
    });

    await tx.records.update({
      where: { id: debtLoan.initial_record_id },
      data: {
        note: recordNote,
        amount: newAmount,
        recorded_at: newOccurredAt,
        updated_at: now(),
      },
    });

    await tx.recordItems.updateMany({
      where: { record_id: debtLoan.initial_record_id },
      data: { note: recordNote, amount: newAmount },
    });

    return debtLoan;
  });
}
```

### Amount Change Examples

| Type | Change      | Wallet impact |
| ---- | ----------- | ------------- |
| DEBT | 100 → 150   | +50           |
| DEBT | 150 → 100   | −50           |
| LOAN | 100 → 150   | −50 (balance check) |
| LOAN | 150 → 100   | +50           |

## Validation

### Create Validation

| Field              | Rules                               |
| ------------------ | ----------------------------------- |
| `wallet_id`        | Required, must exist                |
| `amount`           | Required, > 0                       |
| `other_party`      | Required, not empty                 |
| `occurred_at`      | Required, valid date                |
| Balance (for LOAN) | Wallet must have sufficient balance |

### Resolve Validation

| Check                           | Error                                                  |
| ------------------------------- | ------------------------------------------------------ |
| DebtLoan not found              | `NOT_FOUND`                                            |
| Wrong type                      | `VALIDATION_ERROR: Not a debt/loan`                    |
| Already resolved                | `VALIDATION_ERROR: Already resolved`                   |
| Insufficient balance (for DEBT) | `VALIDATION_ERROR: Insufficient balance for repayment` |

### Update Validation

| Check                           | Error                                                  |
| ------------------------------- | ------------------------------------------------------ |
| DebtLoan not found              | `NOT_FOUND`                                            |
| Already resolved                | `VALIDATION_ERROR: Already resolved`                   |
| Insufficient balance (for LOAN amount increase) | `VALIDATION_ERROR: Insufficient balance` |

## Read Operations

Ownership is scoped via the user's wallets (`wallet.user_id`), not a `user_id` column on `debt_loan`.

### List Debts & Loans

```javascript
async function listDebtLoans(userId, { type, status, walletId, limit, offset }) {
  const walletIds = await getUserWalletIds(userId);
  const where = { source_id: { in: walletIds }, source_type: "WALLET" };

  if (walletId) where.source_id = walletId;
  if (type) where.type = type;
  if (status === "PENDING") where.resolved_at = null;
  if (status === "RESOLVED") where.resolved_at = { not: null };

  const [debtLoans, total] = await Promise.all([
    db.debtLoans.findMany({
      where,
      orderBy: { occurred_at: "desc" },
      take: limit,
      skip: offset,
    }),
    db.debtLoans.count({ where }),
  ]);

  return { debt_loans: debtLoans, pagination: { total, limit, offset } };
}
```

### Get Single Debt/Loan

```javascript
async function getDebtLoan(debtLoanId) {
  const debtLoan = await db.debtLoans.findUnique({
    where: { id: debtLoanId },
    include: {
      initial_record: true,
      resolved_record: true,
      wallet: true,
    },
  });

  if (!debtLoan) throw new NotFoundError("Debt/Loan not found");
  return debtLoan;
}
```

## REST API

Server routes are mounted at `/api/debts-loans`. All endpoints require authentication.

### Endpoints

| Method | Path | Description |
| ------ | ---- | ----------- |
| `POST` | `/api/debts-loans` | Create debt or loan |
| `GET` | `/api/debts-loans` | List with filters and pagination |
| `GET` | `/api/debts-loans/:id` | Detail with linked records and wallet |
| `PATCH` | `/api/debts-loans/:id` | Update pending debt/loan |
| `POST` | `/api/debts-loans/:id/resolve` | Mark paid (DEBT) or collected (LOAN) |
| `DELETE` | `/api/debts-loans/:id` | Delete and reverse balances |

### Create request

```json
{
  "type": "DEBT",
  "wallet_id": "wallet-id",
  "amount": 100,
  "other_party": "Sarah",
  "occurred_at": "2026-02-01T00:00:00.000Z",
  "note": "Rent help"
}
```

### Update request

```json
{
  "note": "Updated note",
  "other_party": "Sarah",
  "amount": 150,
  "occurred_at": "2026-02-02T00:00:00.000Z"
}
```

At least one field is required. Resolved debt/loans return `DEBT_LOAN_ALREADY_RESOLVED`.

### List query parameters

| Parameter   | Type     | Description                          |
| ----------- | -------- | ------------------------------------ |
| `type`      | `DEBT` \| `LOAN` | Filter by type               |
| `status`    | `PENDING` \| `RESOLVED` | Filter by status      |
| `wallet_id` | string   | Filter by wallet                     |
| `limit`     | number   | Page size (default 20, max 100)      |
| `offset`    | number   | Page offset (default 0)              |

### List response

```json
{
  "data": {
    "debt_loans": [],
    "pagination": { "total": 0, "limit": 20, "offset": 0 }
  }
}
```

### Error codes

| Code | HTTP | When |
| ---- | ---- | ---- |
| `DEBT_LOAN_NOT_FOUND` | 404 | Missing or not owned |
| `DEBT_LOAN_ALREADY_RESOLVED` | 400 | Update or resolve on resolved entity |
| `DEBT_LOAN_INSUFFICIENT_BALANCE` | 400 | LOAN create/update or DEBT resolve |
| `VALIDATION_INVALID_INPUT` | 400 | Zod validation failure |

## Related

- [Data Model](./data-model.md) — Schema and relationships
- [Record Operations](../records/operations.md) — Record creation
- [Wallet Operations](../wallets/operations.md) — Balance updates
