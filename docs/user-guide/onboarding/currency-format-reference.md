# Currency Format Reference

This reference explains how KaGet formats currency amounts and dates based on your selections during onboarding.

## Currency Selection

KaGet supports all currencies available in the international currency standard (ISO 4217). The list includes but is not limited to:

| Code | Currency          | Symbol |
| ---- | ----------------- | ------ |
| USD  | US Dollar         | $      |
| EUR  | Euro              | €      |
| GBP  | British Pound     | £      |
| JPY  | Japanese Yen      | ¥      |
| IDR  | Indonesian Rupiah | Rp     |
| CNY  | Chinese Yuan      | ¥      |
| INR  | Indian Rupee      | ₹      |
| KRW  | South Korean Won  | ₩      |
| SGD  | Singapore Dollar  | $      |
| AUD  | Australian Dollar | $      |

> The full list is dynamically generated from your browser's supported currencies.

## Balance Formatting

How your balance appears depends on two factors:

1. **Currency Code** — Determines the currency symbol and decimal places
2. **Browser Locale** — Determines symbol placement, decimal separator, and thousand grouping

### Formatting Examples

The same amount (1234567.89) displayed in different currency and locale combinations:

| Browser Locale | Currency | Formatted Amount |
| -------------- | -------- | ---------------- |
| en-US          | USD      | $1,234,567.89    |
| en-US          | EUR      | €1,234,567.89    |
| de-DE          | EUR      | 1.234.567,89 €   |
| id-ID          | IDR      | Rp 1.234.567,89  |
| ja-JP          | JPY      | ¥1,234,568       |
| fr-FR          | EUR      | 1 234 567,89 €   |

### Key Differences by Locale

| Element            | US/UK Style   | European Style        | Notes            |
| ------------------ | ------------- | --------------------- | ---------------- |
| Decimal separator  | `.` (period)  | `,` (comma)           |                  |
| Thousand separator | `,` (comma)   | `.` (period) or space |                  |
| Symbol position    | Before amount | After amount (often)  | Varies by locale |
| Decimal places     | 2 (usually)   | 2 (usually)           | JPY, KRW have 0  |

## Date Formatting

Date formatting is determined entirely by your browser's locale setting. You cannot change this separately from your browser/device language.

### Date Format Examples

The same date (February 4, 2026) displayed in different locales:

| Browser Locale | Short Format | Long Format      |
| -------------- | ------------ | ---------------- |
| en-US          | 2/4/2026     | February 4, 2026 |
| en-GB          | 04/02/2026   | 4 February 2026  |
| de-DE          | 4.2.2026     | 4. Februar 2026  |
| id-ID          | 4/2/2026     | 4 Februari 2026  |
| ja-JP          | 2026/2/4     | 2026年2月4日     |
| ko-KR          | 2026. 2. 4.  | 2026년 2월 4일   |

### Date Order Patterns

| Pattern        | Example  | Common Locales                     |
| -------------- | -------- | ---------------------------------- |
| Month/Day/Year | 2/4/2026 | en-US                              |
| Day/Month/Year | 4/2/2026 | en-GB, id-ID, de-DE, most of world |
| Year/Month/Day | 2026/2/4 | ja-JP, ko-KR, zh-CN                |

## Frequently Asked Questions

### Why can't I change the date format separately?

KaGet uses your browser's built-in formatting to ensure consistency with other apps on your device. To change the date format, update your browser or device language settings.

### Why does my currency look different from what I expected?

The formatting combines your selected currency with your browser's locale. For example, if you select EUR but your browser is set to en-US, the Euro symbol will appear before the amount ($-style) rather than after (European style).

### What happens to currencies without decimal places?

Some currencies like Japanese Yen (JPY) and Korean Won (KRW) don't use decimal places. KaGet automatically rounds amounts for these currencies.

## Related

- [Getting Started](./getting-started.md) — Complete onboarding walkthrough
