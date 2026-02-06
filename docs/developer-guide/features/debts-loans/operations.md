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

## Read Operations

### List Debts & Loans

```javascript
async function listDebtLoans(userId, { type, status }) {
  const where = { user_id: userId };

  if (type) where.type = type;
  if (status === "PENDING") where.resolved_at = null;
  if (status === "RESOLVED") where.resolved_at = { not: null };

  return await db.debtLoans.findMany({
    where,
    orderBy: { occurred_at: "desc" },
  });
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

## Related

- [Data Model](./data-model.md) — Schema and relationships
- [Record Operations](../records/operations.md) — Record creation
- [Wallet Operations](../wallets/operations.md) — Balance updates
