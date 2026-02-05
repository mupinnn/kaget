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
│  Build Export Object    │
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

```javascript
async function exportData(userId) {
  // Fetch all user data
  const settings = await db.settings.findUnique({
    where: { user_id: userId },
  });

  const wallets = await db.wallets.findMany({
    where: { user_id: userId },
  });

  const records = await db.records.findMany({
    where: { user_id: userId },
    include: { items: true },
  });

  const budgets = await db.budgets.findMany({
    where: { user_id: userId },
  });

  const transfers = await db.transfers.findMany({
    where: { user_id: userId },
  });

  // Build export object
  const exportData = {
    version: "1.0",
    exported_at: new Date().toISOString(),
    settings: {
      currency: settings.currency,
    },
    wallets: wallets.map(sanitizeForExport),
    records: records.map(r => ({
      ...sanitizeForExport(r),
      items: r.items.map(sanitizeForExport),
    })),
    budgets: budgets.map(sanitizeForExport),
    transfers: transfers.map(sanitizeForExport),
  };

  return exportData;
}

function sanitizeForExport(entity) {
  // Remove internal fields like user_id
  const { user_id, ...rest } = entity;
  return rest;
}
```

### Export Fields

Each entity exports relevant fields:

| Entity   | Exported Fields                                                                                                                                                                    |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Settings | `currency`                                                                                                                                                                         |
| Wallet   | `id`, `name`, `type`, `balance`, timestamps                                                                                                                                        |
| Record   | `id`, `source_id`, `source_type`, `record_type`, `amount`, `note`, `recorded_at`, timestamps, `items[]`                                                                            |
| Budget   | `id`, `name`, `type`, `total_balance`, `balance`, `source_id`, `source_type`, timestamps                                                                                           |
| Transfer | `id`, `source_id`, `source_type`, `source_name`, `destination_id`, `destination_type`, `destination_name`, `type`, `amount`, `fee`, `note`, `ref_id`, `transferred_at`, timestamps |

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
│  Parse JSON             │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  Validate Version       │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  Validate Structure     │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  Validate Entities      │
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
│  Delete Existing Data   │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  Insert Wallets         │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  Insert Budgets         │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  Insert Records         │
│  with Items             │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  Insert Transfers       │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  Update Settings        │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  Commit Transaction     │
└───────────┬─────────────┘
            │
            ▼
          Done
```

### Implementation

```javascript
async function importData(userId, jsonData) {
  // Parse and validate
  const data = JSON.parse(jsonData);
  validateExportFormat(data);
  validateReferences(data);

  // Transaction: replace all user data
  await db.$transaction(async tx => {
    // Delete existing data (order matters for FK constraints)
    await tx.transfers.deleteMany({ where: { user_id: userId } });
    await tx.recordItems.deleteMany({
      where: { record: { user_id: userId } },
    });
    await tx.records.deleteMany({ where: { user_id: userId } });
    await tx.budgets.deleteMany({ where: { user_id: userId } });
    await tx.wallets.deleteMany({ where: { user_id: userId } });

    // Insert new data (order matters for FK constraints)
    for (const wallet of data.wallets) {
      await tx.wallets.create({
        data: { ...wallet, user_id: userId },
      });
    }

    for (const budget of data.budgets) {
      await tx.budgets.create({
        data: { ...budget, user_id: userId },
      });
    }

    for (const record of data.records) {
      const { items, ...recordData } = record;
      await tx.records.create({
        data: {
          ...recordData,
          user_id: userId,
          items: { create: items },
        },
      });
    }

    for (const transfer of data.transfers) {
      await tx.transfers.create({
        data: { ...transfer, user_id: userId },
      });
    }

    // Update settings
    await tx.settings.update({
      where: { user_id: userId },
      data: {
        currency: data.settings.currency,
        updated_at: now(),
      },
    });
  });
}
```

### Validation Functions

```javascript
function validateExportFormat(data) {
  // Check version
  if (!data.version || !SUPPORTED_VERSIONS.includes(data.version)) {
    throw new ValidationError("Unsupported export version");
  }

  // Check required keys
  const requiredKeys = ["settings", "wallets", "records", "budgets", "transfers"];
  for (const key of requiredKeys) {
    if (!(key in data)) {
      throw new ValidationError(`Missing required key: ${key}`);
    }
  }

  // Validate settings
  if (!data.settings.currency) {
    throw new ValidationError("Missing currency in settings");
  }

  // Validate arrays
  if (!Array.isArray(data.wallets)) {
    throw new ValidationError("wallets must be an array");
  }
  // ... similar for other entities
}

function validateReferences(data) {
  const walletIds = new Set(data.wallets.map(w => w.id));
  const budgetIds = new Set(data.budgets.map(b => b.id));

  // Validate record references
  for (const record of data.records) {
    if (record.source_type === "WALLET" && !walletIds.has(record.source_id)) {
      throw new ValidationError(`Record references unknown wallet: ${record.source_id}`);
    }
    if (record.source_type === "BUDGET" && !budgetIds.has(record.source_id)) {
      throw new ValidationError(`Record references unknown budget: ${record.source_id}`);
    }
  }

  // Validate budget references
  for (const budget of data.budgets) {
    if (!walletIds.has(budget.source_id)) {
      throw new ValidationError(`Budget references unknown wallet: ${budget.source_id}`);
    }
  }

  // Validate transfer references
  for (const transfer of data.transfers) {
    // Transfers have snapshots, so missing references are acceptable
    // (the original entity may have been deleted before export)
  }
}
```

### Error Cases

| Condition                | Error                                                    |
| ------------------------ | -------------------------------------------------------- |
| Invalid JSON             | `PARSE_ERROR: Invalid JSON format`                       |
| Unsupported version      | `VALIDATION_ERROR: Unsupported export version`           |
| Missing required key     | `VALIDATION_ERROR: Missing required key: {key}`          |
| Invalid entity structure | `VALIDATION_ERROR: Invalid {entity} structure`           |
| Broken reference         | `VALIDATION_ERROR: {entity} references unknown {target}` |

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
