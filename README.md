# KaGet (Kawan Budget)

KaGet, Kawan Budget. A fully offline (soon) web-based budgeting app that meets your need.

## Docs

### Wallets

Wallets hold the main source of everything.

- A wallet can have two different types of balance-holding:
  - `CASH` wallet
  - `DIGITAL` wallet
- Able to update the wallet name
- Deletion will delete all data referencing the wallet, such as budgets and records (cascade)

### Budgets

Budgets are the main purpose of this app. Planning and maintaining a budget with ease.

- Able to refund the balance to its source wallet
- A budget is allocated based on the wallet’s origin. If the wallet is `CASH`, then the budget will act like the wallet, and _vice versa_.
- Deletion will delete all data referencing the budget, such as records.
  - A budget only deletable when its freshly created—not used. Which means no records for this budget at all.
  - Deletion will roll back all unallocated budget to the wallet origin.
- A budget will be archived when there is no balance can be used (0).
  - The balance and used balance will be reset to 0 and the budget will become archived
  - Able to reactivate the archived budget for next cycle from fresh state while previous record still intact
  - When archived, no activity can be performed within this budget: delete, add balance, and refund.

### Records

A central place to record your cash flow.

- A record will have several properties and use the polymorphic table to provide the flexibility
  - `source_type` → `WALLET`, `BUDGET`, `BUDGET_ITEM`
  - `record_type` → `INCOME`, `EXPENSE`, `LOAN`, `DEBT`, `DEBT_REPAYMENT`, `DEBT_COLLECTION`
- A record can have a sub-item
  - Each sub-item will only have a note and amount
- Deletion will delete all data that reference the record, such as record sub-item (CASCADE)
  - Deletion will roll back the amount to the respective source.

### Transfer

Track internal fund movement between wallet and budget.

- A transfer will have two records for each transfer. One is for incoming funds and the other is for outgoing funds.
- A transfer can record a transfer fee.
- A transfer will save the source and destination data as a snapshot to prevent errors when either the source or destination is deleted.
- A transfer can not be deleted.
