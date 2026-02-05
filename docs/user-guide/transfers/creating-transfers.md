# Creating Transfers

This guide walks you through moving money between wallets and budgets in KaGet.

## Overview

Transfers let you move money internally—between your own accounts. Unlike records (income/expense), transfers don't change your total net worth; they just redistribute funds.

| From   | To     | Use Case                         |
| ------ | ------ | -------------------------------- |
| Wallet | Wallet | Move money between bank accounts |
| Wallet | Budget | Add funds to a budget            |
| Budget | Wallet | Refund unused budget to wallet   |

## Creating a Transfer

1. From the dashboard, tap **Transfer** (or navigate to Transfers)
2. Select the **source** (where money comes from)
3. Select the **destination** (where money goes)
4. Enter the **amount**
5. (Optional) Enter a **fee** if applicable
6. (Optional) Add a **note**
7. (Optional) Change the **date** if not today
8. Tap **Transfer**

## Fields Explained

| Field           | Required | Description                                    |
| --------------- | -------- | ---------------------------------------------- |
| **Source**      | Yes      | Wallet or budget to transfer from              |
| **Destination** | Yes      | Wallet or budget to transfer to                |
| **Amount**      | Yes      | How much to transfer                           |
| **Fee**         | No       | Transaction fee (e.g., bank transfer fee)      |
| **Note**        | No       | Description or memo                            |
| **Date**        | Yes      | When the transfer occurred (defaults to today) |

## Transfer Fees

If your transfer has a fee (like a bank wire fee), enter it separately.

**How fees work:**

- Source loses: `amount + fee`
- Destination receives: `amount`
- Fee is recorded as an expense on the source

> **Example:** Transfer $100 from Bank A to Bank B with $5 fee.
>
> - Bank A: −$105 ($100 transfer + $5 fee)
> - Bank B: +$100
> - Expense record created: $5 "Transfer fee to Bank B"

## Examples

### Wallet to Wallet

> **Scenario:** Move $500 from savings to checking.
>
> 1. Tap **Transfer**
> 2. Source: **Savings Account**
> 3. Destination: **Checking Account**
> 4. Amount: `500`
> 5. Tap **Transfer**
>
> Savings: −$500, Checking: +$500

### Wallet to Budget (Add Funds)

> **Scenario:** Top up your grocery budget from your bank account.
>
> 1. Tap **Transfer**
> 2. Source: **Bank Account**
> 3. Destination: **Grocery Budget**
> 4. Amount: `100`
> 5. Tap **Transfer**
>
> This is an alternative to using "Add Funds" from the budget menu.

### Budget to Wallet (Refund)

> **Scenario:** Return unused entertainment budget to your wallet.
>
> 1. Tap **Transfer**
> 2. Source: **Entertainment Budget**
> 3. Destination: **Bank Account**
> 4. Amount: `50`
> 5. Tap **Transfer**
>
> This is an alternative to using "Refund" from the budget menu.

## Rules and Limitations

### What You Can't Do

| Action                       | Reason                                    |
| ---------------------------- | ----------------------------------------- |
| Transfer to same account     | Source and destination must be different  |
| Transfer more than available | Insufficient balance in source            |
| Transfer to archived budget  | Budget must be active                     |
| Exceed budget cap            | Budget balance can't exceed total_balance |
| Delete a transfer            | See below                                 |
| Edit a transfer              | Transfers are permanent                   |

### Why Transfers Can't Be Deleted or Edited

Transfers affect two accounts simultaneously. Deleting or editing would require:

- Rolling back both source and destination
- Handling edge cases (what if one account was deleted?)
- Complex balance reconciliation

**Instead:** If you made a mistake, create a new transfer in the opposite direction—just like in real life.

> **Example:** Accidentally transferred $100 from A to B.
>
> Solution: Transfer $100 from B back to A.

## Tips

- **Use notes** — Describe why you're transferring
- **Include fees** — Track bank/ATM fees as part of transfers
- **Check balances first** — Ensure source has enough (amount + fee)

## Related

- [Viewing Transfers](./viewing-transfers.md) — Find your transfer history
- [Using Budgets](../budgets/using-budgets.md) — Add funds and refund via budget menu
