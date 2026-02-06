# Creating Records

This guide walks you through adding income and expense records in KaGet.

## Overview

Records are the building blocks of your financial tracking. Every time money comes in or goes out, you create a record.

| Type        | Description    | Effect on Balance        |
| ----------- | -------------- | ------------------------ |
| **Income**  | Money received | Increases wallet balance |
| **Expense** | Money spent    | Decreases wallet balance |

## Creating a Record

1. From the dashboard or wallet, tap **Add Record** (or the `+` button)
2. Select the **type**: Income or Expense
3. Select the **wallet** this transaction belongs to
4. Enter the **amount**
5. (Optional) Add a **note** to describe the transaction
6. (Optional) Change the **date** if it's not today
7. Tap **Save**

## Fields Explained

| Field      | Required | Description                                       |
| ---------- | -------- | ------------------------------------------------- |
| **Type**   | Yes      | Income or Expense                                 |
| **Wallet** | Yes      | Which wallet is affected                          |
| **Amount** | Yes      | Transaction amount (always positive)              |
| **Note**   | No       | Description or memo                               |
| **Date**   | Yes      | When the transaction occurred (defaults to today) |

## Examples

### Recording Income

> **Scenario:** You received your $3,000 salary into your bank account.
>
> 1. Tap **Add Record**
> 2. Select **Income**
> 3. Select **Main Bank Account**
> 4. Enter `3000`
> 5. Add note: "Monthly salary"
> 6. Tap **Save**
>
> Your bank account balance increases by $3,000.

### Recording an Expense

> **Scenario:** You spent $45 on groceries using cash.
>
> 1. Tap **Add Record**
> 2. Select **Expense**
> 3. Select **Cash**
> 4. Enter `45`
> 5. Add note: "Weekly groceries"
> 6. Tap **Save**
>
> Your cash wallet balance decreases by $45.

### Recording a Past Transaction

> **Scenario:** You forgot to record yesterday's lunch.
>
> 1. Tap **Add Record**
> 2. Select **Expense**
> 3. Select your wallet
> 4. Enter the amount
> 5. Tap the **date field** and select yesterday
> 6. Tap **Save**

## Tips

- **Be consistent with notes** — Use similar descriptions for recurring transactions
- **Record promptly** — Add records soon after transactions to avoid forgetting
- **Use split records** — For multiple items in one trip (e.g., shopping), use [split records](./split-records.md)

## Related

- [Managing Records](./managing-records.md) — Edit or delete records
- [Split Records](./split-records.md) — Record multiple items at once
- [Wallet Details](../wallets/wallet-details.md) — View all records for a wallet
