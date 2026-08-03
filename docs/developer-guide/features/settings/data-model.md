# Settings Data Model

Technical documentation for the settings data structure.

## Schema

```
Settings
├── id              UUID        PK
├── user_id         UUID        FK → User (unique)
├── currency        VARCHAR     ISO 4217 currency code
├── created_at      TIMESTAMP
└── updated_at      TIMESTAMP
```

## Field Details

| Field        | Type       | Constraints          | Description                                  |
| ------------ | ---------- | -------------------- | -------------------------------------------- |
| `id`         | UUID       | PK, NOT NULL         | Unique identifier                            |
| `user_id`    | UUID       | FK, NOT NULL, UNIQUE | One settings row per user                    |
| `currency`   | VARCHAR(3) | NOT NULL             | ISO 4217 currency code (e.g., USD, EUR, IDR) |
| `created_at` | TIMESTAMP  | NOT NULL             | Record creation timestamp                    |
| `updated_at` | TIMESTAMP  | NOT NULL             | Last modification timestamp                  |

## Single-Row Pattern

Each user has exactly one Settings row, created during onboarding.

```
┌─────────────┐       ┌─────────────┐
│    User     │───1:1─│  Settings   │
└─────────────┘       └─────────────┘
```

### Creation

Settings row is created when user completes onboarding:

```javascript
{
  id: generateUUID(),
  user_id: user.id,
  currency: selectedCurrency,  // From onboarding picker
  created_at: now(),
  updated_at: now()
}
```

### No Delete

Settings row is never deleted — it exists for the lifetime of the user account.

## Currency Field

### Format

ISO 4217 three-letter currency code.

| Code | Currency          |
| ---- | ----------------- |
| USD  | US Dollar         |
| EUR  | Euro              |
| IDR  | Indonesian Rupiah |
| JPY  | Japanese Yen      |
| GBP  | British Pound     |

### Validation

```javascript
const validCurrencies = Intl.supportedValuesOf("currency");
if (!validCurrencies.includes(currency)) {
  throw new ValidationError("Invalid currency code");
}
```

### Usage

Currency is used for **display formatting only**:

```javascript
const formatter = new Intl.NumberFormat(navigator.language, {
  style: "currency",
  currency: settings.currency,
});

formatter.format(1234.56); // "$1,234.56" or "1.234,56 €" etc.
```

No amounts are converted when currency changes.

## Ledger document (export / import / Drive)

Canonical JSON family for Export, Import, and the optional Drive file. Owned in
`apps/web` (`ledger-document.schemas.ts` + `ledger-document.ts`); the API must
not parse entity payloads (ADR-007).

| Field | Role |
| ----- | ---- |
| `version` | Document family version — currently **`2`** (integer) |
| `revised_at` | ISO 8601 timestamp when this revision was produced |
| `content_hash` | SHA-256 (hex) of the **payload only** |
| payload | `settings`, `wallets`, `budgets`, `records`, `transfers`, `debt_loans` |

`content_hash` is computed over canonical JSON of the payload keys above
(sorted object keys). It does **not** include `version`, `revised_at`, or
`content_hash` itself — bumping `revised_at` alone does not change the hash.

Older documents (e.g. `"version": "1.0"`) are rejected with an explicit
unsupported-version error; there is no silent migrate in v1 of this family.

Dexie persistence / wire-up of export buttons is [#40](https://github.com/mupinnn/kaget/issues/40);
this schema is the contract those flows must use.

### Structure

```typescript
interface LedgerDocument {
  version: 2;
  revised_at: string; // ISO 8601
  content_hash: string; // sha-256 hex
  settings: { currency_code: string };
  wallets: Wallet[];
  budgets: Budget[]; // budget_type BUDGET | GOAL
  records: Record[]; // items nested
  transfers: Transfer[];
  debt_loans: DebtLoan[]; // type DEBT | LOAN
}
```

### Example

```json
{
  "version": 2,
  "revised_at": "2026-08-03T10:00:00.000Z",
  "content_hash": "…",
  "settings": {
    "currency_code": "USD"
  },
  "wallets": [
    {
      "id": "...",
      "name": "Bank Account",
      "type": "DIGITAL",
      "balance": 5000.0,
      "created_at": "2026-01-15T08:00:00.000Z",
      "updated_at": "2026-02-01T12:00:00.000Z"
    }
  ],
  "budgets": [],
  "records": [
    {
      "id": "...",
      "source_id": "...",
      "source_type": "WALLET",
      "record_type": "EXPENSE",
      "amount": 50.0,
      "note": "Groceries",
      "recorded_at": "2026-02-01T12:00:00.000Z",
      "created_at": "2026-02-01T12:00:00.000Z",
      "updated_at": "2026-02-01T12:00:00.000Z",
      "items": [
        {
          "id": "...",
          "amount": 30.0,
          "note": "Vegetables",
          "created_at": "2026-02-01T12:00:00.000Z",
          "updated_at": "2026-02-01T12:00:00.000Z"
        }
      ]
    }
  ],
  "transfers": [],
  "debt_loans": []
}
```

## Indexes

| Index       | Columns   | Purpose                      |
| ----------- | --------- | ---------------------------- |
| Primary     | `id`      | Settings lookup              |
| User unique | `user_id` | Ensure one settings per user |

## Related

- [Operations](./operations.md) — Update settings, import/export flows
- [Onboarding Flow](../onboarding/flow.md) — Initial settings creation
- [ADR-001](../../adr/001-locale-and-currency-handling.md) — Currency and locale decisions
