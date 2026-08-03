# Settings

Technical documentation for the Settings feature.

## Overview

Settings provides:

1. **User preferences** — Currently only currency
2. **Data export** — Full data dump as JSON
3. **Data import** — Restore from JSON export

## Contents

- [Data Model](./data-model.md) — Settings schema
- [Operations](./operations.md) — Update settings, import/export flows

## Key Concepts

### Single-Row Settings

Settings uses a single-row table pattern — one row per user containing all preferences.

### Ledger document (version 2)

Export, Import, and optional Drive sync use one schema family (`version: 2`) with
`revised_at`, payload `content_hash`, and `debt_loans`. See [Data Model](./data-model.md).

### Currency (Display Only)

Currency changes only affect formatting. No amount conversion occurs.

## Related

- [Onboarding Flow](../onboarding/flow.md) — Initial currency selection
- [ADR-001: Locale and Currency Handling](../../adr/001-locale-and-currency-handling.md) — Currency formatting decisions
