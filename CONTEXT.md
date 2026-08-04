# KaGet

Personal budgeting where money is allocated into envelopes before it is spent — not tracked only as category limits on a shared balance.

## Language

### Money holders

**Wallet**:
A real-world money account the user controls (cash, bank, e-wallet). Source of funds for allocations and wallet-level records.
_Avoid_: Account, pocket, balance container

**Budget**:
A spending envelope funded from a Wallet. Holds allocated money separately; expenses reduce the Budget balance, not the source Wallet balance.
_Avoid_: Category limit, spending cap, budget category

**Goal**:
A saving envelope funded from a Wallet toward a target. Spending is locked until the Goal is fully funded.
_Avoid_: Savings target (alone), wish list

### Movements

**Record**:
An income or expense that changes a money holder's balance (Wallet or Budget/Goal as source).
_Avoid_: Transaction, entry (when meaning a cash-flow event)

**Transfer**:
A movement of money between Wallets and/or Budgets/Goals, tracked as internal fund movement (optional fee).
_Avoid_: Move, reallocation (as the entity name)

### Obligations

**Debt**:
Money the user owes someone else; creating it increases a Wallet balance (borrowed cash received); resolving it records repayment.
_Avoid_: Accounts payable, bill, IOU (alone)

**Loan**:
Money someone else owes the user; creating it reduces a Wallet balance (cash lent out); resolving it records collection.
_Avoid_: Accounts receivable, receivable (alone)

### Product invariant

**Envelope allocation**:
Money leaves a Wallet into a Budget or Goal before it can be spent from that envelope. Budgets and Goals are funded pools, not soft limits on Wallet balance.
_Avoid_: Category budgeting, virtual budget, spending limit

### Durability (optional)

**Working ledger**:
The day-to-day copy of the user's financial ledger on the device; envelope rules and balances apply here.
_Avoid_: Server ledger, cloud database, source of truth on Drive

**Ledger document**:
The versioned whole-file JSON that represents a ledger snapshot for export, import, and optional Drive durability.
_Avoid_: Spreadsheet, row sync, partial merge file

**Sync**:
Optional whole-file reconcile between the Working ledger and the Drive Ledger document; offline use does not require it.
_Avoid_: Record-level sync, realtime replication, silent last-write-wins

**Sync conflict**:
Both the Working ledger and the remote Ledger document changed since the last successful Sync; the product blocks auto-apply until the user chooses.
_Avoid_: Merge conflict (as CRDT/field merge), auto-resolve

**Keep local** / **Keep remote**:
The only Sync conflict resolutions in v1 — overwrite Drive with the Working ledger, or replace the Working ledger from Drive (export first is allowed).
_Avoid_: Last-write-wins, automatic merge
