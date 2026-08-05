# Onboarding Flow

Technical documentation for the KaGet onboarding feature.

## Overview

Onboarding introduces new users to KaGet and collects their currency preference. The flow consists of:

1. Feature overview (informational copy on the onboarding page)
2. Currency selection with live format preview
3. Persist currency to the local Dexie settings row

## User Flow

Onboarding runs when IndexedDB has **no local settings**, regardless of Google sign-in.

```
┌─────────────────┐
│  App bootstrap  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Empty settings? │──no──▶ Main app
└────────┬────────┘
         │ yes
         ▼
┌─────────────────┐
│  /onboarding    │
│  Currency pick  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Write Dexie     │
│ settings row    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Main Dashboard  │
└─────────────────┘
```

### Behavior

- **Trigger:** Missing local settings (signed-in or signed-out)
- **Dismissible:** No — user must complete onboarding
- **On complete:** Navigate home; currency available via Dexie-backed query / in-memory cache for formatting

## Technical Implementation

### Locale Detection

The browser locale is auto-detected and used for formatting. No user selection required.

```javascript
// Get browser locale with fallback
const locale = navigator.language || "en-US";
```

**Fallback behavior:** If `navigator.language` is unavailable or returns an unsupported value, default to `en-US`.

### Currency List

The currency list is dynamically generated using the `Intl` API:

```javascript
// Get all supported currency codes
const currencies = Intl.supportedValuesOf("currency");
// Returns: ['AED', 'AFN', 'ALL', ..., 'USD', ..., 'ZWL']
```

This ensures the app supports all currencies available in the user's browser without maintaining a static list.

### Format Preview

Live preview of balance and date formatting using `Intl.NumberFormat` and `Intl.DateTimeFormat`:

```javascript
const locale = navigator.language || "en-US";
const currency = "USD"; // User-selected currency code

// Balance preview
const balanceFormatter = new Intl.NumberFormat(locale, {
  style: "currency",
  currency: currency,
});
const balancePreview = balanceFormatter.format(1234.56);
// en-US + USD → "$1,234.56"
// de-DE + USD → "1.234,56 $"

// Date preview
const dateFormatter = new Intl.DateTimeFormat(locale, {
  dateStyle: "short",
});
const datePreview = dateFormatter.format(new Date());
// en-US → "2/4/2026"
// de-DE → "4.2.2026"
```

### Currency Metadata

To display currency names in the picker, use `Intl.DisplayNames`:

```javascript
const locale = navigator.language || "en-US";
const currencyNames = new Intl.DisplayNames([locale], { type: "currency" });

currencyNames.of("USD"); // "US Dollar" (en-US) or "US-Dollar" (de-DE)
currencyNames.of("EUR"); // "Euro"
currencyNames.of("JPY"); // "Japanese Yen"
```

## Data Model

### User Preference

```typescript
interface UserPreference {
  currencyCode: string; // ISO 4217 currency code (e.g., "USD", "EUR")
  // locale is NOT stored; always derived from browser at runtime
}
```

### Why Locale is Not Stored

- Locale affects display only, not data
- User expectation: app matches device language settings
- Avoids sync conflicts when user changes device language
- Browser locale can change; stored preference would become stale

## Persistence

Currency is written to the local Dexie `settings` row when the user completes onboarding. There is **no** server ledger preference sync (ADR-007): optional durability is the Drive ledger document via Settings → Connect / Sync.

| Data               | Storage                         | Sync                                      |
| ------------------ | ------------------------------- | ----------------------------------------- |
| Selected currency  | Dexie `settings`                | Included in optional Drive ledger backup  |
| Locale             | Browser (runtime)               | No                                        |
| Onboarding gate    | Absence of local settings row   | No                                        |

## Edge Cases

### Unsupported Currency

If `Intl.supportedValuesOf('currency')` is not available (older browsers):

```javascript
const getCurrencies = () => {
  if (typeof Intl.supportedValuesOf === "function") {
    return Intl.supportedValuesOf("currency");
  }
  // Fallback: common currencies
  return ["USD", "EUR", "GBP", "JPY", "CNY", "IDR", "INR", "KRW", "SGD", "AUD"];
};
```

### Offline Onboarding

Onboarding only needs IndexedDB. Complete currency setup offline; optional Drive Connect happens later in Settings when online.

### Returning User (Re-onboarding)

If the user clears site data, local settings are gone and onboarding runs again — even if a Drive backup exists. Restore via Settings → Import or Connect + Sync after currency setup.

## Testing Considerations

### Locale Testing

Test with multiple locales to verify formatting:

| Test Locale | Why                                    |
| ----------- | -------------------------------------- |
| en-US       | Default fallback                       |
| de-DE       | European number format (comma decimal) |
| ja-JP       | Zero decimal currency (JPY)            |
| ar-EG       | RTL language                           |
| id-ID       | Common non-Western locale              |

### Currency Edge Cases

| Currency | Test Case                           |
| -------- | ----------------------------------- |
| JPY      | No decimal places                   |
| KWD      | 3 decimal places                    |
| EUR      | Symbol after amount in some locales |
| USD      | Symbol before amount                |

## Related

- [ADR-001: Locale and Currency Handling](../../adr/001-locale-and-currency-handling.md)
- [ADR-007: Local-first Drive custodian boundary](../../adr/007-local-first-drive-custodian-boundary.md)
- [User Guide: Getting Started](../../../user-guide/onboarding/getting-started.md)
