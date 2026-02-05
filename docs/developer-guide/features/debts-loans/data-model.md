# Debts & Loans Data Model

Technical documentation for the DebtLoan data structure and relationships.

## Schema

```
DebtLoan
├── id                  UUID        PK
├── note                VARCHAR     Optional description
├── other_party         VARCHAR     Name of lender/borrower
├── amount              DECIMAL     Original amount
├── type                ENUM        LOAN or DEBT
├── source_id           UUID        FK → Wallet
├── source_type         ENUM        WALLET (for future expansion)
├── initial_record_id   UUID        FK → Record
├── resolved_at         TIMESTAMP   When paid/collected (nullable)
├── resolved_record_id  UUID        FK → Record (nullable)
├── occurred_at         TIMESTAMP   User-specified date
├── created_at          TIMESTAMP
└── updated_at          TIMESTAMP
```

## Field Details

| Field                | Type          | Constraints   | Description                                 |
| -------------------- | ------------- | ------------- | ------------------------------------------- |
| `id`                 | UUID          | PK, NOT NULL  | Unique identifier                           |
| `note`               | VARCHAR(500)  | NULL          | Optional description                        |
| `other_party`        | VARCHAR(255)  | NOT NULL      | Name of person (who you owe / who owes you) |
| `amount`             | DECIMAL(19,4) | NOT NULL, > 0 | Original debt/loan amount                   |
| `type`               | ENUM          | NOT NULL      | `DEBT` or `LOAN`                            |
| `source_id`          | UUID          | FK, NOT NULL  | Wallet affected                             |
| `source_type`        | ENUM          | NOT NULL      | `WALLET` (future: BUDGET?)                  |
| `initial_record_id`  | UUID          | FK, NOT NULL  | Record created at debt/loan creation        |
| `resolved_at`        | TIMESTAMP     | NULL          | When marked as paid/collected               |
| `resolved_record_id` | UUID          | FK, NULL      | Record created at resolution                |
| `occurred_at`        | TIMESTAMP     | NOT NULL      | User-specified date of debt/loan            |
| `created_at`         | TIMESTAMP     | NOT NULL      | Record creation timestamp                   |
| `updated_at`         | TIMESTAMP     | NOT NULL      | Last modification timestamp                 |

## Type Definitions

### DebtLoan Type

| Type   | User's Role | Meaning                          |
| ------ | ----------- | -------------------------------- |
| `DEBT` | Borrower    | User owes money to `other_party` |
| `LOAN` | Lender      | `other_party` owes money to user |

### Associated Record Types

| DebtLoan Type | Initial Record Type | Resolution Record Type |
| ------------- | ------------------- | ---------------------- |
| `DEBT`        | `DEBT` (+)          | `DEBT_REPAYMENT` (−)   |
| `LOAN`        | `LOAN` (−)          | `LOAN_COLLECTION` (+)  |

## Record Type Enum (Updated)

```
record_type ENUM:
├── INCOME
├── EXPENSE
├── DEBT              ← Borrowed money received
├── DEBT_REPAYMENT    ← Paying back borrowed money
├── LOAN              ← Lent money out
└── LOAN_COLLECTION   ← Collecting lent money
```

### Balance Impact

```javascript
const BALANCE_IMPACT = {
  INCOME: +1,
  EXPENSE: -1,
  DEBT: +1, // Money in (borrowed)
  DEBT_REPAYMENT: -1, // Money out (paying back)
  LOAN: -1, // Money out (lending)
  LOAN_COLLECTION: +1, // Money in (collecting)
};

function getBalanceDelta(recordType, amount) {
  return BALANCE_IMPACT[recordType] * amount;
}
```

## State

DebtLoan has two states derived from `resolved_at`:

| State    | Condition                 | Meaning               |
| -------- | ------------------------- | --------------------- |
| PENDING  | `resolved_at IS NULL`     | Outstanding debt/loan |
| RESOLVED | `resolved_at IS NOT NULL` | Paid back / collected |

```javascript
function getStatus(debtLoan) {
  return debtLoan.resolved_at ? "RESOLVED" : "PENDING";
}
```

## Relationships

```
┌─────────────┐       ┌─────────────┐
│   Wallet    │───1:N─│  DebtLoan   │
└─────────────┘       └──────┬──────┘
                             │
                             │ 1:1 (initial)
                             │ 1:1 (resolved, optional)
                             ▼
                      ┌─────────────┐
                      │   Record    │
                      └─────────────┘
```

### DebtLoan → Record

Each DebtLoan references up to two records:

```
DebtLoan
├── initial_record_id ──→ Record (DEBT or LOAN)
└── resolved_record_id ─→ Record (DEBT_REPAYMENT or LOAN_COLLECTION)
```

### Record → DebtLoan (Reverse Lookup)

Records with types `DEBT`, `LOAN`, `DEBT_REPAYMENT`, `LOAN_COLLECTION` can be traced back to their DebtLoan:

```sql
SELECT * FROM debt_loans
WHERE initial_record_id = :record_id
   OR resolved_record_id = :record_id;
```

## Example Data

### Pending Debt

```javascript
{
  id: "dl-001",
  note: "Rent help",
  other_party: "Sarah",
  amount: 200.00,
  type: "DEBT",
  source_id: "wallet-001",        // Bank Account
  source_type: "WALLET",
  initial_record_id: "rec-001",   // DEBT record, +$200
  resolved_at: null,
  resolved_record_id: null,
  occurred_at: "2026-02-01T00:00:00Z",
  created_at: "2026-02-01T10:00:00Z",
  updated_at: "2026-02-01T10:00:00Z"
}
```

### Resolved Loan

```javascript
{
  id: "dl-002",
  note: "Gas money",
  other_party: "Mike",
  amount: 50.00,
  type: "LOAN",
  source_id: "wallet-002",        // Cash
  source_type: "WALLET",
  initial_record_id: "rec-002",   // LOAN record, −$50
  resolved_at: "2026-02-05T14:00:00Z",
  resolved_record_id: "rec-003",  // LOAN_COLLECTION record, +$50
  occurred_at: "2026-01-28T00:00:00Z",
  created_at: "2026-01-28T09:00:00Z",
  updated_at: "2026-02-05T14:00:00Z"
}
```

## Cascade Behavior

### On Wallet Delete

| Entity                              | Behavior                              |
| ----------------------------------- | ------------------------------------- |
| DebtLoan (where source_id = wallet) | Cascade delete                        |
| Associated records                  | Cascade delete (via wallet's records) |

### On DebtLoan Delete

| Entity          | Behavior                               |
| --------------- | -------------------------------------- |
| initial_record  | Delete and reverse balance             |
| resolved_record | Delete and reverse balance (if exists) |

## Indexes

| Index           | Columns                  | Purpose                         |
| --------------- | ------------------------ | ------------------------------- |
| Primary         | `id`                     | DebtLoan lookup                 |
| Source lookup   | `source_type, source_id` | List by wallet                  |
| Type filter     | `type`                   | Filter debts vs loans           |
| Status filter   | `resolved_at`            | Filter pending vs resolved      |
| Initial record  | `initial_record_id`      | Unique, find DebtLoan by record |
| Resolved record | `resolved_record_id`     | Unique, find DebtLoan by record |

## Validation

| Constraint              | Check                                     |
| ----------------------- | ----------------------------------------- |
| Amount positive         | `amount > 0`                              |
| Other party required    | `other_party` is not empty                |
| Source exists           | `source_id` references valid wallet       |
| Initial record required | `initial_record_id` must be set           |
| Consistent record type  | Initial record type matches DebtLoan type |

## Related

- [Operations](./operations.md) — Create, resolve, delete flows
- [Record Data Model](../records/data-model.md) — Record types
- [Wallet Data Model](../wallets/data-model.md) — Balance updates
