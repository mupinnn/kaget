# Onboarding Flow

Technical documentation for the KaGet onboarding feature.

## Overview

Onboarding introduces new users to KaGet and collects their currency preference. The flow consists of:

1. Feature overview screens (informational)
2. Currency selection with live format preview
3. Preference sync to backend

## User Flow

Onboarding is presented as a **modal dialog** overlaying the main dashboard on the user's first login.

```
┌─────────────────┐
│   User Login    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Main Dashboard  │
│    (Behind)     │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────┐
│     Onboarding Dialog (Modal)   │
│  ┌───────────────────────────┐  │
│  │   Feature Overview        │  │
│  │   (Swipeable Screens)     │  │
│  └─────────────┬─────────────┘  │
│                │                │
│                ▼                │
│  ┌───────────────────────────┐  │
│  │   Currency Selection      │  │
│  │   + Format Preview        │  │
│  └─────────────┬─────────────┘  │
│                │                │
│                ▼                │
│  ┌───────────────────────────┐  │
│  │   Sync to Backend         │  │
│  └─────────────┬─────────────┘  │
│                │                │
│                ▼                │
│         Dialog Closes           │
└─────────────────────────────────┘
         │
         ▼
┌─────────────────┐
│ Main Dashboard  │
│   (Active)      │
└─────────────────┘
```

### Dialog Behavior

- **Trigger:** First login (no `currencyCode` preference on backend)
- **Dismissible:** No — user must complete onboarding
- **Backdrop:** Dashboard visible but non-interactive
- **On complete:** Dialog closes, dashboard becomes active

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

## Backend Sync

The selected currency is synced to the backend as part of the user's preferences. Implementation details (endpoint, payload structure) are left to the backend specification.

### Sync Contract

| Field          | Type     | Description                                     |
| -------------- | -------- | ----------------------------------------------- |
| `currencyCode` | `string` | ISO 4217 currency code (e.g., `"USD"`, `"EUR"`) |

### Sync Behavior

| Aspect                  | Behavior                                                  |
| ----------------------- | --------------------------------------------------------- |
| **Trigger**             | User taps "Continue" after selecting currency             |
| **Retry**               | If sync fails, store locally and retry on next app launch |
| **Conflict resolution** | Server preference wins; client re-fetches on login        |
| **Offline**             | Allow completion, queue sync for when connection restores |

## Persistence

| Data                      | Storage              | Sync |
| ------------------------- | -------------------- | ---- |
| Onboarding completed flag | Local (localStorage) | No   |
| Selected currency         | Backend              | Yes  |
| Locale                    | Browser (runtime)    | No   |

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

1. Allow user to complete onboarding offline
2. Store preference in localStorage
3. Sync to backend when connection is restored
4. Show sync status indicator

### Returning User (Re-onboarding)

If user clears app data but backend has existing preference:

1. Fetch preferences on login
2. Skip onboarding if `currencyCode` exists
3. Navigate directly to dashboard

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
- [User Guide: Getting Started](../../../user-guide/onboarding/getting-started.md)
