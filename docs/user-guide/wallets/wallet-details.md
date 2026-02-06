# Wallet Details

This reference explains what you see on the wallet details screen.

## Overview

The wallet details screen shows everything about a single wallet: its current balance, recent transactions, and transfers.

## Screen Elements

### Header

| Element         | Description                                          |
| --------------- | ---------------------------------------------------- |
| **Wallet Name** | The name you gave the wallet                         |
| **Balance**     | Current balance, formatted in your selected currency |
| **Wallet Type** | Icon indicating Cash or Digital                      |

### Records Section

Displays all income and expense transactions for this wallet, sorted by date (newest first).

Each record shows:

| Field        | Description                                            |
| ------------ | ------------------------------------------------------ |
| **Category** | The category of the transaction                        |
| **Amount**   | Transaction amount (green for income, red for expense) |
| **Date**     | When the transaction occurred                          |
| **Note**     | Optional description you added                         |

### Transfers Section

Displays all transfers involving this wallet.

Each transfer shows:

| Field         | Description                      |
| ------------- | -------------------------------- |
| **Direction** | "From [Wallet]" or "To [Wallet]" |
| **Amount**    | Transfer amount                  |
| **Date**      | When the transfer occurred       |

## Balance Calculation

Your wallet balance is calculated from all transactions:

```
Balance = Opening Balance + Income − Expenses + Transfers In − Transfers Out
```

This means:

- Every record affects your balance
- You can verify your balance by reviewing your transaction history
- If something looks wrong, check your recent records

## Filtering and Sorting

You can filter the records view by:

- **Date range** — See transactions from a specific period
- **Type** — Show only income or only expenses
- **Category** — Filter by transaction category

## Related

- [Creating Wallets](./creating-wallets.md) — Set up new wallets
- [Managing Wallets](./managing-wallets.md) — Edit or delete wallets
