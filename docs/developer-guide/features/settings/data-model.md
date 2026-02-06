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

## Export Data Model

Export is not stored — it's generated on demand from all user entities.

### Export Structure

```typescript
interface ExportData {
  version: string; // Export format version
  exported_at: string; // ISO 8601 timestamp
  settings: Settings;
  wallets: Wallet[];
  records: Record[]; // Includes record_items nested
  budgets: Budget[];
  transfers: Transfer[];
}
```

### Example Export

```json
{
  "version": "1.0",
  "exported_at": "2026-02-05T10:00:00Z",
  "settings": {
    "currency": "USD"
  },
  "wallets": [
    {
      "id": "...",
      "name": "Bank Account",
      "type": "DIGITAL",
      "balance": 5000.00,
      "created_at": "2026-01-15T08:00:00Z",
      "updated_at": "2026-02-01T12:00:00Z"
    }
  ],
  "records": [
    {
      "id": "...",
      "source_id": "...",
      "source_type": "WALLET",
      "record_type": "EXPENSE",
      "amount": 50.00,
      "note": "Groceries",
      "recorded_at": "2026-02-01T12:00:00Z",
      "items": [
        { "amount": 30.00, "note": "Vegetables" },
        { "amount": 20.00, "note": "Fruits" }
      ]
    }
  ],
  "budgets": [...],
  "transfers": [...]
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
