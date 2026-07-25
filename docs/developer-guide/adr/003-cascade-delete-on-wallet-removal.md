# ADR-003: Cascade Delete on Wallet Removal

## Status

Accepted

## Date

2026-02-04

## Context

When a user deletes a wallet, we need to decide what happens to related data:

- Records (income/expense transactions)
- Transfers (money movement between wallets and budgets)
- Budgets linked to this wallet

Key considerations:

- Data integrity — orphaned records with invalid wallet references
- User intent — deleting a wallet implies removing that financial context
- Audit trail — some users may want historical data preserved
- Complexity — soft delete adds significant implementation overhead

Transfers use a **double-entry model**: each transfer creates two records linked by `ref_id`, where `source_id` is the **owner** of each leg (see [Transfers Data Model](../features/transfers/data-model.md)).

## Decision

### Hard Delete with Cascade

**When a wallet is deleted, all records and transfers owned by that wallet are permanently deleted.**

| Entity            | Behavior                                                                 |
| ----------------- | ------------------------------------------------------------------------ |
| Records           | Deleted — all records where `source_id = wallet.id` and `source_type = WALLET` |
| Transfers         | Deleted — only transfers **owned** by the wallet (`source_id = wallet.id`, `source_type = WALLET`) |
| Paired transfers  | **Preserved** — counterparty legs (e.g. receiver's INCOMING) remain with name snapshots |
| Counterparty balances | **Not** recalculated — deletion removes only the deleted wallet's view |
| Budgets           | Cascade deleted — budgets with `wallet_id = wallet.id` are removed       |

### Transaction Integrity

**All deletions occur in a single database transaction.**

```sql
BEGIN TRANSACTION
  DELETE FROM transfer WHERE source_id = :wallet_id AND source_type = 'WALLET'
  DELETE FROM record WHERE source_id = :wallet_id AND source_type = 'WALLET'
  -- budgets cascade via FK on wallet_id
  DELETE FROM wallet WHERE id = :wallet_id
COMMIT
```

If any step fails, the entire operation rolls back.

### Transfer Impact on Counterparties

When a wallet involved in transfers is deleted, only that wallet's **owned** transfer legs are removed. Counterparty records are preserved.

Example:

- Wallet A: $100, Wallet B: $50
- Transfer $20 from A to B → A: $80, B: $70
- Creates two transfer legs linked by `ref_id`:
  - A's OUTGOING (`source_id = A`)
  - B's INCOMING (`source_id = B`)
- Delete Wallet A:
  - A's OUTGOING leg: **deleted**
  - B's INCOMING leg: **preserved** (B still sees "Received $20 from Wallet A" via `destination_name` snapshot)
  - Wallet B balance: **unchanged** at $70

The same owner-leg rule applies when a budget is removed: delete transfers where `source_id = budget.id` and `source_type = BUDGET`; counterparty legs are preserved.

### User Warning

**UI must clearly warn users about cascade impact before deletion.**

Required warning elements:

- Number of records that will be deleted
- Number of **owned** transfers that will be deleted (not both legs of each pair)
- Statement that action cannot be undone
- Suggestion to export data first

## Consequences

### Positive

- **Data integrity** — No orphaned records with invalid wallet references
- **Simple model** — No soft-delete complexity (deleted_at, filtering, restoration)
- **Clean state** — Database reflects actual current state
- **User clarity** — Wallet gone = wallet-owned data gone, no ambiguity
- **Counterparty history** — Other accounts retain their transfer view via snapshots

### Negative

- **No undo** — Accidental deletion cannot be recovered (without backup)
- **No historical queries** — Can't answer "what was in deleted wallet X?"
- **Audit gap** — Compliance-sensitive apps may need deletion logs
- **Asymmetric history** — Counterparty may see transfers the deleted wallet no longer has

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

### 5. Delete Both Transfer Legs and Recalculate Counterparty Balance

Delete any transfer where the wallet is source or destination, then restore counterparty balances.

**Rejected because:**

- Conflicts with double-entry ownership model (`source_id` = owner)
- Breaks counterparty audit trail
- Requires complex balance rollback for immutable transfers
- Superseded by [Transfers Data Model](../features/transfers/data-model.md) cascade behavior

## References

- [Wallet Data Model](../features/wallets/data-model.md)
- [Wallet Operations](../features/wallets/operations.md)
- [Transfers Data Model](../features/transfers/data-model.md) — double-entry cascade behavior
