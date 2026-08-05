# Getting Started with KaGet

This guide walks you through onboarding when you first open KaGet.

## Overview

Onboarding is a single screen with one required job: **choose your currency**. You do not need to sign in.

1. **Welcome** — Short local-first intro (wallets, envelope budgets, data on this device)
2. **Currency selection** — Pick a currency and preview how amounts and dates will look

Google Drive backup is optional later in **Settings** — it is not part of onboarding.

## Currency selection

KaGet needs a currency so amounts display correctly. Your preference is saved on this device (Dexie / IndexedDB).

### What you'll see

1. **Currency picker** — Searchable ISO 4217 codes (USD, EUR, IDR, JPY, …)
2. **Balance preview** — Sample amount formatted with your currency + browser locale
3. **Date preview** — Dates formatted from your browser language settings

### Example previews

| Locale           | Currency | Balance Preview | Date Preview |
| ---------------- | -------- | --------------- | ------------ |
| English (US)     | USD      | $1,234.56       | 2/4/2026     |
| German (Germany) | EUR      | 1.234,56 €      | 4.2.2026     |
| Indonesian       | IDR      | Rp 1.234,56     | 4/2/2026     |
| Japanese         | JPY      | ¥1,235          | 2026/2/4     |

> **Note:** Date format comes from the browser language. Currency symbol, decimals, and grouping combine your selected currency with that locale.

### Completing onboarding

1. Select your currency (default is often IDR)
2. Optionally tweak the sample balance to check formatting
3. Tap **Start budgeting!**

You land on Home. Currency is stored locally; if you later connect Google Drive in Settings, it is included in the ledger backup file.

## After onboarding

- [Create your first wallet](../wallets/creating-wallets.md)
- Record income and expenses
- Allocate money into budgets (envelopes)

## Changing currency later

Currency chosen at onboarding is intended to stay fixed. Settings currently shows your currency for reference; it does not offer a change flow.

## Related

- [Currency Format Reference](./currency-format-reference.md)
