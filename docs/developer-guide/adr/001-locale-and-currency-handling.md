# ADR-001: Locale and Currency Handling

## Status

Accepted

## Date

2026-02-04

## Context

KaGet needs to display monetary amounts and dates in a format familiar to users worldwide. We need to decide:

1. How to determine the user's locale for formatting
2. How to present currency options to users
3. Where to store user preferences
4. What fallback behavior to implement

## Decision

### Locale Detection

**Use browser locale via `navigator.language` with `en-US` fallback.**

The locale is detected at runtime and never stored. This ensures:

- Formatting matches user's device/browser settings
- No sync conflicts when user changes device language
- Consistent behavior with other apps on the device

```javascript
const locale = navigator.language || "en-US";
```

### Currency List

**Use `Intl.supportedValuesOf('currency')` for dynamic currency list.**

Benefits:

- No static list to maintain
- Automatically includes all ISO 4217 currencies supported by the browser
- Future-proof as new currencies are added

```javascript
const currencies = Intl.supportedValuesOf("currency");
```

### Formatting

**Use `Intl.NumberFormat` and `Intl.DateTimeFormat` for all formatting.**

Benefits:

- Native browser implementation, no external dependencies
- Handles all locale-specific rules (decimal separators, symbol placement, date order)
- Consistent with platform conventions

### Preference Storage

**Store only currency code; sync to backend.**

| Data          | Storage           | Rationale                                             |
| ------------- | ----------------- | ----------------------------------------------------- |
| Currency code | Backend (synced)  | User choice; must persist across devices              |
| Locale        | Browser (runtime) | System setting; should not override device preference |

### Fallback Behavior

| Scenario                             | Fallback                            |
| ------------------------------------ | ----------------------------------- |
| `navigator.language` unavailable     | `en-US`                             |
| `Intl.supportedValuesOf` unavailable | Static list of common currencies    |
| Backend sync fails                   | Store locally, retry on next launch |

## Consequences

### Positive

- Zero dependencies for internationalization
- Automatic support for all browser-supported currencies and locales
- User sees formatting consistent with their device settings
- Simple data model (only currency code stored)

### Negative

- Formatting may vary slightly between browsers (different Intl implementations)
- Cannot offer custom locale selection independent of browser settings
- Older browsers may have limited currency/locale support

### Neutral

- Users who want different formatting must change browser/device language
- Currency display follows browser locale, not currency's "native" format (e.g., EUR with en-US locale shows "$1,234.56 €" style, not European style)

## Alternatives Considered

### 1. Store locale preference

Rejected because:

- Creates sync conflicts with device settings
- Users expect app to match device language
- Additional complexity for marginal benefit

### 2. Use a formatting library (e.g., date-fns, Luxon)

Rejected because:

- Adds bundle size
- `Intl` API is sufficient for our needs
- Native implementation is more likely to match user expectations

### 3. Maintain static currency list

Rejected because:

- Maintenance burden
- Risk of missing currencies
- `Intl.supportedValuesOf` is widely supported (Chrome 99+, Firefox 93+, Safari 15.4+)

## References

- [BCP 47 - Tags for Identifying Languages](https://www.rfc-editor.org/info/bcp47)
- [ISO 4217 - Currency Codes](https://www.iso.org/iso-4217-currency-codes.html)
- [MDN: Intl.NumberFormat](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat)
- [MDN: Intl.DateTimeFormat](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat)
- [MDN: Intl.supportedValuesOf](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/supportedValuesOf)
