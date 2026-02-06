# ADR-003: Cascade Delete on Wallet Removal

## Status

Accepted

## Date

2026-02-04

## Context

When a user deletes a wallet, we need to decide what happens to related data:

- Records (income/expense transactions)
- Transfers (money movement between wallets)
- Budget references (budgets that track spending from this wallet)

Key considerations:

- Data integrity — orphaned records with invalid wallet references
- User intent — deleting a wallet implies removing that financial context
- Audit trail — some users may want historical data preserved
- Complexity — soft delete adds significant implementation overhead

## Decision

### Hard Delete with Cascade

**When a wallet is deleted, all related records and transfers are permanently deleted.**

| Entity            | Behavior                                                          |
| ----------------- | ----------------------------------------------------------------- |
| Records           | Deleted — all income/expense records for this wallet              |
| Transfers         | Deleted — any transfer where this wallet is source or destination |
| Budget references | Removed — budget continues to exist, wallet reference nullified   |

### Transaction Integrity

**All deletions occur in a single database transaction.**

```
BEGIN TRANSACTION
  DELETE transfers WHERE from_wallet_id = ? OR to_wallet_id = ?
  DELETE records WHERE wallet_id = ?
  UPDATE budgets SET wallet_id = NULL WHERE wallet_id = ?
  DELETE wallets WHERE id = ?
COMMIT
```

If any step fails, the entire operation rolls back.

### Transfer Impact on Other Wallets

**When a transfer is deleted, the other wallet's balance is restored.**

Example:

- Wallet A: $100, Wallet B: $50
- Transfer $20 from A to B → A: $80, B: $70
- Delete Wallet A:
  - Transfer deleted
  - Wallet B balance recalculated → B: $50 (transfer reversed)

### User Warning

**UI must clearly warn users about cascade impact before deletion.**

Required warning elements:

- Number of records that will be deleted
- Number of transfers that will be deleted
- Statement that action cannot be undone
- Suggestion to export data first

## Consequences

### Positive

- **Data integrity** — No orphaned records with invalid wallet references
- **Simple model** — No soft-delete complexity (deleted_at, filtering, restoration)
- **Clean state** — Database reflects actual current state
- **User clarity** — Wallet gone = data gone, no ambiguity

### Negative

- **No undo** — Accidental deletion cannot be recovered (without backup)
- **No historical queries** — Can't answer "what was in deleted wallet X?"
- **Audit gap** — Compliance-sensitive apps may need deletion logs

### Mitigations

| Risk                | Mitigation                                               |
| ------------------- | -------------------------------------------------------- |
| Accidental deletion | Confirmation dialog with impact summary                  |
| Data loss           | Offer data export before deletion                        |
| Audit requirements  | Log deletion events (wallet id, record count, timestamp) |
| Recovery needs      | Database backups with point-in-time recovery             |

## Alternatives Considered

### 1. Soft Delete (Mark as Deleted)

Add `deleted_at` column, filter in all queries.

**Rejected because:**

- Significant query complexity (every query needs `WHERE deleted_at IS NULL`)
- Storage growth (deleted data accumulates)
- User confusion ("I deleted it but it's still there")
- Restoration UX complexity
- Overkill for personal budgeting app

### 2. Archive Instead of Delete

Move wallet and records to archive tables.

**Rejected because:**

- Implementation complexity (duplicate table structures)
- Query complexity for cross-archive reports
- User expectation mismatch (archive ≠ delete)
- Storage overhead

### 3. Orphan Records (Keep Records, Delete Wallet)

Delete wallet but keep records with `wallet_id = NULL` or a tombstone reference.

**Rejected because:**

- Data integrity issues (records reference non-existent wallet)
- Display confusion (where do orphaned records appear?)
- Balance calculation complexity
- User confusion about orphaned data

### 4. Block Deletion If Records Exist

Require user to delete all records first.

**Rejected because:**

- Poor UX (tedious for wallets with many records)
- User may not understand why deletion is blocked
- Cascade is the expected behavior for "delete container"

## References

- [Wallet Data Model](../features/wallets/data-model.md)
- [Wallet Operations](../features/wallets/operations.md)
