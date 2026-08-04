# Settings Operations

Technical documentation for settings operations and import/export flows.

## Update Settings

### Update Currency

```
┌─────────────────────────┐
│   Update Currency       │
│   Request               │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  Validate Currency      │
│  (ISO 4217)             │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  Update Settings Row    │
└───────────┬─────────────┘
            │
            ▼
          Done
```

### Implementation

```javascript
async function updateCurrency(userId, newCurrency) {
  // Validate currency code
  const validCurrencies = Intl.supportedValuesOf("currency");
  if (!validCurrencies.includes(newCurrency)) {
    throw new ValidationError("Invalid currency code");
  }

  // Update settings
  await db.settings.update({
    where: { user_id: userId },
    data: {
      currency: newCurrency,
      updated_at: now(),
    },
  });
}
```

### Validation

| Field      | Rules                                 |
| ---------- | ------------------------------------- |
| `currency` | Required, must be valid ISO 4217 code |

### Error Cases

| Condition             | Error                                     |
| --------------------- | ----------------------------------------- |
| Invalid currency code | `VALIDATION_ERROR: Invalid currency code` |
| Settings not found    | `NOT_FOUND: Settings not found`           |

## Export Data

### Flow

```
┌─────────────────────────┐
│   Export Request        │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  Fetch Settings         │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  Fetch All Wallets      │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  Fetch All Records      │
│  with Items             │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  Fetch All Budgets      │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  Fetch All Transfers    │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  Fetch All DebtLoans    │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  buildLedgerDocument()  │
│  (version, revised_at,  │
│   content_hash, payload)│
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  Return JSON            │
└───────────┬─────────────┘
            │
            ▼
          Done
```

### Implementation

Canonical helpers live in `apps/web` (`ledger-document.ts`). Dexie read/write for export/import is wired via `ledger-ie.services.ts` (working ledger restored in [#40](https://github.com/mupinnn/kaget/issues/40)).

```javascript
import {
  buildLedgerDocument,
  serializeLedgerDocument,
} from "./ledger-document";

async function exportData() {
  const payload = {
    settings: { currency_code: settings.currencyCode },
    wallets: wallets.map(toLedgerWallet),
    budgets: budgets.map(toLedgerBudget),
    records: records.map(toLedgerRecord),
    transfers: transfers.map(toLedgerTransfer),
    debt_loans: debtLoans.map(toLedgerDebtLoan),
  };

  const document = await buildLedgerDocument(payload);
  return serializeLedgerDocument(document, { pretty: true });
}
```

### Export Fields

| Entity   | Exported Fields                                                                                                                                                                    |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Settings | `currency_code`                                                                                                                                                                    |
| Wallet   | `id`, `name`, `type`, `balance`, timestamps                                                                                                                                        |
| Record   | `id`, `source_id`, `source_type`, `record_type`, `amount`, `note`, `recorded_at`, timestamps, `items[]`                                                                            |
| Budget   | `id`, `name`, `wallet_id`, `budget_type`, `total_balance`, `balance`, `archived_at`, timestamps                                                                                   |
| Transfer | `id`, `source_id`, `source_type`, `source_name`, `destination_id`, `destination_type`, `destination_name`, `type`, `amount`, `fee`, `note`, `ref_id`, `transferred_at`, timestamps |
| DebtLoan | `id`, `note`, `other_party`, `amount`, `type`, `source_id`, `source_type`, `initial_record_id`, `resolved_at`, `resolved_record_id`, `occurred_at`, timestamps                    |

## Import Data

### Flow

```
┌─────────────────────────┐
│   Import Request        │
│   (JSON file)           │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  parseLedgerDocument()  │
│  version + schema + hash│
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  Validate References    │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  Begin Transaction      │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  Replace local ledger   │
│  (Dexie — see #40)      │
└───────────┬─────────────┘
            │
            ▼
          Done
```

### Implementation

```javascript
import {
  parseLedgerDocumentJson,
  UnsupportedLedgerDocumentVersionError,
} from "./ledger-document";

async function importData(jsonText) {
  const document = await parseLedgerDocumentJson(jsonText);
  // Replace local Dexie tables from document payload (#40)
  await replaceLocalLedger(extractLedgerDocumentPayload(document));
}
```

### Validation

| Condition            | Error                                                         |
| -------------------- | ------------------------------------------------------------- |
| Invalid JSON         | `InvalidLedgerDocumentError`                                  |
| Unsupported version  | `UnsupportedLedgerDocumentVersionError` (no silent migrate)   |
| Schema failure       | `InvalidLedgerDocumentError`                                  |
| Hash mismatch        | `LedgerDocumentHashMismatchError`                             |
| Broken reference     | Domain validation (wallet/budget refs) — import service (#40) |

Supported document version: **`2`**. Legacy `"1.0"` exports are rejected explicitly.

## Read Settings

### Get Settings

```javascript
async function getSettings(userId) {
  const settings = await db.settings.findUnique({
    where: { user_id: userId },
  });

  if (!settings) {
    throw new NotFoundError("Settings not found");
  }

  return settings;
}
```

## Related

- [Data Model](./data-model.md) — Settings and export schema
- [Wallet Operations](../wallets/operations.md) — Wallet import considerations
- [Record Operations](../records/operations.md) — Record import considerations
