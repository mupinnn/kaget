# Import, Export & Drive Sync

Backup and restore your KaGet ledger. All of this is **your** data on **your** device (and optionally **your** Google Drive). KaGet’s servers do not store your wallets, records, or budgets.

## Overview

| Mechanism | What it does |
|-----------|----------------|
| **Export** | Download a JSON file of your full ledger |
| **Import** | Replace local data from a KaGet JSON file |
| **Google Drive** (optional) | Keep the same JSON document in My Drive for backup / another device |

## Exporting Data

### How to Export

1. Go to **Settings**
2. Tap **Export Data**
3. Wait for the export to complete
4. Save the downloaded file

### What Gets Exported

| Entity | Included |
| ------ | -------- |
| Settings | ✅ Currency preference |
| Wallets | ✅ All wallets with balances |
| Records | ✅ All income/expense records with items |
| Budgets / Goals | ✅ All budgets and goals |
| Transfers | ✅ All transfer history |
| Debts & Loans | ✅ Outstanding and history as modeled in the app (`debt_loans`) |

### Export File Format

Canonical family **version `2`** (Export, Import, and Drive share one schema):

```json
{
  "version": 2,
  "revised_at": "2026-08-03T10:00:00.000Z",
  "content_hash": "…sha-256 hex of ledger payload…",
  "settings": { "currency_code": "USD" },
  "wallets": [],
  "budgets": [],
  "records": [],
  "transfers": [],
  "debt_loans": []
}
```

- `content_hash` covers **settings + entity arrays only** — not `version`, `revised_at`, or the hash field itself.
- Older files (for example `"version": "1.0"`) are **not** migrated silently; import fails with an unsupported-version error.

### File Naming

```
kaget-export-2026-02-05.json
```

Store exports somewhere safe. They contain your full financial history.

## Importing Data

1. Go to **Settings**
2. Tap **Import Data**
3. Select a KaGet export file (`.json`)
4. Review the import summary
5. Confirm

| Scenario | Behavior |
| -------- | -------- |
| **Empty device** | Data is imported directly |
| **Existing data** | Import **replaces** all local ledger data |

Export first if you might need the current copy.

### Validation

| Check | Description |
| ----- | ----------- |
| **Format** | Valid JSON |
| **Version** | Supported document version (`2`) |
| **Structure** | Expected entity keys |
| **Integrity** | `content_hash` matches payload; references between entities must be valid |

## Google Drive (optional)

1. **Settings → Connect Google Drive** (Google sign-in; no email/password for KaGet)
2. KaGet creates or opens a visible file under My Drive (e.g. `KaGet/kaget-ledger.json`)
3. **Sync now** uploads or downloads the ledger file
4. If this device and Drive both changed since the last sync, KaGet asks you to **keep local** or **keep remote** (export first if unsure)
5. **Disconnect** stops sync; local data remains on the device

You can use KaGet forever without connecting Drive.

## Best Practices

- Export (or sync) before bulk deletes or major cleanup
- Keep more than one backup version
- Do not hand-edit the Drive JSON unless you know the schema — prefer Export + edit workflows only if you accept validation failures

## Troubleshooting

| Issue | Solution |
| ----- | -------- |
| Export fails | Check storage space, try again |
| Import fails validation | Ensure the file wasn’t corrupted or hand-broken |
| Unsupported version | Re-export from a current KaGet build; older `"1.0"` files are not auto-upgraded |
| Wrong data after import | Restore from another export / Drive copy via “keep remote” or import |
| Drive conflict | Choose local or remote deliberately; export both sides if needed |

## Related

- [App Settings](./app-settings.md) — Currency and preferences
- [PRD: Local-first + Drive](../../developer-guide/prd/001-local-first-drive-sync.md) — Architecture
