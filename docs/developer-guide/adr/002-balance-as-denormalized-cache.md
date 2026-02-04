# ADR-002: Balance as Denormalized Cache

## Status

Accepted

## Date

2026-02-04

## Context

KaGet needs to display wallet balances frequently (dashboard, wallet list, wallet details). We need to decide how to calculate and store balance data.

Key considerations:

- Wallets may have hundreds or thousands of records
- Balance is displayed on nearly every screen
- Balance must always reflect the sum of all transactions
- Users should not be able to edit balance directly (to prevent data inconsistency)

## Decision

### Balance Source of Truth

**The source of truth for balance is the sum of all records (including an "Opening Balance" record for initial balance).**

```
Actual Balance = Σ(all records for wallet)
```

This includes:

- Opening balance record (income type, created with wallet)
- Income records (+)
- Expense records (−)
- Transfer-in records (+)
- Transfer-out records (−)

### Denormalized Cache

**Store balance as a denormalized column on the wallet table, updated atomically with every transaction.**

```sql
ALTER TABLE wallets ADD COLUMN balance DECIMAL(19,4) NOT NULL DEFAULT 0;
```

Update rules:
| Event | Update |
|-------|--------|
| Record created | Adjust balance by ±amount |
| Record deleted | Reverse the adjustment |
| Record updated | Adjust by delta |
| Transfer | Debit source, credit destination |

### Initial Balance as Record

**When a wallet is created with an initial balance, create an "Opening Balance" record instead of setting balance directly.**

This ensures:

- All balance changes are tracked as records
- No special case in balance calculation
- User can edit/delete opening balance like any record

### No Direct Balance Edit

**Users cannot edit the balance column directly. All balance changes must go through records or transfers.**

This prevents:

- Data inconsistency (balance drifting from actual records)
- Audit trail gaps
- User confusion about why balance doesn't match records

## Consequences

### Positive

- **O(1) balance reads** — No aggregation query needed
- **Single source of truth** — Records are the canonical data
- **Full audit trail** — Every balance change is a record
- **Data integrity** — Balance always reconcilable against records
- **Simple UX** — Users understand "balance = sum of transactions"

### Negative

- **Write overhead** — Every record mutation requires balance update
- **Consistency risk** — Bug in update logic could cause drift
- **Atomic transaction required** — Record + balance update must be atomic
- **Recovery complexity** — Need recalculation logic if balance drifts

### Mitigations

| Risk           | Mitigation                                                  |
| -------------- | ----------------------------------------------------------- |
| Balance drift  | Periodic reconciliation job comparing cached vs. calculated |
| Atomic failure | Database transaction wrapping record + balance update       |
| Update bugs    | Comprehensive tests for all mutation scenarios              |

## Alternatives Considered

### 1. Compute Balance on Every Read

```sql
SELECT SUM(...) FROM records WHERE wallet_id = ?
```

**Rejected because:**

- O(n) read cost for every balance display
- Unacceptable latency for wallets with many records
- Dashboard would require N aggregate queries (one per wallet)

### 2. Store Initial Balance Separately

```sql
balance = initial_balance + SUM(records)
```

**Rejected because:**

- Two sources contributing to balance
- Special case in calculation logic
- No audit trail for initial balance
- User can't "fix" initial balance without special UI

### 3. Allow Direct Balance Edit

**Rejected because:**

- Creates data inconsistency (balance ≠ sum of records)
- No audit trail for manual adjustments
- User confusion when records don't add up to balance
- Defeats the purpose of transaction tracking

## References

- [Wallet Data Model](../features/wallets/data-model.md)
- [Wallet Operations](../features/wallets/operations.md)
