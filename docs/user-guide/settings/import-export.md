# Import & Export

This guide explains how to backup and restore your KaGet data.

## Overview

KaGet allows you to export all your data as a single JSON file and import it back later. This is useful for:

- **Backup** — Keep a copy of your financial data
- **Migration** — Move data to a new device or account
- **Recovery** — Restore after data loss

## Exporting Data

### How to Export

1. Go to **Settings**
2. Tap **Export Data**
3. Wait for the export to complete
4. Save the downloaded file

### What Gets Exported

All your KaGet data is included:

| Entity    | Included                                 |
| --------- | ---------------------------------------- |
| Settings  | ✅ Currency preference                   |
| Wallets   | ✅ All wallets with balances             |
| Records   | ✅ All income/expense records with items |
| Budgets   | ✅ All budgets and goals                 |
| Transfers | ✅ All transfer history                  |

### Export File Format

The export is a single JSON file with the structure:

```json
{
  "version": "1.0",
  "exported_at": "2026-02-05T10:00:00Z",
  "settings": { ... },
  "wallets": [ ... ],
  "records": [ ... ],
  "budgets": [ ... ],
  "transfers": [ ... ]
}
```

### File Naming

Export files are named with a timestamp:

```
kaget-export-2026-02-05.json
```

> **Tip:** Store your export file in a secure location like cloud storage or an encrypted drive.

## Importing Data

### How to Import

1. Go to **Settings**
2. Tap **Import Data**
3. Select your export file (`.json`)
4. Review the import summary
5. Confirm to import

### Import Behavior

| Scenario          | Behavior                          |
| ----------------- | --------------------------------- |
| **Empty account** | Data is imported directly         |
| **Existing data** | Import replaces all existing data |

> **Warning:** Importing data will **replace** your current data. Export your current data first if you want to keep it.

### Validation

Before importing, KaGet validates the file:

| Check         | Description                               |
| ------------- | ----------------------------------------- |
| **Format**    | Must be valid JSON                        |
| **Version**   | Must be a supported export version        |
| **Structure** | Must contain expected entity keys         |
| **Integrity** | References between entities must be valid |

If validation fails, you'll see an error message describing the issue.

## Best Practices

### Regular Backups

- Export your data weekly or monthly
- Keep multiple backup versions
- Store backups in different locations

### Before Major Changes

Export before:

- Deleting wallets
- Bulk record cleanup
- Account changes

### Security

- Export files contain all your financial data
- Store in secure, encrypted locations
- Don't share export files publicly

## Troubleshooting

| Issue                   | Solution                             |
| ----------------------- | ------------------------------------ |
| Export fails            | Check storage space, try again       |
| Import fails validation | Ensure file wasn't modified manually |
| Wrong data after import | Restore from a different backup      |
| Can't find export file  | Check your downloads folder          |

## Related

- [App Settings](./app-settings.md) — Currency and preferences
- [Creating Wallets](../wallets/creating-wallets.md) — Set up after import
